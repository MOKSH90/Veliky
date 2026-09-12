#!/usr/bin/env python3
"""Local administrator CLI. Approval and revocation are never model-facing tools."""
from __future__ import annotations
import argparse
import getpass
import json
from pathlib import Path
from audit_log import AuditLog
from capability_registry import CapabilityRegistry
from sandbox_executor import SandboxExecutor
from self_extension_pipeline import SelfExtensionPipeline


def main() -> None:
    """Review exact code and observed output, then approve/reject its reviewed hash."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', type=Path, default=Path(__file__).with_name('state'))
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('list')
    for name in ('review', 'approve', 'reject'):
        command = commands.add_parser(name)
        command.add_argument('proposal_id')
        if name != 'review':
            command.add_argument('--expected-hash', required=True, help='Exact SHA-256 printed by review; approval registers a reusable high-risk offline capability')
    commands.add_parser('revoke').add_argument('capability_name')
    args = parser.parse_args()
    state = args.state_dir.resolve()
    registry = CapabilityRegistry(generated_path=state / 'generated_capabilities.json')
    pipeline = SelfExtensionPipeline(registry, SandboxExecutor(registry, [], state / 'capability_outputs'),
                                     AuditLog(state / 'audit.jsonl'), None, state / 'capability_proposals')
    if args.command == 'list':
        result = {'registered': registry.list_capabilities(), 'proposals': [
            {'id': path.stem, 'status': pipeline.review(path.stem)['status']}
            for path in sorted(pipeline.proposal_dir.glob('*.json'))]}
    elif args.command == 'review':
        result = pipeline.review(args.proposal_id)
    elif args.command == 'revoke':
        result = pipeline.revoke(args.capability_name, getpass.getuser())
    else:
        result = pipeline.decide(args.proposal_id, args.expected_hash, args.command == 'approve', getpass.getuser())
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
