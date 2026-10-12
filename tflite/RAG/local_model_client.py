"""Bounded, proxy-free inference client restricted to numeric loopback addresses."""
from __future__ import annotations
import ipaddress
import json
import socket
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    """Prevent a local endpoint from redirecting prompts to a remote service."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Model endpoint redirects are forbidden')


class LocalModelClient:
    """The model may reason locally; generated code itself has no network access."""

    def __init__(self, endpoint: str, model: str, timeout: float | None = None) -> None:
        if timeout is None:
            import os
            timeout = float(os.environ.get("VELIKY_TIMEOUT", 300))
        url = urlsplit(endpoint)
        host = url.hostname or ''
        if url.scheme != 'http' or url.username or url.password or url.query or url.fragment:
            raise ValueError('Inference endpoint must be numeric loopback or private network HTTP without credentials/query')
        if host == 'localhost':
            raise ValueError('Inference endpoint must use numeric loopback or private container hostname, not localhost')

        is_allowed = False
        try:
            addr = ipaddress.ip_address(host)
            is_allowed = addr.is_loopback or addr.is_private
        except ValueError:
            try:
                resolved = socket.gethostbyname(host)
                addr = ipaddress.ip_address(resolved)
                is_allowed = addr.is_loopback or addr.is_private
            except (socket.gaierror, socket.herror):
                if host and ('.' not in host or host.endswith('.local') or host.endswith('.internal')):
                    is_allowed = True

        if not is_allowed:
            raise ValueError('Inference endpoint must be numeric loopback or private network HTTP without credentials/query')
        self.endpoint, self.model, self.timeout = endpoint.rstrip('/'), model, timeout

    def complete(self, messages: list[dict], max_tokens: int = 384, tools: list[dict] | None = None) -> dict:
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

    def stream_complete(self, messages: list[dict], max_tokens: int = 512, tools: list[dict] | None = None):
        """Yield token text chunks as they are generated in real-time from the model server."""
        body = {'model': self.model, 'messages': messages, 'temperature': 0, 'max_tokens': max_tokens, 'stream': True}
        if tools:
            body['tools'] = tools
        request = Request(self.endpoint + '/chat/completions', data=json.dumps(body).encode(),
                          headers={'Content-Type': 'application/json'})
        with build_opener(ProxyHandler({}), NoRedirect()).open(request, timeout=self.timeout) as response:
            for line in response:
                line_str = line.decode('utf-8', errors='ignore').strip()
                if line_str.startswith('data: '):
                    payload = line_str[6:].strip()
                    if payload == '[DONE]':
                        break
                    try:
                        chunk = json.loads(payload)
                        delta = chunk.get('choices', [{}])[0].get('delta', {})
                        content = delta.get('content')
                        if content:
                            yield content
                    except Exception:
                        pass
