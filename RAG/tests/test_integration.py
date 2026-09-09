import asyncio
import copy
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from sentinel_service import BridgeConfig, SentinelService, RAG_DIR, digest
from sentinel_security import calculate, can_read
from sentinel_harness import configure, local_url, run_goal
from sentinel_watcher import detect_anomalies, dispatch


@pytest.fixture
def service(tmp_path):
    vault = tmp_path / 'vault'
    shutil.copytree(RAG_DIR / 'sentinel_vault', vault)
    data = tmp_path / 'data'
    shutil.copytree(RAG_DIR / 'data', data)
    return SentinelService(BridgeConfig(vault_dir=vault, data_dir=data, index_dir=tmp_path/'index',
                                       state_dir=tmp_path/'state', retrieval='vault'))


def make_report(service):
    item = service.read_vault_note('Inspection-Report-62')
    quote = 'Baseline measurement was 2.8 mm/s RMS; current measurement is 5.4 mm/s RMS.'
    return {'executive_summary': 'Inspection reports elevated vibration.',
            'evidence': [{'evidence_id': item['evidence_id'], 'quote': quote}],
            'calculations': [{'formula': '(current - baseline) / baseline * 100',
                             'operands': {'current': 5.4, 'baseline': 2.8}, 'claimed_result': 92.857142857,
                             'operand_evidence': {key: {'evidence_id': item['evidence_id'], 'quote': quote} for key in ('current','baseline')}}],
            'actionable_recommendations': ['Plan a controlled shutdown with human approval.']}


@pytest.mark.parametrize('formula', ['().__class__.__bases__', '__import__("os")', '2**999999', '1/0', '(x for x in range(3))', 'open("file")', '1e309', 'pow(2,1000000)'])
def test_calculator_rejects_code_and_unbounded_arithmetic(formula):
    with pytest.raises((ValueError, TypeError, SyntaxError, ArithmeticError)):
        calculate(formula, {})


def test_calculator_obeys_formula_not_operand_names():
    assert calculate('current-baseline', {'current': 5.4, 'baseline': 2.8}) == pytest.approx(2.6)
    assert calculate('round((current-baseline)/baseline*100, 2)', {'current': 5.4, 'baseline': 2.8}) == 92.86
    import rag
    assert rag.SandboxedCalculationEngine.verify_calculation({'formula':'current-baseline','operands':{'current':5.4,'baseline':2.8},'claimed_result':92.86})['computed_result'] == pytest.approx(2.6)


def test_access_graph_and_traversal(service):
    hidden = service.cfg.vault_dir/'Equipment/Secret.md'
    hidden.write_text('---\nclearance_level: restricted\n---\n[[Pump-P204]]\nSecret')
    assert 'Equipment/Secret' not in service.get_vault_backlinks('P-204')['backlinks']
    assert 'Equipment/Secret' not in service.traverse_graph('P-204')['nodes']
    for title in ('Secret', '../../etc/passwd'):
        with pytest.raises(ValueError):
            service.read_vault_note(title)
    assert service.get_vault_backlinks('Compressor-C104')['backlinks']
    assert not can_read('analyst', 'unknown')
    assert not can_read('unknown', 'internal')
    assert not can_read('analyst', 'confidential')


def test_verification_checks_exact_source_and_operands(service):
    report = make_report(service)
    result = service.verify_evidence(report)
    assert result['status'] == 'VERIFIED'
    assert result['report']['verification']['policy_tier'] == 'REQUIRES_APPROVAL'
    report['evidence'][0]['quote'] = 'Baseline was 4.2'
    assert service.verify_evidence(report)['status'] == 'FAILED'
    report = make_report(service)
    report['calculations'][0]['operands']['baseline'] = 4.2
    report['calculations'][0]['claimed_result'] = (5.4-4.2)/4.2*100
    assert service.verify_evidence(report)['status'] == 'FAILED'
    report = make_report(service)
    report['calculations'][0]['formula'] = 'current-baseline'
    assert service.verify_evidence(report)['status'] == 'FAILED'


