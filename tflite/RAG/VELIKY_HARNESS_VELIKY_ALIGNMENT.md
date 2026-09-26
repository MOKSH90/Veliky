# VELIKY & Veliky Harness Architectural Alignment Guide

> **Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work**  
> **SIH 2026 — Problem Statement #26117**

---

## Executive Summary: Understanding Veliky Harness's Purpose

Veliky Harness (`tools/veliky-harness`), the RAG pipeline (`RAG/`), and the VELIKY Architecture Reference Document (`VELIKY_Architecture_Reference.docx`) together establish a complete sovereign industrial intelligence platform. 

This document defines the architectural understanding, alignment strategy, and technical blueprint for bridging Veliky Harness (`dsh`) with the VELIKY RAG pipeline.

---

## Part 1. Veliky Harness (`dsh`) Internal Architecture & CLI Framework

Veliky Harness is not merely a model wrapper; it is an **operating kernel for autonomous AI agents**. Understanding how it runs, launches, boots tools, and enforces policies is key to integrating VELIKY.

```
+-------------------------------------------------------------------------+
|                  Veliky Harness CLI Launcher (dsh)                   |
|           apps/cli/src/bin.ts -> args.ts -> profile-boot.ts             |
+------------------------------------+------------------------------------+
                                     |
                    Boots Layered Cordis Micro-Kernel
                                     |
+------------------------------------+------------------------------------+
|                      Cordis Shared Context (ctx)                        |
|                                                                         |
|  ctx.sessions  ctx.systemPrompt  ctx.tools      ctx.agents  ctx.llm     |
|  (append-only) (prompt builder)  (registry)     (loop)      (adapters)  |
|  ctx.sandbox   ctx.userApproval  ctx.projections ctx.jobs   ctx.mcp     |
+------------------------------------+------------------------------------+
                                     |
                 Tool Execution Pipeline (Guarded Waterfall)
       tools/pre-execute (RBAC/Approval) -> tools/execute (Landlock Sandbox) 
                    -> tools/post-execute (Spill / Verify)
```

### 1.1 CLI Launch & Profile Lifecycle (`apps/cli`)

- **Entry point**: `bin.ts` parses arguments and dispatches through `profile-boot.ts`.
- **Layered Profiles**:
  Instead of hardcoding features, `dsh` uses Profiles and Bundles configured via YAML:
  1. **Base Bundle**: `cordis.patch.yml` (loads default tools, sandbox, session log, and approvals).
  2. **Mode Bundles**: `headless` (one-shot batch runner), `web` (interactive Web UI at port 3080), or `sdk` (JSON-RPC stdio daemon).
  3. **Overlay Patches**: Custom `cordis.patch.yml` files can insert, override, or disable any plugin row by `id`.

### 1.2 The Agent Turn Loop (`packages/core/agent-loop`)

Each agent turn follows a deterministic lifecycle:

```text
turn/start
  ├── claim next input & assemble system prompt + tool schemas
  ├── agent/pre-step: waterfall policy filter
  ├── step/start: prepare route and reconcile system prompt
  ├── derive & freeze request from append-only session log
  ├── stream call (llm/stream) -> assistant/message
  ├── tool/call*:
  │     ├── tools/pre-execute  (Permission presets: ask / auto / deny)
  │     ├── tools/execute      (Sandboxed execution)
  │     └── tools/post-execute (Output pruner, spill-store if > 50KB)
  └── step/end (if tools owe another request -> next step)
turn/end
```

### 1.3 How Veliky Harness Defines and Uses Agentic Tools

In `dsh`, tools are declared using `defineTool(...)` (from `@deepseek-ai/dsh-tools`) with Schemastery or Zod schemas:

- **Schema Declaration**: Name, description, parameters, and return types.
- **Registration**: Registered onto `ctx.tools.register(...)`.
- **Pre-execution Policy**: Handled by `@deepseek-ai/dsh-user-approval` and `@deepseek-ai/dsh-permission-presets`. Read-only actions run immediately, while state mutations trigger human approval.
- **Execution Sandboxing**: Powered by `@deepseek-ai/dsh-sandbox-local` using native Linux Landlock kernel-level confinement and POSIX file locks (`native/system`).
- **Result Spilling**: If tool output exceeds memory/token budgets, `@deepseek-ai/dsh-spill-local` writes it to disk and returns a locator reference to the model.

---

## Part 2. Direct Alignment: VELIKY Specification vs. Veliky Harness

