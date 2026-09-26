#!/usr/bin/env python3
"""
Veliky Agent CLI — Sovereign AI Agent Interface
Interactive CLI supporting /model, /agent, /thinking, /tools, /clear, /help
"""
from __future__ import annotations

import os
import sys
import time
import json
import re
import subprocess
import argparse
from pathlib import Path

# Auto-switch to virtual environment containing Veliky dependencies
if sys.prefix == sys.base_prefix:
    candidate_venvs = [
        Path(__file__).resolve().parent.parent.parent / "tflite/.venv/bin/python",
        Path(__file__).resolve().parent / ".venv/bin/python",
        Path.home() / "Projects/Tflite/Veliky/tflite/.venv/bin/python",
        Path.home() / "tflite/.venv/bin/python",
        Path("/opt/venv/bin/python"),
    ]
    for venv_py in candidate_venvs:
        if venv_py.exists():
            os.execv(str(venv_py), [str(venv_py)] + sys.argv)

# Suppress noisy Hugging Face, gRPC & library logs completely
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["GRPC_VERBOSITY"] = "NONE"
os.environ["GRPC_TRACE"] = ""
os.environ["GLOG_minloglevel"] = "3"
os.environ["GRPC_ARG_KEEPALIVE_TIME_MS"] = "300000"
os.environ["GRPC_ARG_HTTP2_MAX_PINGS_WITHOUT_DATA"] = "0"
os.environ["GRPC_ARG_KEEPALIVE_PERMIT_WITHOUT_CALLS"] = "0"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import warnings
warnings.filterwarnings("ignore")

import logging
logging.basicConfig(level=logging.CRITICAL)
for log_name in (
    "huggingface_hub",
    "huggingface_hub.utils._http",
    "sentence_transformers",
    "transformers",
    "faiss",
    "milvus_lite",
    "veliky",
    "veliky.workbench",
    "veliky.ingest",
    "httpx",
    "urllib3",
):
    logging.getLogger(log_name).setLevel(logging.CRITICAL)


# Add tflite RAG directory to sys.path
cli_file = Path(__file__).resolve()
candidate_rag_dirs = [
    cli_file.parent / "RAG",
    Path.home() / "tflite" / "RAG",
    cli_file.parent.parent.parent / "tflite" / "RAG"
]
for rag_dir in candidate_rag_dirs:
    if rag_dir.exists():
        sys.path.insert(0, str(rag_dir))
        break

try:
    from veliky_security import calculate
    from veliky_service import VelikyService
except ImportError:
    VelikyService = None

try:
    from rich.console import Console
    from rich.markdown import Markdown
    _rich_console = Console()
except ImportError:
    _rich_console = None

try:
    from prompt_toolkit import PromptSession
    from prompt_toolkit.completion import Completer, Completion
    from prompt_toolkit.styles import Style
    from prompt_toolkit.formatted_text import ANSI
    _PROMPT_TOOLKIT_AVAILABLE = True
except ImportError:
    _PROMPT_TOOLKIT_AVAILABLE = False

DEFAULT_MODEL = "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
AVAILABLE_MODELS = [
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    "Qwen/Qwen2.5-1.5B-Instruct",
    "google/gemma-3-1b-it",
]

AGENTS = {
    "general": "General AI Assistant — Capable of multi-domain reasoning, analysis, and problem-solving.",
    "code": "Code & Software Engineer — Specialized in refactoring, debugging, and system architecture.",
    "investigator": "Industrial Reliability Investigator — Specialized in telemetry analysis, vibration drift, and SOP verification.",
    "sre": "SRE & Cloud Ops Incident Agent — Specialized in AWS infrastructure, logs, SLA breaches, and runbook response.",
    "researcher": "Deep Research Agent — Specialized in knowledge vault graph navigation, document synthesis, and citations.",
}


