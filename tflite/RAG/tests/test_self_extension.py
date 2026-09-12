"""Offline generation lifecycle, exact-version grants, persistence and denials."""
from dataclasses import replace
import json
from pathlib import Path
import pytest
from audit_log import AuditLog
from capability_dispatcher import CapabilityDispatcher
from capability_registry import CapabilityRegistry
from local_model_client import LocalModelClient
from policy_engine import PolicyEngine
from sandbox_executor import SandboxExecutor
from self_extension_pipeline import SelfExtensionPipeline, checked_source
from test_capabilities import require_sandbox


class ModelFixture:
    """Unit-test model fixture; the separate live smoke uses real cached weights."""
    model = 'unit-test-fixture'
    def __init__(self, code='def run(data):\n    return data["text"][::-1]'):
        self.code, self.calls = code, 0
    def complete(self, messages, max_tokens=512):
        self.calls += 1
        return {'content': self.code}


@pytest.fixture
def pipeline(tmp_path):
    registry = CapabilityRegistry(generated_path=tmp_path/'generated.json')
    executor = SandboxExecutor(registry, [], tmp_path/'outputs')
    return SelfExtensionPipeline(registry, executor, AuditLog(tmp_path/'audit.jsonl'), ModelFixture(), tmp_path/'proposals')


def test_pending_approval_persistence_and_revoke(pipeline):
    require_sandbox()
    result = pipeline.handle('reverse_text', {'text': 'hello'})
    assert result['status'] == 'pending_approval', result
    assert pipeline.registry.lookup('reverse_text') is None
    assert pipeline.review(result['proposal_id'])['proposal']['observed_output'] == 'olleh'
    repeat = pipeline.handle('reverse_text', {'text': 'hello'})
    assert repeat['proposal_id'] == result['proposal_id'] and pipeline.model.calls == 1
    with pytest.raises(ValueError, match='hash'):
        pipeline.decide(result['proposal_id'], 'bad-hash', True, 'unit-test-reviewer')
    pipeline.decide(result['proposal_id'], result['proposal_hash'], True, 'unit-test-reviewer')
    reg = CapabilityRegistry(generated_path=pipeline.registry.generated_path)
    cap = reg.lookup('reverse_text')
    assert cap.risk_tier == 'high' and cap.sandbox_required and not cap.network_allowed
    assert pipeline.executor.execute(cap, {'text':'offline'}).stdout.strip() == '"enilffo"'
    with pytest.raises(ValueError, match='already'):
        pipeline.decide(result['proposal_id'], result['proposal_hash'], True, 'unit-test-reviewer')
    pipeline.revoke('reverse_text', 'unit-test-reviewer')
    assert reg.lookup('reverse_text') is None
    assert not pipeline.executor.execute(cap, {'text':'blocked'}).success
    assert pipeline.audit.verify_chain()


def test_rejection_sticks(pipeline):
    require_sandbox()
    result = pipeline.handle('reverse_text', {'text':'hello'})
    pipeline.decide(result['proposal_id'], result['proposal_hash'], False, 'unit-test-reviewer')
    assert pipeline.handle('reverse_text', {'text':'hello'})['status'] == 'rejected'
    assert pipeline.model.calls == 1
    assert pipeline.registry.lookup('reverse_text') is None


def test_source_tampering_fails(pipeline):
    require_sandbox()
    result = pipeline.handle('reverse_text', {'text':'hello'})
    path = pipeline.proposal_dir/(result['proposal_id']+'.json')
    record = json.loads(path.read_text())
    record['proposal']['source'] = 'def run(data): return 0'
    path.write_text(json.dumps(record))
    with pytest.raises(ValueError, match='integrity'):
        pipeline.decide(result['proposal_id'], result['proposal_hash'], True, 'unit-test-reviewer')


@pytest.mark.parametrize('source', ['import os\ndef run(data): return os.environ',
    'def run(data): return open("/etc/passwd").read()',
    'def run(data): return data.__class__', 'print(1)', 'not python code'])