The table below shows how every requirement in `VELIKY_Architecture_Reference.docx` directly maps to Veliky Harness and the existing `RAG/` codebase:

| VELIKY Document Requirement | Document Section | Existing `RAG/` Code | Veliky Harness Alignment |
| :--- | :--- | :--- | :--- |
| **Sovereign On-Premise Execution** | Sec. 2 & 11 | `rag.py` (`load_llm` via BitsAndBytes 4-bit) | Local model providers in `ctx.llm` (Ollama/vLLM/Local endpoints). Disconnectable Ethernet proof. |
| **Interaction Layer / UI** | Sec. 5.1 | `rag.py` (Rich terminal CLI) | `dsh web` (3-panel Mission Control) or `dsh --profile headless`. |
| **AI Canvas (Knowledge Graph)** | Sec. 5.1.1 & 6 | `veliky_vault/` (`[[wikilinks]]`, backlinks) | Exposed to the agent via `vault_get_backlinks` & `vault_read_note` tools. |
| **Model Router** | Sec. 5.2 & 9 | `rag.py` (Qwen-VL, Gemma, Llama) | `dsh-llm` route resolution (reasoning, vision, coding, embedding). |
| **Knowledge Vault & Vector DB** | Sec. 5.3 & 6 | `embeddings.py` & `MilvusIndex` in `rag.py` | Built-in toolset for hybrid retrieval (Milvus dense + visual + BM25). |
| **Tool Sandbox** | Sec. 5.4 | `SandboxedCalculationEngine` in `rag.py` | `dsh-code-runtime-worker-thread` + Linux Landlock sandboxing (`native/system`). |
| **3-Tier Policy Engine (RBAC)** | Sec. 5.5 | `rag.py` (`_evaluate_policy`) | `@deepseek-ai/dsh-user-approval` (auto-approve, requires approval, blocked). |
| **4-Tier Verification Engine** | Sec. 5.6 | `verify_investigation` in `rag.py` | Integrated as a post-execution validator before final turn completion. |
| **Immutable Audit Trail** | Sec. 5.7 | `AuditTrail` in `rag.py` | `@deepseek-ai/dsh-session-persistence-jsonl` ("Model-visible means logged"). |
| **Differentiator 7.4: Proactive Sensor Watcher** | Sec. 7.4 & 17.2 | `run_proactive_watcher` in `rag.py` | Background deterministic daemon triggers `dsh` turns via Python SDK or CLI. |

---

## Part 3. The Integration Architecture: Connecting `RAG/` to `dsh`

To integrate the RAG pipeline in `RAG/` (`rag.py`, `embeddings.py`, `veliky_vault/`) with Veliky Harness cleanly without breaking upstream code, we use **Model Context Protocol (MCP)** and the **Python SDK**.