if _PROMPT_TOOLKIT_AVAILABLE:
    class SlashCommandCompleter(Completer):
        def __init__(self, cli):
            self.cli = cli

        def get_completions(self, document, complete_event):
            text = document.text_before_cursor

            # Sub-options after /agent
            if text.startswith("/agent"):
                prefix = text[6:].lstrip()
                for agent_name, desc in AGENTS.items():
                    if not prefix or agent_name.lower().startswith(prefix.lower()):
                        yield Completion(agent_name, start_position=-len(prefix), display_meta=desc)
                return

            # Sub-options after /model
            if text.startswith("/model"):
                prefix = text[6:].lstrip()
                for model_name in AVAILABLE_MODELS:
                    if not prefix or model_name.lower().startswith(prefix.lower()):
                        yield Completion(model_name, start_position=-len(prefix), display_meta="LLM Model")
                return

            # Sub-options after /thinking
            if text.startswith("/thinking"):
                prefix = text[9:].lstrip()
                options = {"on": "Enable CoT reasoning display", "off": "Disable CoT reasoning display"}
                for opt, desc in options.items():
                    if not prefix or opt.startswith(prefix.lower()):
                        yield Completion(opt, start_position=-len(prefix), display_meta=desc)
                return

            # Top-level commands
            if text.startswith("/"):
                commands = {
                    "/agent ": "Select agent persona (general, code, investigator, sre, researcher)",
                    "/model ": "Switch active LLM model",
                    "/thinking ": "Toggle CoT reasoning mode (on/off)",
                    "/web": "Open VELIKY Web Workbench UI in browser (http://localhost:5173)",
                    "/tools": "List active tools & security permissions",
                    "/clear": "Reset conversation memory session",
                    "/help": "Display command menu and help",
                    "/exit": "Exit VELIKY CLI session",
                }
                for cmd, desc in commands.items():
                    if cmd.startswith(text):
                        yield Completion(cmd, start_position=-len(text), display_meta=desc)