def test_evidence_survives_restart_but_rechecks_source(service):
    evidence = service.read_vault_note('Pump-P204')
    restarted = SentinelService(service.cfg)
    assert restarted.read_document(evidence['evidence_id']) == evidence
    Path(evidence['source']).write_text('---\nclearance_level: restricted\n---\nchanged')
    with pytest.raises(ValueError):
        restarted.read_document(evidence['evidence_id'])


def test_sensor_history_and_threshold_dispatch(service):
    readings = service.query_sensor_history('P-204')['readings']
    alerts = detect_anomalies(readings, 4.5)
    assert len(alerts) == 1
    assert alerts[0]['current'] == 5.4
    assert alerts[0]['change_percent'] == pytest.approx(42.105263)
    calls = []
    def launch(prompt, session_id):
        calls.append((prompt,session_id))
        return {'report': 'done'}
    assert dispatch(service, alerts[0], launch)['status'] == 'completed'
    assert dispatch(service, alerts[0], launch)['status'] == 'deduplicated'
    assert len(calls) == 1
    assert 'AUTONOMOUS SENSOR ALERT' in calls[0][0]


def test_failed_alert_is_visible_and_retry_is_explicit(service):
    alert = detect_anomalies(service.query_sensor_history('P-204')['readings'], 4.5)[0]
    def fail(*args, **kwargs):
        raise TimeoutError('model timed out')
    with pytest.raises(TimeoutError):
        dispatch(service, alert, fail)
    assert dispatch(service, alert, fail)['previous_status'] == 'failed'
    assert dispatch(service, alert, lambda *a, **k: {}, retry_failed=True)['status'] == 'completed'


def test_note_writes_require_trusted_role_and_compare_version(service):
    with pytest.raises(PermissionError):
        service.write_vault_note('test','content','')
    cfg = copy.copy(service.cfg)
    cfg.role, cfg.allow_writes = 'engineer', True
    editor = SentinelService(cfg)
    result = editor.write_vault_note('case','first','')
    with pytest.raises(ValueError):
        editor.write_vault_note('case','second','')
    assert editor.read_vault_note('case')['sha256'] == result['sha256']
    editor.write_vault_note('case','second',result['sha256'])
    assert 'second' in editor.read_vault_note('case')['chunk']
    with pytest.raises(ValueError):
        editor.write_vault_note('../Pump-P204', 'bad', '')


def test_audit_chain_and_errors(service):
    service.invoke('read_vault_note',note_title='Pump-P204')
    with pytest.raises(ValueError):
        service.invoke('read_vault_note',note_title='missing')
    previous = '0'*64
    for line in (service.cfg.state_dir/'audit.jsonl').read_text().splitlines():
        entry = json.loads(line)
        current = entry.pop('hash')
        assert entry['previous_hash'] == previous
        assert digest(entry) == current
        previous = current
    assert entry['status'] == 'failed'


@pytest.mark.parametrize('endpoint', ['https://api.deepseek.com/v1','http://8.8.8.8/v1','http://169.254.169.254','http://0.0.0.0','http://user:pass@localhost'])
def test_configuration_rejects_remote_inference(endpoint):
    with pytest.raises(ValueError):
        local_url(endpoint)


def test_generated_patch_matches_actual_harness_rows(tmp_path):
    import yaml
    path = configure(tmp_path/'patch.yml','http://127.0.0.1:11434/v1','local-model')
    rows = yaml.safe_load(path.read_text())
    assert next(r for r in rows if r.get('id') == 'llm-deepseek')['disabled']
    assert next(r for r in rows if r.get('id') == 'session-telemetry-otel')['disabled']
    assert len(next(r for r in rows if 'insert' in r)['insert']) == 2


