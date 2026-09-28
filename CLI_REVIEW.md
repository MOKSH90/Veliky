# CLI review and repairs

Reviewed the Node launcher, both interactive Python CLIs, legacy harness commands,
inference server, installers, service configuration, Docker entry points, and the
first-party backend tests. The embedded harness was exercised through its launcher;
its entire upstream package tree and the Android application were not exhaustively audited.

## Repaired

- Network-interface discovery no longer prevents even `--help` from starting.
- A single shared interactive implementation replaces two divergent copies.
- Interpreter selection honors `VELIKY_PYTHON`, including Windows virtual environments.
- Model loading is lazy and visible; failures remain failures. Removed canned model-server responses that claimed verified industrial findings without loaded weights.
- Conversation history reaches the model, and native inference uses the tokenizer's chat template.
- An optional loopback HTTP endpoint reuses an existing inference server.
- Piped input uses ordinary input rather than terminal-only prompt handling.
- Legacy chat imports the SDK through the existing SDK loader and closes failed startup resources.
- Common legacy options work before or after subcommands; child failure codes propagate.
- `serve` starts inference rather than acting as another interactive-chat alias.
- File discussion no longer triggers implicit code-block overwrites. Search arguments are passed without shell interpolation.
- Automatic workspace discovery is bounded and prunes dependency trees.
- Status probes actual services. Tool listings describe the tools implemented by this CLI.
- Installers include lightweight Python dependencies, resolve their own checkout, enforce compatible Node versions, and fix the Windows downloaded checkout path.
- Docker `chat` uses the harness and configured inference endpoint instead of silently loading another model in the CLI container.

## Validation

- Full backend suite: 82 passing tests, including 15 CLI/inference regressions and a controlled HTTP round trip.
- Harness policy test passed; embedded harness launcher returned its version.
- Web TypeScript/production build passed (existing large-bundle warning remains).
- Both Compose configurations validated; changed shell scripts and JavaScript parsed.
- 22 first-party Python modules parsed successfully.
- Interactive help/exit through piped input, vault listing, and diagnostics exercised.

## Runtime limits observed

- The installed default-model cache contains a tokenizer but lacks weights. No model server was listening on port 8000. Real model generation was not validated; load/download weights or connect to an existing server.
- The HTTP agent client still deliberately requires numeric loopback. Container `chat` uses the harness's private-network endpoint handling; other gateway features using `LocalModelClient` retain the documented Compose limitation.
- Windows installers were reviewed but not executed. Containers were configuration-validated, not rebuilt or deployed.
- Android build tooling was unavailable in this environment; no Android build was attempted.
