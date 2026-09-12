#!/usr/bin/env python3
"""Official MCP SDK stdio transport; stdout is reserved for JSON-RPC."""
from __future__ import annotations

import base64
import inspect
import os
import sys
from contextlib import redirect_stdout
from functools import wraps

from mcp.server.fastmcp import FastMCP
from mcp.types import CallToolResult, ImageContent, TextContent, ToolAnnotations
from sentinel_service import SentinelService, TOOL_NAMES, canonical


def create_server(service=None):
    service = service or SentinelService()
    server = FastMCP("sentinel", instructions="Use evidence ids returned by retrieval. Verify the complete report before completion.")

    def register(name):
        method = getattr(service, name)

        @wraps(method)
        def invoke(**kwargs):
            with redirect_stdout(sys.stderr):
                result = service.invoke(name, **kwargs)
            if name == "analyze_equipment_drawing" and result.get("status") == "image":
                encoded = result.pop("image_base64")
                mime = result.pop("mime_type")
                return CallToolResult(content=[TextContent(type="text", text=canonical(result)),
                    ImageContent(type="image", data=encoded, mimeType=mime)])
            return CallToolResult(content=[TextContent(type="text", text=canonical(result))], structuredContent=result)

        # Preserve bound method parameters, but use the MCP response annotation.
        invoke.__signature__ = inspect.signature(method).replace(return_annotation=CallToolResult)
        invoke.__annotations__ = {**method.__annotations__, "return": CallToolResult}
        server.add_tool(invoke, name=name, description=method.__doc__ or name.replace("_", " "),
                        annotations=ToolAnnotations(readOnlyHint=name not in ("write_vault_note", "request_capability"),
                        destructiveHint=name == "write_vault_note", openWorldHint=False))

    for name in (("request_capability",) if os.environ.get("SENTINEL_CAPABILITIES_ONLY") == "1" else TOOL_NAMES):
        register(name)
    return server


if __name__ == "__main__":
    create_server().run(transport="stdio")
