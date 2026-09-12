"""Bounded, proxy-free inference client restricted to numeric loopback addresses."""
from __future__ import annotations
import ipaddress
import json
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    """Prevent a local endpoint from redirecting prompts to a remote service."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Model endpoint redirects are forbidden')


class LocalModelClient:
    """The model may reason locally; generated code itself has no network access."""

    def __init__(self, endpoint: str, model: str, timeout: float = 90) -> None:
        url = urlsplit(endpoint)
        try:
            loopback = ipaddress.ip_address(url.hostname or '').is_loopback
        except ValueError:
            loopback = False
        if url.scheme != 'http' or not loopback or url.username or url.password or url.query or url.fragment:
            raise ValueError('Inference endpoint must be numeric loopback HTTP without credentials/query')
        self.endpoint, self.model, self.timeout = endpoint.rstrip('/'), model, timeout

    def complete(self, messages: list[dict], max_tokens: int = 768, tools: list[dict] | None = None) -> dict:
        """Return a genuine model message, never synthesize tool calls on failure."""
        body = {'model': self.model, 'messages': messages, 'temperature': 0, 'max_tokens': max_tokens, 'stream': False}
        if tools:
            body['tools'] = tools
        request = Request(self.endpoint + '/chat/completions', data=json.dumps(body).encode(),
                          headers={'Content-Type': 'application/json'})
        with build_opener(ProxyHandler({}), NoRedirect()).open(request, timeout=self.timeout) as response:
            raw = response.read(2 * 1024 * 1024 + 1)
        if len(raw) > 2 * 1024 * 1024:
            raise ValueError('Inference response exceeds 2 MiB')
        return json.loads(raw)['choices'][0]['message']
