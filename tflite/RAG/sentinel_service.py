"""Retrieval-only workbench shared by MCP, SDK verification and the watcher.

The harness owns generation. This module never loads a generative model.
"""
from __future__ import annotations

import csv
import fcntl
import hashlib
import json
import math
import os
import re
import sqlite3
import tempfile
from contextlib import contextmanager
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone
from pathlib import Path

import yaml

from sentinel_security import ROLE_CLEARANCE, can_read, calculate

RAG_DIR = Path(__file__).resolve().parent


def canonical(value) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def digest(value) -> str:
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def contained(root: Path, path: Path) -> Path:
    path = path.resolve()
    if not path.is_relative_to(root.resolve()):
        raise PermissionError("Path leaves the configured data root")
    return path


@dataclass
class BridgeConfig:
    vault_dir: Path = field(default_factory=lambda: Path(os.environ.get("VAULT_DIR", RAG_DIR / "sentinel_vault")))
    index_dir: Path = field(default_factory=lambda: Path(os.environ.get("INDEX_DIR", RAG_DIR / "index_store")))
    data_dir: Path = field(default_factory=lambda: Path(os.environ.get("SENTINEL_DATA_DIR", RAG_DIR / "data")))
    state_dir: Path = field(default_factory=lambda: Path(os.environ.get("SENTINEL_STATE_DIR", RAG_DIR / "state")))
    role: str = field(default_factory=lambda: os.environ.get("SENTINEL_ROLE", "analyst"))
    retrieval: str = field(default_factory=lambda: os.environ.get("SENTINEL_RETRIEVAL", "hybrid"))
    allow_writes: bool = field(default_factory=lambda: os.environ.get("SENTINEL_HARNESS_WRITES") == "1")

    def __post_init__(self):
        for name in ("vault_dir", "index_dir", "data_dir", "state_dir"):
            setattr(self, name, getattr(self, name).resolve())
        if self.role not in ROLE_CLEARANCE or self.retrieval not in ("hybrid", "vault"):
            raise ValueError("Invalid trusted role or retrieval mode")
        self.state_dir.mkdir(parents=True, exist_ok=True)


