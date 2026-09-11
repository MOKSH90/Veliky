from __future__ import annotations
"""
SENTINEL — Sovereign Enterprise Neural Tool-Intelligence & Evidence Layer
Universal Multimodal Knowledge Ingestion & Vector Pipeline

Commercial-Grade Enterprise Ingestion Engine:
  - Multi-Domain Ingestion: Industrial, Finance, Legal, IT Ops, Healthcare & Corporate
  - Document Formats: PDF (Native + OCR fallback + Docling layout), DOCX (Word),
    Markdown (.md) Knowledge Vaults with [[wikilinks]], TXT, CSV/TSV tables
  - Autonomous Entity & Tag Extraction: Asset tags (P-204), Invoices (INV-2026),
    Purchase Orders (PO-984), Incidents (INC-402), Standards (ISO, SOX, SOP)
  - Scientific & Financial Symbol Preservation: Unicode NFKC normalization
  - Deterministic Signed int64 Primary Keys with Incremental MD5 Change Caching
  - Dual Milvus Vector Collections: multimodal_text & multimodal_visual
"""

import csv
import argparse
import hashlib
import json
import logging
import os
import re
import subprocess
import sys
import tempfile
import time
import traceback
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path

try:
    import numpy as np
except ImportError:
    np = None

try:
    from pymilvus import MilvusClient
except ImportError:
    MilvusClient = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────

def _setup_logging(level: str = "INFO") -> logging.Logger:
    fmt = "%(asctime)s  %(levelname)-8s  %(name)s  %(message)s"
    logging.basicConfig(format=fmt, datefmt="%Y-%m-%d %H:%M:%S", level=level.upper())
    return logging.getLogger("sentinel.ingest")


log = _setup_logging(os.environ.get("LOG_LEVEL", "INFO"))


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOM EXCEPTIONS
# ─────────────────────────────────────────────────────────────────────────────

class EmbeddingPipelineError(RuntimeError):
    """Base error for this module."""

class LoaderError(EmbeddingPipelineError):
    """Raised when a data source cannot be loaded."""

class VectorStoreError(EmbeddingPipelineError):
    """Raised when the Milvus collection cannot be created, written to, or queried."""

class ConfigError(EmbeddingPipelineError):
    """Raised for invalid configuration."""


# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PipelineConfig:
    """
    Enterprise Runtime Configuration — overridable via CLI, YAML, or environment.
    """
    domain: str = field(
        default_factory=lambda: os.environ.get("SENTINEL_DOMAIN", "general")
    )
    embed_model: str = field(
        default_factory=lambda: os.environ.get("EMBED_MODEL", "all-MiniLM-L6-v2")
    )
    chunk_size:    int = field(default_factory=lambda: int(os.environ.get("CHUNK_SIZE",    "200")))
    chunk_overlap: int = field(default_factory=lambda: int(os.environ.get("CHUNK_OVERLAP", "40")))
    min_chunk_len: int = field(default_factory=lambda: int(os.environ.get("MIN_CHUNK_LEN", "40")))
    batch_size:    int = 32

    visual_embed_model: str = field(
        default_factory=lambda: os.environ.get("VISUAL_EMBED_MODEL", "sentence-transformers/clip-ViT-B-32")
    )
    extract_images: bool = field(
        default_factory=lambda: os.environ.get("EXTRACT_IMAGES", "true").lower() not in ("0", "false", "no")
    )
    extract_tables: bool = field(
        default_factory=lambda: os.environ.get("EXTRACT_TABLES", "true").lower() not in ("0", "false", "no")
    )
    image_scale:   float = field(default_factory=lambda: float(os.environ.get("IMAGE_SCALE",   "1.5")))
    min_image_dim: int   = field(default_factory=lambda: int(os.environ.get("MIN_IMAGE_DIM", "40")))
    max_pdf_pages: int | None = field(
        default_factory=lambda: (int(v) if (v := os.environ.get("MAX_PDF_PAGES")) else None)
    )

    output_dir: Path = field(
        default_factory=lambda: Path(os.environ.get("OUTPUT_DIR", "./index_store"))
    )
    vault_dir: Path = field(
        default_factory=lambda: Path(os.environ.get("VAULT_DIR", "./sentinel_vault"))
    )
    run_id: str = ""

    milvus_uri_override:        str = field(default_factory=lambda: os.environ.get("MILVUS_URI", ""))
    milvus_collection_override: str = field(default_factory=lambda: os.environ.get("MILVUS_COLLECTION", ""))
    milvus_visual_collection_override: str = field(
        default_factory=lambda: os.environ.get("MILVUS_VISUAL_COLLECTION", "")
    )

    pdfs:         list[str] = field(default_factory=list)
    docx_files:   list[str] = field(default_factory=list)
    notes:        list[str] = field(default_factory=list)
    spreadsheets: list[str] = field(default_factory=list)
    text_files:   list[str] = field(default_factory=list)
    urls:         list[str] = field(default_factory=list)

    auto_discover: bool = field(
        default_factory=lambda: os.environ.get("AUTO_DISCOVER", "true").lower() not in ("0", "false", "no")
    )
    incremental:   bool = True

    def validate(self) -> None:
        if self.chunk_overlap >= self.chunk_size:
            raise ConfigError(
                f"chunk_overlap ({self.chunk_overlap}) must be < chunk_size ({self.chunk_size})"
            )
        if self.batch_size < 1:
            raise ConfigError("batch_size must be >= 1")
        if self.min_chunk_len < 1:
            raise ConfigError("min_chunk_len must be >= 1")
        if self.min_image_dim < 1:
            raise ConfigError("min_image_dim must be >= 1")
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", self.collection_name):
            raise ConfigError(f"Invalid Milvus collection name: '{self.collection_name}'")
        if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", self.visual_collection_name):
            raise ConfigError(f"Invalid Milvus visual collection name: '{self.visual_collection_name}'")

    @property
    def milvus_uri(self) -> str:
        if self.milvus_uri_override:
            return self.milvus_uri_override
        return str(self.output_dir / "milvus.db")

    @property
    def collection_name(self) -> str:
        if self.milvus_collection_override:
            return self.milvus_collection_override
        return f"multimodal_text_{self.run_id}" if self.run_id else "multimodal_text"

    @property
    def visual_collection_name(self) -> str:
        if self.milvus_visual_collection_override:
            return self.milvus_visual_collection_override
        return f"multimodal_visual_{self.run_id}" if self.run_id else "multimodal_visual"

    @property
    def assets_dir(self) -> Path:
        return self.output_dir / "assets"

    @property
    def page_images_dir(self) -> Path:
        return self.output_dir / "page_images"

    @property
    def chunks_backup_path(self) -> Path:
        suffix = f"_{self.run_id}" if self.run_id else ""
        return self.output_dir / f"sentinel_chunks{suffix}.json"

    @property
    def hash_cache_path(self) -> Path:
        return self.output_dir / "source_hashes.json"

    @classmethod
    def from_yaml(cls, path: str) -> PipelineConfig:
        try:
            import yaml
        except ImportError:
            raise ConfigError("PyYAML is required for --config. Install with: pip install pyyaml")
        try:
            with open(path) as f:
                data = yaml.safe_load(f)
        except FileNotFoundError:
            raise ConfigError(f"Config file not found: {path}")

        obj = cls()
        known_keys = {f.name for f in obj.__dataclass_fields__.values()}
        for k, v in data.items():
            if k in known_keys:
                setattr(obj, k, v)
        return obj


