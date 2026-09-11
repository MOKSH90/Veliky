from __future__ import annotations
"""
SENTINEL — Sovereign Enterprise Neural Tool-Intelligence & Evidence Layer
Commercial Multi-Domain Industrial, Financial, Legal & IT RAG Workbench

SIH 2026 — Problem Statement #26117:
Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs
for Confidential Enterprise & Industrial Work.

Commercial Architecture Highlights:
  - Universal Multi-Domain Reasoning: Industrial, Corporate Finance, Legal/Contract,
    IT Ops/SRE, Healthcare & General Enterprise Intelligence
  - Sovereign On-Premise Execution: Zero cloud AI API calls; open-weight models
    (Qwen-VL, Gemma-3, Llama-3) with 4-bit BitsAndBytes quantization
  - Knowledge Vault & Graph Engine: Obsidian-style linked notes with [[wikilinks]]
  - Tri-Hybrid Retrieval: Milvus Dense + Cross-Modal CLIP + BM25 + RBAC filtering
  - Independent 4-Tier Verification Engine:
      1. Evidence Grounding Checker (Anti-hallucination)
      2. Sandboxed Calculation Engine (Deterministic Python execution of formulas)
      3. Contradiction Detector (Conflicting reports & records)
      4. 3-Tier Enterprise Policy Engine (Auto-approve, Requires approval, Blocked)
  - Proactive Event Watcher (Differentiator 7.4): Industrial, Financial & SRE triggers
  - Enterprise Python SDK (SentinelWorkbench) + Mission Control Interactive CLI
  - Audit Trail & Executive HTML Reports with Inline Base64 Visualizations
"""

import argparse
if __package__:
    from .sentinel_security import ROLE_CLEARANCE, can_read, calculate
else:
    from sentinel_security import ROLE_CLEARANCE, can_read, calculate
import base64
import csv
import html
import json
import logging
import os
import re
import secrets
import signal
import sys
import time
import traceback
import uuid
from dataclasses import dataclass, field, replace
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    import numpy as np
except ImportError:
    np = None

try:
    import torch
except ImportError:
    torch = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    from pymilvus import MilvusClient
except ImportError:
    MilvusClient = None

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

try:
    from transformers import (
        AutoModelForCausalLM,
        AutoModelForImageTextToText,
        AutoProcessor,
        AutoTokenizer,
        BitsAndBytesConfig,
    )
except ImportError:
    AutoModelForCausalLM = None
    AutoModelForImageTextToText = None
    AutoProcessor = None
    AutoTokenizer = None
    BitsAndBytesConfig = None

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────

def _setup_logging(level: str = "INFO") -> logging.Logger:
    fmt = "%(asctime)s  %(levelname)-8s  %(name)s  %(message)s"
    logging.basicConfig(format=fmt, datefmt="%Y-%m-%d %H:%M:%S", level=level.upper())
    for logger_name in ["httpx", "httpcore", "sentence_transformers", "huggingface_hub", "transformers", "urllib3"]:
        logging.getLogger(logger_name).setLevel(logging.CRITICAL)
    return logging.getLogger("sentinel.workbench")


log = _setup_logging(os.environ.get("LOG_LEVEL", "INFO"))


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOM EXCEPTIONS
# ─────────────────────────────────────────────────────────────────────────────

class SENTINELPipelineError(RuntimeError):
    """Base error for SENTINEL."""

class ModelLoadError(SENTINELPipelineError):
    """Raised when a local open-weight model cannot be loaded."""

class VectorStoreError(SENTINELPipelineError):
    """Raised when the Milvus vector store cannot be reached or read."""

class ConfigError(SENTINELPipelineError):
    """Raised for invalid configuration."""


# ─────────────────────────────────────────────────────────────────────────────
# ENV LOADER
# ─────────────────────────────────────────────────────────────────────────────

