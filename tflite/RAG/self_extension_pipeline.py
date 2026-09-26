"""Local code generation, bounded sandbox tests, and exact-version admin approval.

Generation supports pure JSON transformations. No packages, files, network grants,
registry paths, or risk tiers are selected by the model. Sandbox tests are evidence
of observed behavior, not a proof that arbitrary inputs are correct.
"""
from __future__ import annotations
import ast
from dataclasses import asdict, replace
from datetime import datetime, timedelta, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import tempfile
import uuid

from audit_log import AuditLog, digest
from capability_registry import CapabilityDefinition, CapabilityRegistry
from local_model_client import LocalModelClient
from sandbox_executor import SandboxExecutor

GENERATOR_PROMPT = "You write short Python functions. Return only code."


def input_schema(value: object) -> dict:
    """Infer a bounded schema from JSON; never ask the model to choose permissions."""
    if isinstance(value, dict):
        if len(value) > 32 or not all(isinstance(k, str) for k in value):
            raise ValueError('Input objects need at most 32 string keys')
        return {'type': 'object', 'properties': {k: input_schema(v) for k, v in value.items()},
                'required': list(value), 'additionalProperties': False}
    if isinstance(value, list):
        if not value:
            raise ValueError('Generation needs a nonempty sample array to infer its type')
        first = input_schema(value[0])
        if any(input_schema(item) != first for item in value):
            raise ValueError('Sample arrays must have a consistent JSON type')
        return {'type': 'array', 'items': first, 'maxItems': 1000}
    if isinstance(value, bool):
        return {'type': 'boolean'}
    if isinstance(value, (int, float)):
        return {'type': 'number'}
    if isinstance(value, str):
        return {'type': 'string', 'maxLength': 65536}
    if value is None:
        return {'type': 'null'}
    raise ValueError('Only JSON inputs are supported')


def checked_source(raw: str) -> str:
    """Check syntax and remove common dangerous constructs before OS isolation.

    This filter is defense in depth. Bubblewrap is the security boundary.
    """
    source = raw.strip()
    fence = re.fullmatch(r'```(?:python)?\s*\n(.*?)\n```', source, re.S)
    if fence:
        source = fence[1].strip()
    if not source or len(source) > 16000:
        raise ValueError('Generated source is empty or exceeds 16000 characters')
    tree = ast.parse(source)
    allowed_imports = {'math', 're', 'statistics', 'collections', 'datetime', 'hashlib', 'base64', 'json'}
    forbidden = {'eval', 'exec', 'compile', 'open', 'input', 'print', 'globals', 'locals', 'vars', 'getattr', 'setattr', 'delattr', 'breakpoint'}
    if not any(isinstance(node, ast.FunctionDef) and node.name == 'run' for node in tree.body):
        raise ValueError('Generated code must define run(data)')
    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.Import, ast.ImportFrom)):
            raise ValueError('Only functions and approved imports are allowed at module level')
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and (node.id in forbidden or node.id.startswith('__')):
            raise ValueError('Forbidden Python name: ' + node.id)
        if isinstance(node, ast.Attribute) and node.attr.startswith('_'):
            raise ValueError('Private attribute access is forbidden')
        if isinstance(node, ast.Import) and any(item.name not in allowed_imports for item in node.names):
            raise ValueError('Import is outside the generated-code allowlist')
        if isinstance(node, ast.ImportFrom) and (node.level or node.module not in allowed_imports or any(a.name.startswith('_') for a in node.names)):
            raise ValueError('Import is outside the generated-code allowlist')
        if isinstance(node, ast.FunctionDef) and node.decorator_list:
            raise ValueError('Function decorators are forbidden')
    return source + '\n'