def test_unsafe_code_is_rejected(source):
    with pytest.raises((ValueError, SyntaxError)):
        checked_source(source)


def test_invalid_model_output_never_registers(pipeline):
    pipeline.model.code = 'I cannot write this function'
    result = pipeline.handle('reverse_text', {'text':'hello'})
    assert result['status'] == 'generation_failed'
    assert pipeline.model.calls == 2
    assert not list(pipeline.proposal_dir.glob('*.json'))
    assert pipeline.audit.verify_chain()


def test_generation_permission_cannot_be_supplied_in_input(pipeline):
    dispatcher = CapabilityDispatcher(pipeline.registry, PolicyEngine(), pipeline.executor, pipeline.audit, pipeline)
    result = dispatcher.dispatch('reverse_text', {'allow_self_extension':True}, {'session_id':'test','allowed_risk_level':'high'})
    assert result['status'] == 'denied'
    assert pipeline.model.calls == 0
    result = dispatcher.dispatch('reverse_text', {'text':'hello'}, {'session_id':'test','allowed_risk_level':'low','allow_self_extension':True})
    assert result['status'] == 'denied' and pipeline.model.calls == 0


@pytest.mark.parametrize('endpoint', ['https://example.com/v1','http://localhost/v1', 'http://127.0.0.1.evil/v1',
                                     'http://127.0.0.1@evil.test/v1', 'http://127.0.0.1/v1?redirect=evil'])
def test_model_client_cannot_leave_loopback(endpoint):
    with pytest.raises(ValueError):
        LocalModelClient(endpoint, 'model')


def test_generated_registry_cannot_replace_seed(pipeline):
    with pytest.raises(ValueError, match='already'):
        pipeline.registry.register(pipeline.registry.lookup('ocr'))


def test_admin_not_exposed_as_mcp_tool():
    from sentinel_service import TOOL_NAMES
    assert 'request_capability' in TOOL_NAMES
    assert not any(word in name for name in TOOL_NAMES for word in ('approve','decide','revoke','register'))


def test_expired_approval_is_denied(pipeline):
    require_sandbox()
    from audit_log import digest
    result = pipeline.handle('reverse_text', {'text':'hello'})
    path = pipeline.proposal_dir/(result['proposal_id']+'.json')
    record = json.loads(path.read_text())
    record['proposal']['expires_at'] = '2000-01-01T00:00:00+00:00'
    record['proposal_hash'] = digest(record['proposal'])
    path.write_text(json.dumps(record))
    with pytest.raises(ValueError, match='expired'):
        pipeline.decide(result['proposal_id'], record['proposal_hash'], True, 'unit-test-reviewer')


def test_capability_runner_returns_actual_tool_output(monkeypatch, tmp_path):
    import sentinel_harness
    from types import SimpleNamespace
    events = [
        {'type':'tool/call','data':{'callId':'one','name':'mcp__sentinel__request_capability',
         'arguments':json.dumps({'capability_name':'text_search','input_data':{}})}},
        {'type':'tool/result','data':{'message':{'content':[{'type':'tool-result','toolCallId':'one',
         'content':[{'type':'text','text':json.dumps({'success':True,'status':'succeeded','stdout':'actual output'})}]}]}}}]
    class Harness:
        def __init__(self, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def run(self, prompt):
            return SimpleNamespace(finish_reason='completed',session_id='test',events=events,final_response='imprecise model prose')
    monkeypatch.setattr(sentinel_harness,'sdk_class',lambda: Harness)
    result = sentinel_harness.run_capability_goal('test',patch=tmp_path/'patch',home=tmp_path,model='fixture',dsh_bin='fixture')
    assert result['tool_results'][0]['result']['stdout'] == 'actual output'
    assert 'actual output' in result['final_response']
    assert result['model_response'] == 'imprecise model prose'