def test_real_mcp_stdio_discovery_retrieval_errors_and_verification(service):
    async def scenario():
        env = {**os.environ, 'VAULT_DIR':str(service.cfg.vault_dir), 'SENTINEL_DATA_DIR':str(service.cfg.data_dir),
               'SENTINEL_STATE_DIR':str(service.cfg.state_dir),'SENTINEL_RETRIEVAL':'vault','SENTINEL_ROLE':'analyst'}
        params = StdioServerParameters(command=sys.executable,args=[str(RAG_DIR/'sentinel_mcp_server.py')],env=env)
        async with stdio_client(params) as (reader,writer):
            async with ClientSession(reader,writer) as session:
                await session.initialize()
                listing = await session.list_tools()
                assert len(listing.tools) == 10
                result = await session.call_tool('search_documents', {'query':'P-204 vibration'})
                assert not result.isError
                assert result.structuredContent['results']
                error = await session.call_tool('calculate_metric', {'formula':'__import__("os")','operands':{}})
                assert error.isError
                verification = await session.call_tool('verify_evidence', {'report':make_report(service)})
                assert not verification.isError
                assert verification.structuredContent['status'] == 'VERIFIED'
                denied = await session.call_tool('write_vault_note', {'note_title':'x','content':'x','expected_sha256':''})
                assert denied.isError
    asyncio.run(scenario())


def test_sdk_runner_rechecks_final_output_and_logs_failure(service,tmp_path):
    verified = service.verify_evidence(make_report(service))['report']
    class Harness:
        output = verified
        def __init__(self, **kwargs):
            assert kwargs['provider'] == 'sentinel-local'
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def run(self,prompt,session_id):
            return SimpleNamespace(finish_reason='completed',final_response=json.dumps(self.output))
    kwargs = dict(patch=tmp_path/'p',home=tmp_path/'h',model='local',service=service,harness_factory=Harness)
    result = run_goal('investigate',**kwargs)
    assert Path(result['report_path']).exists()
    Harness.output = {**verified, 'verification': {'status':'VERIFIED'}}
    with pytest.raises(RuntimeError):
        run_goal('investigate',**kwargs)


def test_visual_retrieval_enforces_clearance_and_surfaces_failure(monkeypatch):
    import rag
    class Vector:
        def tolist(self): return [[0.1, 0.2]]
    class Model:
        def encode(self,*a,**k): return Vector()
    class Client:
        def search(self,collection_name,**kwargs):
            if collection_name == 'dense': return [[]]
            return [[{'id':1,'distance':0.9,'entity':{'chunk':'secret','clearance_level':'restricted'}},
                     {'id':2,'distance':0.8,'entity':{'chunk':'allowed','clearance_level':'internal'}}]]
    monkeypatch.setattr(rag,'load_visual_embedding_model',lambda:Model())
    index = rag.MilvusIndex(Client(),'dense','visual')
    result = rag.retrieve('pump',Model(),index,None,[],rag.SENTINELConfig(user_role='analyst'))
    assert [item['chunk'] for item in result] == ['allowed']
    def fail(*a,**k): raise RuntimeError('offline')
    monkeypatch.setattr(index.client,'search',fail)
    errors = []
    assert rag.retrieve('pump',Model(),index,None,[],rag.SENTINELConfig(),diagnostics=errors) == []
    assert errors == ['Dense retrieval failed','Visual retrieval failed']


def test_missing_hybrid_dependencies_are_explicitly_degraded(service, monkeypatch):
    import rag
    def missing(*args): raise rag.VectorStoreError("missing index")
    monkeypatch.setattr(rag, "load_data", missing)
    service.cfg.retrieval = 'hybrid'
    result = service.search_documents('Pump P-204')
    assert result['mode'] == 'vault-keyword'
    assert 'unavailable' in result['warning']
    assert result['results']


def test_simulator_trips_only_after_drift(service):
    from sentinel_simulator import readings, publish
    path = service.cfg.data_dir/'simulated_sensor_history.csv'
    # Isolate the synthetic historian from the supplied historical CSV.
    service.cfg.data_dir = service.cfg.state_dir/'demo-data'
    path = service.cfg.data_dir/path.name
    rows = []
    for step in range(5):
        rows.extend(readings(step,f'2026-09-09T00:00:{step:02d}Z'))
    publish(path,rows)
    assert detect_anomalies(service.query_sensor_history('P-204')['readings'],4.5) == []
    for step in range(5,15):
        rows.extend(readings(step,f'2026-09-09T00:00:{step:02d}Z'))
    publish(path,rows)
    assert detect_anomalies(service.query_sensor_history('P-204')['readings'],4.5)[0]['current'] == 5.8
    assert detect_anomalies(service.query_sensor_history('C-104')['readings'],4.5) == []