class SentinelService:
    def __init__(self, config: BridgeConfig | None = None):
        self.cfg = config or BridgeConfig()
        self._retrieval = None
        with self.db() as db:
            db.executescript('''
              CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, role TEXT NOT NULL, payload TEXT NOT NULL);
              CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, status TEXT NOT NULL, payload TEXT NOT NULL, result TEXT);
            ''')

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.cfg.state_dir / "sentinel.sqlite3", timeout=30)
        try:
            with db:
                yield db
        finally:
            db.close()

    @contextmanager
    def lock(self, name):
        with open(self.cfg.state_dir / f"{name}.lock", "a") as stream:
            fcntl.flock(stream, fcntl.LOCK_EX)
            yield

    def audit(self, action: str, status: str, details: dict):
        """Fsync a hash-chained JSONL record under a cross-process writer lock."""
        path = self.cfg.state_dir / "audit.jsonl"
        with self.lock("audit"):
            previous = "0" * 64
            if path.exists():
                with path.open("rb") as existing:
                    last = None
                    for line in existing:
                        last = line
                    if last:
                        previous = json.loads(last)["hash"]
            record = {"timestamp": datetime.now(timezone.utc).isoformat(), "role": self.cfg.role,
                      "action": action, "status": status, "details": details, "previous_hash": previous}
            record["hash"] = digest(record)
            with path.open("a") as stream:
                stream.write(canonical(record) + "\n")
                stream.flush()
                os.fsync(stream.fileno())

    def invoke(self, name: str, **arguments):
        if name not in TOOL_NAMES:
            raise ValueError("Unknown SENTINEL tool")
        try:
            result = getattr(self, name)(**arguments)
        except Exception as exc:
            self.audit(name, "failed", {"arguments_hash": digest(arguments), "error": str(exc)})
            raise
        self.audit(name, "succeeded", {"arguments_hash": digest(arguments), "result_hash": digest(result)})
        return result

    def _notes(self):
        notes = {}
        for path in sorted(self.cfg.vault_dir.rglob("*.md")):
            contained(self.cfg.vault_dir, path)
            if any(p in ("AuditLogs", "GeneratedVisuals") for p in path.relative_to(self.cfg.vault_dir).parts):
                continue
            if path.stat().st_size > 1_000_000:
                continue
            text = path.read_text(encoding="utf-8")
            meta = {}
            if text.startswith("---\n"):
                parts = text.split("---", 2)
                if len(parts) != 3:
                    raise ValueError(f"Invalid frontmatter: {path.name}")
                meta = yaml.safe_load(parts[1]) or {}
                if not isinstance(meta, dict):
                    raise ValueError(f"Invalid metadata: {path.name}")
            if not can_read(self.cfg.role, str(meta.get("clearance_level", "internal"))):
                continue
            title = path.relative_to(self.cfg.vault_dir).with_suffix("").as_posix()
            notes[title] = {"title": title, "source": str(path), "chunk": text,
                            "clearance_level": str(meta.get("clearance_level", "internal")),
                            "metadata": json.loads(json.dumps(meta, default=str)),
                            "links": [x.split("|")[0].split("#")[0] for x in re.findall(r"\[\[([^\]]+)\]\]", text)]}
        return notes

    def _resolve(self, title, notes):
        matches = [key for key, value in notes.items() if key == title or Path(key).name == title
                   or Path(key).stem == title
                   or str(value["metadata"].get("equipment_id", "")) == title and key.startswith("Equipment/")]
        if len(matches) == 1:
            return matches[0]
        clean_title = re.sub(r"[^\w]+", "", title.lower())
        fuzzy = [key for key in notes if clean_title in re.sub(r"[^\w]+", "", key.lower()) or re.sub(r"[^\w]+", "", key.lower()) in clean_title]
        if len(fuzzy) == 1:
            return fuzzy[0]
        tokens = set(re.findall(r"[A-Za-z0-9]+", title.lower()))
        overlaps = sorted([(len(tokens & set(re.findall(r"[A-Za-z0-9]+", k.lower()))), k) for k in notes], reverse=True)
        if overlaps and overlaps[0][0] >= 2 and (len(overlaps) == 1 or overlaps[0][0] > overlaps[1][0]):
            return overlaps[0][1]
        if len(matches) != 1:
            raise ValueError("Note missing, inaccessible or ambiguous; use its vault-relative title")
        return matches[0]

    def _evidence(self, item):
        item = json.loads(json.dumps(item, default=str))
        if not can_read(self.cfg.role, item.get("clearance_level", "internal")):
            raise PermissionError("Source clearance denied")
        item["evidence_id"] = digest({"role": self.cfg.role, "item": item})
        with self.db() as db:
            db.execute("INSERT OR IGNORE INTO evidence VALUES (?,?,?)", (item["evidence_id"], self.cfg.role, canonical(item)))
        return item

    def _get_evidence(self, evidence_id):
        with self.db() as db:
            row = db.execute("SELECT payload FROM evidence WHERE id=? AND role=?", (evidence_id, self.cfg.role)).fetchone()
        if not row:
            raise ValueError("Evidence was not retrieved by this role")
        item = json.loads(row[0])
        if not can_read(self.cfg.role, item.get("clearance_level", "internal")):
            raise PermissionError("Evidence clearance denied")
        # Recheck current source permissions/content when the source is a vault note.
        source = Path(item.get("source", ""))
        if source.is_relative_to(self.cfg.vault_dir):
            note = next((n for n in self._notes().values() if n["source"] == str(source)), None)
            if not note or item["chunk"] not in note["chunk"]:
                raise ValueError("Evidence changed or access was revoked; retrieve again")
        return item

    def read_vault_note(self, note_title: str):
        notes = self._notes()
        note = dict(notes[self._resolve(note_title, notes)])
        # Do not reveal inaccessible/dangling graph targets through metadata links.
        note["links"] = self._visible_links(note, notes)
        note["sha256"] = hashlib.sha256(note["chunk"].encode()).hexdigest()
        return self._evidence(note)

    def _visible_links(self, note, notes):
        links = []
        for target in note["links"]:
            try:
                links.append(self._resolve(target, notes))
            except ValueError:
                continue
        return sorted(set(links))

    def get_vault_backlinks(self, entity_id: str):
        notes = self._notes()
        title = self._resolve(entity_id, notes)
        return {"title": title, "backlinks": [key for key, note in notes.items() if title in self._visible_links(note, notes)]}

    def traverse_graph(self, entity_id: str, depth: int = 2):
        if not 0 <= depth <= 4:
            raise ValueError("depth must be 0..4")
        notes = self._notes()
        frontier = {self._resolve(entity_id, notes)}
        seen, edges = set(), set()
        for _ in range(depth + 1):
            seen.update(frontier)
            if len(seen) > 200:
                raise ValueError("Graph exceeds 200 nodes; reduce depth")
            following = set()
            for source in frontier:
                for target in self._visible_links(notes[source], notes):
                    following.add(target)
                    edges.add((source, target))
                for parent, note in notes.items():
                    if source in self._visible_links(note, notes):
                        following.add(parent)
                        edges.add((parent, source))
            frontier = following - seen
        return {"nodes": sorted(seen), "edges": [{"source": a, "target": b, "provenance": "document-link"}
                for a, b in sorted(edges) if a in seen and b in seen]}

    def search_documents(self, query: str, top_k: int = 5):
        if not query.strip() or len(query) > 4000 or not 1 <= top_k <= 20:
            raise ValueError("Provide a query of 1..4000 characters and top_k of 1..20")
        warning = None
        if self.cfg.retrieval == "hybrid":
            try:
                # Import under MCP's stdout redirection; optional ML stays lazy.
                import rag
                if self._retrieval is None:
                    cfg = rag.SENTINELConfig(domain="industrial", user_role=self.cfg.role,
                        index_dir=self.cfg.index_dir, vault_dir=self.cfg.vault_dir)
                    index, bm25, chunks = rag.load_data(cfg)
                    self._retrieval = (cfg, index, bm25, chunks, rag.load_embedding_model())
                cfg, index, bm25, chunks, model = self._retrieval
                diagnostics = []
                items = rag.retrieve(query, model, index, bm25, chunks, replace(cfg, top_k=top_k), diagnostics=diagnostics)
                if diagnostics and not items:
                    raise RuntimeError("; ".join(diagnostics))
                return {"mode": "hybrid-degraded" if diagnostics else "hybrid", "warning": "; ".join(diagnostics) or None,
                        "results": [self._evidence(item) for item in items if can_read(self.cfg.role, item.get("clearance_level", "internal"))][:top_k]}
            except (ImportError, RuntimeError, OSError) as exc:
                warning = f"Hybrid retrieval unavailable ({type(exc).__name__}); direct vault keyword search only."
        terms = set(re.findall(r"[\w-]+", query.lower()))
        ranked = sorted(self._notes().values(), key=lambda n: sum(n["chunk"].lower().count(t) for t in terms), reverse=True)
        return {"mode": "vault-keyword", "warning": warning or "Vault-only mode; vector and visual retrieval disabled.",
                "results": [self._evidence(n) for n in ranked if any(t in n["chunk"].lower() for t in terms)][:top_k]}

    def read_document(self, evidence_id: str):
        """Read the exact indexed chunk/page by issued evidence id; never arbitrary host files."""
        return self._get_evidence(evidence_id)

    def analyze_equipment_drawing(self, evidence_id: str):
        item = self._get_evidence(evidence_id)
        asset = item.get("asset_path") or item.get("page_image_path")
        if not asset:
            return {"status": "unavailable", "reason": "No indexed drawing image for this evidence", "evidence": item}
        path = Path(asset)
        if not path.is_absolute():
            path = self.cfg.index_dir / path
        path = contained(self.cfg.index_dir, path)
        if path.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp") or path.stat().st_size > 5_000_000:
            raise ValueError("Unsupported or oversized drawing")
        import base64
        return {"status": "image", "evidence": item, "image_base64": base64.b64encode(path.read_bytes()).decode(),
                "mime_type": {".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(path.suffix.lower(), "image/" + path.suffix[1:])}

    def calculate_metric(self, formula: str, operands: dict[str, float], formula_name: str = "metric"):
        return {"formula_name": formula_name, "formula": formula, "operands": operands,
                "computed_result": calculate(formula, operands), "verification_status": "COMPUTED"}

    def query_sensor_history(self, equipment_id: str, limit: int = 100):
        if not 1 <= limit <= 1000:
            raise ValueError("limit must be 1..1000")
        notes = self._notes()
        self._resolve(equipment_id, notes)  # equipment ACL also protects sensor history
        readings = []
        for path in sorted(self.cfg.data_dir.glob("*.csv")):
            contained(self.cfg.data_dir, path)
            with path.open(newline="") as stream:
                for line, row in enumerate(csv.DictReader(stream), 2):
                    if row.get("Equipment") == equipment_id:
                        readings.append({**row, "source": str(path), "line": line})
        readings.sort(key=lambda row: (row["Date"], row.get("Measurement_Point", "")))
        return {"equipment_id": equipment_id, "readings": [self._evidence({"source": row["source"], "line": row["line"],
                "clearance_level": "internal", "chunk": canonical(row), "reading": row}) for row in readings[-limit:]]}

    def verify_evidence(self, report: dict):
        """Check exact quotes, source-local numbers, arithmetic and explicit contradictions.

        This verifies evidence and calculations, not semantic entailment of prose.
        """
        if len(canonical(report)) > 100_000:
            raise ValueError("Report exceeds 100KB")
        errors, checked, contradictions = [], [], []
        evidence = report.get("evidence", [])
        if not isinstance(evidence, list) or not evidence:
            raise ValueError("Report needs non-empty evidence")
        measurements = {}
        for idx, claim in enumerate(evidence):
            item = self._get_evidence(claim["evidence_id"])
            quote = claim.get("quote", "")
            if not isinstance(quote, str) or not quote.strip() or quote not in item["chunk"]:
                errors.append(f"evidence[{idx}]: exact quote absent from cited source")
            if "value" in claim and str(claim["value"]) not in quote:
                errors.append(f"evidence[{idx}]: value absent from its quote")
            key = (claim.get("parameter"), claim.get("measurement_time"), claim.get("measurement_point"))
            if all(key) and "value" in claim:
                measurements.setdefault(key, set()).add(str(claim["value"]))
            checked.append({"evidence_id": claim["evidence_id"], "source": item["source"],
                            "page_no": item.get("page_no"), "line": item.get("line")})
        for key, values in measurements.items():
            if len(values) > 1:
                contradictions.append({"parameter": key[0], "measurement_time": key[1], "measurement_point": key[2], "values": sorted(values)})
        for idx, calc in enumerate(report.get("calculations", [])):
            try:
                result = calculate(calc["formula"], calc["operands"])
                claimed = float(calc["claimed_result"])
                if not math.isfinite(claimed) or not math.isclose(result, claimed, rel_tol=1e-6, abs_tol=0.05):
                    errors.append(f"calculations[{idx}]: claimed result differs from {result}")
                refs = calc.get("operand_evidence", {})
                for operand, value in calc["operands"].items():
                    ref = refs.get(operand, {})
                    source = self._get_evidence(ref.get("evidence_id", ""))
                    quote = ref.get("quote", "")
                    numbers = [float(n) for n in re.findall(r"(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])", quote)]
                    if not quote or quote not in source["chunk"] or float(value) not in numbers:
                        errors.append(f"calculations[{idx}]: operand {operand} is not grounded")
            except (KeyError, ValueError, TypeError, ArithmeticError, SyntaxError) as exc:
                errors.append(f"calculations[{idx}]: {exc}")
        if contradictions:
            errors.append("Conflicting measurements require human resolution")
        recommendations = report.get("actionable_recommendations", [])
        intrusive = any(re.search(r"shutdown|trip|replace|realign|overhaul|terminate|disburse|delete", str(r), re.I) for r in recommendations)
        policy = "BLOCKED" if errors else "REQUIRES_APPROVAL" if intrusive else "AUTO_APPROVE"
        verified = {**report, "verification": {"status": "FAILED" if errors else "VERIFIED", "violations": errors,
                    "citations": checked, "contradictions": contradictions, "policy_tier": policy,
                    "scope": "Exact quotation, numeric grounding and arithmetic; conclusions remain model-inferred."}}
        return {"status": verified["verification"]["status"], "report": verified, "report_hash": digest(verified)}

    def write_vault_note(self, note_title: str, content: str, expected_sha256: str):
        """Approved client only. Compare-and-swap; empty expected hash means create."""
        if not self.cfg.allow_writes or self.cfg.role not in ("engineer", "manager", "admin"):
            raise PermissionError("Vault writes disabled or role cannot write")
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", note_title) or len(content) > 100_000:
            raise ValueError("Use a simple note title and content <=100KB")
        # Generated notes never overwrite original source evidence or control clearance.
        directory = contained(self.cfg.vault_dir, self.cfg.vault_dir / "Investigations")
        directory.mkdir(parents=True, exist_ok=True)
        path = contained(directory, directory / f"{note_title}.md")
        with self.lock("vault-write"):
            current = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else ""
            if current != expected_sha256:
                raise ValueError("Concurrent edit detected; read the current note and request approval again")
            body = f'---\nclearance_level: {self.cfg.role}\nprovenance: human-approved-agent-draft\n---\n\n' + content
            with tempfile.NamedTemporaryFile(mode="w", dir=directory, delete=False) as temp:
                temp.write(body)
                temp.flush()
                os.fsync(temp.fileno())
            os.replace(temp.name, path)
        return {"source": str(path), "sha256": hashlib.sha256(body.encode()).hexdigest(), "status": "written"}


TOOL_NAMES = ("search_documents", "read_document", "read_vault_note", "get_vault_backlinks", "traverse_graph",
              "analyze_equipment_drawing", "calculate_metric", "query_sensor_history", "verify_evidence", "write_vault_note")
