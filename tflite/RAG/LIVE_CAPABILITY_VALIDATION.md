# Capability validation — 12 September 2026

Implementation and automated tests are complete. Live registration/reuse awaits
human approval of the exact proposal below; it has not been silently authorized.

## Runtime actually exercised

- Real cached `Qwen/Qwen2.5-0.5B-Instruct`, revision
  `7ae557604adf67be50417f59c2c2f167def9a775`.
- CPU inference, four Torch threads; Torch `2.14.0+cpu`, Transformers `5.17.0`.
- Loopback endpoint `http://127.0.0.1:18080/v1`; cached-only model loading,
  remote model code disabled. No downloaded model or mocked inference responses.
- Existing installed DeepSeek Harness runtime at
  `/home/lucifer/Projects/Tflite/reinery/RAG/harness/dsh-source`, using this
  checkout's policy, MCP service, registry and execution code.
- Capability runtime installed in this checkout's `tflite/.venv`.
- `capability_doctor.py`: all ten binaries, four Python imports and real
  Bubblewrap namespace probe passed on the host. Docker image execution was not tested.

## Results

| Check | Result |
|---|---|
| Registry, sandbox, policy, audit, approval lifecycle, existing MCP regressions | 67 Python tests passed |
| Harness policy, including rejecting completion without tool evidence | Passed |
| Real model → DeepSeek Harness → MCP → registered `text_search` → Bubblewrap | Passed; latest run 42.01 seconds |
| Exact stdout from registered tool | `1:VELIKY live capability test` |
| Real model → harness → unknown `reverse_text` → local model generation → sandbox → approval gate | Passed; 43.98 seconds |
| Generated source result | `VELIKY` → `LENITNES`, exit 0, Bubblewrap |
| Human approval → persistent registration → real-model reuse | Awaiting approval |
| Audit-chain verification | Passed |

Live evidence is retained under `state/live-qwen-05b/`:
`registered-evidence.json`, `generate-evidence.json`, the MCP audit JSONL,
proposal JSON, and compressed original harness sessions. Runtime evidence contains
machine-specific paths and is ignored by Git. Tests can reproduce it using
`tests/smoke_capabilities_live.py`.

Early live attempts were rejected because the 0.5B model claimed execution without
emitting a tool call or generated malformed code. A focused tool menu and concise
prompts produced valid calls/code. The new capability completion gate rejects
turns without a real tool result. Qwen also misinterpreted a null artifact path as
no output despite valid stdout; the runner now renders the actual tool receipt as
its final response and retains raw model prose separately as `model_response`.
These observations limit the result: this is a passing constrained utility smoke,
not evidence that a 0.5B model is generally reliable at autonomous reasoning.

## Exact proposal awaiting human approval

ID: `6f57558454b4416f9d0f49923f41f32e`

Hash: `53e77b80a82512e652867e384fde4db34230199e8bec2d15a78128753f10def8`

Model-generated source:

```python
def run(data):
    return data["text"][::-1]
```

Contract: one string field `text`, maximum 65536 characters; string output;
high risk, Bubblewrap required, no network, 10-second timeout. The host wraps the
function with JSON stdin/stdout serialization. Approval registers it only in the
isolated smoke-test state directory, for reuse until revoked. Full review:

```bash
# Run from tflite:
.venv/bin/python RAG/capability_admin.py --state-dir RAG/state/live-qwen-05b \
  review 6f57558454b4416f9d0f49923f41f32e
```

After human approval, use `capability_admin.py approve` with the exact reviewed
hash, then run the live smoke with `--phase reuse`. That phase independently
checks `offline` → `enilffo` and verifies that no new generation took place.
