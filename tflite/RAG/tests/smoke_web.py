#!/usr/bin/env python3
"""Boot the real web profile with the SENTINEL overlay and request its built UI."""
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import build_opener, ProxyHandler, HTTPCookieProcessor

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sentinel_harness import ROOT, configure


def main():
    with tempfile.TemporaryDirectory(prefix='sentinel-web-') as folder:
        temp = Path(folder)
        os.environ['SENTINEL_STATE_DIR'] = str(temp/'state')
        patch = configure(temp/'patch.yml','http://127.0.0.1:11434/v1','qwen2.5:7b',retrieval='vault')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0))
            port = sock.getsockname()[1]
        with (temp/'web.log').open('w+') as log:
            proc = subprocess.Popen([str(ROOT/'RAG/harness/dsh-source'),'--profile','web','--patch',str(patch),
                                     '--no-open','--host','127.0.0.1','--port',str(port)],
                env={**os.environ,'DSH_HOME':str(temp/'home'),'DSH_TELEMETRY_DISABLED':'1','SENTINEL_LOCAL_API_KEY':'local-no-auth'},
                stdout=log,stderr=subprocess.STDOUT)
            try:
                opener = build_opener(ProxyHandler({}), HTTPCookieProcessor())
                for _ in range(120):
                    if proc.poll() is not None:
                        log.seek(0)
                        diagnostics = re.sub(r'token=[A-Za-z0-9_-]+', 'token=[redacted]', log.read()[-6000:])
                        raise RuntimeError(diagnostics)
                    try:
                        log.flush()
                        log.seek(0)
                        match = re.search(r'http://127\.0\.0\.1:\d+/\?token=[A-Za-z0-9_-]+', log.read())
                        if not match:
                            time.sleep(.5)
                            continue
                        with opener.open(match.group(0),timeout=1) as response:
                            text = response.read().decode()
                            assert response.status == 200 and '<html' in text.lower()
                            assert '/assets/' in text
                            print('PASS: real SENTINEL web profile serves built UI over loopback')
                            return
                    except (URLError, TimeoutError):
                        time.sleep(.5)
                raise TimeoutError('Web profile did not serve within 60 seconds')
            finally:
                proc.terminate()
                try:
                    proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=5)


if __name__ == '__main__':
    main()