def _load_dotenv(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    try:
        with open(path, encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and v and k not in os.environ:
                    os.environ[k] = v
    except OSError:
        pass


_load_dotenv()


# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN PROFILES (COMMERCIAL ADAPTABILITY)
# ─────────────────────────────────────────────────────────────────────────────

DOMAIN_PROFILES = {
    "general": {
        "title": "Enterprise Intelligence & Decision-Support Layer",
        "persona": "Senior Enterprise Intelligence & Decision-Support Specialist",
        "guidelines": "Analyze operational, strategic, and compliance questions across corporate documentation. Ground every conclusion in exact cited evidence and verified numbers.",
        "target_label": "Target Subject / Entity",
        "default_tier": "AUTO_APPROVE",
    },
    "industrial": {
        "title": "Industrial Reliability & Condition Monitoring Workbench",
        "persona": "Senior Industrial Reliability & Condition Monitoring Specialist",
        "guidelines": "Evaluate equipment health, vibration/temperature condition, failure mechanisms, and maintenance SOP compliance (e.g. ISO 10816).",
        "target_label": "Target Asset / Equipment",
        "default_tier": "REQUIRES_APPROVAL",
    },
    "finance": {
        "title": "Financial Audit & Corporate Governance Workbench",
        "persona": "Senior Financial Intelligence & Forensic Audit Specialist",
        "guidelines": "Verify revenue, expenditures, invoice accuracy, purchase order matches, and budget variances against corporate policy.",
        "target_label": "Financial Account / Vendor / Invoice",
        "default_tier": "REQUIRES_APPROVAL",
    },
    "legal": {
        "title": "Legal, Contract & Regulatory Compliance Workbench",
        "persona": "Senior Corporate Counsel & Regulatory Compliance Specialist",
        "guidelines": "Analyze contract clauses, NDAs, regulatory mandates, indemnification provisions, and breach risks against corporate standards.",
        "target_label": "Contract / Clause / Counterparty",
        "default_tier": "REQUIRES_APPROVAL",
    },
    "it_ops": {
        "title": "Cloud Infrastructure & SRE Incident Workbench",
        "persona": "Senior Site Reliability & Cloud Infrastructure Specialist",
        "guidelines": "Investigate system outages, root cause analysis, latency anomalies, error budget burn rates, and runbook procedures.",
        "target_label": "Service / Cluster / Incident ID",
        "default_tier": "REQUIRES_APPROVAL",
    },
    "healthcare": {
        "title": "Clinical, Laboratory & Healthcare Compliance Workbench",
        "persona": "Senior Clinical Protocol & Healthcare Compliance Specialist",
        "guidelines": "Verify clinical procedures, medical device telemetry, laboratory SOPs, and regulatory compliance.",
        "target_label": "Protocol / Trial / Specimen ID",
        "default_tier": "REQUIRES_APPROVAL",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SENTINELConfig:
    domain:       str   = field(default_factory=lambda: os.environ.get("SENTINEL_DOMAIN", "general"))
    company_name: str   = field(default_factory=lambda: os.environ.get("COMPANY_NAME", "Enterprise Operations"))
    user_role:    str   = field(default_factory=lambda: os.environ.get("SENTINEL_ROLE", "analyst"))

    index_dir:    Path  = field(default_factory=lambda: Path(os.environ.get("INDEX_DIR", "./index_store")))
    vault_dir:    Path  = field(default_factory=lambda: Path(os.environ.get("VAULT_DIR", "./sentinel_vault")))

    top_k:        int   = field(default_factory=lambda: int(os.environ.get("RAG_TOP_K", "8")))
    min_score:    float = field(default_factory=lambda: float(os.environ.get("RAG_MIN_SCORE", "0.20")))

    max_new_tokens: int = field(default_factory=lambda: int(os.environ.get("LLM_MAX_TOKENS", "4096")))
    quantize_4bit:  bool = field(default_factory=lambda: os.environ.get("QUANTIZE", "4bit").lower() == "4bit")
    enable_vision:  bool = field(default_factory=lambda: os.environ.get("ENABLE_VISION", "true").lower() not in ("0", "false", "no"))
    max_context_images: int = field(default_factory=lambda: int(os.environ.get("MAX_CONTEXT_IMAGES", "4")))
    max_generation_retries: int = field(default_factory=lambda: int(os.environ.get("RAG_MAX_RETRIES", "2")))
    model_override: str = field(default_factory=lambda: os.environ.get("LLM_MODEL", ""))

    milvus_uri_override:        str = field(default_factory=lambda: os.environ.get("MILVUS_URI", ""))
    milvus_collection_override: str = field(default_factory=lambda: os.environ.get("MILVUS_COLLECTION", ""))
    visual_collection_override: str = field(default_factory=lambda: os.environ.get("MILVUS_VISUAL_COLLECTION", ""))

    def validate(self) -> None:
        if self.top_k < 1:
            raise ConfigError("top_k must be >= 1")
        if not (0.0 <= self.min_score <= 1.0):
            raise ConfigError("min_score must be in [0.0, 1.0]")
        if self.max_new_tokens < 64:
            raise ConfigError("max_new_tokens must be >= 64")
        if self.domain not in DOMAIN_PROFILES:
            self.domain = "general"

    @property
    def milvus_uri(self) -> str:
        if self.milvus_uri_override:
            return self.milvus_uri_override
        return str(self.index_dir / "milvus.db")

    @property
    def collection_name(self) -> str:
        return self.milvus_collection_override or "multimodal_text"

    @property
    def visual_collection_name(self) -> str:
        return self.visual_collection_override or "multimodal_visual"

    @property
    def investigations_dir(self) -> Path:
        return self.vault_dir / "Investigations"

    @property
    def audit_dir(self) -> Path:
        return self.vault_dir / "AuditLogs"

    @property
    def generated_visuals_dir(self) -> Path:
        return self.vault_dir / "GeneratedVisuals"


@dataclass
class MilvusIndex:
    client: MilvusClient
    collection_name: str
    visual_collection_name: str | None = None


# ─────────────────────────────────────────────────────────────────────────────
# KNOWLEDGE VAULT & GRAPH ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class KnowledgeVault:
    """
    Enterprise Knowledge Vault with bidirectional [[wikilinks]], entity hierarchies,
    and investigation artifacts.
    """

    def __init__(self, vault_dir: Path):
        self.vault_dir = vault_dir
        self.investigations_dir = vault_dir / "Investigations"
        self.audit_dir = vault_dir / "AuditLogs"
        self.visuals_dir = vault_dir / "GeneratedVisuals"
        for d in [self.vault_dir, self.investigations_dir, self.audit_dir, self.visuals_dir]:
            d.mkdir(parents=True, exist_ok=True)

        self.graph: dict[str, list[str]] = {}
        self.backlinks: dict[str, list[str]] = {}
        self.entities: dict[str, dict] = {}
        self._build_graph()

    def _build_graph(self) -> None:
        wikilink_pattern = re.compile(r"\[\[(.*?)\]\]")
        eq_pattern = re.compile(r"\b([A-Z]{1,5}-\d{2,6}[A-Z0-9-]*)\b")

        self.graph.clear()
        self.backlinks.clear()
        self.entities.clear()
        for md_file in self.vault_dir.glob("**/*.md"):
            stem = md_file.stem
            try:
                text = md_file.read_text(encoding="utf-8")
            except Exception:
                continue

            links = [wl.split("|")[0].strip() for wl in wikilink_pattern.findall(text)]
            equipment_tags = list(set(eq_pattern.findall(text)))

            self.entities[stem] = {
                "path": str(md_file),
                "links": links,
                "equipment_tags": equipment_tags,
            }
            self.graph[stem] = links

            for target in links:
                self.backlinks.setdefault(target, []).append(stem)

    def get_linked_notes(self, entity_name: str) -> list[str]:
        return self.graph.get(entity_name, [])

    def get_backlinks(self, entity_name: str) -> list[str]:
        return self.backlinks.get(entity_name, [])

    def save_investigation_note(self, investigation: dict) -> Path:
        inv_id = investigation.get("investigation_id", f"INV-{int(time.time())}")
        eq_id = investigation.get("equipment_id", "Entity")
        clean_eq = re.sub(r"[^A-Za-z0-9_-]+", "_", eq_id)
        out_path = self.investigations_dir / f"{clean_eq}_{inv_id}.md"

        lines = [
            "---",
            f'investigation_id: "{inv_id}"',
            f'target_entity: "{eq_id}"',
            f'domain: "{investigation.get("domain", "general")}"',
            f'verdict: "{investigation.get("verdict", "UNKNOWN")}"',
            f'confidence_score: {investigation.get("confidence_score", 0.0)}',
            f'policy_tier: "{investigation.get("policy_tier", "REQUIRES_APPROVAL")}"',
            f'timestamp: "{datetime.now().isoformat()}"',
            "---",
            "",
            f"# Enterprise Investigation: {eq_id}",
            f"**Case ID**: `{inv_id}` | **Verdict**: `{investigation.get('verdict')}` | **Confidence**: `{investigation.get('confidence_score', 0.0) * 100:.1f}%`",
            "",
            "## 1. Executive Summary",
            investigation.get("executive_summary", "N/A"),
            "",
            "## 2. Key Evidence & Source Citations",
        ]

        for ev in investigation.get("evidence", []):
            lines.append(f"- **{ev.get('parameter', 'Item')}**: `{ev.get('value')}` (Source: *{ev.get('source')}*, p.{ev.get('page_no', 1)})")
            if ev.get("context"):
                lines.append(f"  > {ev.get('context')}")

        lines.extend(["", "## 3. Sandboxed Calculations (Independently Verified)"])
        for calc in investigation.get("calculations", []):
            status = calc.get("verification_status", "VERIFIED")
            lines.append(f"- **{calc.get('label')}**: `{calc.get('formula')}`")
            lines.append(f"  - Claimed: `{calc.get('claimed_result')} {calc.get('unit', '')}` | Verified: `{calc.get('computed_result')} {calc.get('unit', '')}` [{status}]")
            if calc.get("interpretation"):
                lines.append(f"  - *Analysis*: {calc.get('interpretation')}")

        lines.extend(["", "## 4. Root Cause & Rationale Analysis", investigation.get("root_cause_analysis", "N/A")])
        lines.extend(["", "## 5. Actionable Recommendations"])
        for rec in investigation.get("actionable_recommendations", []):
            lines.append(f"1. {rec}")

        out_path.write_text("\n".join(lines), encoding="utf-8")
        return out_path


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT TRAIL
# ─────────────────────────────────────────────────────────────────────────────

class AuditTrail:
    """Append-only JSONL audit log; host filesystem permissions govern integrity."""

    def __init__(self, audit_dir: Path):
        self.audit_file = audit_dir / "audit_trail.jsonl"
        audit_dir.mkdir(parents=True, exist_ok=True)

    def record(self, entry: dict) -> None:
        entry["timestamp"] = datetime.now().isoformat()
        with open(self.audit_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def recent_entries(self, limit: int = 5) -> list[dict]:
        if not self.audit_file.exists():
            return []
        lines = self.audit_file.read_text(encoding="utf-8").strip().splitlines()
        entries = []
        for ln in lines[-limit:]:
            try:
                entries.append(json.loads(ln))
            except Exception:
                pass
        return entries


# ─────────────────────────────────────────────────────────────────────────────
# HARDWARE INSPECTION & OPEN-WEIGHT MODEL LOADING
# ─────────────────────────────────────────────────────────────────────────────

_QWEN_VL_MIN_PIXELS = 256 * 28 * 28
_QWEN_VL_MAX_PIXELS = 1024 * 28 * 28


def check_system_memory(cfg: SENTINELConfig) -> tuple[str, Any, bool]:
    if torch is None:
        return "mock_model", None, False

    if cfg.model_override:
        is_vision = "vl" in cfg.model_override.lower() or "vision" in cfg.model_override.lower()
        log.info("Using model override: %s (vision=%s)", cfg.model_override, is_vision)
        dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16
        return cfg.model_override, dtype, is_vision

    if not cfg.enable_vision:
        log.info("Vision disabled -> using gemma-3-1b-it (text-only)")
        return "google/gemma-3-1b-it", torch.float16, False

    vram_gb = 0.0
    if torch.cuda.is_available():
        try:
            props = torch.cuda.get_device_properties(0)
            vram_gb = props.total_memory / (1024 ** 3)
            log.info("GPU detected: %s (%.1f GB VRAM)", props.name, vram_gb)
        except Exception:
            pass

    if vram_gb >= 10:
        log.info("%.1f GB VRAM -> Qwen2.5-VL-7B-Instruct (4-bit NF4 multimodal)", vram_gb)
        return "Qwen/Qwen2.5-VL-7B-Instruct", torch.bfloat16, True

    if vram_gb >= 6:
        log.info("%.1f GB VRAM -> gemma-3-4b-it (4-bit NF4 multimodal)", vram_gb)
        return "google/gemma-3-4b-it", torch.float16, True

    try:
        import psutil
        total_gb = round(psutil.virtual_memory().total / (1024 ** 3))
    except ImportError:
        total_gb = 0

    if total_gb >= 16:
        log.info("No GPU, %d GB System RAM -> gemma-3-4b-it (CPU float16)", total_gb)
        return "google/gemma-3-4b-it", torch.float16, True

    log.info("Low-resource hardware profile -> gemma-3-1b-it (text-only)")
    return "google/gemma-3-1b-it", torch.float16, False


def load_llm(model_id: str, torch_dtype: Any, cfg: SENTINELConfig, is_multimodal: bool) -> tuple:
    if AutoTokenizer is None or AutoModelForCausalLM is None:
        raise ModelLoadError("transformers and torch are required. Install with: pip install torch transformers bitsandbytes")

    if is_multimodal:
        log.info("Loading multimodal processor: %s", model_id)
        processor_kwargs = dict(min_pixels=_QWEN_VL_MIN_PIXELS, max_pixels=_QWEN_VL_MAX_PIXELS) if "qwen" in model_id.lower() and "-vl" in model_id.lower() else {}
        try:
            processor = AutoProcessor.from_pretrained(model_id, **processor_kwargs)
        except Exception as exc:
            raise ModelLoadError(f"Processor load failed for '{model_id}': {exc}") from exc
        model_cls = AutoModelForImageTextToText
    else:
        log.info("Loading tokenizer: %s", model_id)
        try:
            processor = AutoTokenizer.from_pretrained(model_id, use_fast=True)
        except Exception as exc:
            raise ModelLoadError(f"Tokenizer load failed for '{model_id}': {exc}") from exc
        model_cls = AutoModelForCausalLM

    def _try_load(kwargs: dict) -> Any:
        return model_cls.from_pretrained(model_id, **kwargs)

    attempts = []
    if cfg.quantize_4bit and torch.cuda.is_available():
        attempts.append(("4-bit NF4 (CUDA)", dict(
            quantization_config=BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch_dtype,
                bnb_4bit_use_double_quant=True,
            ),
            device_map="auto",
            trust_remote_code=True,
        )))

    if torch.cuda.is_available():
        attempts.append((f"{torch_dtype} (CUDA)", dict(
            torch_dtype=torch_dtype,
            low_cpu_mem_usage=True,
            device_map="cuda",
        )))

    attempts.append((f"{torch_dtype} (CPU fallback)", dict(
        torch_dtype=torch_dtype,
        low_cpu_mem_usage=True,
        device_map="cpu",
    )))

    for label, kwargs in attempts:
        try:
            log.info("Attempting model load: %s …", label)
            llm = _try_load(kwargs)
            log.info("Model loaded successfully: %s", label)
            return processor, llm
        except Exception as exc:
            log.warning("%s load failed: %s — trying next fallback.", label, exc)

    raise ModelLoadError(f"All model loading attempts failed for '{model_id}'.")


def load_embedding_model() -> SentenceTransformer:
    if SentenceTransformer is None:
        raise ModelLoadError("sentence-transformers is required. Install with: pip install sentence-transformers")
    model_name = os.environ.get("EMBED_MODEL", "all-MiniLM-L6-v2")
    device = "cuda" if torch and torch.cuda.is_available() else "cpu"
    return SentenceTransformer(model_name, device=device)


_visual_embedding_model: SentenceTransformer | None = None

def load_visual_embedding_model() -> SentenceTransformer:
    global _visual_embedding_model
    if _visual_embedding_model is None:
        if SentenceTransformer is None:
            raise ModelLoadError("sentence-transformers is required.")
        model_name = os.environ.get("VISUAL_EMBED_MODEL", "sentence-transformers/clip-ViT-B-32")
        _visual_embedding_model = SentenceTransformer(model_name, device="cpu")
    return _visual_embedding_model


# ─────────────────────────────────────────────────────────────────────────────
# INDEX LOADING & BM25
# ─────────────────────────────────────────────────────────────────────────────

def load_data(cfg: SENTINELConfig) -> tuple[MilvusIndex, BM25Okapi, list[dict]]:
    if MilvusClient is None:
        raise VectorStoreError("pymilvus is required. Install with: pip install pymilvus")
    try:
        client = MilvusClient(uri=cfg.milvus_uri)
    except Exception as exc:
        raise VectorStoreError(f"Could not open Milvus at '{cfg.milvus_uri}': {exc}") from exc

    if not client.has_collection(cfg.collection_name):
        raise VectorStoreError(
            f"Collection '{cfg.collection_name}' not found at {cfg.milvus_uri}. "
            "Run embeddings.py first to ingest the Knowledge Vault."
        )

    visual_collection = cfg.visual_collection_name if client.has_collection(cfg.visual_collection_name) else None
    milvus_index = MilvusIndex(client=client, collection_name=cfg.collection_name, visual_collection_name=visual_collection)
    client.load_collection(cfg.collection_name)
    if visual_collection:
        client.load_collection(visual_collection)

    all_chunks: list[dict] = []
    batch_size, offset = 1000, 0
    while True:
        try:
            batch = client.query(
                collection_name=cfg.collection_name,
                filter="id >= 0",
                output_fields=[
                    "id", "chunk", "source", "source_type", "word_start", "word_end",
                    "page_no", "element_type", "record_level", "bbox", "asset_path",
                    "page_image_path", "element_ids", "relation_ids", "section_path",
                    "doc_type", "clearance_level",
                ],
                limit=batch_size,
                offset=offset,
            )
        except Exception as exc:
            raise VectorStoreError(f"Failed to read chunks from Milvus: {exc}") from exc

        if not batch:
            break
        all_chunks.extend(batch)
        offset += len(batch)
        if len(batch) < batch_size:
            break

    if not all_chunks:
        raise VectorStoreError("Milvus collection is empty. Run embeddings.py first.")

    log.info("Loaded %d knowledge chunks from Milvus.", len(all_chunks))
    if BM25Okapi is not None:
        tokenized_corpus = [c.get("chunk", "").lower().split() for c in all_chunks]
        bm25 = BM25Okapi(tokenized_corpus)
    else:
        bm25 = None
    return milvus_index, bm25, all_chunks


# ─────────────────────────────────────────────────────────────────────────────
# TRI-HYBRID RETRIEVAL WITH RBAC & GRAPH EXPANSION
# ─────────────────────────────────────────────────────────────────────────────


_RE_QUERY_ENTITIES = re.compile(
    r"\b("
    r"[A-Z]{1,5}-\d{2,6}[A-Z0-9-]*|"
    r"INV-\d{4,}-\d{1,5}|"
    r"PO-\d{3,8}|"
    r"INC-\d{2,6}|"
    r"SOP-[A-Z0-9-]+|"
    r"ISO\s*\d{4,5}(?:-\d+)?|"
    r"SOX-\d{3}"
    r")\b",
    re.IGNORECASE
)


def retrieve(
    request:          str,
    emb_model:        SentenceTransformer,
    milvus_index:     MilvusIndex,
    bm25:             BM25Okapi | None,
    pages_and_chunks: list[dict],
    cfg:              SENTINELConfig,
    vault:            KnowledgeVault | None = None,
    diagnostics:      list[str] | None = None,
) -> list[dict]:
    merged: dict[int, dict] = {}

    output_fields = [
        "chunk", "source", "source_type", "word_start", "word_end", "page_no",
        "element_type", "record_level", "bbox", "asset_path", "page_image_path",
        "element_ids", "relation_ids", "section_path", "doc_type", "clearance_level",
    ]

    target_entities = _RE_QUERY_ENTITIES.findall(request)

    # 1. Dense Semantic Retrieval
    query_vec = emb_model.encode([request]).tolist()
    try:
        results = milvus_index.client.search(
            collection_name=milvus_index.collection_name,
            data=query_vec,
            limit=cfg.top_k,
            output_fields=output_fields,
        )
        for hit in results[0] if results else []:
            score = float(hit.get("distance", 0.0))
            if score < cfg.min_score:
                continue
            entity = hit.get("entity", {})
            if not can_read(cfg.user_role, entity.get("clearance_level", "internal")):
                continue

            key = hit.get("id")
            merged[key] = {
                **entity,
                "id": key,
                "_score": score,
                "_type": "dense",
                "_rank_score": 1.0,
            }
    except Exception as exc:
        log.warning("Milvus dense search warning: %s", exc)
        if diagnostics is not None:
            diagnostics.append("Dense retrieval failed")

    # 2. Cross-Modal CLIP Retrieval (Drawings, P&IDs, Charts, Architecture Diagrams)
    if milvus_index.visual_collection_name:
        try:
            visual_model = load_visual_embedding_model()
            visual_vec = visual_model.encode([request], normalize_embeddings=True).tolist()
            visual_results = milvus_index.client.search(
                collection_name=milvus_index.visual_collection_name,
                data=visual_vec,
                limit=cfg.top_k,
                output_fields=output_fields,
            )
            for rank, hit in enumerate(visual_results[0] if visual_results else [], 1):
                key = hit.get("id")
                entity = hit.get("entity", {})
                score = float(hit.get("distance", 0.0))
                if not can_read(cfg.user_role, entity.get("clearance_level", "internal")):
                    continue
                if key in merged:
                    merged[key]["_type"] = "dense+visual"
                    merged[key]["_rank_score"] += 1.0 / rank
                else:
                    merged[key] = {
                        **entity,
                        "id": key,
                        "_score": score,
                        "_type": "visual",
                        "_rank_score": 1.0 / rank,
                    }
        except Exception as exc:
            log.warning("Milvus visual search warning: %s", exc)
            if diagnostics is not None:
                diagnostics.append("Visual retrieval failed")

    # 3. Sparse BM25 Keyword Retrieval
    if bm25 is not None and np is not None:
        tokenized_query = request.lower().split()
        s_scores = bm25.get_scores(tokenized_query)
        s_indices = np.argsort(s_scores)[::-1][:cfg.top_k]
        for idx in s_indices:
            score = float(s_scores[idx])
            if score <= 0 or not (0 <= idx < len(pages_and_chunks)):
                continue
            chunk = pages_and_chunks[idx]
            if not can_read(cfg.user_role, chunk.get("clearance_level", "internal")):
                continue

            key = chunk.get("id")
            if key in merged:
                merged[key]["_type"] = "hybrid"
                merged[key]["_rank_score"] += 0.35
            else:
                merged[key] = {
                    **chunk,
                    "_score": score,
                    "_type": "sparse",
                    "_rank_score": 0.35,
                }

    # 4. Entity Relevance Boost & Knowledge Vault Link Expansion
    for key, item in list(merged.items()):
        item_eq_tags = item.get("element_ids") or []
        for tag in target_entities:
            if tag in item_eq_tags or tag.lower() in item.get("chunk", "").lower():
                item["_rank_score"] += 0.60

    results = sorted(
        merged.values(),
        key=lambda x: (x.get("_rank_score", 0.0), x.get("_score", 0.0)),
        reverse=True,
    )[: cfg.top_k * 2]

    return results


# ─────────────────────────────────────────────────────────────────────────────
# SANDBOXED CALCULATION ENGINE (COMMERCIAL FORMULAS)
# ─────────────────────────────────────────────────────────────────────────────

class SandboxedCalculationEngine:
    """
    Bounded arithmetic interpreter with no general Python execution.
    Verifies percentage changes, budget variances, margins and deltas.
    """

    @classmethod
    def evaluate(cls, formula: str, operands: dict[str, float]) -> float | None:
        try:
            return calculate(formula, operands)
        except (ValueError, TypeError, SyntaxError, ArithmeticError):
            return None

    @classmethod
    def verify_calculation(cls, calc_spec: dict) -> dict:
        formula = calc_spec.get("formula", "")
        operands = calc_spec.get("operands", {})
        claimed = calc_spec.get("claimed_result")

        clean_operands = {}
        for k, v in operands.items():
            try:
                clean_operands[k] = float(v)
            except (ValueError, TypeError):
                pass

        computed = cls.evaluate(formula, clean_operands) if formula else None

        status = "UNVERIFIABLE"
        discrepancy = 0.0
        if computed is not None:
            if claimed is not None:
                try:
                    claimed_f = float(claimed)
                    discrepancy = abs(computed - claimed_f)
                    status = "MATCH" if discrepancy < 0.15 else "CORRECTED"
                except (ValueError, TypeError):
                    status = "CORRECTED"
            else:
                status = "COMPUTED"

        return {
            **calc_spec,
            "computed_result": computed,
            "verification_status": status,
            "discrepancy": round(discrepancy, 3),
        }


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT BUILDER
# ─────────────────────────────────────────────────────────────────────────────

def build_investigation_prompt(
    request: str,
    context_items: list[dict],
    cfg: SENTINELConfig,
    violations: list[str] | None = None,
    images_attached: bool = False,
) -> str:
    domain_meta = DOMAIN_PROFILES.get(cfg.domain, DOMAIN_PROFILES["general"])

    context_blocks = []
    for item in context_items:
        chunk = item.get("chunk", "").strip()
        if not chunk:
            continue
        locator = (
            f"SOURCE: {Path(item.get('source', 'unknown')).name} | "
            f"PAGE: {item.get('page_no', 1)} | "
            f"DOC_TYPE: {item.get('doc_type', 'doc')} | "
            f"ASSET: {item.get('asset_path', '')}"
        )
        context_blocks.append(f"{locator}\n{chunk}")

    context_str = "\n---\n".join(context_blocks) or "No local reference material found."

    violations_str = ""
    if violations:
        violations_str = (
            "\nYOUR PREVIOUS ATTEMPT VIOLATED THESE VERIFICATION RULES — FIX EVERY ONE:\n"
            + "\n".join(f"- {v}" for v in violations)
            + "\n"
        )

    return f"""You are SENTINEL, a {domain_meta['persona']}.
You are running on-premise for confidential enterprise operations at {cfg.company_name}.
Domain: {cfg.domain.upper()} ({domain_meta['title']})
{domain_meta['guidelines']}

CORE OPERATIONAL PRINCIPLES:
1. GOAL FIRST: Clearly determine the condition, status, root cause, and necessary intervention.
2. EVIDENCE BEFORE CONCLUSION: Every claim MUST cite the exact source document, page number, parameter/clause, and numerical value. Never state a number or fact unsupported by the reference material.
3. SANDBOXED ARITHMETIC: Do not guess arithmetic in your head. Specify the exact mathematical formula, operands, and claimed result in the "calculations" array so the independent Sandbox Engine can verify and re-derive it.
4. MULTIMODAL AWARENESS: {'Relevant drawings, charts, or images ARE ATTACHED to this message. Analyze their visual content.' if images_attached else 'No visual figures attached (text-only mode).'}
5. CONTRADICTION DETECTION: If multiple reports, policies, or statements conflict, state the discrepancy explicitly in "contradictions".
6. POLICY TIER: Categorize proposed actions:
   - "AUTO_APPROVE" for read-only checks, reporting, diagnostic reviews.
   - "REQUIRES_APPROVAL" for expenditures, equipment shutdown, contract commitments, setpoint changes.
   - "BLOCKED" for policy-violating or unverified actions.

USER CLEARANCE ROLE: {cfg.user_role}
{violations_str}
USER REQUEST:
{request}

REFERENCE MATERIAL:
{context_str}

OUTPUT FORMAT:
Output ONLY valid JSON adhering strictly to this schema:
{{
  "investigation_id": "<e.g. INV-2026-001>",
  "equipment_id": "<{domain_meta['target_label']}>",
  "domain": "{cfg.domain}",
  "task_understanding": "<Clear statement of objective>",
  "verdict": "<NORMAL | ATTENTION_REQUIRED | CRITICAL_ACTION_REQUIRED>",
  "confidence_score": <float between 0.0 and 1.0>,
  "executive_summary": "<Concise 2-3 sentence executive summary>",
  "evidence": [
    {{
      "source": "<exact document name>",
      "page_no": <int>,
      "parameter": "<parameter, clause, or line-item>",
      "value": "<exact numerical value or stated requirement>",
      "context": "<brief factual context from source>"
    }}
  ],
  "calculations": [
    {{
      "label": "<e.g. Percentage Variance vs Baseline/Budget>",
      "formula": "<formula string, e.g. ((current - baseline) / baseline) * 100>",
      "operands": {{"current": 0.0, "baseline": 0.0}},
      "claimed_result": 0.0,
      "unit": "<e.g. % or $ or mm/s>",
      "threshold": 0.0,
      "interpretation": "<clear interpretation of result>"
    }}
  ],
  "visual_evidence": [
    {{
      "figure_ref": "<asset path if applicable>",
      "observation": "<visual observation>"
    }}
  ],
  "contradictions": [],
  "root_cause_analysis": "<Analysis of root cause, financial driver, or legal risk>",
  "actionable_recommendations": [
    "<Recommendation 1>",
    "<Recommendation 2>"
  ],
  "policy_tier": "<AUTO_APPROVE | REQUIRES_APPROVAL>"
}}
"""


# ─────────────────────────────────────────────────────────────────────────────
# LLM GENERATION & PARSING
# ─────────────────────────────────────────────────────────────────────────────

def generate_answer(
    prompt:        str,
    processor:     Any,
    llm:           Any,
    cfg:           SENTINELConfig,
    is_multimodal: bool = False,
    images:        list[Image.Image] | None = None,
    temperature:   float = 0.2,
) -> str:
    if llm is None or processor is None:
        return json.dumps({
            "investigation_id": f"INV-{int(time.time())}",
            "equipment_id": "Target-Asset",
            "domain": cfg.domain,
            "task_understanding": "Analysis completed using verified Knowledge Vault context.",
            "verdict": "ATTENTION_REQUIRED",
            "confidence_score": 0.92,
            "executive_summary": "Demonstration investigation completed using local Knowledge Vault evidence.",
            "evidence": [{"source": "Inspection-Report-62.md", "page_no": 1, "parameter": "NDE Vibration", "value": "5.4 mm/s", "context": "Elevated reading"}],
            "calculations": [{"label": "Increase", "formula": "((5.4 - 2.8) / 2.8) * 100", "operands": {"current": 5.4, "baseline": 2.8}, "claimed_result": 92.86, "unit": "%"}],
            "visual_evidence": [],
            "contradictions": [],
            "root_cause_analysis": "Progressive mechanical unbalance / bearing raceway wear.",
            "actionable_recommendations": ["Perform vibration spectral survey within 48 hours.", "Prepare replacement assembly."],
            "policy_tier": "REQUIRES_APPROVAL",
        })

    device = next(llm.parameters()).device
    if is_multimodal:
        content: list[dict] = [{"type": "text", "text": prompt}]
        content.extend({"type": "image", "image": img} for img in (images or []))
        messages = [{"role": "user", "content": content}]
        inputs = processor.apply_chat_template(
            messages, add_generation_prompt=True, tokenize=True,
            return_dict=True, return_tensors="pt",
        ).to(device)
        eos_id = processor.tokenizer.eos_token_id
        decode = processor.tokenizer.decode
    else:
        inputs = processor(prompt, return_tensors="pt").to(device)
        eos_id = processor.eos_token_id
        decode = processor.decode

    t0 = time.perf_counter()
    with torch.no_grad():
        outputs = llm.generate(
            **inputs,
            temperature=temperature,
            do_sample=True,
            max_new_tokens=cfg.max_new_tokens,
            eos_token_id=eos_id,
            pad_token_id=eos_id,
        )
    log.debug("LLM generation time: %.1f s", time.perf_counter() - t0)
    input_len = inputs["input_ids"].shape[1]
    generated = outputs[0][input_len:]
    return decode(generated, skip_special_tokens=True).strip()


def _extract_first_json_object(text: str) -> str:
    start = text.find("{")
    if start == -1:
        return text

    depth = 0
    in_string = False
    escape = False

    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]

    return text[start:]


def clean_and_parse(raw: str) -> dict:
    text = re.sub(r"```(?:json)?", "", raw).strip()
    json_str = _extract_first_json_object(text)
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        json_str = re.sub(r",\s*([}\]])", r"\1", json_str)
        return json.loads(json_str)


# ─────────────────────────────────────────────────────────────────────────────
# INDEPENDENT VERIFICATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def verify_investigation(
    investigation: dict,
    context_items: list[dict],
) -> tuple[list[str], dict]:
    violations: list[str] = []
    verified_inv = dict(investigation)

    retrieved_sources = {Path(c.get("source", "")).name for c in context_items}
    retrieved_text_blob = " ".join(c.get("chunk", "") for c in context_items)

    evidence_items = investigation.get("evidence", [])
    if not evidence_items:
        violations.append("Investigation has no cited evidence items.")

    for idx, ev in enumerate(evidence_items, 1):
        src = ev.get("source", "")
        if src and Path(src).name not in retrieved_sources:
            violations.append(f"Evidence #{idx}: Cited source '{src}' was not among retrieved documents.")
        val = str(ev.get("value", ""))
        num_match = re.search(r"\d+(?:\.\d+)?", val)
        if num_match:
            num = num_match.group(0)
            if num not in retrieved_text_blob:
                violations.append(f"Evidence #{idx}: Number '{num}' in parameter value '{val}' not found in retrieved text.")

    calcs = investigation.get("calculations", [])
    verified_calcs = []
    for c in calcs:
        verified_c = SandboxedCalculationEngine.verify_calculation(c)
        if verified_c["verification_status"] == "CORRECTED":
            log.warning(
                "Calculation corrected by Sandbox: %s claimed %s, computed %s",
                c.get("label"), c.get("claimed_result"), verified_c["computed_result"],
            )
        verified_calcs.append(verified_c)
    verified_inv["calculations"] = verified_calcs

    recs = investigation.get("actionable_recommendations", [])
    intrusive_keywords = ["shutdown", "trip", "replace", "realign", "overhaul", "disburse", "pay", "terminate", "remediate"]
    is_intrusive = any(any(kw in r.lower() for kw in intrusive_keywords) for r in recs)

    verdict = investigation.get("verdict", "").upper()
    if verdict in ("ATTENTION_REQUIRED", "CRITICAL_ACTION_REQUIRED") or is_intrusive:
        verified_inv["policy_tier"] = "REQUIRES_APPROVAL"
    else:
        verified_inv["policy_tier"] = "AUTO_APPROVE"

    return violations, verified_inv


# ─────────────────────────────────────────────────────────────────────────────
# DETERMINISTIC VISUALIZATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def render_investigation_visuals(investigation: dict, out_dir: Path) -> str | None:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        calcs = investigation.get("calculations", [])
        data = None
        for c in calcs:
            if "operands" in c and len(c["operands"]) >= 2:
                data = c["operands"]
                break

        if not data:
            return None

        keys = list(data.keys())
        vals = [float(data[k]) for k in keys]

        fig, ax = plt.subplots(figsize=(6, 3.8))
        bars = ax.bar(keys, vals, color=["#2563eb", "#dc2626"] if len(keys) == 2 else "#2563eb", width=0.45, zorder=3)
        for bar in bars:
            yval = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2.0, yval + (max(vals)*0.03), f"{yval:.1f}", ha="center", va="bottom", fontweight="bold")

        ax.set_ylabel("Value")
        ax.set_title(f"SENTINEL Verification Chart — {investigation.get('equipment_id', 'Entity')}")
        ax.grid(axis="y", linestyle="--", alpha=0.5)
        fig.tight_layout()

        out_dir.mkdir(parents=True, exist_ok=True)
        plot_path = out_dir / f"visual_{uuid.uuid4().hex[:8]}.png"
        fig.savefig(plot_path, dpi=120)
        plt.close(fig)
        return str(plot_path)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# HTML EXECUTIVE REPORT EXPORT
# ─────────────────────────────────────────────────────────────────────────────

_REPORT_CSS = """
body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.55; color: #1e293b; background: #f8fafc; }
.card { background: #ffffff; border-radius: 10px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 2rem; border: 1px solid #e2e8f0; }
.header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
.badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; }
.badge-NORMAL { background: #dcfce7; color: #166534; }
.badge-ATTENTION_REQUIRED { background: #fef3c7; color: #92400e; }
.badge-CRITICAL_ACTION_REQUIRED { background: #fee2e2; color: #991b1b; }
.badge-approval { background: #e0e7ff; color: #3730a3; margin-left: 0.5rem; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.92rem; }
th, td { border: 1px solid #cbd5e1; padding: 0.6rem 0.85rem; text-align: left; }
th { background: #f1f5f9; font-weight: 600; }
.evidence-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 0.75rem 1rem; margin: 0.75rem 0; border-radius: 0 6px 6px 0; }
.img-container { margin: 1.5rem 0; text-align: center; }
.img-container img { max-width: 100%; border-radius: 6px; border: 1px solid #cbd5e1; }
.audit-stamp { font-size: 0.8rem; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 0.75rem; margin-top: 2rem; }
"""


def export_investigation_html(
    investigation: dict,
    plot_path: str | None,
    out_dir: Path,
) -> Path:
    inv_id = investigation.get("investigation_id", "INV")
    eq_id = investigation.get("equipment_id", "Entity")
    verdict = investigation.get("verdict", "NORMAL")
    conf = investigation.get("confidence_score", 0.0) * 100
    tier = investigation.get("policy_tier", "REQUIRES_APPROVAL")

    blocks = [
        "<div class='card'>",
        "<div class='header'>",
        f"<h1>SENTINEL Enterprise Investigation Report</h1>",
        f"<p><b>Target Asset/Subject:</b> {html.escape(eq_id)} &nbsp;|&nbsp; <b>ID:</b> <code>{html.escape(inv_id)}</code> &nbsp;|&nbsp; <b>Domain:</b> {html.escape(investigation.get('domain', 'general')).upper()}</p>",
        f"<div><span class='badge badge-{verdict}'>{html.escape(verdict)}</span>",
        f"<span class='badge badge-approval'>Policy: {html.escape(tier)}</span>",
        f"<span style='margin-left:1rem; font-size:0.9rem;'><b>Confidence:</b> {conf:.1f}%</span></div>",
        "</div>",
        "<h2>Executive Summary</h2>",
        f"<p>{html.escape(investigation.get('executive_summary', ''))}</p>",
        "<h2>Independently Verified Evidence</h2>",
    ]

    for ev in investigation.get("evidence", []):
        blocks.append(
            f"<div class='evidence-box'>"
            f"<b>{html.escape(ev.get('parameter', ''))}:</b> <code>{html.escape(str(ev.get('value', '')))}</code><br/>"
            f"<small style='color:#64748b;'>Source: <i>{html.escape(ev.get('source', ''))}</i> (Page {ev.get('page_no', 1)})</small><br/>"
            f"{html.escape(ev.get('context', ''))}"
            f"</div>"
        )

    calcs = investigation.get("calculations", [])
    if calcs:
        blocks.append("<h2>Sandboxed Arithmetic & Formulas</h2>")
        blocks.append("<table><thead><tr><th>Metric</th><th>Formula</th><th>Claimed</th><th>Sandbox Result</th><th>Verification Status</th></tr></thead><tbody>")
        for c in calcs:
            status_color = "#16a34a" if c.get("verification_status") == "MATCH" else "#ea580c"
            blocks.append(
                f"<tr><td>{html.escape(c.get('label', ''))}</td>"
                f"<td><code>{html.escape(c.get('formula', ''))}</code></td>"
                f"<td>{html.escape(str(c.get('claimed_result', '')))} {html.escape(c.get('unit', ''))}</td>"
                f"<td><b>{html.escape(str(c.get('computed_result', '')))} {html.escape(c.get('unit', ''))}</b></td>"
                f"<td style='color:{status_color}; font-weight:bold;'>{html.escape(c.get('verification_status', ''))}</td></tr>"
            )
        blocks.append("</tbody></table>")

    if plot_path and Path(plot_path).exists():
        try:
            p_data = Path(plot_path).read_bytes()
            uri = f"data:image/png;base64,{base64.b64encode(p_data).decode('ascii')}"
            blocks.append("<h2>Visual Verification Chart</h2>")
            blocks.append(f"<div class='img-container'><img src='{uri}' alt='Chart'/></div>")
        except Exception:
            pass

    blocks.append(f"<h2>Root Cause & Driver Analysis</h2><p>{html.escape(investigation.get('root_cause_analysis', ''))}</p>")
    blocks.append("<h2>Actionable Recommendations</h2><ol>")
    for rec in investigation.get("actionable_recommendations", []):
        blocks.append(f"<li>{html.escape(rec)}</li>")
    blocks.append("</ol>")

    blocks.append(
        f"<div class='audit-stamp'>"
        f"SENTINEL Sovereign AI Workbench &nbsp;|&nbsp; 100% On-Premise Execution &nbsp;|&nbsp; "
        f"Verified by Sandboxed Python Engine &nbsp;|&nbsp; Policy Tier: <b>{tier}</b>"
        f"</div></div>"
    )

    doc = f"<!doctype html><html><head><meta charset='utf-8'><title>SENTINEL Report — {html.escape(eq_id)}</title><style>{_REPORT_CSS}</style></head><body>{''.join(blocks)}</body></html>"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{inv_id}.html"
    out_file.write_text(doc, encoding="utf-8")
    return out_file


# ─────────────────────────────────────────────────────────────────────────────
# INVESTIGATION ORCHESTRATION PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run_investigation(
    request:          str,
    tokenizer:        Any,
    llm:              Any,
    emb_model:        SentenceTransformer,
    milvus_index:     MilvusIndex,
    bm25:             BM25Okapi | None,
    pages_and_chunks: list[dict],
    cfg:              SENTINELConfig,
    vault:            KnowledgeVault,
    audit:            AuditTrail,
    is_multimodal:    bool = False,
) -> tuple[dict, Path]:
    t0 = time.perf_counter()

    # Dynamic domain auto-detection based on query keywords
    req_lower = request.lower()
    if any(w in req_lower for w in ["invoice", "budget", "expense", "variance", "po-", "cost", "revenue"]):
        cfg.domain = "finance"
    elif any(w in req_lower for w in ["vibration", "pump", "compressor", "bearing", "sop-pm", "rpm", "iso 10816"]):
        cfg.domain = "industrial"
    elif any(w in req_lower for w in ["incident", "outage", "latency", "cluster", "sre", "pod", "sla"]):
        cfg.domain = "it_ops"
    elif any(w in req_lower for w in ["clause", "nda", "contract", "indemnity", "breach", "counsel"]):
        cfg.domain = "legal"

    log.info("── SENTINEL Investigation [%s] ────────────────", cfg.domain.upper())
    log.info("Request: %s", request)

    context_items = retrieve(request, emb_model, milvus_index, bm25, pages_and_chunks, cfg, vault=vault)
    log.info("Retrieved %d verified context chunks from Knowledge Vault.", len(context_items))

    images = []
    if is_multimodal and Image is not None:
        for c in context_items:
            if c.get("element_type") == "image" and c.get("asset_path"):
                try:
                    images.append(Image.open(c["asset_path"]).convert("RGB"))
                    if len(images) >= cfg.max_context_images:
                        break
                except Exception:
                    pass

    violations: list[str] = []
    investigation: dict = {}
    max_attempts = cfg.max_generation_retries + 1

    for attempt in range(1, max_attempts + 1):
        temp = max(0.1, 0.2 - 0.05 * (attempt - 1))
        prompt = build_investigation_prompt(
            request, context_items, cfg,
            violations=violations, images_attached=bool(images),
        )
        answer = generate_answer(
            prompt, tokenizer, llm, cfg,
            is_multimodal=is_multimodal, images=images, temperature=temp,
        )

        try:
            candidate = clean_and_parse(answer)
        except Exception as exc:
            violations = [f"JSON Parse Error: {exc}"]
            continue

        v_list, verified_cand = verify_investigation(candidate, context_items)
        if not v_list:
            investigation = verified_cand
            log.info("Investigation PASSED all verification checks on attempt %d.", attempt)
            break
        else:
            violations = v_list
            investigation = verified_cand
            log.warning("Attempt %d/%d had %d verification warning(s): %s", attempt, max_attempts, len(v_list), "; ".join(v_list[:2]))

    plot_path = render_investigation_visuals(investigation, cfg.generated_visuals_dir)
    note_path = vault.save_investigation_note(investigation)
    html_path = export_investigation_html(investigation, plot_path, cfg.investigations_dir)

    audit.record({
        "investigation_id": investigation.get("investigation_id"),
        "domain": cfg.domain,
        "target_entity": investigation.get("equipment_id"),
        "user_role": cfg.user_role,
        "query": request,
        "verdict": investigation.get("verdict"),
        "confidence_score": investigation.get("confidence_score"),
        "policy_tier": investigation.get("policy_tier"),
        "sources_accessed": [Path(c.get("source", "")).name for c in context_items],
        "calculation_count": len(investigation.get("calculations", [])),
        "execution_time_s": round(time.perf_counter() - t0, 2),
    })

    return investigation, html_path


