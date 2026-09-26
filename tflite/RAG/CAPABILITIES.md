# OS Capability Registry

Agent utility requests enter `mcp__veliky__request_capability` with
`{"capability_name":"pdf_text_extraction","input_data":{"path":"/absolute/path/sample.pdf"}}`.
The MCP adapter creates identity and permissions on the host; agents cannot submit
risk permissions, session IDs, network grants, executables, or command-line options.
Existing retrieval/evidence tools retain their existing routing. Utility requests
use this registry before local self-extension. Only unknown names escalate;
invalid input, policy denials, missing binaries and execution failures do not.

## Install and run offline

Provision Linux with Bubblewrap, util-linux (`prlimit`), Python 3, Poppler
(`pdftotext`, `pdftoppm`), tesseract plus local language data, ImageMagick (`convert`),
GNU tar/gzip and grep. Install `requirements-harness.txt` into the service virtual
environment. `csv_analysis` uses pandas from that same environment. The Python
script capability uses `/usr/bin/python3` and its installed system packages.
For disconnected installation, transfer approved distro packages and a wheelhouse
and use `pip install --no-index --find-links /media/wheels -r requirements-harness.txt`.
No execution path downloads packages, models, schemas or language data.

The service loads `capabilities.yaml` at startup. Place approved input files in
`VELIKY_DATA_DIR/capability_inputs/` (create this directory when provisioning).
Artifacts persist in `VELIKY_STATE_DIR/capability_outputs/`. The default MCP adapter
permits low risk only and no network. `image_processing` (medium) and `python_exec`
(high) are denied there; a trusted application may instantiate the dispatcher with
explicitly authorized context. Do not expose that context as an agent tool parameter.
Rate limits count authorized attempts per capability and service session: 20/minute,
process-local, resetting when the MCP service restarts. Separate service instances
have separate limits; this is not a distributed quota.

```python
from pathlib import Path
from audit_log import AuditLog
from capability_registry import CapabilityRegistry
from capability_dispatcher import CapabilityDispatcher
from policy_engine import PolicyEngine
from sandbox_executor import SandboxExecutor

registry = CapabilityRegistry()
dispatcher = CapabilityDispatcher(
    registry, PolicyEngine(),
    SandboxExecutor(registry, [Path('/srv/veliky/inputs')], Path('/srv/veliky/outputs')),
    AuditLog('/srv/veliky/state/audit.jsonl'),
)
result = dispatcher.dispatch('pdf_text_extraction', {'path': '/srv/veliky/inputs/sample.pdf'},
                             {'session_id': 'authenticated-session', 'allowed_risk_level': 'low',
                              'network_allowed': False,
                              'allowed_capabilities': ['pdf_text_extraction']})
```

## Configuration contract

Each definition has `name`, `implementation`, a closed object `input_schema`,
`risk_tier`, `sandbox_required`, `network_allowed` (default false), and
`timeout_seconds` (default 30, maximum 300). JSON configuration is accepted too.
Schema references are rejected to avoid implicit remote resolution.

For plain binaries, `implementation.path` is an absolute administrator-approved
executable and `args` is an array of literal tokens or whole-token `{field}`
placeholders. Array placeholders expand into separate arguments. `input_files`
lists fields to stage from trusted roots; these are replaced with sandbox paths.
Only regular files are accepted, up to 32 MiB each; symlinks and directories are
rejected. `output_file` is a fixed sandbox-relative artifact filename. It is copied
to a unique persistent output path after successful execution. Caller-chosen output
paths are not supported. Add binary capabilities by editing YAML and restarting.
Treat the config, runtime, installed packages, input roots and artifact directory
as administrator-owned, and keep secrets out of the runtime installation.

`python_callable` uses `module: module_name:function_name`; the callable accepts a
dict and returns JSON. Install custom modules in the service environment. Built-in
adapters live in `capability_worker.py`. `output_format: json` requires an
`output_schema`; otherwise output must be nonempty unless `nonempty_output: false`.
`success_exit_codes` defaults to `[0]`; grep also accepts 1 for no matches.

Seed inputs:

| Capability | Structured input | Result |
|---|---|---|
| ocr | `path`: PDF or image | JSON `text`; PDFs rasterized locally, first 20 pages |
| pdf_text_extraction | `path`: PDF | stdout text |
| image_processing | `path`, `operation`: `-resize` or `-rotate`, numeric `value` such as `640x480` or `90` | persistent PNG path |
| compression | `paths`: list of files | persistent `.gz` tar archive path |
| text_search | `path`, `pattern` | stdout matches, empty for no match |
| python_exec | `script`: Python source | stdout/stderr; high risk |
| csv_analysis | `path`, `operation`: `head`, `describe`, `summary` | JSON result |

