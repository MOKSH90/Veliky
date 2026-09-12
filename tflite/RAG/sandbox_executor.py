"""Fail-closed Linux namespace execution with administrator-defined argv."""
from __future__ import annotations
from dataclasses import dataclass
import json
import math
import os
import stat
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from jsonschema import Draft202012Validator
from capability_registry import CapabilityDefinition, CapabilityRegistry


@dataclass
class ExecutionResult:
    """Bounded process output and execution evidence."""
    success: bool
    stdout: str = ''
    stderr: str = ''
    exit_code: int | None = None
    duration_ms: float = 0
    sandbox_used: str = 'none'
    output_path: str | None = None


class SandboxExecutor:
    """Only execute definitions identical to the startup registry.

    Input files are copied from trusted roots, never mounted from caller paths.
    A missing or unusable Bubblewrap backend is a hard error, not a downgrade.
    """

    def __init__(self, registry: CapabilityRegistry, input_roots: list[Path], output_dir: Path):
        self.registry = registry
        self.input_roots = [Path(root).resolve() for root in input_roots]
        self.output_dir = Path(output_dir).resolve()
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _stage(self, value: str, work: Path, index: int) -> str:
        """Stage a regular file, rejecting symlinks and files outside granted roots."""
        original = Path(value).absolute()
        resolved = original.resolve(strict=True)
        if original != resolved or not any(resolved.is_relative_to(root) for root in self.input_roots):
            raise ValueError('Input path is outside trusted roots or contains symlinks')
        if not resolved.is_file() or resolved.stat().st_size > 32 * 1024 * 1024:
            raise ValueError('Input must be a regular file of at most 32 MiB')
        name = f'input-{index}{resolved.suffix.lower()}'
        fd = os.open(resolved, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(fd, 'rb') as source:
            actual = Path(f'/proc/self/fd/{source.fileno()}').resolve()
            info = os.fstat(source.fileno())
            if actual != resolved or not stat.S_ISREG(info.st_mode) or info.st_size > 32 * 1024 * 1024:
                raise ValueError('Input file changed while staging')
            with (work / name).open('wb') as target:
                remaining = 32 * 1024 * 1024 + 1
                while remaining:
                    chunk = source.read(min(remaining, 65536))
                    if not chunk:
                        break
                    target.write(chunk)
                    remaining -= len(chunk)
                if remaining == 0:
                    raise ValueError('Input exceeds 32 MiB')
        return '/work/' + name

    def _argv(self, cap: CapabilityDefinition, data: dict) -> list[str]:
        """Expand whole-token placeholders only; never parse a command string."""
        impl = cap.implementation
        args = [impl['path']]
        for token in impl['args']:
            match = re.fullmatch(r'\{([a-z_]+)\}', token)
            if match:
                value = data[match[1]]
                args.extend(str(item) for item in value) if isinstance(value, list) else args.append(str(value))
            else:
                args.append(token)
        return args

    def execute(self, capability: CapabilityDefinition, validated_input: dict) -> ExecutionResult:
        """Validate again at the execution boundary, isolate, and collect bounded output."""
        started = time.monotonic()
        result = ExecutionResult(False)
        try:
            if self.registry.lookup(capability.name) != capability:
                raise ValueError('Implementation is not explicitly registered')
            Draft202012Validator(capability.input_schema).validate(validated_input)
            # Scripts are intentional Python source; all other strings are data only.
            for key, value in validated_input.items():
                values = value if isinstance(value, list) else [value]
                if key != 'script' and any(isinstance(v, str) and re.search(r'[;|&`$<>\n\r\x00]', v) for v in values):
                    raise ValueError('Shell metacharacters are forbidden')
            if not Path('/usr/bin/bwrap').is_file() or not Path('/usr/bin/prlimit').is_file():
                raise RuntimeError('Sandbox unavailable: Linux Bubblewrap and prlimit are required')
            with tempfile.TemporaryDirectory(prefix='sentinel-cap-') as tmp:
                work = Path(tmp)
                data = dict(validated_input)
                index = 0
                for key in capability.implementation.get('input_files', []):
                    values = data[key] if isinstance(data[key], list) else [data[key]]
                    staged = []
                    for value in values:
                        staged.append(self._stage(value, work, index))
                        index += 1
                    data[key] = staged if isinstance(data[key], list) else staged[0]
                impl = capability.implementation
                if impl['type'] == 'binary':
                    command = self._argv(capability, data)
                else:
                    command = [sys.executable, '-I', '/runner/capability_worker.py', impl['module']]
                wrapper = ['/usr/bin/prlimit', '--as=2147483648', '--fsize=16777216', '--nofile=64',
                           f'--cpu={max(1, math.ceil(capability.timeout_seconds))}', '--',
                           '/usr/bin/bwrap', '--unshare-all', '--die-with-parent', '--new-session', '--cap-drop', 'ALL']
                if capability.network_allowed:
                    wrapper += ['--share-net']
                for folder in ('/usr', '/lib', '/lib64', '/bin'):
                    if Path(folder).exists():
                        wrapper += ['--ro-bind', folder, folder]
                wrapper += ['--tmpfs', '/tmp']
                for prefix in {sys.prefix, sys.base_prefix}:
                    if not Path(prefix).is_relative_to('/usr'):
                        wrapper += ['--ro-bind', prefix, prefix]
                # Only utility configuration is exposed; no host /etc secrets or home.
                for folder in ('/etc/ImageMagick-6', '/etc/fonts', '/etc/ld.so.cache'):
                    if Path(folder).exists():
                        wrapper += ['--ro-bind', folder, folder]
                wrapper += ['--ro-bind', str(Path(__file__).with_name('capability_worker.py')), '/runner/capability_worker.py',
                            '--bind', str(work), '/work', '--proc', '/proc', '--dev', '/dev',
                            '--chdir', '/work', '--clearenv', '--setenv', 'PATH', '/usr/bin:/bin',
                            '--setenv', 'HOME', '/work', '--setenv', 'LANG', 'C.UTF-8',
                            '--setenv', 'OPENBLAS_NUM_THREADS', '1', '--setenv', 'OMP_NUM_THREADS', '1', '--']
                # Files bound output growth without buffering arbitrary stdout in RAM.
                with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
                    result.sandbox_used = 'bubblewrap'
                    process = subprocess.run(wrapper + ['/usr/bin/prlimit', '--nproc=64', '--'] + command, input=json.dumps(data).encode(), stdout=out, stderr=err,
                                             cwd=work, env={'PATH': '/usr/bin:/bin'}, timeout=capability.timeout_seconds,
                                             shell=False, close_fds=True)
                    out.seek(0)
                    err.seek(0)
                    stdout = out.read(1024 * 1024 + 1)
                    stderr = err.read(1024 * 1024 + 1)
                    if max(len(stdout), len(stderr)) > 1024 * 1024:
                        raise ValueError('Process output exceeds 1 MiB capture limit')
                    result.stdout = stdout.decode('utf-8', errors='replace')
                    result.stderr = stderr.decode('utf-8', errors='replace')
                    result.exit_code = process.returncode
                    result.success = process.returncode in impl.get('success_exit_codes', [0])
                output = impl.get('output_file')
                if result.success and output:
                    artifact = work / output
                    if artifact.is_symlink() or not artifact.is_file() or artifact.stat().st_size == 0:
                        raise ValueError('Missing or empty output artifact')
                    target = self.output_dir / (uuid.uuid4().hex + artifact.suffix)
                    shutil.copyfile(artifact, target)
                    result.output_path = str(target)
        except subprocess.TimeoutExpired:
            result.success = False
            result.stderr = 'Capability execution timed out'
        except Exception as exc:
            result.success = False
            result.stderr = str(exc)
        result.duration_ms = round((time.monotonic() - started) * 1000, 3)
        return result