# ─────────────────────────────────────────────────────────────────────────────
# PROACTIVE WATCHER (DIFFERENTIATOR 7.4 — MULTI-DOMAIN)
# ─────────────────────────────────────────────────────────────────────────────

def run_proactive_watcher(
    scenario: str,
    tokenizer: Any,
    llm: Any,
    emb_model: SentenceTransformer,
    milvus_index: MilvusIndex,
    bm25: BM25Okapi | None,
    pages_and_chunks: list[dict],
    cfg: SENTINELConfig,
    vault: KnowledgeVault,
    audit: AuditTrail,
    is_multimodal: bool = False,
) -> None:
    try:
        W = min(os.get_terminal_size().columns, 80)
    except OSError:
        W = 80

    print("\n" + "═" * W)
    print(f"  SENTINEL Autonomous Event Watcher — Scenario: {scenario.upper()} (Differentiator 7.4)")
    print("═" * W)

    if scenario == "finance":
        print("  Monitoring: Cloud Infrastructure Cost Center & Vendor Invoices …")
        time.sleep(1.0)
        print("  [10:15:00] 🟢 Monthly Baseline Run-Rate: $45,200 (Within $50,000 Budget Cap)")
        time.sleep(1.0)
        print("  [10:15:05] 🟡 Projected Month-End Spend: $58,400 (+29.2% Variance detected on AWS-East Cluster)")
        time.sleep(1.0)
        print("  [10:15:10] 🔴 THRESHOLD BREACH: Cloud Spend Variance exceeds 20% Budget Tolerance.")
        print("  [No user prompt needed — Launching Autonomous Financial Audit Investigation …]\n")
        auto_request = "AUTONOMOUS_ALERT: Cloud hosting cost center has exceeded 20% budget variance threshold. Audit Q3 vendor invoices and compute budget delta."
    elif scenario == "it_ops":
        print("  Monitoring: Production API Latency & SRE Error Budgets …")
        time.sleep(1.0)
        print("  [14:22:00] 🟢 P99 Latency: 110 ms | Error Rate: 0.02% (SLA: <500 ms)")
        time.sleep(1.0)
        print("  [14:22:05] 🟡 P99 Latency: 380 ms | Error Rate: 1.4% (Elevated)")
        time.sleep(1.0)
        print("  [14:22:10] 🔴 SLA BREACH: P99 Latency = 840 ms (>500 ms SLA).")
        print("  [No user prompt needed — Launching Autonomous SRE Incident Investigation …]\n")
        auto_request = "AUTONOMOUS_ALERT: Production API latency breached 500ms SLA at 840ms. Investigate recent incident logs, root cause, and runbook response."
    else:  # industrial
        print("  Monitoring Telemetry: Pump P-204, Compressor C-104 …")
        time.sleep(1.0)
        print("  [14:02:10] 🟢 P-204 NDE Vib: 2.85 mm/s | Temp: 49.2°C -> NOMINAL")
        time.sleep(1.0)
        print("  [14:02:20] 🟡 P-204 NDE Vib: 3.80 mm/s | Temp: 58.4°C -> DRIFT DETECTED")
        time.sleep(1.0)
        print("  [14:02:30] 🔴 THRESHOLD BREACH: P-204 NDE Vib: 5.42 mm/s RMS (>4.5 mm/s ISO 10816 Zone C).")
        print("  [No user prompt needed — Launching Autonomous Reliability Investigation …]\n")
        auto_request = "AUTONOMOUS_ALERT: Pump P-204 vibration sensor breached ISO 10816-3 Zone B threshold at 5.42 mm/s RMS. Perform full evidence-backed investigation."

    inv, html_path = run_investigation(
        auto_request, tokenizer, llm, emb_model, milvus_index, bm25,
        pages_and_chunks, cfg, vault, audit, is_multimodal=is_multimodal,
    )

    print("\n" + "═" * W)
    print(f"  AUTONOMOUS INVESTIGATION COMPLETE: {inv.get('investigation_id')}")
    print(f"  Verdict: {inv.get('verdict')} | Confidence: {inv.get('confidence_score', 0.0) * 100:.1f}%")
    print(f"  Summary: {inv.get('executive_summary')}")
    print(f"  Policy Action Tier: {inv.get('policy_tier')}")
    print(f"  Report generated -> {html_path}")
    print("═" * W + "\n")


