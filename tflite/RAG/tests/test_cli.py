"""CLI regressions: no model downloads or running services required."""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[3]
TFLITE = ROOT / 'tflite'
sys.path.insert(0, str(TFLITE))
import veliky_cli
import reinery_cli


@pytest.fixture
def cli(monkeypatch, tmp_path):
    monkeypatch.setattr(veliky_cli, 'VelikyService', None)
    monkeypatch.setattr(veliky_cli, '_service_import_error', 'test', raising=False)
    monkeypatch.chdir(tmp_path)
    return veliky_cli.VelikyCLI(endpoint='http://127.0.0.1:8000/v1', thinking=False)


def test_prompt_uses_history_and_model_selection(cli, monkeypatch):
    calls = []
    def complete(client, messages):
        calls.append((client.model, messages))
        return {'content': 'Actual model response'}
    from local_model_client import LocalModelClient
    monkeypatch.setattr(LocalModelClient, 'complete', complete)
    cli.process_prompt('hello')
    cli.model = 'changed-model'
    cli.process_prompt('continue')
    assert calls[1][0] == 'changed-model'
    assert calls[1][1][1:3] == [{'role': 'user', 'content': 'hello'}, {'role': 'assistant', 'content': 'Actual model response'}]
    cli.history.clear()
    cli.process_prompt('fresh')
    assert len(calls[2][1]) == 2


def test_inference_failure_is_not_a_successful_turn(cli, monkeypatch):
    from local_model_client import LocalModelClient
    def fail(*args):
        raise RuntimeError('inference offline')
    monkeypatch.setattr(LocalModelClient, 'complete', fail)
    with pytest.raises(RuntimeError, match='offline'):
        cli.process_prompt('hello')
    assert cli.history == []


def test_discussing_file_does_not_overwrite_it(cli, tmp_path):
    target = tmp_path / 'example.py'
    target.write_text('original')
    cli._execute_agent_tools('explain example.py', 'Example:\n```python\nprint("changed")\n```')
    assert target.read_text() == 'original'


def test_search_arguments_are_not_shell_code(cli, monkeypatch):
    calls = []
    monkeypatch.setattr(subprocess, 'run', lambda args, **kwargs: calls.append((args, kwargs)) or SimpleNamespace(stdout='', stderr='', returncode=1))
    cli._execute_agent_tools('search', '<grep_search query="$(touch injected)" path="."/>')
    assert calls[0][0][:6] == ['rg', '-n', '-i', '-F', '--', '$(touch injected)']
    assert not calls[0][1].get('shell')


def test_context_scan_prunes_dependencies(tmp_path):
    (tmp_path / 'node_modules').mkdir()
    (tmp_path / 'node_modules' / 'hidden.md').write_text('ignored')
    (tmp_path / 'visible.md').write_text('context')
    assert list(veliky_cli.workspace_files(tmp_path, '*.md')) == [tmp_path / 'visible.md']


@pytest.mark.parametrize('args', [
    ['--model', 'selected', 'agent'], ['agent', '--model', 'selected'],
    ['serve', '--model', 'selected'], ['rag', 'notes', '--model', 'selected'],
])
def test_legacy_common_options(args, monkeypatch):
    seen = []
    for name in ('cmd_agent', 'cmd_serve', 'cmd_rag'):
        monkeypatch.setattr(reinery_cli, name, lambda args: seen.append(args) or 7)
    monkeypatch.setattr(sys, 'argv', ['reinery', *args])
    assert reinery_cli.main() == 7
    assert seen[0].model == 'selected'


@pytest.mark.parametrize('entry', [TFLITE / 'veliky_cli.py', ROOT / 'Veliky-Web/bin/veliky_cli.py'])
def test_piped_session_never_loads_model(entry, tmp_path):
    env = {**os.environ, 'VELIKY_STATE_DIR': str(tmp_path), 'HF_HUB_OFFLINE': '1', 'TRANSFORMERS_OFFLINE': '1'}
    result = subprocess.run([sys.executable, str(entry), '--model', 'nonexistent-model'], input='/help\n/clear\n/exit\n', text=True, capture_output=True, timeout=15, env=env)
    assert result.returncode == 0, result.stderr
    assert 'Available Commands' in result.stdout
    assert 'Goodbye' in result.stdout
    assert 'not a terminal' not in result.stderr


def test_node_forwards_child_failure(tmp_path):
    result = subprocess.run(['node', str(ROOT / 'Veliky-Web/bin/veliky.js'), 'start', '--agent', 'invalid'], env={**os.environ, 'VELIKY_PYTHON': sys.executable}, text=True, capture_output=True, timeout=15)
    assert result.returncode == 2
    assert 'invalid choice' in result.stderr


def test_node_forwards_serve_arguments():
    result = subprocess.run(['node', str(ROOT / 'Veliky-Web/bin/veliky.js'), 'serve', '--help'], env={**os.environ, 'VELIKY_PYTHON': sys.executable}, text=True, capture_output=True, timeout=15)
    assert result.returncode == 0
    assert '--device' in result.stdout


def test_model_server_rejects_missing_weights(monkeypatch):
    pytest.importorskip('torch')
    server = pytest.importorskip('veliky_llm_server')
    monkeypatch.setenv('HF_HUB_OFFLINE', '1')
    def missing(*args, **kwargs):
        raise OSError('weights unavailable')
    monkeypatch.setattr(server.AutoTokenizer, 'from_pretrained', missing)
    with pytest.raises(RuntimeError, match='Download the model weights'):
        server.ModelEngine('missing-model')


def test_endpoint_roundtrip(cli):
    """Exercise actual HTTP serialization against a controlled local endpoint."""
    import json
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer
    requests = []
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            requests.append((self.path, json.loads(self.rfile.read(int(self.headers['Content-Length'])))))
            body = json.dumps({'choices': [{'message': {'role': 'assistant', 'content': 'Test endpoint reply'}}]}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def log_message(self, *args):
            pass
    with HTTPServer(('127.0.0.1', 0), Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            cli.endpoint = f'http://127.0.0.1:{server.server_port}/v1'
            assert cli.process_prompt('hello') == 'Test endpoint reply'
            assert requests[0][0] == '/v1/chat/completions'
            assert requests[0][1]['messages'][-1]['content'] == 'hello'
        finally:
            server.shutdown()
            thread.join(timeout=5)