class VelikyCLI:
    def __init__(self, model: str = DEFAULT_MODEL, agent: str = "general", thinking: bool = True):
        self.model = model
        self.agent = agent
        self.thinking = thinking
        self.history: list[dict] = []
        self.service = VelikyService() if VelikyService else None
        self._llm = None
        self._tokenizer = None

    def print_header(self):
        cyan = "\033[38;2;0;229;255m"
        silver = "\033[38;2;220;225;230m"
        reset = "\033[0m"
        banner = f"""
{silver}  ███████   {cyan}████████{silver}   ███    ██  ████████  ██  ███    ██  ████████  ██      {reset}
{silver} ██▀        {cyan} ▀▀▀▀▀▀ {silver}   ████   ██     ██     ██  ████   ██  ██       ██      {reset}
{silver} ▀███████   {cyan}████████{silver}   ██ ██  ██     ██     ██  ██ ██  ██  ███████  ██      {reset}
{silver}      ▄██   {cyan} ▄▄▄▄▄▄ {silver}   ██  ██ ██     ██     ██  ██  ██ ██  ██       ██      {reset}
{silver} ███████▀   {cyan}████████{silver}   ██   ████     ██     ██  ██   ████  ████████  ███████▀{reset}
"""
        print(banner)
        print("\033[1;36m" + "─" * 78 + "\033[0m")
        print("\033[1;32m  🛡️ VELIKY Sovereign Agentic AI Workbench\033[0m")
        print("\033[1;34m  Model    :\033[0m " + self.model)
        print("\033[1;34m  Agent    :\033[0m " + f"{self.agent.upper()} ({AGENTS.get(self.agent, '')})")
        print("\033[1;34m  Thinking :\033[0m " + ("\033[1;32mON\033[0m" if self.thinking else "\033[1;31mOFF\033[0m"))
        print("\033[1;34m  Workspace:\033[0m \033[1;33m" + str(Path.cwd()) + "\033[0m")
        print("\033[1;36m" + "─" * 78 + "\033[0m")
        print("\033[90m  Commands: /model <name> | /agent <type> | /thinking <on|off> | /tools | /clear | /help\033[0m\n")

    def show_help(self):
        print("\n\033[1;33mAvailable Commands:\033[0m")
        print("  \033[1;36m/model <name>\033[0m    Switch active LLM model (e.g. /model Qwen/Qwen2.5-0.5B-Instruct)")
        print("  \033[1;36m/agent <name>\033[0m    Select agent persona (general, code, investigator, sre, researcher)")
        print("  \033[1;36m/thinking <on|off>\033[0m Toggle reasoning / chain-of-thought display mode")
        print("  \033[1;36m/web\033[0m             Open VELIKY Web Workbench UI in default browser (http://localhost:5173)")
        print("  \033[1;36m/tools\033[0m           List active agent tools and capability permissions")
        print("  \033[1;36m/clear\033[0m           Reset conversation session and memory")
        print("  \033[1;36m/help\033[0m            Display this menu")
        print("  \033[1;36m/exit\033[0m            Exit VELIKY CLI session\n")

    def show_tools(self):
        print("\n\033[1;33mRegistered Agent Tools & Capabilities:\033[0m")
        print("  • \033[1;32mwrite_file\033[0m              Direct local file creation & code persistence")
        print("  • \033[1;32mread_file\033[0m               Inspect local workspace & project code files")
        print("  • \033[1;32mrun_command\033[0m             Execute terminal bash commands, builds & tests")
        print("  • \033[1;32msearch_documents\033[0m        Milvus dense + CLIP + BM25 hybrid document search")
        print("  • \033[1;32mread_vault_note\033[0m         Knowledge Vault wikilink note reader & provenance")
        print("  • \033[1;32mtraverse_graph\033[0m          Bidirectional entity graph traversal")
        print("  • \033[1;32mcalculate_metric\033[0m        Safe AST bounded arithmetic parser (no eval)")
        print("  • \033[1;32mquery_sensor_history\033[0m    Historian CSV telemetry query engine")
        print("  • \033[1;32mverify_evidence\033[0m         Independent anti-hallucination verification engine")
        print("  • \033[1;32mwrite_vault_note\033[0m        Approved investigation note persistence (CAS SHA-256)\n")

    def _execute_agent_tools(self, user_input: str, response: str) -> tuple[bool, list[str]]:
        tool_outputs = []
        has_tools = False

        def _resolve_path(raw: str) -> Path:
            clean = raw.strip(" `\"'\t\r\n")
            p = Path(clean).expanduser()
            return p.resolve() if p.is_absolute() else (Path.cwd() / p).resolve()

        # 1. Match <read_file path="..."/>
        read_matches = re.findall(r'<read_file\s+path=["\']([^"\']+)["\']\s*/?>', response)
        for filepath in read_matches:
            has_tools = True
            try:
                p = _resolve_path(filepath)
                if p.exists() and p.is_file():
                    content = p.read_text(encoding="utf-8", errors="ignore")[:3500]
                    print(f"\033[1;36m  🔍 [Agent Tool] Read File:\033[0m {p.name}", flush=True)
                    tool_outputs.append(f"<tool_result tool=\"read_file\" path=\"{filepath}\">\n{content}\n</tool_result>")
                else:
                    tool_outputs.append(f"<tool_result tool=\"read_file\" path=\"{filepath}\">Error: File does not exist</tool_result>")
            except Exception as exc:
                tool_outputs.append(f"<tool_result tool=\"read_file\" path=\"{filepath}\">Error reading file: {exc}</tool_result>")

        # 2. Match <list_dir path="..."/>
        dir_matches = re.findall(r'<list_dir\s+path=["\']([^"\']+)["\']\s*/?>', response)
        for dirpath in dir_matches:
            has_tools = True
            try:
                p = _resolve_path(dirpath)
                if p.exists() and p.is_dir():
                    items = [f"{f.name}/" if f.is_dir() else f.name for f in p.iterdir() if not f.name.startswith(".")]
                    res_str = f"Directory contents of {dirpath}:\n" + "\n".join(sorted(items)[:40])
                    print(f"\033[1;36m  📁 [Agent Tool] List Dir:\033[0m {dirpath}", flush=True)
                    tool_outputs.append(f"<tool_result tool=\"list_dir\" path=\"{dirpath}\">\n{res_str}\n</tool_result>")
                else:
                    tool_outputs.append(f"<tool_result tool=\"list_dir\" path=\"{dirpath}\">Error: Directory does not exist</tool_result>")
            except Exception as exc:
                tool_outputs.append(f"<tool_result tool=\"list_dir\" path=\"{dirpath}\">Error listing dir: {exc}</tool_result>")

        # 3. Match <grep_search query="..." path="..."/>
        grep_matches = re.findall(r'<grep_search\s+query=["\']([^"\']+)["\'](?:\s+path=["\']([^"\']+)["\'])?\s*/?>', response)
        for query, search_path in grep_matches:
            has_tools = True
            target_path = _resolve_path(search_path if search_path else ".")
            try:
                print(f"\033[1;36m  🔎 [Agent Tool] Grep Search:\033[0m '{query}' in {target_path.name}", flush=True)
                cmd_str = f"rg -n -i '{query}' '{target_path}' | head -n 25"
                res = subprocess.run(cmd_str, shell=True, capture_output=True, text=True, timeout=15)
                output = res.stdout.strip() if res.stdout else "No matches found."
                tool_outputs.append(f"<tool_result tool=\"grep_search\" query=\"{query}\">\n{output}\n</tool_result>")
            except Exception as exc:
                tool_outputs.append(f"<tool_result tool=\"grep_search\" query=\"{query}\">Error: {exc}</tool_result>")

        # 4. Match <write_file path="...">content</write_file>
        xml_matches = re.findall(r'<write_file\s+path=["\']([^"\']+)["\']>([\s\S]*?)</write_file>', response)
        for filepath, content in xml_matches:
            has_tools = True
            try:
                p = _resolve_path(filepath)
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(content.strip(), encoding="utf-8")
                print(f"\033[1;32m  📁 [Agent Tool] Created File:\033[0m {p} ({len(content)} bytes)", flush=True)
                tool_outputs.append(f"<tool_result tool=\"write_file\" path=\"{filepath}\">Success: Wrote {len(content)} bytes</tool_result>")
            except Exception as exc:
                tool_outputs.append(f"<tool_result tool=\"write_file\" path=\"{filepath}\">Error: {exc}</tool_result>")

        # 5. Match markdown ### File: filepath
        md_matches = re.findall(r'###\s+File:\s*([^\n]+)\s*\n```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```', response)
        for raw_path, content in md_matches:
            has_tools = True
            try:
                p = _resolve_path(raw_path)
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(content, encoding="utf-8")
                print(f"\033[1;32m  📁 [Agent Tool] Created File:\033[0m {p} ({len(content)} bytes)", flush=True)
                tool_outputs.append(f"<tool_result tool=\"write_file\" path=\"{raw_path}\">Success: Wrote {len(content)} bytes</tool_result>")
            except Exception as exc:
                tool_outputs.append(f"<tool_result tool=\"write_file\" path=\"{raw_path}\">Error: {exc}</tool_result>")

        # 6. Fallback file creation if prompt asks explicitly
        if not xml_matches and not md_matches:
            prompt_file_match = re.search(r'\b([a-zA-Z0-9_\-./]+\.(?:py|js|ts|jsx|tsx|html|css|json|sh|md|txt|yaml|yml|c|cpp|h|rs|go|java|pyw))\b', user_input, re.IGNORECASE)
            if prompt_file_match:
                target_filename = prompt_file_match.group(1)
                code_blocks = re.findall(r'```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```', response)
                if code_blocks:
                    code_content = code_blocks[0]
                    try:
                        p = _resolve_path(target_filename)
                        p.parent.mkdir(parents=True, exist_ok=True)
                        p.write_text(code_content, encoding="utf-8")
                        print(f"\033[1;32m  📁 [Agent Tool] Created File:\033[0m {p} ({len(code_content)} bytes)", flush=True)
                    except Exception as exc:
                        pass

        # 7. Match <run_cmd>cmd</run_cmd>
        cmd_matches = re.findall(r'<run_cmd>([\s\S]*?)</run_cmd>', response)
        for cmd in cmd_matches:
            cmd_str = cmd.strip()
            if cmd_str:
                has_tools = True
                try:
                    print(f"\033[1;33m  ⚡ [Agent Shell Tool] Executing:\033[0m {cmd_str}", flush=True)
                    res = subprocess.run(cmd_str, shell=True, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=30)
                    out = (res.stdout + ("\n" + res.stderr if res.stderr else "")).strip()[:2000]
                    if out:
                        print(f"\033[90m{out[:300]}\033[0m", flush=True)
                    tool_outputs.append(f"<tool_result tool=\"run_cmd\" command=\"{cmd_str}\">\nExit Code: {res.returncode}\nOutput:\n{out}\n</tool_result>")
                except Exception as exc:
                    tool_outputs.append(f"<tool_result tool=\"run_cmd\" command=\"{cmd_str}\">Error: {exc}</tool_result>")

        return has_tools, tool_outputs

    def load_model_if_needed(self):
        if self._llm is not None:
            return
        import warnings
        import contextlib
        warnings.filterwarnings("ignore")
        try:
            import torch
            import transformers
            transformers.logging.set_verbosity_error()
            from transformers import AutoTokenizer, AutoModelForCausalLM
            with contextlib.redirect_stderr(open(os.devnull, "w")):
                self._tokenizer = AutoTokenizer.from_pretrained(self.model, use_fast=True)
                device = "cuda" if torch.cuda.is_available() else "cpu"
                dtype_param = torch.float16 if torch.cuda.is_available() else torch.float32
                self._llm = AutoModelForCausalLM.from_pretrained(
                    self.model,
                    torch_dtype=dtype_param,
                    device_map="auto" if torch.cuda.is_available() else None,
                )
        except Exception:
            pass

    def process_prompt(self, user_input: str):
        t0 = time.time()
        response = ""

        # Automatic Workspace Directory & File Inspection
        workspace_context = ""
        read_files = set()
        try:
            target_dir = None

            # 1. Direct path regex (e.g. ~/Projects/legit, /path/to/dir, file.md)
            path_candidates = re.findall(r'(?:~[/\w.-]+|[/\w.-]+(?:/[/\w.-]+)+|[\w.-]+\.(?:md|txt|json|py|js|yml|yaml))', user_input)
            for path_str in path_candidates:
                clean_str = path_str.strip(" `\"'")
                p = Path(clean_str).expanduser()
                if not p.is_absolute():
                    p = (Path.cwd() / p).resolve()
                else:
                    p = p.resolve()

                if p.exists():
                    if p.is_dir():
                        target_dir = p
                        break
                    elif p.is_file():
                        text = p.read_text(encoding="utf-8", errors="ignore")[:1500]
                        workspace_context += f"\n=== Document File: {p.name} ===\n{text}\n\n"
                        read_files.add(p.resolve())
                        print(f"\033[90m📄 [Workspace Inspector] Read file: {p}\033[0m", flush=True)
                        break

            # 2. Fuzzy directory name search (e.g. "legit directory", "legit folder", "analyze legit")
            if not target_dir and not workspace_context:
                words = re.findall(r'\b[a-zA-Z0-9_-]{3,30}\b', user_input)
                search_roots = [Path.cwd(), Path.home() / "Projects", Path.home()]
                ignored_words = {"the", "and", "for", "you", "can", "please", "directory", "folder", "project", "analyze", "check", "explain", "about", "what", "with", "this", "from"}
                for word in words:
                    if word.lower() in ignored_words:
                        continue
                    for root in search_roots:
                        if root.exists():
                            candidate = root / word
                            if candidate.exists() and candidate.is_dir():
                                target_dir = candidate.resolve()
                                break
                            matches = [d for d in root.iterdir() if d.is_dir() and d.name.lower() == word.lower()]
                            if matches:
                                target_dir = matches[0].resolve()
                                break
                    if target_dir:
                        break

            # 3. Comprehensive Project Directory & Architecture Inspection
            if target_dir:
                workspace_context += f"\n--- WORKSPACE PROJECT DIRECTORY: {target_dir.name} ({target_dir}) ---\n"
                
                # 3a. Top-level files and subdirectories
                top_items = [f.name for f in target_dir.iterdir() if not f.name.startswith(".")]
                workspace_context += f"Root Structure: {', '.join(sorted(top_items)[:40])}\n\n"
                
                # 3b. Read Top-Level README and architecture documentation FIRST
                doc_candidates = [
                    target_dir / "readme.md", target_dir / "README.md", target_dir / "Readme.md",
                    target_dir / "ARCHITECTURE.md", target_dir / "connection.md", target_dir / "API.md"
                ]
                for doc in doc_candidates:
                    if doc.exists() and doc.is_file():
                        try:
                            rel_path = doc.relative_to(target_dir)
                            text = doc.read_text(encoding="utf-8", errors="ignore")[:3000]
                            workspace_context += f"=== DOCUMENT: {rel_path} ===\n{text}\n\n"
                            read_files.add(doc.resolve())
                            print(f"\033[90m📄 [Workspace Inspector] Read primary document: {rel_path}\033[0m", flush=True)
                        except Exception:
                            pass

                # 3c. Inspect Subdirectories for READMEs and Manifests
                manifest_names = ("package.json", "docker-compose.yml", "docker-compose.yaml", "build.gradle.kts", "build.gradle", "requirements.txt", "pyproject.toml", "Cargo.toml", "go.mod", "API.md", "readme.md", "README.md")
                subdirs = [d for d in target_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
                for subdir in subdirs[:6]:
                    sub_items = [f.name for f in subdir.iterdir() if not f.name.startswith(".")]
                    workspace_context += f"Module Directory [{subdir.name}]: {', '.join(sorted(sub_items)[:25])}\n"
                    for m_name in manifest_names:
                        m_path = subdir / m_name
                        if m_path.exists() and m_path.is_file() and m_path.resolve() not in read_files:
                            try:
                                text = m_path.read_text(encoding="utf-8", errors="ignore")[:1500]
                                rel_path = m_path.relative_to(target_dir)
                                workspace_context += f"=== Sub-Module File ({rel_path}) ===\n{text}\n\n"
                                read_files.add(m_path.resolve())
                            except Exception:
                                pass

                # 3d. Fallback rglob for any additional .md documentation
                if len(read_files) < 4:
                    for doc_file in sorted(target_dir.rglob("*.md")):
                        if len(read_files) >= 5:
                            break
                        if any(x in doc_file.parts for x in ("node_modules", ".git", "build", "dist", ".agents", ".codex", ".idea")):
                            continue
                        if doc_file.resolve() not in read_files:
                            try:
                                rel_path = doc_file.relative_to(target_dir)
                                text = doc_file.read_text(encoding="utf-8", errors="ignore")[:1500]
                                workspace_context += f"=== DOCUMENT: {rel_path} ===\n{text}\n\n"
                                read_files.add(doc_file.resolve())
                            except Exception:
                                pass

            # 4. Automatically locate and read requested files/classes mentioned in prompt across project roots
            file_tokens = re.findall(r'\b[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9_-]+\b', user_input) + re.findall(r'\b[A-Z][a-zA-Z0-9_]{3,}\b', user_input)
            search_roots = [target_dir] if target_dir else [Path.cwd(), Path.home() / "Projects"]
            ignored_prompt_words = {"the", "file", "code", "show", "what", "here", "with", "this", "from", "main", "vaultkey", "projects", "present", "directory", "content", "contents", "readme.md"}
            
            for word in file_tokens:
                if len(word) < 4 or word.lower() in ignored_prompt_words:
                    continue
                found_matches = []
                for root in search_roots:
                    if root and root.exists():
                        for matched_path in root.rglob(f"*{word}*"):
                            if matched_path.is_file():
                                if any(x in matched_path.parts for x in ("node_modules", ".git", "build", "dist", ".idea", ".gradle")):
                                    continue
                                found_matches.append(matched_path)
                        if found_matches:
                            break
                for fp in found_matches[:2]:
                    if fp.resolve() not in read_files:
                        try:
                            text = fp.read_text(encoding="utf-8", errors="ignore")[:4000]
                            workspace_context += f"\n=== REQUESTED FILE ({fp}) ===\n{text}\n\n"
                            read_files.add(fp.resolve())
                            print(f"\033[1;32m📄 [Workspace Inspector] Located & Read requested file:\033[0m {fp}", flush=True)
                        except Exception:
                            pass

            if read_files:
                print(f"\033[90m📂 [Workspace Inspector] Found & Indexed {len(read_files)} file(s)\033[0m", flush=True)
        except Exception:
            pass

        # Perform automatic vector DB / vault retrieval
        rag_context = ""
        if self.service:
            try:
                retrieved = self.service.search_documents(user_input, top_k=2)
                items = retrieved.get("results", [])
                if items:
                    rag_context = "\n\n--- RETRIEVED KNOWLEDGE VAULT EVIDENCE ---\n"
                    for idx, item in enumerate(items, 1):
                        title = item.get("title") or item.get("source") or f"Evidence {idx}"
                        chunk = (item.get("chunk") or str(item.get("reading", "")))[:800]
                        rag_context += f"[Source #{idx}: {title}]\n{chunk}\n\n"
                    print(f"\033[90m🔍 [Milvus Vector RAG] Retrieved {len(items)} matching evidence document(s) from Knowledge Vault\033[0m", flush=True)
            except Exception:
                pass

        # Multi-Turn Autonomous Agent Execution Loop
        max_agent_turns = 3
        current_turn = 0
        agent_history = []
        final_response = ""

        while current_turn < max_agent_turns:
            current_turn += 1
            response = ""

            def _do_generate():
                nonlocal response
                self.load_model_if_needed()
                if self._llm and self._tokenizer:
                    import torch
                    device = next(self._llm.parameters()).device
                    system_prompt = (
                        f"You are VELIKY Sovereign Agent, an Autonomous Systems Architect and Lead Engineer running in {self.agent} mode.\n"
                        "You embody the directness, craftsmanship, and precision of Claude Code.\n\n"
                        "CORE DIRECTIVES:\n"
                        "1. Direct & High-Signal: Begin answers immediately without conversational filler, greetings, or apologies.\n"
                        "2. Zero-Hallucination & Evidence-First Invariant: Ground every assertion in retrieved Knowledge Vault evidence or files. NEVER fabricate telemetry or code.\n"
                        "3. Wikilink Citations: Explicitly cite knowledge vault records using [[NoteName]] (e.g. [[Pump-P204]], [[Inspection-Report-62]], [[SOP-Pump-Maintenance]]).\n"
                        "4. Cognitive Loop & Chain of Thought: Perform step-by-step reasoning inside <thinking>...</thinking> tags before giving your final response.\n"
                        "5. 4-Tier Verification Matrix: Validate (1) schema, (2) RBAC clearance, (3) evidence provenance, and (4) sandboxed arithmetic.\n\n"
                        "INSTRUCTIONS & AGENTIC TOOL SUITE:\n"
                        "You can inspect files, search code, write code, and run commands autonomously using XML tool tags:\n"
                        "- Read file: <read_file path=\"path/to/file\"/>\n"
                        "- List directory: <list_dir path=\"path/to/dir\"/>\n"
                        "- Grep search code: <grep_search query=\"keyword\" path=\"optional/dir\"/>\n"
                        "- Create/Update file: <write_file path=\"path/to/file\">content</write_file>\n"
                        "- Run bash command: <run_cmd>command</run_cmd>\n\n"
                        "CRITICAL NO-HALLUCINATION CODE RULE:\n"
                        "When asked to show, display, or analyze code from a file (e.g. MainActivity.kt or auth.py), DO NOT output fake, dummy, or simplified 'Hello World' placeholder code!\n"
                        "You MUST output the REAL source code provided in the workspace context or retrieved via tools.\n"
                        "If you need to view a file that is not in context, call <read_file path=\"path/to/file\"/> or <grep_search query=\"keyword\"/> FIRST to retrieve the real file from disk!\n\n"
                        "When asked to analyze or explain a project directory, DO NOT just list filenames or output directory trees.\n"
                        "Instead, provide a comprehensive, deep technical explanation covering:\n"
                        "1. WHAT the project does in real-world terms (its main purpose, functionality, and problem it solves).\n"
                        "2. HOW the code works under the hood (architecture, components, database, and security mechanisms).\n"
                        "3. CORE DATA & WORKFLOW (step-by-step request flow).\n\n"
                        f"{workspace_context}\n"
                        f"{rag_context}\n"
                    )

                    history_str = ""
                    for turn_item in agent_history:
                        history_str += f"<|im_start|>assistant\n{turn_item['assistant']}<|im_end|>\n"
                        if turn_item.get("tool_results"):
                            history_str += f"<|im_start|>user\n{turn_item['tool_results']}<|im_end|>\n"

                    prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_input}<|im_end|>\n{history_str}<|im_start|>assistant\n"
                    inputs = self._tokenizer(prompt, return_tensors="pt").to(device)
                    with torch.no_grad():
                        outputs = self._llm.generate(
                            **inputs,
                            max_new_tokens=400,
                            do_sample=True,
                            temperature=0.3,
                            repetition_penalty=1.15,
                            pad_token_id=self._tokenizer.eos_token_id,
                        )
                    in_len = inputs["input_ids"].shape[1]
                    response = self._tokenizer.decode(outputs[0][in_len:], skip_special_tokens=True).strip()
                else:
                    response = f"VELIKY Agent ({self.agent} mode): Processed request '{user_input}'."

            if self.thinking and _rich_console and sys.stdout.isatty():
                with _rich_console.status(f"[magenta]thinking (step {current_turn})...[/magenta]", spinner="dots"):
                    _do_generate()
            elif self.thinking:
                print(f"\033[1;35mthinking (step {current_turn})...\033[0m", flush=True)
                _do_generate()
            else:
                _do_generate()

            final_response = response
            has_tools, tool_outputs = self._execute_agent_tools(user_input, response)

            if has_tools and tool_outputs:
                tool_results_combined = "\n".join(tool_outputs)
                agent_history.append({
                    "assistant": response,
                    "tool_results": tool_results_combined
                })
            else:
                break

        elapsed = time.time() - t0
        print(f"\n\033[1;32mVELIKY Agent\033[0m \033[90m({elapsed:.2f}s)\033[0m:", flush=True)
        if _rich_console and sys.stdout.isatty():
            _rich_console.print(Markdown(final_response))
        else:
            print(final_response, flush=True)
        print()

        self.history.append({"user": user_input, "assistant": final_response})
        return final_response

    def run(self):
        self.print_header()
        self.load_model_if_needed()

        session = None
        if _PROMPT_TOOLKIT_AVAILABLE:
            try:
                completer = SlashCommandCompleter(self)
                style = Style.from_dict({
                    'completion-menu.completion': 'bg:#1e293b #e2e8f0',
                    'completion-menu.completion.current': 'bg:#0284c7 #ffffff bold',
                    'completion-menu.meta.completion': 'bg:#0f172a #94a3b8',
                    'completion-menu.meta.completion.current': 'bg:#0369a1 #e0f2fe bold',
                    'scrollbar.background': 'bg:#0f172a',
                    'scrollbar.button': 'bg:#38bdf8',
                })
                session = PromptSession(completer=completer, style=style, complete_while_typing=True)
            except Exception:
                session = None

        while True:
            try:
                prompt_str = f"\033[1;34mveliky ({self.agent})\033[0m > "
                if session:
                    user_input = session.prompt(ANSI(prompt_str)).strip()
                else:
                    user_input = input(prompt_str).strip()
            except (KeyboardInterrupt, EOFError):
                print("\nExiting VELIKY CLI. Goodbye!")
                break

            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit", "/exit", "/quit"):
                print("Exiting VELIKY CLI. Goodbye!")
                break

            if user_input.startswith("/model"):
                parts = user_input.split()
                if len(parts) > 1:
                    new_model = parts[1]
                    self.model = new_model
                    self._llm = None
                    self._tokenizer = None
                    print(f"\033[32mModel switched to: {self.model}\033[0m\n")
                else:
                    print("\033[33mAvailable models:\033[0m")
                    for m in AVAILABLE_MODELS:
                        active = " (active)" if m == self.model else ""
                        print(f"  • {m}{active}")
                    print()
                continue

            if user_input.startswith("/agent"):
                parts = user_input.split()
                if len(parts) > 1 and parts[1].lower() in AGENTS:
                    self.agent = parts[1].lower()
                    print(f"\033[32mAgent switched to: {self.agent.upper()} — {AGENTS[self.agent]}\033[0m\n")
                else:
                    print("\033[33mAvailable agents:\033[0m")
                    for k, v in AGENTS.items():
                        active = " (active)" if k == self.agent else ""
                        print(f"  • {k.upper()}: {v}{active}")
                    print()
                continue

            if user_input.startswith("/thinking"):
                parts = user_input.split()
                if len(parts) > 1:
                    val = parts[1].lower()
                    if val in ("on", "true", "1"):
                        self.thinking = True
                        print("\033[32mThinking mode enabled [ON]\033[0m\n")
                    elif val in ("off", "false", "0"):
                        self.thinking = False
                        print("\033[33mThinking mode disabled [OFF]\033[0m\n")
                else:
                    print(f"Thinking mode is currently: {'ON' if self.thinking else 'OFF'}\n")
                continue

            if user_input == "/web":
                url = "http://localhost:5173"
                print(f"\n\033[1;32m🌐 Opening VELIKY Web Workbench UI in browser at {url}...\033[0m\n")
                try:
                    import webbrowser
                    webbrowser.open(url)
                except Exception as exc:
                    print(f"\033[1;31m❌ Could not launch browser automatically: {exc}\033[0m\n")
                continue

            if user_input == "/tools":
                self.show_tools()
                continue

            if user_input == "/clear":
                self.history.clear()
                print("\033[32mSession memory cleared.\033[0m\n")
                continue

            if user_input == "/help":
                self.show_help()
                continue

            # Process AI prompt
            self.process_prompt(user_input)


def main():
    parser = argparse.ArgumentParser(description="VELIKY Agent CLI")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Initial model name")
    parser.add_argument("--agent", default="general", choices=tuple(AGENTS.keys()), help="Initial agent preset")
    parser.add_argument("--no-thinking", action="store_true", help="Disable thinking mode by default")
    args = parser.parse_args()

    cli = VelikyCLI(model=args.model, agent=args.agent, thinking=not args.no_thinking)
    cli.run()


if __name__ == "__main__":
    main()