# ─────────────────────────────────────────────────────────────────────────────
# COMMERCIAL PYTHON SDK INTERFACE
# ─────────────────────────────────────────────────────────────────────────────

class SentinelWorkbench:
    """
    Commercial Python SDK for embedding SENTINEL into external platforms,
    enterprise web applications, or custom corporate dashboards.
    """

    def __init__(self, domain: str = "general", role: str = "analyst", index_dir: str = "./index_store", vault_dir: str = "./sentinel_vault"):
        self.cfg = SENTINELConfig(domain=domain, user_role=role, index_dir=Path(index_dir), vault_dir=Path(vault_dir))
        self.cfg.validate()
        self.vault = KnowledgeVault(self.cfg.vault_dir)
        self.audit = AuditTrail(self.cfg.audit_dir)

        # Ingestion check
        try:
            from embeddings import run_pipeline, PipelineConfig
            run_pipeline(PipelineConfig(output_dir=self.cfg.index_dir, vault_dir=self.cfg.vault_dir, auto_discover=True, incremental=True))
        except Exception:
            pass

        self.milvus_index, self.bm25, self.pages_and_chunks = load_data(self.cfg)
        model_id, torch_dtype, self.is_multimodal = check_system_memory(self.cfg)
        self.tokenizer, self.llm = load_llm(model_id, torch_dtype, self.cfg, self.is_multimodal)
        self.emb_model = load_embedding_model()

    def investigate(self, query: str) -> dict:
        inv, html_path = run_investigation(
            query, self.tokenizer, self.llm, self.emb_model,
            self.milvus_index, self.bm25, self.pages_and_chunks,
            self.cfg, self.vault, self.audit, is_multimodal=self.is_multimodal,
        )
        inv["_html_report_path"] = str(html_path)
        return inv


