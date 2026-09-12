#!/usr/bin/env python3
"""Offline deployment checks for tools, Python packages and real namespace isolation."""
from __future__ import annotations
import importlib.util
import json
from pathlib import Path
import subprocess


def check() -> dict:
    """Fail when a required binary, import or actual sandbox probe is unavailable."""
    binaries = {name: Path('/usr/bin', name).is_file() for name in
                ('bwrap','prlimit','pdftotext','pdftoppm','tesseract','convert','tar','gzip','grep','python3')}
    modules = {name: importlib.util.find_spec(name) is not None for name in ('yaml','jsonschema','pandas','mcp')}
    sandbox = {'success': False, 'error': 'Bubblewrap is not installed'}
    if binaries['bwrap']:
        command = ['/usr/bin/bwrap','--unshare-all','--die-with-parent','--new-session']
        for path in ('/usr','/lib','/lib64'):
            if Path(path).exists():
                command += ['--ro-bind',path,path]
        try:
            result = subprocess.run(command + ['/usr/bin/true'], capture_output=True, text=True, timeout=10)
            sandbox = {'success': result.returncode == 0, 'error': result.stderr.strip()}
        except (OSError, subprocess.TimeoutExpired) as exc:
            sandbox = {'success':False, 'error':str(exc)}
    return {'ready': all(binaries.values()) and all(modules.values()) and sandbox['success'],
            'binaries':binaries,'python_packages':modules,'sandbox':sandbox}


if __name__ == '__main__':
    report = check()
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['ready'] else 1)
