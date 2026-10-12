#!/usr/bin/env python3
"""Robust local OpenAI-compatible inference server for open-weight Hugging Face models.

Designed to serve models like Qwen2.5 to Veliky Harness via stdio MCP and pi-ai.
Supports standard OpenAI endpoints:
  - GET  /v1/models
  - POST /v1/chat/completions (streaming and non-streaming, with tool_calls)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import re
import sys
import threading
import time
import uuid
from typing import Any

import torch
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response, StreamingResponse
from transformers import AutoModelForCausalLM, AutoTokenizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("veliky_llm")

TOOL_CALL_REGEX = re.compile(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", re.DOTALL)
JSON_CALL_REGEX = re.compile(r'\{[^{}]*"name"\s*:\s*"(?:mcp__veliky__)?[a-zA-Z0-9_]+"[^{}]*\}', re.DOTALL)


class ModelEngine:
    def __init__(self, model_name: str, device: str = "cpu", torch_dtype: str = "float32"):
        self.model_name = model_name
        self.device = device
        self._lock = threading.Lock()
        if device == "cpu":
            num_threads = int(os.environ.get("TORCH_NUM_THREADS", min(16, os.cpu_count() or 4)))
            torch.set_num_threads(num_threads)
            logger.info("Configured PyTorch CPU execution with %d threads", num_threads)
        self.dtype = getattr(torch, torch_dtype, torch.float32)
        offline = os.environ.get("TRANSFORMERS_OFFLINE", "0") == "1" or os.environ.get("HF_HUB_OFFLINE", "0") == "1"
        logger.info("Initializing inference engine for %s...", model_name)
        try:
            logger.info("Loading tokenizer for %s...", model_name)
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=False, local_files_only=True)
            except Exception:
                if offline:
                    raise
                logger.info("Local tokenizer not found, downloading %s...", model_name)
                self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=False, local_files_only=False)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            logger.info("Loading model weights for %s on %s (%s)...", model_name, device, torch_dtype)
            try:
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=self.dtype,
                    device_map=device,
                    trust_remote_code=False, local_files_only=True,
                    low_cpu_mem_usage=True,
                )
            except Exception:
                if offline:
                    raise
                logger.info("Local model weights not found, downloading %s...", model_name)
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=self.dtype,
                    device_map=device,
                    trust_remote_code=False, local_files_only=False,
                    low_cpu_mem_usage=True,
                )
            self.model.eval()
            logger.info("Model %s successfully loaded into memory and ready for inference.", model_name)
        except Exception as exc:
            raise RuntimeError(
                f"Could not load model {model_name}: {exc}. "
                "Download the model weights before offline use, or select an available --model."
            ) from exc

    def format_input(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]] | None = None) -> str:
        # Convert any messages with null content
        clean_messages = []
        for m in messages:
            msg = dict(m)
            if msg.get("content") is None:
                msg["content"] = ""
            clean_messages.append(msg)

        if tools:
            # Only present approved VELIKY tools to the model
            filtered_tools = [t for t in tools if t.get("function", {}).get("name", "").startswith("mcp__veliky__")]
            tools_to_use = filtered_tools if filtered_tools else tools
            try:
                return self.tokenizer.apply_chat_template(
                    clean_messages, tools=tools_to_use, add_generation_prompt=True, tokenize=False
                )
            except Exception:
                pass

        try:
            return self.tokenizer.apply_chat_template(
                clean_messages, add_generation_prompt=True, tokenize=False
            )
        except Exception:
            lines = []
            for m in clean_messages:
                role = m.get("role", "user")
                content = m.get("content", "")
                lines.append(f"<|im_start|>{role}\n{content}<|im_end|>")
            lines.append("<|im_start|>assistant\n")
            return "\n".join(lines)

    def generate(self, prompt_text: str, max_tokens: int = 2048, temperature: float = 0.2) -> tuple[str, int, int]:
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Inference model is not loaded")

        inputs = self.tokenizer(prompt_text, return_tensors="pt").to(self.device)
        input_len = inputs["input_ids"].shape[1]

        gen_kwargs = dict(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=temperature > 0.0,
            temperature=max(temperature, 1e-4),
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )
        with self._lock:
            with torch.no_grad():
                outputs = self.model.generate(**gen_kwargs)

        generated_tokens = outputs[0][input_len:]
        output_len = len(generated_tokens)
        decoded = self.tokenizer.decode(generated_tokens, skip_special_tokens=False)
        # Strip eos token if present
        if self.tokenizer.eos_token and decoded.endswith(self.tokenizer.eos_token):
            decoded = decoded[:-len(self.tokenizer.eos_token)].rstrip()
        return decoded, input_len, output_len


def parse_tool_calls(text: str) -> tuple[str, list[dict[str, Any]]]:
    tool_calls = []
    # 1. Match <tool_call> blocks
    for idx, match in enumerate(TOOL_CALL_REGEX.finditer(text)):
        raw_json = match.group(1).strip()
        try:
            data = json.loads(raw_json)
            name = data.get("name", "")
            if name and not name.startswith("mcp__veliky__"):
                name = f"mcp__veliky__{name}"
            args = data.get("arguments", {})
            args_str = json.dumps(args) if isinstance(args, dict) else str(args)
            tool_calls.append({
                "id": f"call_{idx}_{uuid.uuid4().hex[:8]}",
                "type": "function",
                "function": {
                    "name": name,
                    "arguments": args_str,
                }
            })
        except Exception:
            pass

    clean_text = TOOL_CALL_REGEX.sub("", text).strip()
    return clean_text, tool_calls


def create_app(engine: ModelEngine) -> Starlette:
    middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
            allow_credentials=True,
        )
    ]
    app = Starlette(middleware=middleware)

    async def list_models(request: Request) -> JSONResponse:
        model_info = {
            "id": engine.model_name,
            "object": "model",
            "created": int(time.time()),
            "owned_by": "veliky-local",
            "contextWindow": 32768,
            "maxTokens": 4096,
        }
        return JSONResponse({"object": "list", "data": [model_info], "models": {engine.model_name: model_info}})

    async def chat_completions(request: Request) -> Response:
        body = await request.json()
        messages = body.get("messages", [])
        tools = body.get("tools")
        stream = body.get("stream", False)
        temperature = float(body.get("temperature", 0.2))
        max_tokens = int(body.get("max_tokens", 2048))
        request_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        created = int(time.time())
        user_msg = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")
        print("\n" + "="*60, flush=True)
        print(f"📱 [INCOMING QUERY FROM CLIENT / MOBILE] (ID: {request_id})", flush=True)
        print(f"👉 Prompt: {user_msg}", flush=True)
        print("="*60, flush=True)

        # Auto-grounding: only inject if caller has NOT already provided workspace context
        workspace_context = ""
        user_lower = user_msg.lower()
        workspace_dir = "/workspace" if os.path.exists("/workspace") else "/app"
        already_has_context = any("=== DOCUMENT:" in m.get("content", "") or "=== REQUESTED FILE" in m.get("content", "") or "=== File:" in m.get("content", "") for m in messages)
        
        if not already_has_context:
            # Read README.md if mentioned or if asking about repository/project files
            if any(w in user_lower for w in ["readme", "project", "sentinel", "analyze", "context", "files"]):
                candidates = [
                    os.path.join(workspace_dir, "README.md"),
                    os.path.join(workspace_dir, "readme.md"),
                    "/app/README.md"
                ]
                for c in candidates:
                    if os.path.exists(c):
                        try:
                            with open(c, "r", encoding="utf-8", errors="ignore") as f:
                                readme_content = f.read(1500)
                            workspace_context += f"\n=== File: {os.path.basename(c)} ===\n{readme_content}\n"
                            break
                        except Exception:
                            pass

        # If user asks for file list or what files exist
        if any(w in user_lower for w in ["list file", "files in", "what files", "structure"]):
            try:
                tree = []
                for root, dirs, files in os.walk(workspace_dir):
                    dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ["node_modules", ".venv", "__pycache__"]]
                    for file in files:
                        if not file.startswith("."):
                            rel = os.path.relpath(os.path.join(root, file), workspace_dir)
                            tree.append(rel)
                    if len(tree) >= 40:
                        break
                if tree:
                    workspace_context += "\n=== Workspace Files Available ===\n" + "\n".join(tree[:40]) + "\n"
            except Exception:
                pass

        # If workspace context was found, ground the system message
        augmented_messages = list(messages)
        if workspace_context:
            has_system = any(m.get("role") == "system" for m in augmented_messages)
            grounding_instruction = f"You are VELIKY Sovereign Agent. You have direct read access to files on the laptop host. Here is the relevant workspace file data:\n{workspace_context}\nAnswer the user's inquiry directly using this real file content."
            if has_system:
                for idx, m in enumerate(augmented_messages):
                    if m.get("role") == "system":
                        augmented_messages[idx] = {
                            "role": "system",
                            "content": f"{m.get('content', '')}\n\n{grounding_instruction}"
                        }
                        break
            else:
                augmented_messages.insert(0, {"role": "system", "content": grounding_instruction})

        prompt_text = engine.format_input(augmented_messages, tools)
        loop = asyncio.get_running_loop()
        raw_output, input_tokens, output_tokens = await loop.run_in_executor(
            None, engine.generate, prompt_text, max_tokens, temperature
        )

        clean_text, tool_calls = parse_tool_calls(raw_output)
        finish_reason = "tool_calls" if tool_calls else "stop"

        print("\n" + "-"*60, flush=True)
        print(f"🤖 [MODEL RESPONSE GENERATED] -> Dispatching to Mobile & Client", flush=True)
        print(clean_text or raw_output, flush=True)
        print("-"*60 + "\n", flush=True)

        if stream:
            async def event_generator():
                delta: dict[str, Any] = {"role": "assistant"}
                if tool_calls:
                    delta["tool_calls"] = [
                        {"index": i, "id": tc["id"], "type": "function", "function": tc["function"]}
                        for i, tc in enumerate(tool_calls)
                    ]
                else:
                    delta["content"] = clean_text

                chunk1 = {
                    "id": request_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": engine.model_name,
                    "choices": [{
                        "index": 0,
                        "delta": delta,
                        "finish_reason": None,
                    }],
                }
                yield f"data: {json.dumps(chunk1)}\n\n"

                # Final finish chunk
                finish_chunk = {
                    "id": request_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": engine.model_name,
                    "choices": [{
                        "index": 0,
                        "delta": {},
                        "finish_reason": finish_reason,
                    }],
                    "usage": {
                        "prompt_tokens": input_tokens,
                        "completion_tokens": output_tokens,
                        "total_tokens": input_tokens + output_tokens,
                    },
                }
                yield f"data: {json.dumps(finish_chunk)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
            )
        else:
            msg_obj: dict[str, Any] = {"role": "assistant"}
            if tool_calls:
                msg_obj["tool_calls"] = tool_calls
            if clean_text or not tool_calls:
                msg_obj["content"] = clean_text

            return JSONResponse({
                "id": request_id,
                "object": "chat.completion",
                "created": created,
                "model": engine.model_name,
                "choices": [{
                    "index": 0,
                    "message": msg_obj,
                    "finish_reason": finish_reason,
                }],
                "usage": {
                    "prompt_tokens": input_tokens,
                    "completion_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens,
                },
            })

    app.add_route("/models", list_models, methods=["GET"])
    app.add_route("/v1/models", list_models, methods=["GET"])
    app.add_route("/chat/completions", chat_completions, methods=["POST"])
    app.add_route("/v1/chat/completions", chat_completions, methods=["POST"])
    app.add_route("/health", lambda r: JSONResponse({"status": "healthy", "model": engine.model_name}), methods=["GET"])
    app.add_route("/", lambda r: JSONResponse({"name": "veliky_llm_server", "model": engine.model_name}), methods=["GET"])

    return app


def main():
    parser = argparse.ArgumentParser(description="Local OpenAI-compatible inference server for open-weight models.")
    parser.add_argument("--model", default=os.environ.get("MODEL_NAME", "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"), help="Hugging Face model repository or local path")
    parser.add_argument("--host", default=os.environ.get("SERVE_HOST", "0.0.0.0"), help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")), help="Bind port (default: 8000)")
    parser.add_argument("--device", default=os.environ.get("DEVICE", "auto"), choices=("cpu", "cuda", "auto"), help="Execution device")
    parser.add_argument("--dtype", default=os.environ.get("TORCH_DTYPE", "auto"), choices=("auto", "float32", "bfloat16", "float16"), help="Torch datatype")
    args = parser.parse_args()

    # Auto-detect device and optimal dtype
    if args.device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device = args.device

    if args.dtype == "auto":
        dtype = "bfloat16" if device == "cuda" and torch.cuda.is_bf16_supported() else ("float16" if device == "cuda" else "float32")
    else:
        dtype = args.dtype

    import uvicorn
    engine = ModelEngine(args.model, device=device, torch_dtype=dtype)
    app = create_app(engine)
    print(f"\n🚀 VELIKY Local Inference Server running on http://{args.host}:{args.port}/v1")
    print(f"Model: {args.model} ({device}, {dtype})\n", flush=True)
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