# ─────────────────────────────────────────────────────────────────────────────
# METRICS & CACHING
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class RunMetrics:
    sources_processed: int   = 0
    sources_skipped:   int   = 0
    sources_failed:    int   = 0
    total_chunks:      int   = 0
    total_images:      int   = 0
    total_tables:      int   = 0
    vectors_deleted:   int   = 0
    embed_time_s:      float = 0.0
    image_embed_time_s: float = 0.0
    insert_time_s:     float = 0.0
    total_time_s:      float = 0.0

    def report(self) -> None:
        log.info("─" * 60)
        log.info("SENTINEL Commercial Ingestion Metrics")
        log.info("  Sources processed     : %d", self.sources_processed)
        log.info("  Sources skipped       : %d (unchanged)", self.sources_skipped)
        log.info("  Sources failed        : %d", self.sources_failed)
        log.info("  Total text chunks     : %d", self.total_chunks)
        log.info("  Total diagrams/images : %d", self.total_images)
        log.info("  Total tables          : %d", self.total_tables)
        log.info("  Stale vectors purged  : %d", self.vectors_deleted)
        log.info("  Embed time (text)     : %.1f s", self.embed_time_s)
        log.info("  Embed time (visual)   : %.1f s", self.image_embed_time_s)
        log.info("  Milvus insert time    : %.1f s", self.insert_time_s)
        log.info("  Total pipeline time   : %.1f s", self.total_time_s)
        log.info("─" * 60)


def _file_md5(path: str, chunk_bytes: int = 65536) -> str:
    h = hashlib.md5()
    try:
        with open(path, "rb") as f:
            while block := f.read(chunk_bytes):
                h.update(block)
    except OSError:
        return ""
    return h.hexdigest()


def _content_md5(content: str) -> str:
    return hashlib.md5(content.encode("utf-8", errors="replace")).hexdigest()


class HashCache:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._cache: dict[str, str] = {}
        if path.exists():
            try:
                self._cache = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                log.warning("Hash cache corrupted — rebuilding.")

    def is_unchanged(self, key: str, current_hash: str) -> bool:
        return self._cache.get(key) == current_hash

    def update(self, key: str, current_hash: str) -> None:
        self._cache[key] = current_hash

    def save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._cache, indent=2), encoding="utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# GENERALIZED ENTITY EXTRACTION & CLEANING
# ─────────────────────────────────────────────────────────────────────────────

_RE_ENTITY_TAGS = re.compile(
    r"\b("
    r"[A-Z]{1,5}-\d{2,6}[A-Z0-9-]*|"
    r"INV-\d{4,}-\d{1,5}|"
    r"PO-\d{3,8}|"
    r"INC-\d{2,6}|"
    r"SOP-[A-Z0-9-]+|"
    r"ISO\s*\d{4,5}(?:-\d+)?|"
    r"SOX-\d{3}|"
    r"REQ-\d{2,6}"
    r")\b",
    re.IGNORECASE
)