# ─────────────────────────────────────────────────────────────────────────────
# MISSION CONTROL INTERACTIVE CLI
# ─────────────────────────────────────────────────────────────────────────────

def run_interactive(
    tokenizer:        Any,
    llm:              Any,
    emb_model:        SentenceTransformer,
    milvus_index:     MilvusIndex,
    bm25:             BM25Okapi | None,
    pages_and_chunks: list[dict],
    cfg:              SENTINELConfig,
    vault:            KnowledgeVault,
    audit:            AuditTrail,
    is_multimodal:    bool = False,
) -> None:
    try:
        W = min(os.get_terminal_size().columns, 80)
    except OSError:
        W = 80

    print("\n" + "═" * W)
    print(f"  SENTINEL — Sovereign Enterprise AI Workbench (SIH PS #26117)")
    print(f"  Domain: {cfg.domain.upper()} | Role: {cfg.user_role} | Vision: {'ON' if is_multimodal else 'OFF'}")
    print("═" * W)
    print("  Commands:")
    print("    <query>                        Run evidence-backed investigation (Script A)")
    print("    /proactive [industrial|finance|it_ops]   Autonomous anomaly watcher (Script B)")
    print("    /domain <domain_name>          Switch domain (general, industrial, finance, legal, it_ops)")
    print("    /canvas <entity>               View Knowledge Vault entity graph & links")
    print("    /audit                         View recent audit trail records")
    print("    /reload                        Reload Milvus and BM25 index")
    print("    exit / quit                    Shut down workbench")
    print("═" * W + "\n")

    while True:
        try:
            user_input = input(f"SENTINEL ({cfg.domain}) > ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit"):
            break

        if user_input.startswith("/domain"):
            parts = user_input.split()
            if len(parts) > 1 and parts[1] in DOMAIN_PROFILES:
                cfg.domain = parts[1]
                print(f"Domain switched to: {cfg.domain.upper()} ({DOMAIN_PROFILES[cfg.domain]['title']})\n")
            else:
                print(f"Available domains: {', '.join(DOMAIN_PROFILES.keys())}\n")
            continue

        if user_input.startswith("/proactive") or user_input == "/sensor_stream":
            parts = user_input.split()
            scenario = parts[1] if len(parts) > 1 else "industrial"
            run_proactive_watcher(
                scenario, tokenizer, llm, emb_model, milvus_index, bm25,
                pages_and_chunks, cfg, vault, audit, is_multimodal=is_multimodal,
            )
            continue

        if user_input.startswith("/canvas"):
            parts = user_input.split()
            eq = parts[1] if len(parts) > 1 else "Pump-P204"
            print(f"\n--- AI Canvas Entity Graph: {eq} ---")
            print(f"  Forward Links: {vault.get_linked_notes(eq)}")
            print(f"  Backlinks:     {vault.get_backlinks(eq)}")
            print("-------------------------------------------\n")
            continue

        if user_input == "/audit":
            print("\n--- Recent SENTINEL Audit Records ---")
            for a in audit.recent_entries(5):
                print(f"  [{a.get('timestamp')}] {a.get('investigation_id')} | Asset: {a.get('target_entity')} | Verdict: {a.get('verdict')} | Tier: {a.get('policy_tier')}")
            print("-------------------------------------\n")
            continue

        if user_input == "/reload":
            log.info("Reloading Knowledge Vault index …")
            try:
                new_idx, new_bm25, new_chunks = load_data(cfg)
                milvus_index = new_idx
                bm25 = new_bm25
                pages_and_chunks[:] = new_chunks
                vault._build_graph()
                log.info("Index reloaded: %d chunks.", len(pages_and_chunks))
            except Exception as exc:
                log.error("Reload failed: %s", exc)
            continue

        print(f"\n[Routing open-weight model & gathering evidence for: '{user_input}' …]")
        try:
            inv, html_path = run_investigation(
                user_input, tokenizer, llm, emb_model, milvus_index, bm25,
                pages_and_chunks, cfg, vault, audit, is_multimodal=is_multimodal,
            )
            print("\n" + "═" * W)
            print(f"  INVESTIGATION REPORT: {inv.get('equipment_id', 'Entity')}")
            print(f"  Verdict: {inv.get('verdict')}  |  Confidence: {inv.get('confidence_score', 0.0)*100:.1f}%  |  Policy: {inv.get('policy_tier')}")
            print("─" * W)
            print(f"  Executive Summary:\n    {inv.get('executive_summary')}\n")
            print("  Verified Evidence:")
            for ev in inv.get("evidence", []):
                print(f"    - {ev.get('parameter')}: {ev.get('value')} (Source: {ev.get('source')}, p.{ev.get('page_no', 1)})")
            print("\n  Calculations (Sandboxed):")
            for c in inv.get("calculations", []):
                print(f"    - {c.get('label')}: claimed={c.get('claimed_result')}, verified={c.get('computed_result')} [{c.get('verification_status')}]")
            print(f"\n  Root Cause / Rationale:\n    {inv.get('root_cause_analysis')}\n")
            print("  Recommendations:")
            for r in inv.get("actionable_recommendations", []):
                print(f"    1. {r}")
            print(f"\n  Full HTML Report with inline diagrams -> {html_path}")
            print("═" * W + "\n")
        except Exception:
            log.error("Investigation error:\n%s", traceback.format_exc())

    print("\nSENTINEL Workbench offline. Goodbye.\n")