Non-script string inputs reject shell metacharacters, including newlines and `$`.
This conservative restriction also excludes some otherwise valid filenames and
regexes. Scripts are intentional Python source, accepted only for the registered
high-risk capability. They may create subprocesses *inside* the OS sandbox; they
do not obtain a host shell or unrestricted host filesystem access.

## Isolation and evidence

Bubblewrap provides separate user, PID, mount, IPC, UTS and network namespaces,
a new session and dropped capabilities. Only runtime files, selected utility
configuration, the callable worker and staged inputs are exposed. Host home,
audit logs and data roots are not mounted. Networking stays isolated unless both
the definition and trusted policy context grant it. Even definitions marked
`sandbox_required: false` receive isolation in this backend.

Missing Bubblewrap, disabled user namespaces, unsupported OS, or failed isolation
produce an execution error. **There is no unsandboxed fallback.** `unshare --net`
alone does not provide the filesystem boundary needed by Python scripts. See the
[Bubblewrap manual](https://manpages.debian.org/bookworm/bubblewrap/bwrap.1.en.html)
for the namespace and mount options used here.

Every process has a wall-clock timeout, CPU-time limit, 2 GiB address-space limit,
16 MiB per-file growth limit, 64 descriptors and 64-process limit. Capture is capped
at 1 MiB per output stream; exceeding it fails rather than silently truncating.
The PID namespace and `--die-with-parent` remove descendants on timeout/exit.
These are process limits, not aggregate cgroup memory/disk quotas. Run the service
under host cgroup/storage quotas for adversarial multi-process resource workloads.
The scratch directory is deleted; successful artifacts require an operator retention
policy. A read-only utility runtime remains visible to sandbox code.

Capability attempts append timestamp, name, input hash, risk tier, sandbox backend,
exit code (null if none), status, session and elapsed milliseconds to the existing
`state/audit.jsonl`. Ordinary service entries and capability entries share the same
cross-process lock and compatible hash chain. Raw input/script contents are not
logged. Audit write failures propagate; callers must not treat an unaudited result
as successful. Because audit is written after execution, storage failure can occur
after a utility has run; this is not a transactional rollback mechanism.

`AuditLog(path).verify_chain()` checks hashes and ordering. It detects changed records
but cannot detect deletion of an intact tail or complete rewriting by someone who
controls the log; externally retain the latest hash to anchor stronger evidence.
A dispatcher without a configured extension pipeline returns `no_capability_found`
with `next_action: escalate_to_tool_generation`. The service uses the local pipeline
described below, with generation disabled until the host explicitly grants it.

## Validation

```bash
python -m pytest tests/test_capabilities.py tests/test_integration.py -q
node --test harness/policy.test.mjs
```

Run from `tflite/RAG`. Real sandbox tests skip explicitly if the host lacks usable
Bubblewrap namespaces. A complete validation run should have no capability skips.
Tests build a valid sample PDF in a temporary directory and run real utilities,
including network/filesystem isolation and timeout checks.

## Local self-extension and explicit approval

Self-extension is now implemented for **pure JSON-to-JSON Python transformations**.
It does not install packages or generate file/network integrations. Those remain
administrator-configured binary/callable capabilities. Unknown requests go through
host authorization, local model generation (at most two attempts), syntax/import
checks, real Bubblewrap execution, JSON verification, and a durable proposal.
Generated capabilities are always high risk, offline, and limited to 10 seconds.
The input schema is inferred by trusted code from the sample, and output type is
inferred from the sandbox result. One sample passing is not proof of correctness;
review semantics and edge cases before approving.

Enable generation only in a trusted host environment:

```bash
export VELIKY_EXTENSION_ENDPOINT=http://127.0.0.1:18080/v1
export VELIKY_EXTENSION_MODEL=Qwen/Qwen2.5-0.5B-Instruct
export VELIKY_ALLOW_SELF_EXTENSION=1
export VELIKY_CAPABILITY_RISK=high
```

These variables are propagated to MCP by `veliky_harness.configure`; they are
never accepted as tool arguments. The model endpoint must use a numeric loopback
HTTP address. Proxy environment variables and redirects are disabled in the
client. Inference uses the local model server, while generated code has no network.
The high-risk setting also enables the existing `python_exec` capability, so only
grant it to an authorized session. Low-risk/offline remains the default.

The agent gets `pending_approval` with a proposal ID and hash. It cannot approve
itself. Use the local administrator CLI (not exposed to MCP):

```bash
python capability_admin.py --state-dir state list
python capability_admin.py --state-dir state review PROPOSAL_ID
python capability_admin.py --state-dir state approve PROPOSAL_ID --expected-hash REVIEWED_HASH
# Or decline:
python capability_admin.py --state-dir state reject PROPOSAL_ID --expected-hash REVIEWED_HASH
# Withdraw future execution rights:
python capability_admin.py --state-dir state revoke reverse_text
```

Review shows exact source and execution wrapper, schema, risk, network setting,
sample input, observed output, sandbox result and model provenance. Approval is
bound to the hash of the complete proposal and expires after 24 hours. Any changed
proposal fails integrity/hash checks. Approval creates a reusable grant until
revocation; `list` exposes these grants. Repeated pending/rejected requests for the
same sample retain their decision rather than regenerate. Revocation prevents
future lookups/executions; it does not interrupt a process already executing.
State files are operator-owned and must not be writable by untrusted users.

Approved definitions are atomically persisted in `state/generated_capabilities.json`.
Services read this overlay on lookup, so registration/revocation is visible without
a restart. Seed definitions cannot be replaced. Decisions and sandbox tests join
the existing audit chain. Administration requires the same filesystem trust as
editing the seed config; proposal hashes detect changes, not a malicious host admin.

## Small local model and real agent smoke

The inference server now loads **only cached weights** with remote model code
disabled. Provision inference packages separately using your existing inference
virtual environment. On this machine the cached Qwen 0.5B runtime is available in
`/home/lucifer/Projects/Tflite/reinery/.venv`; the capability/MCP runtime is installed
in this checkout's `tflite/.venv`. No model weights need downloading.

From `tflite`, with the appropriate inference Python:

```bash
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 /path/to/inference/python RAG/veliky_llm_server.py \
  --model Qwen/Qwen2.5-0.5B-Instruct --port 18080 --device cpu --dtype float32
.venv/bin/python RAG/capability_doctor.py
```

The doctor checks installed binaries/imports and actually launches a network
namespace. A container image containing Bubblewrap is insufficient if the host
blocks user namespaces; fail closed and fix the deployment rather than disabling
isolation. The Dockerfile now includes the utility and Python capability packages.
The Docker image itself is not validated by the host smoke test.

A focused capability agent mode presents only the capability MCP tool to small
models. Its completion gate refuses a turn that claims execution without receiving
a real tool result. It leaves the existing investigation verification gate intact:

```bash
.venv/bin/python RAG/veliky_harness.py capability \
  'Call request_capability with capability_name text_search and input_data {"path":"/absolute/approved/file.txt","pattern":"VELIKY"}.' \
  --endpoint http://127.0.0.1:18080/v1 --model Qwen/Qwen2.5-0.5B-Instruct \
  --dsh-bin /path/to/installed/dsh --patch /tmp/capability.patch.yml --retrieval vault
```

The live smoke uses real Veliky Harness, local model responses, MCP transport,
Bubblewrap and audit evidence. It never injects canned model answers and never
approves proposals automatically:

```bash
.venv/bin/python RAG/tests/smoke_capabilities_live.py --dsh-bin /path/to/installed/dsh \
  --state-dir "$PWD/RAG/state/live-smoke" --phase registered
.venv/bin/python RAG/tests/smoke_capabilities_live.py --dsh-bin /path/to/installed/dsh \
  --state-dir "$PWD/RAG/state/live-smoke" --phase generate
# Review/approve the proposal via capability_admin.py, then:
.venv/bin/python RAG/tests/smoke_capabilities_live.py --dsh-bin /path/to/installed/dsh \
  --state-dir "$PWD/RAG/state/live-smoke" --phase reuse
```

Each successful phase writes full events and timing evidence to its state directory.
The utility runner renders its final response from the actual tool receipt; raw model
prose is retained separately as `model_response`, because tiny models can misread
fields such as a null artifact path despite valid stdout.
Tiny models can miss tool calls or generate invalid code. Such failures are surfaced;
a passing smoke demonstrates the named scenarios, not general reasoning quality.