_RE_WIKILINKS = re.compile(r"\[\[(.*?)\]\]")
_RE_CONTROL_CHARS = re.compile(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")
_RE_WHITESPACE = re.compile(r"\s+")


def clean_text(text: str) -> str:
    text = text.replace(chr(0), "")
    text = unicodedata.normalize("NFKC", text)
    text = _RE_CONTROL_CHARS.sub(" ", text)
    text = _RE_WHITESPACE.sub(" ", text)
    return text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# MULTI-FORMAT DOCUMENT LOADERS
# ─────────────────────────────────────────────────────────────────────────────

def _load_markdown_vault_note(path: str) -> tuple[str, dict]:
    try:
        raw_text = Path(path).read_text(encoding="utf-8")
    except Exception as exc:
        raise LoaderError(f"Vault note read failed [{path}]: {exc}") from exc

    metadata: dict = {
        "entity_ids": [],
        "relation_ids": [],
        "doc_type": "vault_note",
        "clearance_level": "internal",
    }

    body = raw_text
    if raw_text.startswith("---"):
        parts = raw_text.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            body = parts[2]
            try:
                import yaml
                fm_data = yaml.safe_load(fm_text)
                if isinstance(fm_data, dict):
                    for k in ["equipment_id", "entity_id", "asset_id", "vendor_id", "case_id"]:
                        if k in fm_data:
                            metadata["entity_ids"].append(str(fm_data[k]))
                    if "category" in fm_data:
                        metadata["doc_type"] = str(fm_data["category"]).lower()
                    if "clearance_level" in fm_data:
                        metadata["clearance_level"] = str(fm_data["clearance_level"]).lower()
                    for lk in ["connected_equipment", "related_policies", "sops", "links"]:
                        if lk in fm_data and isinstance(fm_data[lk], list):
                            metadata["relation_ids"].extend(str(x) for x in fm_data[lk])
            except Exception:
                pass

    for wl in _RE_WIKILINKS.findall(raw_text):
        clean_wl = wl.split("|")[0].strip()
        if clean_wl and clean_wl not in metadata["relation_ids"]:
            metadata["relation_ids"].append(clean_wl)

    for tag in _RE_ENTITY_TAGS.findall(raw_text):
        if tag not in metadata["entity_ids"]:
            metadata["entity_ids"].append(tag)

    return body.strip(), metadata


def _load_docx(path: str) -> tuple[str, dict]:
    metadata: dict = {
        "entity_ids": [],
        "relation_ids": [],
        "doc_type": "word_document",
        "clearance_level": "internal",
    }
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read("word/document.xml")
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
            texts = [node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
            if texts:
                paragraphs.append("".join(texts))
        raw_text = "\n\n".join(paragraphs)
        metadata["entity_ids"] = list(set(_RE_ENTITY_TAGS.findall(raw_text)))
        metadata["relation_ids"] = list(set(_RE_WIKILINKS.findall(raw_text)))
        return raw_text, metadata
    except Exception as exc:
        raise LoaderError(f"Word (.docx) parse failed [{path}]: {exc}") from exc


def _load_text(path: str) -> tuple[str, dict]:
    try:
        raw_text = Path(path).read_text(encoding="utf-8")
        metadata: dict = {
            "entity_ids": list(set(_RE_ENTITY_TAGS.findall(raw_text))),
            "relation_ids": list(set(_RE_WIKILINKS.findall(raw_text))),
            "doc_type": "text_document",
            "clearance_level": "internal",
        }
        return raw_text, metadata
    except Exception as exc:
        raise LoaderError(f"Text file read failed [{path}]: {exc}") from exc


def _load_spreadsheet(path: str) -> tuple[str, dict]:
    metadata: dict = {
        "entity_ids": [],
        "relation_ids": [],
        "doc_type": "data_table",
        "clearance_level": "internal",
    }
    try:
        delimiter = "\t" if path.endswith(".tsv") else ","
        rows = []
        with open(path, encoding="utf-8") as f:
            reader = csv.reader(f, delimiter=delimiter)
            header = next(reader, None)
            if not header:
                raise LoaderError(f"Spreadsheet has no rows: {path}")
            rows.append("| " + " | ".join(header) + " |")
            rows.append("| " + " | ".join(["---"] * len(header)) + " |")
            for r in reader:
                if any(c.strip() for c in r):
                    rows.append("| " + " | ".join(r) + " |")
                    for cell in r:
                        for eq in _RE_ENTITY_TAGS.findall(cell):
                            if eq not in metadata["entity_ids"]:
                                metadata["entity_ids"].append(eq)

        table_md = "\n".join(rows)
        stem = Path(path).stem.replace("_", " ").title()
        content = f"### Structured Data Table: {stem}\nSource: {Path(path).name}\n\n{table_md}"
        return content, metadata
    except Exception as exc:
        raise LoaderError(f"Spreadsheet load failed [{path}]: {exc}") from exc


def _pdf_text_quality(text: str) -> float:
    if not text or len(text.strip()) < 100:
        return 0.0
    chars = [char for char in text if not char.isspace()]
    if not chars:
        return 0.0
    printable = sum(char.isprintable() for char in chars) / len(chars)
    ascii_letters = sum(char.isascii() and char.isalpha() for char in chars) / len(chars)
    controls = sum(not char.isprintable() for char in chars) / len(chars)
    return max(0.0, min(1.0, printable * 0.45 + ascii_letters * 0.75 - controls * 4.0))


def _ocr_pdf_page(path: str, page_number: int, dpi: int = 150) -> tuple[int, str]:
    with tempfile.TemporaryDirectory(prefix="sentinel-ocr-") as tmp_dir:
        image_root = Path(tmp_dir) / "page"
        render = subprocess.run(
            [
                "pdftoppm", "-f", str(page_number), "-l", str(page_number),
                "-r", str(dpi), "-jpeg", "-jpegopt", "quality=90",
                "-singlefile", path, str(image_root),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
            timeout=30,
        )
        if render.returncode != 0:
            raise LoaderError(f"Could not render PDF page {page_number}")
        ocr_env = os.environ.copy()
        ocr_env["OMP_THREAD_LIMIT"] = "1"
        ocr = subprocess.run(
            ["tesseract", f"{image_root}.jpg", "stdout", "-l", "eng", "--psm", "3"],
            capture_output=True,
            text=True,
            check=False,
            timeout=30,
            env=ocr_env,
        )
        if ocr.returncode != 0:
            raise LoaderError(f"OCR failed on PDF page {page_number}: {ocr.stderr.strip()}")
        return page_number, ocr.stdout.strip()


def _ocr_pdf(path: str, page_count: int) -> str:
    cache_path = Path(f"{path}.ocr.txt")
    source_mtime = Path(path).stat().st_mtime
    if cache_path.exists() and cache_path.stat().st_mtime >= source_mtime:
        cached = cache_path.read_text(encoding="utf-8")
        if _pdf_text_quality(cached) >= 0.70:
            return cached

    workers = min(4, max(1, os.cpu_count() or 1))
    log.warning("Running Tesseract OCR fallback on %d pages (%d workers) …", page_count, workers)
    pages: dict[int, str] = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_ocr_pdf_page, path, page): page for page in range(1, page_count + 1)}
        for completed, future in enumerate(as_completed(futures), 1):
            page = futures[future]
            try:
                page_number, text = future.result()
                pages[page_number] = text
            except Exception as exc:
                log.warning("OCR failed on page %d: %s", page, exc)
    result = "\n\n".join(
        f"[Page {page}]\n{pages[page]}" for page in range(1, page_count + 1) if pages.get(page)
    )
    try:
        cache_path.write_text(result, encoding="utf-8")
    except OSError:
        pass
    return result


def _load_pdf(path: str) -> str:
    if PdfReader is None:
        raise LoaderError("pypdf is required for PDF ingestion. Install with: pip install pypdf")
    try:
        reader = PdfReader(path)
        sample_count = min(8, len(reader.pages))
        sample_text = "\n\n".join(
            text for page in reader.pages[:sample_count] if (text := page.extract_text())
        )
        quality = _pdf_text_quality(sample_text)
        if quality < 0.70:
            return _ocr_pdf(path, len(reader.pages))
        pages = [text for page in reader.pages if (text := page.extract_text())]
        return "\n\n".join(pages)
    except Exception as exc:
        raise LoaderError(f"PDF load failed [{path}]: {exc}") from exc


def _slug(path: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", Path(path).stem)


def _docling_convert(path: str, cfg: PipelineConfig):
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption

    pipeline_options = PdfPipelineOptions()
    pipeline_options.generate_picture_images = True
    pipeline_options.generate_page_images = True
    pipeline_options.generate_table_images = True
    pipeline_options.images_scale = cfg.image_scale
    pipeline_options.do_ocr = False
    pipeline_options.do_table_structure = cfg.extract_tables

    converter = DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    )
    page_range = (1, cfg.max_pdf_pages) if cfg.max_pdf_pages else (1, sys.maxsize)
    try:
        result = converter.convert(path, page_range=page_range)
        return result.document
    except Exception as exc:
        raise LoaderError(f"Docling conversion failed [{path}]: {exc}") from exc


def _save_page_image(doc, page_no: int, pages_dir: Path, saved_pages: dict[int, str]) -> str:
    if page_no not in saved_pages:
        page = doc.pages.get(page_no)
        if page and page.image and page.image.pil_image:
            page_path = pages_dir / f"p{page_no:04d}.png"
            page.image.pil_image.convert("RGB").save(page_path)
            saved_pages[page_no] = str(page_path)
        else:
            saved_pages[page_no] = ""
    return saved_pages[page_no]


def _extract_pdf_images(doc, path: str, cfg: PipelineConfig) -> list[dict]:
    assets_dir = cfg.assets_dir / _slug(path)
    pages_dir  = cfg.page_images_dir / _slug(path)
    assets_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)

    saved_pages: dict[int, str] = {}
    elements: list[dict] = []

    for idx, pic in enumerate(doc.pictures):
        if not pic.prov:
            continue
        prov = pic.prov[0]
        page_no = prov.page_no
        bbox = prov.bbox

        img = pic.get_image(doc)
        if img is None:
            continue
        img = img.convert("RGB")
        if img.width < cfg.min_image_dim or img.height < cfg.min_image_dim:
            continue

        asset_path = assets_dir / f"p{page_no:04d}_i{idx:03d}.png"
        img.save(asset_path)
        page_image_path = _save_page_image(doc, page_no, pages_dir, saved_pages)

        caption_raw = pic.caption_text(doc) or ""
        caption = clean_text(caption_raw)
        if not caption or _pdf_text_quality(caption) < 0.70:
            caption = f"Figure/Drawing from {Path(path).name}, page {page_no}."

        elements.append({
            "source":          path,
            "source_type":     "pdf",
            "element_type":    "image",
            "record_level":    "element",
            "page_no":         page_no,
            "bbox":            {"l": bbox.l, "t": bbox.t, "r": bbox.r, "b": bbox.b,
                                 "coord_origin": str(bbox.coord_origin)},
            "chunk":           caption,
            "asset_path":      str(asset_path),
            "page_image_path": page_image_path,
            "element_ids":     _RE_ENTITY_TAGS.findall(caption),
            "relation_ids":    [],
            "section_path":    "",
            "word_start":      -1,
            "word_end":        -1,
            "doc_type":        "diagram_drawing",
            "clearance_level": "internal",
            "_docling_index":  idx,
            "_pil_image":      img,
        })
    return elements


