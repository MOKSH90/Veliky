"""Explicit offline authorization with process-local session rate limits."""
from __future__ import annotations
from collections import defaultdict, deque
from dataclasses import dataclass
import threading
import time
from capability_registry import CapabilityDefinition


@dataclass(frozen=True)
class PolicyDecision:
    """An authorization verdict and its human-readable reason."""
    allowed: bool
    reason: str


class PolicyEngine:
    """Contexts must come from the authenticated host, never agent arguments."""

    def __init__(self, max_calls: int = 20, window_seconds: float = 60):
        if max_calls < 1 or window_seconds <= 0:
            raise ValueError('Rate limits must be positive')
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._calls: dict[tuple[str, str], deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, capability: CapabilityDefinition, requester_context: dict) -> PolicyDecision:
        """Gate risk, network permission, optional capability RBAC, and rate."""
        ctx = requester_context
        levels = {'low': 0, 'medium': 1, 'high': 2}
        level = ctx.get('allowed_risk_level', 'low')
        session = ctx.get('session_id')
        if not isinstance(session, str) or not session:
            return PolicyDecision(False, 'Trusted session_id is required')
        if level not in levels or levels.get(capability.risk_tier, 99) > levels[level]:
            return PolicyDecision(False, 'Risk tier exceeds requester permission')
        if capability.network_allowed and ctx.get('network_allowed') is not True:
            return PolicyDecision(False, 'Network access is not authorized')
        allowed = ctx.get('allowed_capabilities')
        if allowed is not None and (not isinstance(allowed, (list, tuple, set)) or capability.name not in allowed):
            return PolicyDecision(False, 'Capability is not granted to this requester')
        with self._lock:
            now = time.monotonic()
            for key in list(self._calls):
                queue = self._calls[key]
                while queue and queue[0] <= now - self.window_seconds:
                    queue.popleft()
                if not queue:
                    del self._calls[key]
            queue = self._calls[(session, capability.name)]
            if len(queue) >= self.max_calls:
                return PolicyDecision(False, 'Capability rate limit exceeded for session')
            queue.append(now)
        return PolicyDecision(True, 'Authorized')
