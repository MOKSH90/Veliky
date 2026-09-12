#!/usr/bin/env python3
"""Reinery — Sovereign Agentic AI Workbench with Integrated RAG.

Unified CLI interface orchestrating the DeepSeek Harness Cordis micro-kernel,
local open-weight models, and industrial RAG capabilities.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

# Ensure project root and RAG directory are on sys.path
ROOT = Path(__file__).resolve().parent
_VENV_PY = ROOT / ".venv/bin/python"
_OPT_VENV_PY = Path("/opt/venv/bin/python")
if _VENV_PY.exists() and sys.prefix != str(ROOT / ".venv"):
    os.execv(str(_VENV_PY), [str(_VENV_PY)] + sys.argv)
elif _OPT_VENV_PY.exists() and sys.prefix != "/opt/venv":
    os.execv(str(_OPT_VENV_PY), [str(_OPT_VENV_PY)] + sys.argv)

RAG_DIR = ROOT / "RAG"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(RAG_DIR))
sys.path.insert(0, str(ROOT / "tools/deepseek-harness/python/sdk/src"))

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table

console = Console()

SENTINEL_BANNER = """[bold white]  ███████   [/bold white][bold cyan]████████[/bold cyan][bold white]   ███    ██  ████████  ██  ███    ██  ████████  ██      [/bold white]
[bold white] ██▀        [/bold white][bold cyan] ▀▀▀▀▀▀ [/bold cyan][bold white]   ████   ██     ██     ██  ████   ██  ██       ██      [/bold white]
[bold white] ▀███████   [/bold white][bold cyan]████████[/bold cyan][bold white]   ██ ██  ██     ██     ██  ██ ██  ██  ███████  ██      [/bold white]
[bold white]      ▄██   [/bold white][bold cyan] ▄▄▄▄▄▄ [/bold cyan][bold white]   ██  ██ ██     ██     ██  ██  ██ ██  ██       ██      [/bold white]
[bold white] ███████▀   [/bold white][bold cyan]████████[/bold cyan][bold white]   ██   ████     ██     ██  ██   ████  ████████  ███████▀[/bold white]"""


def ensure_patch(endpoint: str, model: str, role: str = "analyst", retrieval: str = "hybrid", mode: str = "investigate") -> Path:
    from sentinel_harness import configure
    patch_path = ROOT / "sentinel.cordis.patch.yml"
    python_bin = ROOT / ".venv/bin/python"
    if not python_bin.exists() and Path("/opt/venv/bin/python").exists():
        python_bin = Path("/opt/venv/bin/python")
    configure(
        output=patch_path,
        endpoint=endpoint,
        model=model,
        role=role,
        retrieval=retrieval,
        python=str(python_bin) if python_bin.exists() else sys.executable,
        mode=mode,
    )
    return patch_path


def check_model_server(endpoint: str) -> bool:
    import urllib.request
    try:
        url = endpoint.rstrip("/") + "/models"
        req = urllib.request.Request(url, headers={"User-Agent": "reinery-cli"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False


def cmd_agent(args: argparse.Namespace):
    from deepseek_cli import DeepSeekCLI
    cli = DeepSeekCLI(
        model=args.model,
        agent=args.agent,
        thinking=not getattr(args, "no_thinking", False),
    )
    cli.run()


def cmd_chat(args: argparse.Namespace):
    from deepseek_harness import DeepSeekHarness
    from sentinel_service import BridgeConfig, SentinelService

    console.print()
    console.print(SENTINEL_BANNER)
    console.print("[bold cyan]" + "─" * 78 + "[/bold cyan]")
    console.print(Panel.fit(
        "[bold cyan]SENTINEL[/bold cyan] — [bold white]Sovereign Agentic AI Workbench[/bold white]\n"
        f"[dim]Model: [green]{args.model}[/green] | Endpoint: [green]{args.endpoint}[/green] | Role: [yellow]{args.role}[/yellow][/dim]\n"
        "[dim]Type [bold]/help[/bold] for commands or [bold]exit[/bold] to quit.[/dim]",
        border_style="cyan",
    ))

    # Check if local endpoint is active
    if not check_model_server(args.endpoint):
        console.print(f"[bold red]Error:[/bold red] Inference server at [yellow]{args.endpoint}[/yellow] is not reachable.")
        console.print("[dim]Start the local model with: [bold]python reinery_cli.py serve[/bold][/dim]\n")
        return 1

    patch_path = ensure_patch(args.endpoint, args.model, role=args.role, retrieval=args.retrieval, mode="chat")
    dsh_bin = str(ROOT / "RAG/harness/dsh-source")
    service = SentinelService(BridgeConfig(role=args.role, retrieval=args.retrieval))

    dsh_env = {
        **os.environ,
        "DSH_TELEMETRY_DISABLED": "1",
        "SENTINEL_LOCAL_API_KEY": os.environ.get("SENTINEL_LOCAL_API_KEY", "local-no-auth"),
        "SENTINEL_MODE": "chat",
    }

    console.print("[dim]Initializing agent harness & mounting RAG MCP tools...[/dim]")
    try:
        harness = DeepSeekHarness(
            dsh_home=str(ROOT / ".sentinel-dsh"),
            cwd=str(ROOT),
            patches=(str(patch_path),),
            provider="sentinel-local",
            model=args.model,
            dsh_bin=dsh_bin,
            env=dsh_env,
            initialize_timeout_seconds=60,
            request_timeout_seconds=300,
        )
        harness.start()
        session = harness.start_session()
        console.print("[bold green]Agent ready.[/bold green]\n")
    except Exception as exc:
        console.print(f"[bold red]Failed to start agent:[/bold red] {exc}")
        return 1

    try:
        while True:
            try:
                user_input = console.input("[bold cyan]reinery ❯ [/bold cyan]").strip()
            except (KeyboardInterrupt, EOFError):
                console.print("\n[dim]Session ended.[/dim]")
                break

            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit", ":q"):
                console.print("[dim]Goodbye![/dim]")
                break

            if user_input == "/help":
                console.print("""
