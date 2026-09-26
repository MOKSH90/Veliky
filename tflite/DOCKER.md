# Reinery: Containerized Sovereign AI Workbench & RAG Pipeline

This document provides complete instructions for building, running, and orchestrating Reinery in production-grade Docker containers.

---

## 🏗️ Architecture

The Reinery container encapsulates the entire sovereign stack in an isolated, reproducible environment:

```mermaid
flowchart TD
    subgraph Host["Host Machine"]
        V[./RAG/veliky_vault] -->|Mount| CV[/app/RAG/veliky_vault]
        D[./RAG/data] -->|Mount| CD[/app/RAG/data]
        S[./RAG/state] -->|Mount| CS[/app/RAG/state]
        HFC[reinery_hf_cache Volume] -->|Mount| CHFC[/root/.cache/huggingface]
        DSH[reinery_dsh_sessions Volume] -->|Mount| CDSH[/app/.veliky-dsh]
    end

    subgraph Container["Docker Network: reinery_default"]
        subgraph MS["Service: model-server"]
            LLM[Local Open-Weight Model<br/>Qwen/Qwen2.5-0.5B-Instruct]
            SRV[OpenAI-Compatible API<br/>Port 8000: /v1/chat/completions]
            LLM --> SRV
        end

        subgraph CLI["Service: reinery"]
            UI[Interactive CLI Workbench<br/>reinery chat | investigate | rag]
            DSH_CORE[Veliky Harness Micro-kernel<br/>Node.js 22 + Cordis Plugin System]
            MCP[Veliky FastMCP Bridge<br/>Python 3.11 + Tools]
            RAG_ENG[Tri-Hybrid RAG Engine<br/>BM25 + Dense Vector + Vault Graph]
            VERIF[Independent Deterministic Verifier]

            UI --> DSH_CORE
            DSH_CORE -->|HTTP /v1| SRV
            DSH_CORE -->|stdio MCP| MCP
            MCP --> RAG_ENG
            MCP --> VERIF
        end

        subgraph WCH["Service: watcher (Optional)"]
            DAEMON[Autonomous Telemetry Watcher<br/>Detects Sensor Anomalies & Triggers Agent]
            DAEMON -->|run_goal| DSH_CORE
        end
    end
```

---

## 🚀 Quickstart

### 1. Ensure Docker Daemon is Running
If Docker is not running on your host:
```bash
sudo systemctl start docker
```

### 2. Build the Container Image
Build the multi-runtime image (Debian Bookworm + Node.js 22 + Python 3.11 venv + CPU PyTorch + compiled Veliky Harness):
```bash
docker compose build
```
*(Or directly with standard Docker: `docker build -t reinery:latest .`)*

---

## 💻 CLI Commands via Docker Compose

### 🩺 Run System Diagnostics (Doctor)
Verify runtime dependencies, paths, knowledge vault, and model connectivity:
```bash
docker compose run --rm reinery doctor
```

### 💬 Interactive Chat
Launch the terminal workbench to converse with the agent or query equipment:
```bash
docker compose run --rm reinery chat
```
*Tip: Type `/help` inside chat to see available commands, or `exit` to quit.*

### 🔍 Autonomous Industrial Investigation
Instruct the agent to inspect telemetry anomalies, consult vault documentation, calculate metrics, and generate an independently verified report:
```bash
docker compose run --rm reinery investigate "Analyze Pump P-204 using its inspection and sensor history."
```

### 📚 Knowledge Base Retrieval
Perform direct semantic or keyword search over the knowledge vault:
```bash
# Search equipment specifications and incident logs
docker compose run --rm reinery rag search "cavitation threshold"

# Inspect indexed vault notes
docker compose run --rm reinery rag notes
```

### 👁️ Autonomous Telemetry Watcher Daemon
To run the background watcher that continuously monitors sensor telemetry for threshold excursions:
```bash
docker compose --profile watcher up -d
```

---

## 📦 Single-Container Mode (Standalone)

You can also run Reinery as a single self-contained container without Docker Compose. In this mode, the container automatically spawns the local inference server in the background:

```bash
docker run -it --rm \
  -p 8000:8000 \
  -v "$(pwd)/RAG/veliky_vault:/app/RAG/veliky_vault" \
  -v "$(pwd)/RAG/data:/app/RAG/data" \
  -v "$(pwd)/RAG/state:/app/RAG/state" \
  -v "reinery_hf_cache:/root/.cache/huggingface" \
  reinery:latest chat
```

---

## ⚙️ Environment Configuration

You can customize the deployment by setting environment variables in `docker-compose.yml` or via `--env`:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `INFERENCE_ENDPOINT` | `http://model-server:8000/v1` | URL to the OpenAI-compatible completions API |
| `MODEL_NAME` | `Qwen/Qwen2.5-0.5B-Instruct` | Hugging Face repo ID or local path |
| `ROLE` | `analyst` | Role clearance level (`operator`, `technician`, `analyst`, `safety_officer`) |
| `RETRIEVAL` | `hybrid` | Retrieval strategy (`hybrid` for BM25+Vector, `vault` for keyword only) |
| `SERVE_HOST` | `0.0.0.0` | Bind host for local inference server |
| `DSH_HOME` | `/app/.veliky-dsh` | Veliky Harness state and session storage |

---

## 🛡️ Security & Isolation
- **Read-Only Sandbox**: Agent filesystem interactions are strictly confined to the project workspace and governed by Cordis policies.
- **SSRF Hardening**: Network calls are validated via `local_url` ensuring connections can only target private or container-local endpoints.
- **Independent Verification**: Formal investigation reports must pass deterministic multi-pass verification before completion.
- **Cryptographic Audit**: All tool calls and decisions are recorded in hash-chained audit trails under `RAG/state/audit.jsonl`.
