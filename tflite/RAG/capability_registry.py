"""Trusted, offline capability configuration; callers cannot supply implementations."""
from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, asdict
import json
import fcntl
import os
import tempfile
from pathlib import Path
import re

import yaml
from jsonschema import Draft202012Validator


@dataclass(frozen=True)
class CapabilityDefinition:
    """An administrator-owned execution contract."""

    name: str
    implementation: dict
    input_schema: dict
    risk_tier: str
    sandbox_required: bool = True
    network_allowed: bool = False
    timeout_seconds: float = 30


class CapabilityRegistry:
    """Load YAML or JSON once and return isolated copies of approved definitions."""

    def __init__(self, config_path: str | Path | None = None, generated_path: str | Path | None = None):
        path = Path(config_path) if config_path else Path(__file__).with_name('capabilities.yaml')
        self.config_path = path
        self.generated_path = Path(generated_path) if generated_path else None
        data = yaml.safe_load(path.read_text(encoding='utf-8'))
        if not isinstance(data, dict) or set(data) != {'capabilities'} or not isinstance(data['capabilities'], list):
            raise ValueError('Expected a capabilities list')
        self._definitions: dict[str, CapabilityDefinition] = {}
        for row in data['capabilities']:
            cap = CapabilityDefinition(**row)
            if not re.fullmatch(r'[a-z][a-z0-9_]{0,63}', cap.name) or cap.name in self._definitions:
                raise ValueError('Invalid or duplicate capability name')
            if cap.risk_tier not in ('low', 'medium', 'high'):
                raise ValueError('Invalid risk tier')
            if type(cap.sandbox_required) is not bool or type(cap.network_allowed) is not bool:
                raise ValueError('Sandbox/network flags must be booleans')
            if type(cap.timeout_seconds) not in (int, float) or not 0 < cap.timeout_seconds <= 300:
                raise ValueError('Timeout must be between 0 and 300 seconds')
            impl = cap.implementation
            if impl.get('type') not in ('binary', 'python_callable'):
                raise ValueError('Invalid implementation type')
            if impl['type'] == 'binary':
                if not Path(impl.get('path', '')).is_absolute() or not isinstance(impl.get('args'), list):
                    raise ValueError('Binary requires absolute path and an argument list')
            elif not re.fullmatch(r'[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*:[a-zA-Z_]\w*', impl.get('module', '')):
                raise ValueError('Callable requires module:function')
            if not all(isinstance(arg, str) for arg in impl.get('args', [])):
                raise ValueError('Arguments must be string tokens')
            if impl.get('output_format') == 'json':
                output_schema = impl.get('output_schema')
                if not isinstance(output_schema, dict):
                    raise ValueError('JSON output requires an output schema')
                if any(key in json.dumps(output_schema) for key in ('"$ref"', '"$dynamicRef"')):
                    raise ValueError('Output schema references are not supported')
                Draft202012Validator.check_schema(output_schema)
            output_file = impl.get('output_file')
            if output_file is not None and (not isinstance(output_file, str) or Path(output_file).name != output_file or output_file in ('', '.', '..')):
                raise ValueError('Output artifact must be a filename')
            if cap.input_schema.get('type') != 'object' or cap.input_schema.get('additionalProperties') is not False:
                raise ValueError('Input must be a closed object schema')
            # Remote references are forbidden: schema validation must stay offline.
            if any(key in json.dumps(cap.input_schema) for key in ('"$ref"', '"$dynamicRef"')):
                raise ValueError('Schema references are not supported')
            Draft202012Validator.check_schema(cap.input_schema)
            self._definitions[cap.name] = cap

    def lookup(self, capability_name: str) -> CapabilityDefinition | None:
        """Return a definition without exposing mutable registry state."""
        return deepcopy(self._all_definitions().get(capability_name))

    def list_capabilities(self) -> list[str]:
        """List registered names in stable order."""
        return sorted(self._all_definitions())


    def _all_definitions(self) -> dict[str, CapabilityDefinition]:
        """Read the atomically replaced approved overlay so running services see changes."""
        definitions = dict(self._definitions)
        if self.generated_path and self.generated_path.exists():
            extra = CapabilityRegistry(self.generated_path)._definitions
            if definitions.keys() & extra.keys():
                raise ValueError('Generated capabilities cannot shadow seed definitions')
            definitions.update(extra)
        return definitions

    def register(self, capability: CapabilityDefinition) -> None:
        """Persist an administrator-approved definition under a cross-process lock."""
        if self.generated_path is None:
            raise ValueError('No persistent generated registry is configured')
        path = self.generated_path
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.with_suffix('.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            if capability.name in self._all_definitions():
                raise ValueError('Capability name is already registered')
            rows = list(CapabilityRegistry(path)._definitions.values()) if path.exists() else []
            self._write_overlay(rows + [capability])

    def revoke(self, name: str) -> None:
        """Remove only generated definitions; subsequent lookups immediately lose the grant."""
        if self.generated_path is None:
            raise ValueError('No generated registry is configured')
        with self.generated_path.with_suffix('.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            rows = CapabilityRegistry(self.generated_path)._definitions
            if name not in rows:
                raise ValueError('Generated capability is not registered')
            self._write_overlay([cap for key, cap in rows.items() if key != name])

    def _write_overlay(self, rows: list[CapabilityDefinition]) -> None:
        """Validate and fsync a replacement before making it visible to readers."""
        assert self.generated_path is not None
        path = self.generated_path
        with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False, encoding='utf-8') as stream:
            temporary = Path(stream.name)
            try:
                json.dump({'capabilities': [asdict(cap) for cap in rows]}, stream)
                stream.flush()
                os.fsync(stream.fileno())
                CapabilityRegistry(temporary)
                os.replace(temporary, path)
                directory = os.open(path.parent, os.O_DIRECTORY)
                try:
                    os.fsync(directory)
                finally:
                    os.close(directory)
            finally:
                temporary.unlink(missing_ok=True)