[bold]Available Commands:[/bold]
  [cyan]/rag <query>[/cyan]            Direct hybrid RAG search (vault + Milvus)
  [cyan]/notes[/cyan]                  List accessible Knowledge Vault notes
  [cyan]/sensor <equipment>[/cyan]     Inspect equipment CSV sensor telemetry
  [cyan]/calc <formula>[/cyan]          Evaluate expression in safe math sandbox
  [cyan]/clear[/cyan]                  Reset conversation session
  [cyan]exit[/cyan]                    Exit chat
                """)
                continue

            if user_input.startswith("/rag "):
                query = user_input[5:].strip()
                res = service.search_documents(query, top_k=3)
                console.print(f"[dim]Mode: {res.get('mode')}[/dim]")
                for item in res.get("results", []):
                    title = item.get("title") or item.get("source", "Unknown")
                    console.print(f"• [bold green]{title}[/bold green] (Evidence ID: [dim]{item.get('evidence_id')[:10]}...[/dim])")
                    chunk = item.get("chunk", "")[:200].replace("\n", " ")
                    console.print(f"  [dim]{chunk}...[/dim]")
                console.print()
                continue

            if user_input == "/notes":
                notes = service._notes()
                table = Table(title="Knowledge Vault Documents", show_header=True)
                table.add_column("Path / Title", style="cyan")
                table.add_column("Clearance", style="yellow")
                table.add_column("Tags", style="dim")
                for key, val in sorted(notes.items()):
                    table.add_row(key, val.get("clearance_level", "internal"), ", ".join(val.get("tags", [])))
                console.print(table)
                console.print()
                continue

            if user_input.startswith("/sensor"):
                parts = user_input.split()
                eq = parts[1] if len(parts) > 1 else "P-204"
                hist = service.query_sensor_history(eq, limit=5)
                table = Table(title=f"Recent Telemetry for {eq}", show_header=True)
                table.add_column("Date", style="dim")
                table.add_column("Point", style="cyan")
                table.add_column("RMS Velocity", style="green")
                table.add_column("Temp (°C)", style="yellow")
                for r in hist.get("readings", []):
                    table.add_row(r.get("Date", ""), r.get("Measurement_Point", ""), str(r.get("RMS_Velocity_mms", "")), str(r.get("Temperature_C", "")))
                console.print(table)
                console.print()
                continue

            if user_input.startswith("/calc "):
                formula = user_input[6:].strip()
                from sentinel_security import calculate
                try:
                    res = calculate(formula, {})
                    console.print(f"[bold green]Result:[/bold green] {res}\n")
                except Exception as e:
                    console.print(f"[bold red]Calculation error:[/bold red] {e}\n")
                continue

            if user_input == "/clear":
                session = harness.start_session()
                console.print("[dim]Conversation reset.[/dim]\n")
                continue

            # Standard agent turn
            def on_notify(notification):
                if notification.method == "session.event":
                    event = notification.payload.get("event", {})
                    etype = event.get("type")
                    if etype == "tool/call":
                        data = event.get("data", {})
                        tname = data.get("name", "").replace("mcp__sentinel__", "")
                        args_str = data.get("arguments", "")
                        console.print(f"[bold yellow]⚙ Executing tool:[/bold yellow] [bold white]{tname}[/bold white] [dim]{args_str}[/dim]")
                    elif etype == "tool/result":
                        console.print("[dim]  ✔ Received tool response[/dim]")

            try:
                console.print()
                res = session.run(user_input, on_notification=on_notify)
                if res.final_response:
                    console.print(Markdown(res.final_response))
                else:
                    console.print("[italic dim]Completed turn with no final text.[/italic dim]")
                console.print()
            except Exception as e:
                console.print(f"[bold red]Turn error:[/bold red] {e}\n")

    finally:
        harness.close()


def cmd_investigate(args: argparse.Namespace):
    from sentinel_harness import run_goal
    from sentinel_service import BridgeConfig, SentinelService

    console.print(f"[bold cyan]Running investigation:[/bold cyan] {args.prompt}")
    patch_path = ensure_patch(args.endpoint, args.model, role=args.role, retrieval=args.retrieval)
    dsh_bin = str(ROOT / "RAG/harness/dsh-source")
    service = SentinelService(BridgeConfig(role=args.role, retrieval=args.retrieval))

    try:
        result = run_goal(
            args.prompt,
            patch=patch_path,
            home=ROOT / ".sentinel-dsh",
            model=args.model,
            dsh_bin=dsh_bin,
            service=service,
        )
        report = result.get("report", {})
        console.print(Panel.fit(
            f"[bold green]INVESTIGATION VERIFIED & COMPLETED[/bold green]\n"
            f"[dim]Report Path: {result.get('report_path')}[/dim]\n\n"
            f"[bold]Summary:[/bold] {report.get('executive_summary', '')}\n"
            f"[bold]Evidence Items:[/bold] {len(report.get('evidence', []))}\n"
            f"[bold]Calculations:[/bold] {len(report.get('calculations', []))}\n"
            f"[bold]Recommendations:[/bold] {', '.join(report.get('actionable_recommendations', []))}",
            title="Investigation Result",
            border_style="green",
        ))
        console.print(json.dumps(report, indent=2))
    except Exception as exc:
        console.print(f"[bold red]Investigation failed:[/bold red] {exc}")
        return 1


def cmd_watch(args: argparse.Namespace):
    from sentinel_watcher import detect_anomalies, dispatch
    from sentinel_service import BridgeConfig, SentinelService
    from sentinel_harness import run_goal

    console.print(f"[bold cyan]Starting Anomaly Watcher on Equipment:[/bold cyan] [bold green]{args.equipment}[/bold green]")
    service = SentinelService(BridgeConfig())
    patch_path = ensure_patch(args.endpoint, args.model)
    dsh_bin = str(ROOT / "RAG/harness/dsh-source")

    def launch(prompt, session_id):
        return run_goal(prompt, patch=patch_path, home=ROOT / ".sentinel-dsh", model=args.model,
                        dsh_bin=dsh_bin, session_id=session_id, service=service)

    while True:
        history = service.invoke("query_sensor_history", equipment_id=args.equipment, limit=1000)
        alerts = detect_anomalies(history["readings"], args.absolute_limit, args.change_limit, args.window)
        for alert in alerts:
            if args.dry_run:
                console.print(f"[yellow]Anomaly Detected (dry-run):[/yellow] {alert}")
            else:
                res = dispatch(service, alert, launch, retry_failed=args.retry_failed)
                console.print(f"[green]Dispatched & Handled:[/green] {res}")
        if args.once or args.dry_run:
            break
        time.sleep(args.interval)


def cmd_rag(args: argparse.Namespace):
    from sentinel_service import BridgeConfig, SentinelService
    service = SentinelService(BridgeConfig(role=args.role))

    if args.rag_cmd == "search":
        console.print(f"[cyan]Searching for:[/cyan] [bold]{args.query}[/bold]\n")
        res = service.search_documents(args.query, top_k=args.top_k)
        console.print(f"[dim]Retrieval mode: {res.get('mode')}[/dim]")
        for i, item in enumerate(res.get("results", []), 1):
            console.print(Panel(
                f"[bold cyan]Source:[/bold cyan] {item.get('source')} | [yellow]Clearance:[/yellow] {item.get('clearance_level')}\n"
                f"[dim]Evidence ID: {item.get('evidence_id')}[/dim]\n\n"
                f"{item.get('chunk', '')[:400]}",
                title=f"Result {i}: {item.get('title', 'Document')}",
            ))

    elif args.rag_cmd == "notes":
        notes = service._notes()
        table = Table(title="Knowledge Vault Notes", show_header=True)
        table.add_column("Path", style="cyan")
        table.add_column("Role Clearance", style="yellow")
        table.add_column("Backlinks", style="green")
        for k, v in sorted(notes.items()):
            table.add_row(k, v.get("clearance_level", "internal"), str(len(v.get("links", []))))
        console.print(table)


def cmd_serve(args: argparse.Namespace):
    from sentinel_llm_server import main as run_server
    sys.argv = [
        "sentinel_llm_server.py",
        "--model", args.model,
        "--host", args.host,
        "--port", str(args.port),
        "--device", args.device,
        "--dtype", getattr(args, "dtype", "float32"),
    ]
    run_server()


def cmd_doctor(args: argparse.Namespace):
    from sentinel_harness import ROOT
    import importlib.util

    table = Table(title="System Diagnostics & Readiness", show_header=True)
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("Details", style="dim")

    # Python env
    table.add_row("Python Executable", "[green]OK[/green]", sys.executable)

    # dsh binary
    dsh_bin = ROOT / "RAG/harness/dsh-source"
    if dsh_bin.exists():
        table.add_row("DeepSeek Harness Runtime", "[green]OK[/green]", str(dsh_bin))
    else:
        table.add_row("DeepSeek Harness Runtime", "[red]Missing[/red]", "Run pnpm run build:native-system")

    # Inference server
    server_up = check_model_server(args.endpoint)
    if server_up:
        table.add_row("Inference Endpoint", "[green]Online[/green]", args.endpoint)
    else:
        table.add_row("Inference Endpoint", "[yellow]Offline[/yellow]", f"{args.endpoint} (Start with: reinery serve)")

    # Milvus & RAG dependencies
    for dep in ("mcp", "torch", "transformers", "pymilvus", "sentence_transformers"):
        found = importlib.util.find_spec(dep) is not None
        status = "[green]Installed[/green]" if found else "[dim]Optional / Not installed[/dim]"
        table.add_row(f"Dependency: {dep}", status, "")

    # Vault Notes
    from sentinel_service import SentinelService
    notes = SentinelService()._notes()
    table.add_row("Knowledge Vault Notes", f"[green]{len(notes)} loaded[/green]", str(ROOT / "RAG/sentinel_vault"))

    console.print(table)


def main():
    parser = argparse.ArgumentParser(prog="reinery", description="Reinery — Sovereign AI Workbench & Pipeline")
    parser.add_argument("--endpoint", default="http://127.0.0.1:8000/v1", help="OpenAI-compatible inference endpoint")
    parser.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct", help="Open-weight model identifier")
    parser.add_argument("--role", default="analyst", help="User role clearance level")
    parser.add_argument("--retrieval", default="hybrid", choices=("hybrid", "vault"), help="Retrieval backend")

    subparsers = parser.add_subparsers(dest="subcommand", help="Available subcommands")

    # Agent CLI (Full SENTINEL Persona Interface with /model, /agent, /thinking, /tools)
    p_agent = subparsers.add_parser("agent", aliases=["start"], help="Start interactive SENTINEL Agent CLI (/model, /agent, /thinking, /tools)")
    p_agent.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct", help="Initial model name")
    p_agent.add_argument("--agent", default="general", choices=("general", "code", "investigator", "sre", "researcher"), help="Initial agent persona")
    p_agent.add_argument("--no-thinking", action="store_true", help="Disable thinking mode")
    p_agent.set_defaults(func=cmd_agent)

    # Chat
    p_chat = subparsers.add_parser("chat", help="Start interactive agent CLI session")
    p_chat.set_defaults(func=cmd_chat)

    # Investigate
    p_inv = subparsers.add_parser("investigate", help="Run autonomous investigation")
    p_inv.add_argument("prompt", help="Investigation objective / prompt")
    p_inv.set_defaults(func=cmd_investigate)

    # Watcher
    p_watch = subparsers.add_parser("watch", help="Monitor sensor historian anomalies")
    p_watch.add_argument("--equipment", default="P-204")
    p_watch.add_argument("--absolute-limit", type=float, default=4.5)
    p_watch.add_argument("--change-limit", type=float, default=15.0)
    p_watch.add_argument("--window", type=int, default=3)
    p_watch.add_argument("--interval", type=float, default=5.0)
    p_watch.add_argument("--once", action="store_true")
    p_watch.add_argument("--dry-run", action="store_true")
    p_watch.add_argument("--retry-failed", action="store_true")
    p_watch.set_defaults(func=cmd_watch)

    # RAG
    p_rag = subparsers.add_parser("rag", help="Knowledge base and RAG retrieval tools")
    rag_subs = p_rag.add_subparsers(dest="rag_cmd", help="RAG commands")
    p_search = rag_subs.add_parser("search", help="Search knowledge base")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("--top-k", type=int, default=3)
    p_notes = rag_subs.add_parser("notes", help="List vault notes")
    p_rag.set_defaults(func=cmd_rag)

    # Serve
    p_serve = subparsers.add_parser("serve", help="Start local open-weight model server")
    p_serve.add_argument("--host", default=os.environ.get("SERVE_HOST", "127.0.0.1"), help="Bind host (default: 127.0.0.1 or SERVE_HOST env)")
    p_serve.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    p_serve.add_argument("--device", default="cpu", choices=("cpu", "cuda"), help="Execution device")
    p_serve.add_argument("--dtype", default="float32", choices=("float32", "bfloat16", "float16"), help="Torch datatype")
    p_serve.set_defaults(func=cmd_serve)

    # Doctor
    p_doc = subparsers.add_parser("doctor", help="Run system diagnostics")
    p_doc.set_defaults(func=cmd_doctor)

    args = parser.parse_args()
    if not hasattr(args, "func"):
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
