"""Capability contracts, fail-closed boundaries and real offline utility checks."""
from dataclasses import replace
import json
from pathlib import Path
import subprocess

import pytest
import yaml

from audit_log import AuditLog
from capability_dispatcher import CapabilityDispatcher
from capability_registry import CapabilityRegistry
from policy_engine import PolicyEngine
from sandbox_executor import SandboxExecutor


@pytest.fixture
def registry():
    return CapabilityRegistry()


@pytest.fixture
def dispatcher(tmp_path, registry):
    return CapabilityDispatcher(registry, PolicyEngine(), SandboxExecutor(registry, [tmp_path], tmp_path / 'outputs'), AuditLog(tmp_path / 'audit.jsonl'))


def context(**values):
    return {'session_id': 'test', 'allowed_risk_level': 'high', **values}


def require_sandbox():
    """Skip only when the host cannot supply a real namespace sandbox."""
    if not Path('/usr/bin/bwrap').exists():
        pytest.skip('Bubblewrap is not installed')
    result = subprocess.run(['/usr/bin/bwrap', '--unshare-all', '--ro-bind', '/usr', '/usr', '--ro-bind', '/lib', '/lib', '--ro-bind', '/lib64', '/lib64', '/usr/bin/true'], capture_output=True)
    if result.returncode:
        pytest.skip('Host denies namespace isolation: ' + result.stderr.decode())


def sample_pdf(path):
    """Write a minimal valid PDF with selectable text, no external fixture dependency."""
    stream = b'BT /F1 18 Tf 40 100 Td (VELIKY capability test) Tj ET'
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>', b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream']
    pdf = b'%PDF-1.4\n'
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += f'{i} 0 obj\n'.encode()+obj+b'\nendobj\n'
    xref = len(pdf)
    pdf += b'xref\n0 6\n0000000000 65535 f \n'
    pdf += b''.join(f'{offset:010} 00000 n \n'.encode() for offset in offsets[1:])
    pdf += f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()
    path.write_bytes(pdf)


def test_registry(registry, tmp_path):
    assert len(registry.list_capabilities()) == 7
    assert registry.lookup('missing') is None
    cap = registry.lookup('ocr')
    cap.implementation['module'] = 'bad:call'
    assert registry.lookup('ocr').implementation['module'] != 'bad:call'
    raw = yaml.safe_load(Path(__file__).parents[1].joinpath('capabilities.yaml').read_text())
    path = tmp_path / 'config.json'
    path.write_text(json.dumps(raw))
    assert CapabilityRegistry(path).list_capabilities() == registry.list_capabilities()
    raw['capabilities'].append(raw['capabilities'][0])
    path.write_text(json.dumps(raw))
    with pytest.raises(ValueError, match='duplicate'):
        CapabilityRegistry(path)


@pytest.mark.parametrize('changes,allowed', [({}, True), ({'allowed_risk_level':'invalid'}, False), ({'session_id':''},False), ({'allowed_capabilities':[]},False)])
def test_policy(registry, changes, allowed):
    decision = PolicyEngine().check(registry.lookup('ocr'), context(**changes))
    assert decision.allowed is allowed
    assert decision.reason


def test_risk_network_rate(registry):
    policy = PolicyEngine(max_calls=1)
    cap = registry.lookup('python_exec')
    assert not policy.check(cap, context(allowed_risk_level='low')).allowed
    assert not policy.check(replace(cap, network_allowed=True), context()).allowed
    assert policy.check(cap, context()).allowed
    assert not policy.check(cap, context()).allowed
    assert policy.check(cap, context(session_id='other')).allowed


def test_missing_invalid_and_denied_are_audited(dispatcher):
    missing = dispatcher.dispatch('unknown', {}, context())
    assert missing['next_action'] == 'escalate_to_tool_generation'
    invalid = dispatcher.dispatch('ocr', {'path':'x', 'command':'sh'}, context())
    assert invalid['status'] == 'invalid_input'
    denied = dispatcher.dispatch('python_exec', {'script':'print(1)'}, context(allowed_risk_level='low'))
    assert denied['status'] == 'denied'
    rows = [json.loads(line) for line in dispatcher.audit.path.read_text().splitlines()]
    assert len(rows) == 3
    assert all({'timestamp','capability_name','input_hash','risk_tier','sandbox_used','exit_status','execution_time_ms'} <= row.keys() for row in rows)
    assert dispatcher.audit.verify_chain()


def test_executor_rejects_override_and_metacharacters(dispatcher, registry):
    cap = registry.lookup('text_search')
    forged = replace(cap, implementation={'type':'binary','path':'/bin/sh','args':['-c','touch /tmp/pwned']})
    assert not dispatcher.executor.execute(forged, {'path':'x','pattern':'x'}).success
    result = dispatcher.executor.execute(cap, {'path':'x; touch /tmp/pwned','pattern':'x'})
    assert not result.success and 'metacharacters' in result.stderr
    assert not dispatcher.executor.execute(cap, {'path':'x','pattern':'x','path_override':'/bin/sh'}).success


def test_audit_tamper(dispatcher):
    dispatcher.dispatch('unknown', {}, context())
    dispatcher.dispatch('unknown', {}, context())
    path = dispatcher.audit.path
    path.write_text(path.read_text().replace('unknown','changed',1))
    assert not dispatcher.audit.verify_chain()
    with pytest.raises(ValueError, match='integrity'):
        dispatcher.audit.append({'action':'test'})


def test_pdf_real(dispatcher, tmp_path):
    require_sandbox()
    path = tmp_path / 'sample.pdf'
    sample_pdf(path)
    result = dispatcher.dispatch('pdf_text_extraction', {'path':str(path)}, context())
    assert result['success'], result
    assert 'VELIKY capability test' in result['stdout']
    assert dispatcher.audit.verify_chain()
    assert json.loads(dispatcher.audit.path.read_text())['exit_status'] == 0


