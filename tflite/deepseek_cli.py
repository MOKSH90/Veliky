#!/usr/bin/env python3
"""
DeepSeek Agent CLI — Sovereign AI Agent Interface
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
    "sentinel",
    "sentinel.workbench",
    "sentinel.ingest",
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
    from sentinel_security import calculate
    from sentinel_service import SentinelService
except ImportError:
    SentinelService = None

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

DEFAULT_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
AVAILABLE_MODELS = [
    "Qwen/Qwen2.5-0.5B-Instruct",
    "Qwen/Qwen2.5-1.5B-Instruct",
    "Qwen/Qwen2.5-3B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-VL-7B-Instruct",
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
                    "/tools": "List active tools & security permissions",
                    "/clear": "Reset conversation memory session",
                    "/help": "Display command menu and help",
                    "/exit": "Exit SENTINEL CLI session",
                }
                for cmd, desc in commands.items():
                    if cmd.startswith(text):
                        yield Completion(cmd, start_position=-len(text), display_meta=desc)


class DeepSeekCLI:
    def __init__(self, model: str = DEFAULT_MODEL, agent: str = "general", thinking: bool = True):
        self.model = model
        self.agent = agent
        self.thinking = thinking
        self.history: list[dict] = []
        self.service = SentinelService() if SentinelService else None
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
        print("\033[1;32m  🛡️ SENTINEL Sovereign Agentic AI Workbench\033[0m")
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
        print("  \033[1;36m/tools\033[0m           List active agent tools and capability permissions")
        print("  \033[1;36m/clear\033[0m           Reset conversation session and memory")
        print("  \033[1;36m/help\033[0m            Display this menu")
        print("  \033[1;36m/exit\033[0m            Exit SENTINEL CLI session\n")

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

    def _execute_file_tools(self, user_input: str, response: str):
        written_files = set()

        def _resolve_path(raw: str) -> Path:
            clean = raw.strip(" `\"'\t\r\n")
            p = Path(clean).expanduser()
            return p.resolve() if p.is_absolute() else (Path.cwd() / p).resolve()

        # 1. Match XML <write_file path="...">content</write_file>
        xml_matches = re.findall(r'<write_file\s+path=["\']([^"\']+)["\']>([\s\S]*?)</write_file>', response)
        for filepath, content in xml_matches:
            try:
                p = _resolve_path(filepath)
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(content.strip(), encoding="utf-8")
                written_files.add(str(p))
                print(f"\033[1;32m  📁 [SENTINEL File Tool] Created file:\033[0m {p} ({len(content)} bytes)")
            except Exception as exc:
                print(f"\033[1;31m  ❌ [SENTINEL File Tool Error] Failed to write {filepath}: {exc}\033[0m")

        # 2. Match markdown ### File: filepath \n ```lang \n content \n ```
        md_matches = re.findall(r'###\s+File:\s*([^\n]+)\s*\n```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```', response)
        for raw_path, content in md_matches:
            try:
                p = _resolve_path(raw_path)
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(content, encoding="utf-8")
                written_files.add(str(p))
                print(f"\033[1;32m  📁 [SENTINEL File Tool] Created file:\033[0m {p} ({len(content)} bytes)")
            except Exception as exc:
                print(f"\033[1;31m  ❌ [SENTINEL File Tool Error] Failed to write {raw_path}: {exc}\033[0m")

        # 3. Fallback: If prompt explicitly asks to create/write/save a file (e.g. "create a python file named 2.py")
        if not written_files:
            prompt_file_match = re.search(r'\b([a-zA-Z0-9_\-./]+\.(?:py|js|ts|jsx|tsx|html|css|json|sh|md|txt|yaml|yml|c|cpp|h|rs|go|java|pyw))\b', user_input, re.IGNORECASE)
            if prompt_file_match:
                target_filename = prompt_file_match.group(1)
                code_blocks = re.findall(r'```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```', response)
                if not code_blocks and ("def " in response or "import " in response or "function" in response or "const " in response):
                    code_blocks = [response.strip()]
                if code_blocks:
                    code_content = code_blocks[0]
                    try:
                        p = _resolve_path(target_filename)
                        p.parent.mkdir(parents=True, exist_ok=True)
                        p.write_text(code_content, encoding="utf-8")
                        written_files.add(str(p))
                        print(f"\033[1;32m  📁 [SENTINEL File Tool] Automatically created file:\033[0m {p} ({len(code_content)} bytes)")
                    except Exception as exc:
                        print(f"\033[1;31m  ❌ [SENTINEL File Tool Error] Failed to write {target_filename}: {exc}\033[0m")

        # 4. Match <run_cmd>cmd</run_cmd>
        cmd_matches = re.findall(r'<run_cmd>([\s\S]*?)</run_cmd>', response)
        for cmd in cmd_matches:
            cmd_str = cmd.strip()
            if cmd_str:
                try:
                    print(f"\033[1;33m  ⚡ [SENTINEL Shell Tool] Executing command:\033[0m {cmd_str}")
                    res = subprocess.run(cmd_str, shell=True, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=30)
                    out = res.stdout if res.stdout else res.stderr
                    if out.strip():
                        print(f"\033[90m{out.strip()}\033[0m")
                except Exception as exc:
                    print(f"\033[1;31m  ❌ [SENTINEL Shell Tool Error] {exc}\033[0m")

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

        # Perform automatic vector DB / vault retrieval
        rag_context = ""
        if self.service:
            try:
                retrieved = self.service.search_documents(user_input, top_k=3)
                items = retrieved.get("results", [])
                if items:
                    rag_context = "\n\n--- RETRIEVED KNOWLEDGE VAULT EVIDENCE ---\n"
                    for idx, item in enumerate(items, 1):
                        title = item.get("title") or item.get("source") or f"Evidence {idx}"
                        chunk = item.get("chunk") or str(item.get("reading", ""))
                        rag_context += f"[Source #{idx}: {title}]\n{chunk}\n\n"
                    print(f"\033[90m🔍 [Milvus Vector RAG] Retrieved {len(items)} matching evidence document(s) from Knowledge Vault\033[0m")
            except Exception:
                pass

        def _do_generate():
            nonlocal response
            self.load_model_if_needed()
            if self._llm and self._tokenizer:
                import torch
                device = next(self._llm.parameters()).device
                system_prompt = (
                    f"You are SENTINEL, a sovereign agent running in {self.agent} mode.\n"
                    "You have direct access to local workspace files and the SENTINEL Knowledge Vault RAG vector database.\n"
                    "Answer the user's query precisely using the retrieved evidence below when provided:\n"
                    f"{rag_context}\n"
                    "When asked to write code or create files, use:\n"
                    "### File: `path/to/filename` \n```language\n<code content>\n```\n"
                    "When asked to run commands, use:\n"
                    "<run_cmd>command</run_cmd>"
                )
                prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_input}<|im_end|>\n<|im_start|>assistant\n"
                inputs = self._tokenizer(prompt, return_tensors="pt").to(device)
                with torch.no_grad():
                    outputs = self._llm.generate(
                        **inputs,
                        max_new_tokens=512,
                        do_sample=True,
                        temperature=0.3,
                        pad_token_id=self._tokenizer.eos_token_id,
                    )
                in_len = inputs["input_ids"].shape[1]
                response = self._tokenizer.decode(outputs[0][in_len:], skip_special_tokens=True).strip()
            else:
                response = f"SENTINEL Agent ({self.agent} mode): Processed request '{user_input}'."

        if self.thinking and _rich_console:
            with _rich_console.status("[magenta]thinking...[/magenta]", spinner="dots"):
                _do_generate()
        elif self.thinking:
            print("\033[1;35mthinking...\033[0m")
            _do_generate()
        else:
            _do_generate()

        elapsed = time.time() - t0
        print(f"\n\033[1;32mSENTINEL Agent\033[0m \033[90m({elapsed:.2f}s)\033[0m:")
        if _rich_console:
            _rich_console.print(Markdown(response))
        else:
            print(response)
        print()

        # Automatically execute file tool calls & write code to disk
        self._execute_file_tools(user_input, response)

        self.history.append({"user": user_input, "assistant": response})

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
                prompt_str = f"\033[1;34msentinel ({self.agent})\033[0m > "
                if session:
                    user_input = session.prompt(ANSI(prompt_str)).strip()
                else:
                    user_input = input(prompt_str).strip()
            except (KeyboardInterrupt, EOFError):
                print("\nExiting SENTINEL CLI. Goodbye!")
                break

            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit", "/exit", "/quit"):
                print("Exiting SENTINEL CLI. Goodbye!")
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
    parser = argparse.ArgumentParser(description="SENTINEL Agent CLI")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Initial model name")
    parser.add_argument("--agent", default="general", choices=tuple(AGENTS.keys()), help="Initial agent preset")
    parser.add_argument("--no-thinking", action="store_true", help="Disable thinking mode by default")
    args = parser.parse_args()

    cli = DeepSeekCLI(model=args.model, agent=args.agent, thinking=not args.no_thinking)
    cli.run()


if __name__ == "__main__":
    main()