def _extract_pdf_tables(doc, path: str, cfg: PipelineConfig) -> list[dict]:
    assets_dir = cfg.assets_dir / _slug(path)
    pages_dir  = cfg.page_images_dir / _slug(path)
    assets_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)

    saved_pages: dict[int, str] = {}
    elements: list[dict] = []

    for idx, tbl in enumerate(doc.tables):
        if not tbl.prov:
            continue
        prov = tbl.prov[0]
        page_no = prov.page_no
        bbox = prov.bbox

        crop = tbl.get_image(doc)
        if crop is None:
            continue
        crop = crop.convert("RGB")

        table_md = tbl.export_to_markdown(doc)
        if not table_md:
            continue

        asset_path = assets_dir / f"p{page_no:04d}_t{idx:03d}.png"
        crop.save(asset_path)
        page_image_path = _save_page_image(doc, page_no, pages_dir, saved_pages)

        caption_raw = tbl.caption_text(doc) or ""
        caption = clean_text(caption_raw) or f"Table from {Path(path).name}, page {page_no}."
        chunk_content = f"{caption}\n\n{table_md}"

        elements.append({
            "source":          path,
            "source_type":     "pdf",
            "element_type":    "table",
            "record_level":    "element",
            "page_no":         page_no,
            "bbox":            {"l": bbox.l, "t": bbox.t, "r": bbox.r, "b": bbox.b,
                                 "coord_origin": str(bbox.coord_origin)},
            "chunk":           chunk_content,
            "asset_path":      str(asset_path),
            "page_image_path": page_image_path,
            "element_ids":     _RE_ENTITY_TAGS.findall(chunk_content),
            "relation_ids":    [],
            "section_path":    "",
            "word_start":      -1,
            "word_end":        -1,
            "doc_type":        "structured_table",
            "clearance_level": "internal",
            "_docling_index":  idx,
        })
    return elements