@pytest.mark.parametrize('script,expected', [
    ("print('isolated')", 'isolated'),
    ("import os; print(os.path.exists('/etc/passwd'))", 'False'),
    ("import socket; s=socket.socket();\ntry: s.connect(('1.1.1.1',443))\nexcept OSError: print('network blocked')", 'network blocked'),
])
def test_python_isolation(dispatcher, script, expected):
    require_sandbox()
    result = dispatcher.dispatch('python_exec', {'script':script}, context())
    assert result['success'], result
    assert expected in result['stdout']


def test_csv_and_archive(dispatcher, tmp_path):
    require_sandbox()
    path = tmp_path / 'data.csv'
    path.write_text('a,b\n1,2\n3,4\n')
    result = dispatcher.dispatch('csv_analysis', {'path':str(path),'operation':'summary'}, context())
    assert result['success'], result
    assert result['output'] == {'rows':2, 'columns':['a','b']}
    result = dispatcher.dispatch('compression', {'paths':[str(path)]}, context())
    assert result['success'], result
    assert Path(result['output_path']).is_file()


def test_timeout(tmp_path, registry):
    require_sandbox()
    raw = yaml.safe_load(Path(__file__).parents[1].joinpath('capabilities.yaml').read_text())
    for cap in raw['capabilities']:
        if cap['name'] == 'python_exec':
            cap['timeout_seconds'] = 0.5
    config = tmp_path / 'short.yaml'
    config.write_text(yaml.safe_dump(raw))
    reg = CapabilityRegistry(config)
    result = SandboxExecutor(reg, [tmp_path], tmp_path/'out').execute(reg.lookup('python_exec'), {'script':'import time; time.sleep(10)'})
    assert not result.success
    assert 'timed out' in result.stderr
    assert result.duration_ms < 3000


def test_paths_and_empty_output(dispatcher, tmp_path):
    require_sandbox()
    outside = dispatcher.dispatch('text_search', {'path':'/etc/passwd','pattern':'root'}, context())
    assert not outside['success']
    path = tmp_path/'empty.pdf'
    path.write_text('invalid pdf')
    assert not dispatcher.dispatch('pdf_text_extraction', {'path':str(path)}, context())['success']
    link = tmp_path/'link'
    link.symlink_to(path)
    assert not dispatcher.dispatch('text_search', {'path':str(link),'pattern':'x'}, context())['success']


def test_unavailable_sandbox_fails_closed(dispatcher, monkeypatch):
    original = Path.is_file
    monkeypatch.setattr(Path, 'is_file', lambda self: False if str(self) == '/usr/bin/bwrap' else original(self))
    result = dispatcher.dispatch('python_exec', {'script':'print(1)'}, context())
    assert not result['success']
    assert 'Sandbox unavailable' in result['stderr']


def test_only_missing_calls_extension(dispatcher, tmp_path):
    class Extension:
        def __init__(self):
            self.calls = []
        def handle(self, name, data):
            self.calls.append(name)
            return {'success': False, 'status':'no_capability_found'}
    extension = Extension()
    dispatcher.self_extension_pipeline = extension
    dispatcher.dispatch('missing', {}, context(allow_self_extension=True))
    dispatcher.dispatch('ocr', {}, context())
    dispatcher.dispatch('python_exec', {'script':'print(1)'}, context(allowed_risk_level='low'))
    assert extension.calls == ['missing']


def test_image_ocr_and_search(dispatcher, tmp_path):
    require_sandbox()
    pdf = tmp_path/'ocr.pdf'
    sample_pdf(pdf)
    result = dispatcher.dispatch('ocr', {'path':str(pdf)}, context())
    assert result['success'], result
    assert 'VELIKY' in result['output']['text']
    image = tmp_path/'image.ppm'
    image.write_bytes(b'P6\n2 2\n255\n' + b'\xff\x00\x00' * 4)
    result = dispatcher.dispatch('image_processing', {'path':str(image), 'operation':'-resize', 'value':'4x4'}, context())
    assert result['success'], result
    assert Path(result['output_path']).read_bytes().startswith(b'\x89PNG')
    source = tmp_path/'sample.txt'
    source.write_text('hello veliky\n')
    found = dispatcher.dispatch('text_search', {'path':str(source),'pattern':'veliky'}, context())
    assert found['success'] and 'hello veliky' in found['stdout']
    empty = dispatcher.dispatch('text_search', {'path':str(source),'pattern':'absent'}, context())
    assert empty['success'] and empty['exit_code'] == 1 and not empty['stdout']


def test_service_context_and_shared_audit(tmp_path):
    from veliky_service import BridgeConfig, VelikyService
    service = VelikyService(BridgeConfig(data_dir=tmp_path/'data', state_dir=tmp_path/'state'))
    service.audit('test', 'started', {})
    result = service.request_capability('python_exec', {'script':'print(1)'})
    assert result['status'] == 'denied'
    assert AuditLog(service.cfg.state_dir/'audit.jsonl').verify_chain()


def test_output_verification_failure(dispatcher, monkeypatch):
    from sandbox_executor import ExecutionResult
    monkeypatch.setattr(dispatcher.executor, 'execute', lambda *args: ExecutionResult(True, stdout='{}', exit_code=0))
    result = dispatcher.dispatch('ocr', {'path':'sample.pdf'}, context())
    assert result['status'] == 'verification_failed'
    assert not result['success']
    monkeypatch.setattr(dispatcher.executor, 'execute', lambda *args: ExecutionResult(True, exit_code=0))
    result = dispatcher.dispatch('pdf_text_extraction', {'path':'sample.pdf'}, context())
    assert result['status'] == 'verification_failed'
