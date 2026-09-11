# Reinery — Sovereign Industrial Agentic AI Workbench

An on-premise, air-gapped sovereign AI workbench for industrial telemetry, root-cause investigation, and multi-modal knowledge retrieval. Powered by DeepSeek Harness Cordis micro-kernel, FastMCP tool bridging, local open-weight language models, and multi-pass deterministic evidence verification.

---

## 🚀 Quick Execution

### Option A: Docker (Recommended)
Containerized execution requires Docker and Docker Compose:
```bash
# 1. Ensure Docker is running
sudo systemctl start docker

# 2. Build image
docker compose build

# 3. Launch interactive CLI workbench
docker compose run --rm reinery chat

# 4. Or run an autonomous investigation
docker compose run --rm reinery investigate "Analyze Pump P-204 using its inspection and sensor history."
```
*See [DOCKER.md](file:///home/lucifer/Projects/Tflite/reinery/DOCKER.md) for complete container documentation.*

---

### Option B: Local Native CLI
```bash
# 1. Start local open-weight model server (in one terminal)
./reinery serve

# 2. Launch interactive CLI chat (in another terminal)
./reinery chat

# 3. Or run autonomous investigation
./reinery investigate "Analyze Pump P-204 using its inspection and sensor history."

# 4. Check system health and diagnostics
./reinery doctor
```

---

## 🛠️ Key Capabilities
- **Natural Interaction**: Conversational terminal interface with slash commands (`/help`, `/clear`, `/model`, `/role`, `/doc`, `/exit`).
- **Knowledge Vault**: Permission-filtered industrial markdown vault with bidirectional entity backlinks.
- **FastMCP Protocol**: Standardized stdio Model Context Protocol bridge exposing sensor telemetry, bounded math, and document search.
- **Deterministic Verifier**: Multi-pass validator ensuring claims in generated reports cite exact quotes and matching calculations.
- **Cryptographic Audit Trail**: Hash-chained audit logs recording every tool call, response, and verification result.
