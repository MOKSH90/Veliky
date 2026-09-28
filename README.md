# VELIKY

**A local-first industrial AI workbench for knowledge retrieval, equipment investigation, and evidence-backed reporting.**

Veliky brings together a React web application, Python agent services, a Markdown knowledge vault, local language-model inference, and an Android companion project. It is designed to help teams investigate equipment issues using source documents, telemetry, bounded calculations, and reviewable outputs.

The repository contains working backend components alongside demonstration data and evolving frontend integrations. Available features depend on which services, models, and host tools are running.

## What is included

- **Web workspace:** workspace selection, industrial records, agent interfaces, and supporting knowledge, approval, and activity views.
- **Knowledge retrieval:** Markdown vault search, source metadata, document links, role-based filtering, and optional Milvus-backed retrieval.
- **Local inference:** an OpenAI-compatible model server exposing `/v1/models` and `/v1/chat/completions` for locally hosted Hugging Face models.
- **Agent tools:** a FastMCP bridge, capability registry, policy checks, and sandboxed execution through Linux Bubblewrap.
- **Evidence verification:** source-quote and calculation checks, persisted evidence, and hash-chained audit records.
- **Controlled extension:** generated capability proposals with approval, expiry, revocation, and source-integrity checks.
- **Telemetry workflows:** a simulator and watcher for equipment readings and investigation triggers.
- **Android application:** Kotlin and Jetpack Compose sources under `Veliky-App`.

## Repository layout

```text
Veliky/
├── Veliky-Web/                  React + TypeScript frontend and Python gateway
│   ├── src/                    Pages, stores, services, and workbench components
│   ├── server/gateway.py       Local HTTP API
│   └── bin/veliky.js           Node CLI entry point
├── Veliky-App/                  Android application
├── tflite/
│   ├── RAG/                    Retrieval, verification, model server, MCP, and tests
│   ├── RAG/veliky_vault/       Bundled equipment, report, and SOP examples
│   ├── veliky_vault/           Vault mounted by the root Docker configuration
│   ├── index_store/            Retrieval index and chunk data
│   ├── tools/veliky-harness/   Embedded agent harness
│   ├── veliky_cli.py           Interactive agent CLI
│   └── reinery_cli.py          Existing investigation and diagnostics CLI
├── docker/                     Container builds and gateway entry point
├── docker-compose.yml          Multi-service deployment configuration
└── docker-compose.gpu.yml      NVIDIA GPU override
```

The two vault directories are separate. Set `VAULT_DIR` explicitly when switching between native and container workflows.

## Start the web application

Use Node.js 22.19+ and npm. From the repository root:

```bash
cd Veliky-Web
npm ci
npm run dev
```

Open **http://localhost:5173**. The development server forwards `/api` requests to `127.0.0.1:8766` and `/v1` requests to `127.0.0.1:8000`. Starting Vite alone does not start either Python service.

To create a production web bundle:

```bash
npm run build
```

The output is written to `Veliky-Web/dist/`.

## Run the local backend

The following commands assume a Linux shell and Python 3.11+. From the repository root, create an environment and install the lightweight backend dependencies:

```bash
python3 -m venv tflite/.venv
tflite/.venv/bin/python -m pip install -r tflite/RAG/requirements-harness.txt
```

Start the gateway in a separate terminal:

```bash
cd Veliky-Web
npm run dev:api
```

The launcher discovers `tflite/.venv/bin/python` automatically. Set `VELIKY_PYTHON` to use another interpreter. Check the gateway at **http://127.0.0.1:8766/health**.

### Local model inference

Install the model-server dependencies from the repository root:

```bash
tflite/.venv/bin/python -m pip install torch transformers accelerate starlette uvicorn
```

Then start a model server in another terminal:

```bash
tflite/.venv/bin/python tflite/RAG/veliky_llm_server.py \
  --host 127.0.0.1 \
  --port 8000 \
  --model Qwen/Qwen2.5-1.5B-Instruct
```

The first run may download model weights. Memory requirements depend on the model, device, and datatype. The server's default model, when `--model` is omitted, is `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`.

For offline use, cache the selected model first, then set `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`. The gateway development launcher already sets these flags for its own process.

Full ML ingestion and vector retrieval dependencies are listed separately in [requirements.txt](tflite/RAG/requirements.txt). Linux capability execution also uses host tools such as Bubblewrap, Poppler, Tesseract, and ImageMagick; the gateway Dockerfile lists the installed utilities.

## Command-line interface

After installing the lightweight Python dependencies above and running `npm ci` in
`Veliky-Web`, launch from the repository root:

```bash
node Veliky-Web/bin/veliky.js start
```

The prompt opens immediately. `/help`, `/model`, `/agent`, `/tools`, `/clear`, and
`/exit` work without loading a model. The first AI request loads the selected
model in-process; install `torch transformers accelerate` for this mode. First
use may download weights. A tokenizer-only cache is insufficient for offline
inference, and model failures are reported rather than replaced with canned answers.

To use a separate model server with consistent model selection:

```bash
# Terminal 1
node Veliky-Web/bin/veliky.js serve --model Qwen/Qwen2.5-1.5B-Instruct
# Terminal 2
node Veliky-Web/bin/veliky.js start --endpoint http://127.0.0.1:8000/v1 --model Qwen/Qwen2.5-1.5B-Instruct
```