def _scrape_url(url: str, timeout: int = 15, retries: int = 3) -> str:
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        raise LoaderError("requests and beautifulsoup4 are required for URL scraping.")

    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, timeout=timeout, headers={"User-Agent": "SENTINEL-Ingest/1.0"})
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "head", "noscript"]):
                tag.decompose()
            text = soup.get_text(separator=" ")
            if not text.strip():
                raise LoaderError(f"URL returned empty content: {url}")
            return text
        except Exception as exc:
            last_exc = exc
            if attempt < retries:
                time.sleep(2 ** attempt)

    raise LoaderError(f"URL scrape failed: {last_exc}") from last_exc


# ─────────────────────────────────────────────────────────────────────────────
# CHUNKING & EMBEDDINGS
# ─────────────────────────────────────────────────────────────────────────────

def chunk_text(
    text: str,
    source: str,
    source_type: str,
    cfg: PipelineConfig,
    meta: dict | None = None,
) -> list[dict]:
    words = text.split()
    if not words:
        return []

    meta = meta or {}
    base_eq_ids = list(meta.get("entity_ids", []))
    base_rel_ids = list(meta.get("relation_ids", []))
    doc_type = meta.get("doc_type", "document")
    clearance = meta.get("clearance_level", "internal")

    chunks: list[dict] = []
    step = max(1, cfg.chunk_size - cfg.chunk_overlap)

    for local_index, i in enumerate(range(0, len(words), step)):
        window = " ".join(words[i : i + cfg.chunk_size])
        if len(window.strip()) < cfg.min_chunk_len:
            continue

        chunk_eq_ids = list(set(base_eq_ids + _RE_ENTITY_TAGS.findall(window)))
        chunk_rel_ids = list(set(base_rel_ids + _RE_WIKILINKS.findall(window)))

        chunks.append({
            "local_index":     local_index,
            "chunk":           window,
            "source":          source,
            "source_type":     source_type,
            "word_start":      i,
            "word_end":        min(i + cfg.chunk_size, len(words)),
            "page_no":         -1,
            "element_type":    "text",
            "record_level":    "chunk",
            "bbox":            {},
            "asset_path":      "",
            "page_image_path": "",
            "element_ids":     chunk_eq_ids,
            "relation_ids":    chunk_rel_ids,
            "section_path":    "",
            "doc_type":        doc_type,
            "clearance_level": clearance,
        })
    return chunks


def embed_chunks(
    chunks: list[dict],
    model: SentenceTransformer,
    cfg: PipelineConfig,
) -> tuple[np.ndarray, float]:
    texts = [c["chunk"] for c in chunks]
    log.info("Embedding %d chunks (batch=%d) …", len(texts), cfg.batch_size)
    t0 = time.perf_counter()
    embeddings = model.encode(
        texts,
        batch_size=cfg.batch_size,
        show_progress_bar=False,
        convert_to_numpy=True,
    ).astype("float32")
    elapsed = time.perf_counter() - t0
    return embeddings, elapsed


def embed_images(
    images: list[dict],
    visual_model: SentenceTransformer,
    cfg: PipelineConfig,
) -> tuple[np.ndarray, float]:
    pil_images = [img["_pil_image"] for img in images]
    log.info("Embedding %d images with CLIP (batch=%d) …", len(pil_images), cfg.batch_size)
    t0 = time.perf_counter()
    embeddings = visual_model.encode(
        pil_images,
        batch_size=cfg.batch_size,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,
    ).astype("float32")
    elapsed = time.perf_counter() - t0
    return embeddings, elapsed


# ─────────────────────────────────────────────────────────────────────────────
# STABLE PRIMARY KEYS & MILVUS RECORDS
# ─────────────────────────────────────────────────────────────────────────────

def _stable_chunk_id(source: str, word_start: int) -> int:
    digest = hashlib.md5(f"{source}:{word_start}".encode()).digest()
    return int.from_bytes(digest, byteorder="big") % (2 ** 63)


def _stable_image_id(source: str, page_no: int, index: int) -> int:
    digest = hashlib.md5(f"{source}:img:{page_no}:{index}".encode()).digest()
    return int.from_bytes(digest, byteorder="big") % (2 ** 63)


def _stable_table_id(source: str, page_no: int, index: int) -> int:
    digest = hashlib.md5(f"{source}:tbl:{page_no}:{index}".encode()).digest()
    return int.from_bytes(digest, byteorder="big") % (2 ** 63)


