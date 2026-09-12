#!/usr/bin/env python3
"""Opt-in real-model / DeepSeek Harness / MCP / Bubblewrap smoke evidence.

Never mocks inference and never approves proposals. Run registered and generate
first, review with capability_admin.py, then run reuse after explicit approval.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from audit_log import AuditLog
from sentinel_harness import configure, run_capability_goal


def main() -> None:
    """Assert real audited tool output, independently of the model's final prose."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--endpoint', default='http://127.0.0.1:18080/v1')
    parser.add_argument('--model', default='Qwen/Qwen2.5-0.5B-Instruct')
    parser.add_argument('--dsh-bin', required=True)
    parser.add_argument('--state-dir', required=True, type=Path)
    parser.add_argument('--phase', choices=['registered', 'generate', 'reuse'], required=True)
    args = parser.parse_args()
    state = args.state_dir.resolve()
    state.mkdir(parents=True, exist_ok=True)
    inputs = state / 'data/capability_inputs'
    inputs.mkdir(parents=True, exist_ok=True)
    sample = inputs/'sample.txt'
    sample.write_text('SENTINEL live capability test\nVerified offline execution\n')
    os.environ.update(SENTINEL_DATA_DIR=str(state/'data'), SENTINEL_STATE_DIR=str(state),
        SENTINEL_RETRIEVAL='vault', SENTINEL_CAPABILITY_RISK='high', SENTINEL_ALLOW_SELF_EXTENSION='1',
        SENTINEL_EXTENSION_ENDPOINT=args.endpoint, SENTINEL_EXTENSION_MODEL=args.model)
    if args.phase == 'registered':
        name, data = 'text_search', {'path': str(sample), 'pattern': 'SENTINEL'}
    else:
        name, data = 'reverse_text', {'text': 'SENTINEL' if args.phase == 'generate' else 'offline'}
    patch = configure(state / 'live.patch.yml', args.endpoint, args.model, retrieval='vault', mode='capability')
    prompt = f'Call request_capability with capability_name {name} and input_data {json.dumps(data)}.'
    audit_path = state/'audit.jsonl'
    before = len(audit_path.read_text().splitlines()) if audit_path.exists() else 0
    started = time.monotonic()
    result = run_capability_goal(prompt, patch=patch, home=state/'dsh-home', model=args.model, dsh_bin=args.dsh_bin)
    rows = [json.loads(line) for line in audit_path.read_text().splitlines()[before:]] if audit_path.exists() else []
    calls = [row for row in rows if row.get('action') == 'capability' and row['capability_name'] == name]
    (state/(args.phase+'-trace.json')).write_text(json.dumps(result, indent=2))
    assert calls, 'The model did not invoke the requested capability through MCP'
    expected = 'pending_approval' if args.phase == 'generate' else 'succeeded'
    assert any(row['status'] == expected for row in calls), calls
    assert AuditLog(audit_path).verify_chain()
    outputs = [item['result'] for item in result['tool_results'] if item['request']['capability_name'] == name]
    if args.phase == 'registered':
        assert any(item.get('stdout') == '1:SENTINEL live capability test\n' for item in outputs), outputs
    elif args.phase == 'reuse':
        assert any(item.get('output') == 'enilffo' for item in outputs), outputs
        assert not any(row.get('action') == 'self_extension' for row in rows), 'Reuse unexpectedly generated code'
    else:
        assert any(item.get('status') == 'pending_approval' for item in outputs), outputs
    evidence = {'phase': args.phase, 'model': args.model, 'inference': 'real cached model, no mock responses',
                'duration_seconds': round(time.monotonic()-started, 2), 'audit_chain_valid': True,
                'capability_records': calls, **result}
    output = state/(args.phase+'-evidence.json')
    output.write_text(json.dumps(evidence, indent=2))
    print(json.dumps({'phase': args.phase, 'status': 'passed', 'evidence': str(output),
                      'final_response': result['final_response'], 'duration_seconds': evidence['duration_seconds']}))


if __name__ == '__main__':
    main()
