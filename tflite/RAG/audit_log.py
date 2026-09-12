"""Append-only, fsynced JSONL evidence compatible with SENTINEL's audit chain."""
from __future__ import annotations
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path


def canonical(value: object) -> str:
    """Encode deterministic JSON for hashing."""
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False)


def digest(value: object) -> str:
    """Hash structured data without recording its potentially sensitive content."""
    return hashlib.sha256(canonical(value).encode()).hexdigest()


class AuditLog:
    """Serialize writers using the same audit.lock as SentinelService."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _tail(self) -> str:
        previous = '0' * 64
        if self.path.exists():
            with self.path.open(encoding='utf-8') as stream:
                for line in stream:
                    record = json.loads(line)
                    claimed = record.pop('hash')
                    if record['previous_hash'] != previous or digest(record) != claimed:
                        raise ValueError('Audit chain integrity failure')
                    previous = claimed
        return previous

    def append(self, fields: dict) -> dict:
        """Check the existing chain and append one durable record."""
        with self.path.with_suffix('.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            record = {**fields, 'timestamp': datetime.now(timezone.utc).isoformat(), 'previous_hash': self._tail()}
            record.pop('hash', None)
            record['hash'] = digest(record)
            with self.path.open('a', encoding='utf-8') as stream:
                stream.write(canonical(record) + '\n')
                stream.flush()
                os.fsync(stream.fileno())
            return record

    def verify_chain(self) -> bool:
        """Detect edits/reordering; external anchoring is needed to detect tail deletion."""
        try:
            with self.path.with_suffix('.lock').open('a') as lock:
                fcntl.flock(lock, fcntl.LOCK_SH)
                self._tail()
            return True
        except (ValueError, KeyError, TypeError):
            return False