class SelfExtensionPipeline:
    """Durable proposals are separate from the executable approved registry."""

    def __init__(self, registry: CapabilityRegistry, executor: SandboxExecutor, audit: AuditLog,
                 model: LocalModelClient | None, proposal_dir: Path) -> None:
        self.registry, self.executor, self.audit, self.model = registry, executor, audit, model
        self.proposal_dir = Path(proposal_dir)
        self.proposal_dir.mkdir(parents=True, exist_ok=True)

    def _event(self, name: str, data: dict, status: str, **details: object) -> None:
        """Write evidence for generation, test and administration phases."""
        self.audit.append({'action': 'self_extension', 'capability_name': name, 'input_hash': digest(data),
                           'risk_tier': 'high', 'sandbox_used': 'none', 'exit_status': None,
                           'execution_time_ms': 0, 'status': status, **details})

    def handle(self, capability_name: str, input_data: dict) -> dict:
        """Serialize proposals and respect pending/rejected decisions for this sample."""
        with (self.proposal_dir / 'generation.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            for path in self.proposal_dir.glob('*.json'):
                record = self.review(path.stem)
                proposal = record['proposal']
                if proposal['capability_name'] == capability_name and proposal['sample_input'] == input_data:
                    if record['status'] in ('pending_approval', 'rejected'):
                        return {'success': False, 'status': record['status'], 'proposal_id': proposal['id'],
                                'proposal_hash': record['proposal_hash'], 'reason': 'Existing review decision retained; no new generation was started'}
            return self._generate(capability_name, input_data)

    def _generate(self, capability_name: str, input_data: dict) -> dict:
        """Generate and test, then stop at an exact-version approval proposal."""
        if self.model is None:
            return {'success': False, 'status': 'generation_unavailable', 'reason': 'Configure a local model endpoint before enabling self-extension'}
        if not re.fullmatch(r'[a-z][a-z0-9_]{0,63}', capability_name):
            raise ValueError('Invalid capability name')
        if self.registry.lookup(capability_name):
            raise ValueError('Existing capabilities cannot enter self-extension')
        if not isinstance(input_data, dict) or len(json.dumps(input_data, allow_nan=False)) > 16000:
            raise ValueError('Generation requires a JSON object sample of at most 16000 characters')
        schema = input_schema(input_data)
        targets = ', '.join(f'data[{json.dumps(key)}]' for key in input_data) or 'data'
        messages = [{'role': 'system', 'content': GENERATOR_PROMPT}, {'role': 'user', 'content':
            f'Write Python code only. Define a function run(data) that performs {capability_name.replace("_", " ")} '
            f'on {targets} and returns the result. No explanation.'}]
        errors = []
        # Two bounded attempts; repairs use actual validation/test errors.
        for attempt in range(2):
            self._event(capability_name, input_data, 'generation_started', attempt=attempt + 1, model=self.model.model)
            try:
                response = self.model.complete(messages, max_tokens=512)
                raw = response.get('content') or ''
                source = checked_source(raw)
                program = source + '\nimport json, sys\nprint(json.dumps(run(json.load(sys.stdin)), allow_nan=False))\n'
                definition = CapabilityDefinition(capability_name, {'type': 'binary', 'path': '/usr/bin/python3',
                    'args': ['-I', '-c', program], 'output_format': 'json',
                    'output_schema': {'type': ['object', 'array', 'string', 'number', 'boolean', 'null']},
                    'generated': True, 'source_sha256': digest(source)}, schema, 'high', True, False, 10)
                with tempfile.TemporaryDirectory(prefix='veliky-candidate-') as folder:
                    config = Path(folder) / 'candidate.json'
                    config.write_text(json.dumps({'capabilities': [asdict(definition)]}))
                    trial_registry = CapabilityRegistry(config)
                    trial_executor = SandboxExecutor(trial_registry, [], Path(folder) / 'outputs')
                    trial = trial_executor.execute(definition, input_data)
                self._event(capability_name, input_data, 'sandbox_test', attempt=attempt + 1,
                            sandbox_used=trial.sandbox_used, exit_status=trial.exit_code,
                            execution_time_ms=trial.duration_ms, success=trial.success)
                if not trial.success:
                    raise ValueError('Sandbox test failed: ' + trial.stderr[:2000])
                observed = json.loads(trial.stdout)
                output_type = ('null' if observed is None else 'boolean' if isinstance(observed, bool) else
                               'object' if isinstance(observed, dict) else 'array' if isinstance(observed, list) else
                               'string' if isinstance(observed, str) else 'number')
                definition = replace(definition, implementation={**definition.implementation,
                                     'output_schema': {'type': output_type}})
                proposal = {'id': uuid.uuid4().hex, 'capability_name': capability_name, 'source': source,
                            'definition': asdict(definition), 'sample_input': input_data, 'observed_output': observed,
                            'test_result': asdict(trial), 'model': self.model.model,
                            'created_at': datetime.now(timezone.utc).isoformat(),
                            'expires_at': (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()}
                version = digest(proposal)
                record = {'proposal': proposal, 'proposal_hash': version, 'status': 'pending_approval'}
                self._write(self.proposal_dir / (proposal['id'] + '.json'), record)
                self._event(capability_name, input_data, 'pending_approval', proposal_id=proposal['id'], proposal_hash=version)
                return {'success': False, 'status': 'pending_approval', 'proposal_id': proposal['id'],
                        'proposal_hash': version, 'risk_tier': 'high', 'network_allowed': False,
                        'observed_output': observed, 'reason': 'Sandbox test passed. An administrator must review and approve this exact version before registration.'}
            except Exception as exc:
                error = str(exc)[:2000]
                errors.append(error)
                self._event(capability_name, input_data, 'generation_attempt_failed', attempt=attempt + 1, reason=error)
                messages.append({'role': 'user', 'content': 'Previous attempt failed: ' + error + '. Return corrected Python code defining run(data), without explanation.'})
        return {'success': False, 'status': 'generation_failed', 'errors': errors}

    @staticmethod
    def _write(path: Path, value: dict) -> None:
        """Atomically persist private proposal state."""
        with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as stream:
            temporary = Path(stream.name)
            try:
                json.dump(value, stream, indent=2, allow_nan=False)
                stream.flush()
                os.fsync(stream.fileno())
                os.replace(temporary, path)
            finally:
                temporary.unlink(missing_ok=True)

    def review(self, proposal_id: str) -> dict:
        """Return the complete source, input, output and permissions for human review."""
        if not re.fullmatch(r'[a-f0-9]{32}', proposal_id):
            raise ValueError('Invalid proposal ID')
        record = json.loads((self.proposal_dir / (proposal_id + '.json')).read_text())
        if digest(record['proposal']) != record['proposal_hash']:
            raise ValueError('Proposal integrity failure')
        return record

    def decide(self, proposal_id: str, expected_hash: str, approve: bool, actor: str) -> dict:
        """Admin-only decision. Never expose this function as an agent/MCP tool."""
        if not actor.strip():
            raise ValueError('Administrator identity is required')
        with (self.proposal_dir / 'decisions.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            record = self.review(proposal_id)
            proposal = record['proposal']
            if record['proposal_hash'] != expected_hash:
                raise ValueError('Approval hash does not match the reviewed proposal')
            if record['status'] != 'pending_approval':
                raise ValueError('Proposal has already been decided')
            if datetime.fromisoformat(proposal['expires_at']) <= datetime.now(timezone.utc):
                raise ValueError('Proposal has expired; generate and review a new version')
            self._event(proposal['capability_name'], proposal['sample_input'], 'approval_decision',
                        approved=approve, actor=actor, proposal_id=proposal_id, proposal_hash=expected_hash)
            if approve:
                self.registry.register(CapabilityDefinition(**proposal['definition']))
            record.update(status='approved' if approve else 'rejected', decided_by=actor,
                          decided_at=datetime.now(timezone.utc).isoformat())
            self._write(self.proposal_dir / (proposal_id + '.json'), record)
            return {'status': record['status'], 'capability_name': proposal['capability_name'], 'proposal_hash': expected_hash}

    def revoke(self, name: str, actor: str) -> dict:
        """Withdraw a generated capability grant, preserving audit history."""
        self._event(name, {}, 'revocation_requested', actor=actor)
        self.registry.revoke(name)
        return {'status': 'revoked', 'capability_name': name}