```
                           +-------------------------------------+
                           |      Veliky Harness Runtime       |
                           |   `dsh web` or `dsh --profile sdk`   |
                           +------------------+------------------+
                                              |
                   @deepseek-ai/dsh-mcp-client (stdio JSON-RPC)
                                              |
                                              v
+-----------------------------------------------------------------------------------+
|                    VELIKY Sovereign MCP Tool Server (Python)                     |
|                                                                                   |
|  +---------------------------+  +----------------------------------------------+  |
|  | Knowledge Vault & Graph   |  | Tri-Hybrid Retrieval (embeddings.py + Milvus)|  |
|  | - read_vault_note()       |  | - search_documents() (Milvus + BM25)         |  |
|  | - write_vault_note()      |  | - read_document()                            |  |
|  | - get_vault_backlinks()   |  | - analyze_equipment_drawing() (Multimodal)   |  |
|  | - traverse_graph()        |  |                                              |  |
|  +---------------------------+  +----------------------------------------------+  |
|  +---------------------------+  +----------------------------------------------+  |
|  | Sandboxed Calculations    |  | Independent Verification Engine              |  |
|  | - calculate_metric()      |  | - verify_evidence()                          |  |
|  +---------------------------+  +----------------------------------------------+  |
|  +-----------------------------------------------------------------------------+  |
|  | Proactive Sensor Watcher (Differentiator 7.4)                              |  |
|  | - query_sensor_history() & autonomous alert triggering                     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Why MCP via `@deepseek-ai/dsh-mcp-client` is the Superior Integration Pattern:

1. **Zero Hacks to Upstream Monorepo**: Harness already ships with built-in MCP client support (`packages/mcp/mcp-client`).
2. **Native Tool Bridging**: Every Python tool exposed by `veliky_mcp_server.py` appears in `dsh` as a first-class citizen (`mcp__veliky__search_documents`, `mcp__veliky__read_vault_note`, etc.).
3. **Explicit Policy Enforcement**: The VELIKY policy plugin uses the harness approval service for writes and a monotonic guard to block bypass tools. MCP child-process filesystem access is constrained by the Python service, not automatically by the harness shell sandbox.
4. **Preserves Python PyTorch/Milvus Ecosystem**: The heavy ML stack (`torch`, `transformers`, `pymilvus`, `sentence-transformers`) stays natively in Python while `dsh` handles agent orchestration.

---

## Part 4. Implemented Integration

The implementation and complete runbook are in [RAG/README.md](README.md). The original illustrative Python constructor and YAML snippets have been replaced: `VelikyWorkbench` accepts domain/role/path arguments and eagerly loads a generative model, so the MCP server instead uses the retrieval-only `VelikyService`. The real MCP client does not automatically ask before writes; the external `harness/policy.mjs` plugin supplies that gate.

| Component | Implementation |
| --- | --- |
| MCP stdio server | `veliky_mcp_server.py`, using the official Python MCP SDK |
| Retrieval, vault, graph and evidence service | `veliky_service.py` |
| Shared bounded arithmetic and clearance policy | `veliky_security.py`, also used by `rag.py` |
| Harness tool allowlist, approval and completion checks | `harness/policy.mjs` |
| Local provider and MCP overlay | Root `veliky.cordis.patch.yml`, generated by `veliky_harness.py configure` |
| SDK investigation entry point | `veliky_harness.py investigate` |
| Deterministic sensor dispatch | `veliky_watcher.py`, calling the same SDK `run_goal` |
| Live synthetic historian | `veliky_simulator.py`, atomic CSV publication with pump drift |
| Unit and real MCP tests | `tests/test_integration.py`, `harness/policy.test.mjs` |
| Real harness / SDK / MCP smoke | `tests/smoke_harness.py`, with an explicitly scripted local model |

MCP output includes source-backed evidence IDs. Verification checks exact quotes, numerical operands and arithmetic against stored evidence. Successful completion requires the final JSON to match the verified report; arbitrary later additions fail the completion gate. Source notes and arbitrary host files are not writable; human-approved writes are confined to generated investigation notes with version checks.

Hybrid retrieval loads lazily and reports an explicit vault-only fallback if its dependencies/index are unavailable. Drawing evidence remains unavailable until images are ingested and a vision-capable model is configured. A local model service, model weights and a populated Milvus index are deployment prerequisites for the full multimodal path; the keyless smoke test does not claim model-quality validation.

The hash-chained audit is tamper-evident, not administrator-proof immutable storage. Deployment authentication, disk encryption, retention, network isolation and a dedicated VELIKY canvas remain separate responsibilities; see the runbook's deployment limits.

---

## Part 5. Demonstration Scripts Alignment

With this architecture in place, both demonstration scenarios defined in Section 17 of the document work seamlessly:

### Script A: General Investigation Demo (On Command — Sec. 17.1)

1. **User asks**: *"Analyze Pump P-204 and determine whether its current vibration condition requires attention. Use the maintenance history, inspection report, drawing, and applicable SOP. Calculate the change from previous measurement."*
2. **Veliky Harness execution trace**:
   - Routes to `mcp__veliky__read_vault_note("Pump-P204")` to inspect metadata and linked documents (`[[Compressor-C104]]`, `[[SOP-Pump-Maintenance]]`).
   - Retrieves `Inspection-Report-62` via `mcp__veliky__search_documents`.
   - Executes `mcp__veliky__calculate_metric` to deterministically calculate percentage drift from the documented 2.8 mm/s commissioning baseline (or 4.4 mm/s immediately previous reading, as requested).
   - Runs verification: checks exact cited quotations and operands against the bundled SOP; standard applicability remains an engineering judgment.
   - Outputs full evidence-backed report with exact source/page or row provenance and explicit verification scope.
3. **Sovereignty Proof**: Network cable can be physically disconnected during the run; all inference and retrieval happen entirely on-premise.

### Script B: Proactive Sensor-Triggered Demo (Unprompted — Sec. 17.2)

1. Background sensor process generates simulated baseline telemetry.
2. Vibration metric on P-204 drifts above the threshold (e.g. 7.1 mm/s).
3. The deterministic watcher trips and dispatches a goal to Veliky Harness.
4. Veliky Harness wakes up unprompted, executes the investigation plan, verifies findings, and posts the report to Mission Control without human input.