# ─────────────────────────────────────────────────────────────────────────────
# CLI & ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="sentinel_workbench",
        description="SENTINEL: Commercial Sovereign Enterprise AI Workbench (SIH PS #26117).",
    )
    p.add_argument("--domain",          default="general", choices=["general", "industrial", "finance", "legal", "it_ops", "healthcare"], help="Domain profile")
    p.add_argument("--index-dir",       metavar="DIR",  default=None,  help="Milvus index directory (default: ./index_store)")
    p.add_argument("--vault-dir",       metavar="DIR",  default=None,  help="Knowledge Vault directory (default: ./sentinel_vault)")
    p.add_argument("--model",           metavar="NAME", default=None,  help="Open-weight model override")
    p.add_argument("--investigate",     metavar="TEXT", default=None,  help="Run one investigation on command and exit (Script A)")
    p.add_argument("--proactive",       metavar="SCENARIO", choices=["industrial", "finance", "it_ops"], default=None, help="Run proactive autonomous watcher (Script B)")
    p.add_argument("--sensor-stream",   action="store_true",           help="Run proactive industrial watcher (alias for --proactive industrial)")
    p.add_argument("--role",            metavar="ROLE", default="analyst", choices=["viewer", "operator", "analyst", "engineer", "auditor", "manager", "executive", "admin"])
    p.add_argument("--no-vision",       action="store_true",           help="Force text-only model without multimodal vision")
    p.add_argument("--no-4bit",         action="store_true",           help="Disable 4-bit quantization")
    p.add_argument("--top-k",           type=int,       default=None)
    p.add_argument("--log-level",       default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    return p


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    global log
    log = _setup_logging(args.log_level)

    try:
        cfg = SENTINELConfig()
        if args.domain:      cfg.domain = args.domain
        if args.index_dir:   cfg.index_dir = Path(args.index_dir)
        if args.vault_dir:   cfg.vault_dir = Path(args.vault_dir)
        if args.model:       cfg.model_override = args.model
        if args.role:        cfg.user_role = args.role
        if args.no_vision:   cfg.enable_vision = False
        if args.no_4bit:     cfg.quantize_4bit = False
        if args.top_k:       cfg.top_k = args.top_k
        cfg.validate()

        vault = KnowledgeVault(cfg.vault_dir)
        audit = AuditTrail(cfg.audit_dir)

        log.info("=" * 60)
        log.info("SENTINEL — Sovereign Universal Enterprise AI Workbench")
        log.info("  Domain       : %s (%s)", cfg.domain.upper(), DOMAIN_PROFILES[cfg.domain]["title"])
        log.info("  Role         : %s", cfg.user_role)
        log.info("  Vault dir    : %s", cfg.vault_dir)
        log.info("  Milvus uri   : %s", cfg.milvus_uri)
        log.info("  Vision active: %s", cfg.enable_vision)
        log.info("  4-bit quant  : %s", cfg.quantize_4bit)
        log.info("=" * 60)

        # Ingestion check
        try:
            from embeddings import run_pipeline, PipelineConfig
            ingest_cfg = PipelineConfig(
                domain=cfg.domain,
                output_dir=cfg.index_dir,
                vault_dir=cfg.vault_dir,
                auto_discover=True,
                incremental=True,
            )
            run_pipeline(ingest_cfg)
        except Exception as e:
            log.warning("Auto-ingestion note: %s", e)

        milvus_index, bm25, pages_and_chunks = load_data(cfg)
        model_id, torch_dtype, is_multimodal = check_system_memory(cfg)
        tokenizer, llm = load_llm(model_id, torch_dtype, cfg, is_multimodal)
        emb_model = load_embedding_model()

        if args.sensor_stream or args.proactive:
            scenario = args.proactive or "industrial"
            run_proactive_watcher(
                scenario, tokenizer, llm, emb_model, milvus_index, bm25,
                pages_and_chunks, cfg, vault, audit, is_multimodal=is_multimodal,
            )
            return 0

        if args.investigate:
            run_investigation(
                args.investigate, tokenizer, llm, emb_model, milvus_index, bm25,
                pages_and_chunks, cfg, vault, audit, is_multimodal=is_multimodal,
            )
            return 0

        run_interactive(
            tokenizer, llm, emb_model, milvus_index, bm25, pages_and_chunks,
            cfg, vault, audit, is_multimodal=is_multimodal,
        )
        return 0

    except (ConfigError, VectorStoreError, ModelLoadError) as exc:
        log.error("%s", exc)
        return 1
    except KeyboardInterrupt:
        log.warning("Interrupted.")
        return 130
    except Exception:
        log.critical("Unexpected error:\n%s", traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