`serve` starts inference; `start` and `cli` open the interactive prompt.
`VELIKY_PYTHON` overrides interpreter discovery. Both Python CLI entry points use
`tflite/veliky_cli.py`; `Veliky-Web/bin/veliky_cli.py` is a compatibility launcher.
The direct Python entry point should be run with `tflite/.venv/bin/python`.

Additional commands:

```bash
node Veliky-Web/bin/veliky.js doctor
node Veliky-Web/bin/veliky.js status
node Veliky-Web/bin/veliky.js rag notes --retrieval vault
node Veliky-Web/bin/veliky.js chat --model Qwen/Qwen2.5-1.5B-Instruct
```

`chat` uses the embedded harness and requires its Node dependencies, native
runtime, and a running model endpoint. Common options also work after legacy
subcommands, for example `tflite/reinery serve --model MODEL`.
The interactive agent defaults to vault-only retrieval to avoid loading embedding
models for every new session; use `--retrieval hybrid` when those dependencies
are installed. Workspace file and shell tools operate with the launching user's
permissions. The separate harness uses the capability policy layer.

`status` probes services and exits nonzero when any service is unavailable.
The installer (`bash Veliky-Web/install.sh`) installs the lightweight CLI
dependencies and links `veliky`; inference dependencies and model weights are
installed separately. Windows installation uses `Veliky-Web/install.ps1`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VAULT_DIR` | Path to the Markdown knowledge vault. |
| `VELIKY_STATE_DIR` | Runtime state location. |
| `VELIKY_DATA_DIR` | Runtime data location. |
| `VELIKY_ROLE` | Backend role; the native service defaults to `analyst`. |
| `VELIKY_HARNESS_WRITES` | Set to `1` to enable writes for an authorized role. |
| `VELIKY_REASONING_ENDPOINT` | Reasoning endpoint; native gateway default: `http://127.0.0.1:8000/v1`. |
| `VELIKY_CODING_ENDPOINT` | Coding endpoint. |
| `VELIKY_VISION_ENDPOINT` | Vision endpoint; requires a model compatible with the intended task. |
| `VELIKY_REASONING_MODEL` | Model identifier for reasoning requests. |
| `VELIKY_CODING_MODEL` | Model identifier for coding requests. |
| `VELIKY_VISION_MODEL` | Model identifier for vision requests. |
| `VELIKY_PYTHON` | Python interpreter used by the gateway development launcher. |

`LocalModelClient` accepts numeric loopback HTTP addresses and rejects redirects. Use `127.0.0.1`, rather than `localhost`, for that client. Role configuration is a backend policy input, not an organizational login system.

## Docker deployment

The root Compose file defines a model server, gateway, web server, and optional CLI and telemetry watcher services.

```bash
docker compose config --quiet
docker compose up --build -d
```

| Service | Host address |
| --- | --- |
| Web application | http://localhost:3000 or http://localhost:5173 |
| Gateway health | http://localhost:8766/health |
| Model API | http://localhost:8000/v1/models |

For NVIDIA GPU allocation, use the provided override with a configured NVIDIA container runtime:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d
```

Inspect or stop the services:

```bash
docker compose logs -f
docker compose down
```

**Current integration limitation:** Compose configures inference at `http://model-server:8000/v1`, while `LocalModelClient` requires a numeric loopback address. Requests using that client need a compatible deployment/network arrangement before containerized inference will work. Compose syntax validation alone does not verify an end-to-end deployment. The supplied gateway configuration also enables an admin role and writes; it is a development configuration.

See [the Docker guide](VELIKY_DOCKER_GUIDE.md) for service details. Dependency and model downloads are required before an offline deployment can run.

## Android development

Open `Veliky-App` in Android Studio with the JDK and Android SDK required by its checked-in Gradle configuration. The application uses the package `com.example.veliky`, targets API 36, and supports API 24 and later.

With the Android toolchain installed:

```bash
cd Veliky-App
./gradlew assembleDebug
```

Rebuild from source for current branding; the prebuilt release APK predates the Veliky rename.

## Verification

From the repository root:

```bash
# Backend tests
tflite/.venv/bin/python -m pip install pytest
tflite/.venv/bin/python -m pytest tflite/RAG/tests -q

# Agent policy tests
node --test tflite/RAG/harness/policy.test.mjs

# Container configuration
docker compose config --quiet

# Frontend compilation and production bundle
cd Veliky-Web
npm run build
```

Some backend capability tests require Linux sandbox support and external utilities. The frontend also provides `npm run qa:browser`; it expects a running development server and Chromium. See [the browser test script](Veliky-Web/scripts/qa-browser.mjs) for its environment overrides.

## Further reading

- [Project documentation](VELIKY_Project_Documentation.md)
- [Docker guide](VELIKY_DOCKER_GUIDE.md)
- [Backend capability reference](tflite/RAG/CAPABILITIES.md)
- [Recorded live capability validation](tflite/RAG/LIVE_CAPABILITY_VALIDATION.md)
- [Web design notes](Veliky-Web/DESIGN.md)
- [Web interaction contract](Veliky-Web/UX-CONTRACT.md)

Some component documents describe earlier iterations. Check the current source and configuration when those descriptions differ from this README.