def _to_milvus_records(chunks: list[dict], embeddings: np.ndarray) -> list[dict]:
    return [
        {
            "id":              _stable_chunk_id(c["source"], c["word_start"]),
            "vector":          vec.tolist(),
            "chunk":           c["chunk"],
            "source":          c["source"],
            "source_type":     c["source_type"],
            "word_start":      c["word_start"],
            "word_end":        c["word_end"],
            "page_no":         c.get("page_no", -1),
            "element_type":    c.get("element_type", "text"),
            "record_level":    c.get("record_level", "chunk"),
            "bbox":            c.get("bbox", {}),
            "asset_path":      c.get("asset_path", ""),
            "page_image_path": c.get("page_image_path", ""),
            "element_ids":     c.get("element_ids", []),
            "relation_ids":    c.get("relation_ids", []),
            "section_path":    c.get("section_path", ""),
            "doc_type":        c.get("doc_type", "document"),
            "clearance_level": c.get("clearance_level", "internal"),
        }
        for c, vec in zip(chunks, embeddings)
    ]


def _to_milvus_table_records(tables: list[dict], embeddings: np.ndarray) -> list[dict]:
    return [
        {
            "id":              _stable_table_id(t["source"], t["page_no"], t["_docling_index"]),
            "vector":          vec.tolist(),
            "chunk":           t["chunk"],
            "source":          t["source"],
            "source_type":     t["source_type"],
            "word_start":      t["word_start"],
            "word_end":        t["word_end"],
            "page_no":         t["page_no"],
            "element_type":    t["element_type"],
            "record_level":    t["record_level"],
            "bbox":            t["bbox"],
            "asset_path":      t["asset_path"],
            "page_image_path": t["page_image_path"],
            "element_ids":     t.get("element_ids", []),
            "relation_ids":    t.get("relation_ids", []),
            "section_path":    t.get("section_path", ""),
            "doc_type":        t.get("doc_type", "table"),
            "clearance_level": t.get("clearance_level", "internal"),
        }
        for t, vec in zip(tables, embeddings)
    ]


def _to_milvus_image_records(images: list[dict], embeddings: np.ndarray) -> list[dict]:
    return [
        {
            "id":              _stable_image_id(img["source"], img["page_no"], img["_docling_index"]),
            "vector":          vec.tolist(),
            "chunk":           img["chunk"],
            "source":          img["source"],
            "source_type":     img["source_type"],
            "word_start":      img["word_start"],
            "word_end":        img["word_end"],
            "page_no":         img["page_no"],
            "element_type":    img["element_type"],
            "record_level":    img["record_level"],
            "bbox":            img["bbox"],
            "asset_path":      img["asset_path"],
            "page_image_path": img["page_image_path"],
            "element_ids":     img.get("element_ids", []),
            "relation_ids":    img.get("relation_ids", []),
            "section_path":    img.get("section_path", ""),
            "doc_type":        img.get("doc_type", "diagram"),
            "clearance_level": img.get("clearance_level", "internal"),
        }
        for img, vec in zip(images, embeddings)
    ]


# ─────────────────────────────────────────────────────────────────────────────
# MILVUS COLLECTION MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

def get_milvus_client(cfg: PipelineConfig) -> MilvusClient:
    if MilvusClient is None:
        raise VectorStoreError("pymilvus is required. Install with: pip install pymilvus")
    try:
        return MilvusClient(uri=cfg.milvus_uri)
    except Exception as exc:
        raise VectorStoreError(f"Could not open Milvus at '{cfg.milvus_uri}': {exc}") from exc


def ensure_collection(client: MilvusClient, collection_name: str, dim: int) -> None:
    try:
        if client.has_collection(collection_name):
            log.info("Milvus collection '%s' ready.", collection_name)
            return
        log.info("Creating collection '%s' (dim=%d, metric=COSINE) …", collection_name, dim)
        client.create_collection(
            collection_name=collection_name,
            dimension=dim,
            metric_type="COSINE",
        )
    except Exception as exc:
        raise VectorStoreError(f"Could not create collection '{collection_name}': {exc}") from exc


def delete_existing_source(client: MilvusClient, collection_name: str, source: str) -> int:
    if not client.has_collection(collection_name):
        return 0
    try:
        escaped = source.replace("\\", "\\\\").replace('"', '\\"')
        result = client.delete(collection_name=collection_name, filter=f'source == "{escaped}"')
        return result.get("delete_count", 0) if isinstance(result, dict) else 0
    except Exception as exc:
        raise VectorStoreError(f"Failed to purge stale vectors: {exc}") from exc


def insert_chunks(client: MilvusClient, collection_name: str, records: list[dict], retries: int = 3) -> float:
    t0 = time.perf_counter()
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            client.insert(collection_name=collection_name, data=records)
            return time.perf_counter() - t0
        except Exception as exc:
            last_exc = exc
            if attempt < retries:
                time.sleep(2 ** attempt)
    raise VectorStoreError(f"Insert into '{collection_name}' failed: {last_exc}") from last_exc


