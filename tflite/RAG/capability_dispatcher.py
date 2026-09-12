"""Agent-facing lookup, validation, policy, execution, verification and evidence."""
from __future__ import annotations
from dataclasses import asdict
import json
import time
from jsonschema import Draft202012Validator
from audit_log import AuditLog, digest
from capability_registry import CapabilityRegistry
from policy_engine import PolicyEngine
from sandbox_executor import SandboxExecutor


from self_extension_pipeline import SelfExtensionPipeline

class CapabilityDispatcher:
    """One entrypoint for every capability attempt, including rejected attempts."""

    def __init__(self, registry: CapabilityRegistry, policy: PolicyEngine, executor: SandboxExecutor,
                 audit: AuditLog, self_extension_pipeline: SelfExtensionPipeline | None = None):
        self.registry, self.policy, self.executor, self.audit = registry, policy, executor, audit
        self.self_extension_pipeline = self_extension_pipeline

    def dispatch(self, capability_name: str, input_data: dict, requester_context: dict) -> dict:
        """Dispatch with trusted host identity; never escalate validation or policy failures."""
        start = time.monotonic()
        cap = self.registry.lookup(capability_name)
        result = {'success': False, 'status': 'invalid_input'}
        input_hash = digest({'invalid_input_type': type(input_data).__name__})
        try:
            input_hash = digest(input_data)
            if cap is None:
                if self.self_extension_pipeline is None:
                    result = {'success': False, 'status': 'no_capability_found', 'next_action': 'escalate_to_tool_generation'}
                else:
                    from capability_registry import CapabilityDefinition
                    generation = CapabilityDefinition(capability_name, {}, {}, 'high')
                    decision = self.policy.check(generation, requester_context)
                    if requester_context.get('allow_self_extension') is not True or not decision.allowed:
                        result = {'success': False, 'status': 'denied', 'reason': 'Self-extension requires a trusted generation grant and high-risk permission: ' + decision.reason}
                    else:
                        result = {'success': False, 'status': 'generation_failed'}
                        result = self.self_extension_pipeline.handle(capability_name, input_data)
            else:
                Draft202012Validator(cap.input_schema).validate(input_data)
                decision = self.policy.check(cap, requester_context)
                if not decision.allowed:
                    result = {'success': False, 'status': 'denied', 'reason': decision.reason}
                else:
                    result = asdict(self.executor.execute(cap, input_data))
                    result['status'] = 'succeeded' if result['success'] else 'execution_failed'
                    if result['success']:
                        impl = cap.implementation
                        if impl.get('output_format') == 'json':
                            result['output'] = json.loads(result['stdout'])
                            Draft202012Validator(impl['output_schema']).validate(result['output'])
                        elif impl.get('nonempty_output', True) and not (result['stdout'].strip() or result.get('output_path')):
                            raise ValueError('Verification failed: empty output')
        except Exception as exc:
            result.update(success=False, status='verification_failed' if result.get('status') == 'succeeded' else result.get('status', 'failed'), reason=str(exc))
        self.audit.append({'action': 'capability', 'capability_name': capability_name, 'input_hash': input_hash,
                           'risk_tier': cap.risk_tier if cap else 'unknown', 'sandbox_used': result.get('sandbox_used', 'none'),
                           'exit_status': result.get('exit_code'), 'status': result['status'],
                           'execution_time_ms': round((time.monotonic() - start) * 1000, 3),
                           'session_id': requester_context.get('session_id')})
        return result