def save_outputs(
    chunks: list[dict],
    cfg: PipelineConfig,
    skipped_sources: list[str],
    images: list[dict] | None = None,
    tables: list[dict] | None = None,
) -> None:
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    def _strip_transient(items: list[dict] | None) -> list[dict]:
        return [
            {k: v for k, v in item.items() if k not in ("_pil_image", "_docling_index")}
            for item in (items or [])
        ]
    output = {
        "_metadata": {
            "system": "SENTINEL — Sovereign Enterprise Knowledge Layer",
            "domain": cfg.domain,
            "incremental": cfg.incremental,
            "skipped_sources": skipped_sources,
            "milvus_uri": cfg.milvus_uri,
            "collection": cfg.collection_name,
            "visual_collection": cfg.visual_collection_name,
        },
        "chunks": chunks,
        "images": _strip_transient(images),
        "tables": _strip_transient(tables),
    }
    cfg.chunks_backup_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Audit backup saved -> %s", cfg.chunks_backup_path)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run_pipeline(cfg: PipelineConfig) -> RunMetrics:
    cfg.validate()
    cfg.output_dir.mkdir(parents=True, exist_ok=True)

    metrics = RunMetrics()
    hash_cache = HashCache(cfg.hash_cache_path) if cfg.incremental else None
    skipped_sources: list[str] = []
    t_total = time.perf_counter()

    if cfg.auto_discover:
        discovered_notes, discovered_pdfs, discovered_docx, discovered_sheets, discovered_txt = [], [], [], [], []
        scan_dirs = [cfg.vault_dir, Path("data"), Path(".")]
        for d in scan_dirs:
            if d.is_dir():
                for p in d.rglob("*"):
                    if not p.is_file():
                        continue
                    if any(part in ("Investigations", "AuditLogs", "GeneratedPlots", "index_store", ".git") for part in p.parts):
                        continue
                    ext = p.suffix.lower()
                    if ext == ".md":
                        discovered_notes.append(str(p))
                    elif ext == ".pdf":
                        discovered_pdfs.append(str(p))
                    elif ext == ".docx":
                        discovered_docx.append(str(p))
                    elif ext in (".csv", ".tsv"):
                        discovered_sheets.append(str(p))
                    elif ext == ".txt":
                        discovered_txt.append(str(p))

        for n in discovered_notes:
            if n not in cfg.notes: cfg.notes.append(n)
        for p in discovered_pdfs:
            if p not in cfg.pdfs: cfg.pdfs.append(p)
        for d in discovered_docx:
            if d not in cfg.docx_files: cfg.docx_files.append(d)
        for s in discovered_sheets:
            if s not in cfg.spreadsheets: cfg.spreadsheets.append(s)
        for t in discovered_txt:
            if t not in cfg.text_files: cfg.text_files.append(t)

    if SentenceTransformer is None:
        raise EmbeddingPipelineError("sentence-transformers is required. Install with: pip install sentence-transformers")

    log.info("Loading embedding model: %s", cfg.embed_model)
    try:
        model = SentenceTransformer(cfg.embed_model)
    except Exception as exc:
        raise EmbeddingPipelineError(f"Cannot load embedding model '{cfg.embed_model}': {exc}") from exc

    dim = model.get_embedding_dimension()
    client = get_milvus_client(cfg)
    ensure_collection(client, cfg.collection_name, dim)

    all_chunks: list[dict] = []
    all_images: list[dict] = []
    all_tables: list[dict] = []

    source_list: list[tuple[str, str]] = (
        [("vault_note", p) for p in cfg.notes]
        + [("docx", p) for p in cfg.docx_files]
        + [("spreadsheet", p) for p in cfg.spreadsheets]
        + [("pdf", p) for p in cfg.pdfs]
        + [("text", p) for p in cfg.text_files]
        + [("url", u) for u in cfg.urls]
    )

    if not source_list:
        raise ConfigError("No sources found to ingest. Place files in ./sentinel_vault or ./data, or use CLI flags.")

    log.info("Ingesting %d enterprise document(s) (Domain: %s) …", len(source_list), cfg.domain)

    for source_type, path in source_list:
        if source_type == "url":
            try:
                raw_content = _scrape_url(path)
            except LoaderError as exc:
                log.error("  FAIL  %s", exc)
                metrics.sources_failed += 1
                continue
            current_hash = _content_md5(raw_content)
        else:
            raw_content = None
            current_hash = _file_md5(path)

        if hash_cache and hash_cache.is_unchanged(path, current_hash):
            log.info("  SKIP  [%s]  %s", source_type.upper(), Path(path).name)
            metrics.sources_skipped += 1
            skipped_sources.append(path)
            continue

        log.info("  LOAD  [%s]  %s", source_type.upper(), Path(path).name)
        try:
            meta: dict = {}
            if source_type == "vault_note":
                raw_content, meta = _load_markdown_vault_note(path)
            elif source_type == "docx":
                raw_content, meta = _load_docx(path)
            elif source_type == "spreadsheet":
                raw_content, meta = _load_spreadsheet(path)
            elif source_type == "text":
                raw_content, meta = _load_text(path)
            elif source_type == "pdf":
                raw_content = _load_pdf(path)
                meta = {"doc_type": "technical_document", "clearance_level": "internal"}

            cleaned = clean_text(raw_content or "")
            chunks = chunk_text(cleaned, source=path, source_type=source_type, cfg=cfg, meta=meta)
            log.info("  -> %d text chunk(s)", len(chunks))

            images: list[dict] = []
            tables: list[dict] = []
            if source_type == "pdf" and (cfg.extract_images or cfg.extract_tables):
                try:
                    doc = _docling_convert(path, cfg)
                    if cfg.extract_images:
                        images = _extract_pdf_images(doc, path, cfg)
                        log.info("  -> %d diagram/image(s)", len(images))
                    if cfg.extract_tables:
                        tables = _extract_pdf_tables(doc, path, cfg)
                        log.info("  -> %d structured table(s)", len(tables))
                except Exception as exc:
                    log.warning("  Layout extraction skipped (continuing with text): %s", exc)

            deleted = delete_existing_source(client, cfg.collection_name, path)
            deleted += delete_existing_source(client, cfg.visual_collection_name, path)
            if deleted:
                metrics.vectors_deleted += deleted

            all_chunks.extend(chunks)
            all_images.extend(images)
            all_tables.extend(tables)
            metrics.sources_processed += 1

            if hash_cache:
                hash_cache.update(path, current_hash)

        except LoaderError as exc:
            log.error("  FAIL  %s", exc)
            metrics.sources_failed += 1

    if not all_chunks and not all_images and not all_tables:
        if metrics.sources_skipped > 0:
            log.info("All sources unchanged. Milvus vector index is up to date.")
            metrics.total_time_s = time.perf_counter() - t_total
            return metrics
        raise EmbeddingPipelineError("No chunks produced. Verify file contents.")

    insert_time = 0.0

    if all_chunks or all_tables:
        metrics.total_chunks = len(all_chunks)
        metrics.total_tables = len(all_tables)
        records: list[dict] = []
        embed_time = 0.0

        if all_chunks:
            chunk_embeddings, t = embed_chunks(all_chunks, model, cfg)
            embed_time += t
            records.extend(_to_milvus_records(all_chunks, chunk_embeddings))

        if all_tables:
            table_embeddings, t = embed_chunks(all_tables, model, cfg)
            embed_time += t
            records.extend(_to_milvus_table_records(all_tables, table_embeddings))

        metrics.embed_time_s = embed_time
        insert_time += insert_chunks(client, cfg.collection_name, records)
        log.info("Inserted %d record(s) into '%s'", len(records), cfg.collection_name)

    visual_model: SentenceTransformer | None = None
    if all_images:
        metrics.total_images = len(all_images)
        visual_model = SentenceTransformer(cfg.visual_embed_model)
        image_embeddings, t_vis = embed_images(all_images, visual_model, cfg)
        metrics.image_embed_time_s = t_vis

        image_records = _to_milvus_image_records(all_images, image_embeddings)
        ensure_collection(client, cfg.visual_collection_name, visual_model.get_embedding_dimension())
        insert_time += insert_chunks(client, cfg.visual_collection_name, image_records)
        log.info("Inserted %d visual vector(s) into '%s'", len(image_records), cfg.visual_collection_name)

    metrics.insert_time_s = insert_time
    save_outputs(all_chunks, cfg, skipped_sources, images=all_images, tables=all_tables)

    if hash_cache:
        hash_cache.save()

    metrics.total_time_s = time.perf_counter() - t_total
    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="sentinel_ingest",
        description="SENTINEL: Commercial Multimodal Enterprise Ingestion & Vector Pipeline.",
    )
    p.add_argument("--domain",            default="general", choices=["general", "industrial", "finance", "legal", "it_ops", "healthcare"], help="Domain profile")
    p.add_argument("--vault-dir",         metavar="DIR", default="./sentinel_vault", help="Knowledge Vault directory")
    p.add_argument("--output-dir",        metavar="DIR", default="./index_store",    help="Milvus index directory")
    p.add_argument("--note",              metavar="FILE", action="append", default=[], dest="notes",        help="Markdown file(s)")
    p.add_argument("--pdf",               metavar="FILE", action="append", default=[], dest="pdfs",         help="PDF file(s)")
    p.add_argument("--docx",              metavar="FILE", action="append", default=[], dest="docx_files",   help="Word document(s)")
    p.add_argument("--spreadsheet",       metavar="FILE", action="append", default=[], dest="spreadsheets", help="CSV/Excel spreadsheet(s)")
    p.add_argument("--text",              metavar="FILE", action="append", default=[], dest="text_files",   help="Text file(s)")
    p.add_argument("--url",               metavar="URL",  action="append", default=[], dest="urls",         help="URL(s)")
    p.add_argument("--model",             metavar="NAME", default=None,                                     help="Text embedding model")
    p.add_argument("--milvus-uri",        metavar="URI",  default=None,                                     help="Milvus URI")
    p.add_argument("--no-incremental",    action="store_true",                                             help="Re-index everything")
    p.add_argument("--no-auto-discover",  action="store_true",                                             help="Disable auto-discovery")
    p.add_argument("--log-level",         default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    return p


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    global log
    log = _setup_logging(args.log_level)

    try:
        cfg = PipelineConfig()
        if args.domain:          cfg.domain = args.domain
        if args.vault_dir:       cfg.vault_dir = Path(args.vault_dir)
        if args.output_dir:      cfg.output_dir = Path(args.output_dir)
        if args.notes:           cfg.notes = args.notes
        if args.pdfs:            cfg.pdfs = args.pdfs
        if args.docx_files:      cfg.docx_files = args.docx_files
        if args.spreadsheets:    cfg.spreadsheets = args.spreadsheets
        if args.text_files:      cfg.text_files = args.text_files
        if args.urls:            cfg.urls = args.urls
        if args.model:           cfg.embed_model = args.model
        if args.milvus_uri:      cfg.milvus_uri_override = args.milvus_uri
        if args.no_incremental:  cfg.incremental = False
        if args.no_auto_discover: cfg.auto_discover = False

        log.info("=" * 60)
        log.info("SENTINEL — Universal Enterprise Knowledge Ingestion Engine")
        log.info("  Domain        : %s", cfg.domain.upper())
        log.info("  Vault dir     : %s", cfg.vault_dir)
        log.info("  Output dir    : %s", cfg.output_dir)
        log.info("  Text model    : %s", cfg.embed_model)
        log.info("  Incremental   : %s", cfg.incremental)
        log.info("=" * 60)

        metrics = run_pipeline(cfg)
        metrics.report()
        log.info("SENTINEL Ingestion complete.")
        return 0

    except ConfigError as exc:
        log.error("Config error: %s", exc)
        return 2
    except EmbeddingPipelineError as exc:
        log.error("Pipeline error: %s", exc)
        return 1
    except KeyboardInterrupt:
        log.warning("Interrupted.")
        return 130
    except Exception:
        log.critical("Unexpected error:\n%s", traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
