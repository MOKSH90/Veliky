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
            load_kwargs = {
                "torch_dtype": self.dtype,
                "trust_remote_code": False,
                "low_cpu_mem_usage": True,
            }
            if device == "cuda":
                free_mem_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                if free_mem_gb < 10.0 and ("7b" in model_name.lower() or "8b" in model_name.lower() or os.environ.get("LOAD_IN_4BIT", "1") == "1"):
                    try:
                        from transformers import BitsAndBytesConfig, AutoConfig
                        load_kwargs["quantization_config"] = BitsAndBytesConfig(
                            load_in_4bit=True,
                            bnb_4bit_compute_dtype=torch.float16,
                            bnb_4bit_quant_type="nf4",
                            bnb_4bit_use_double_quant=True,
                            llm_int8_enable_fp32_cpu_offload=True,
                        )
                        try:
                            config = AutoConfig.from_pretrained(model_name, local_files_only=not not offline)
                        except Exception:
                            config = AutoConfig.from_pretrained(model_name)
                        num_layers = getattr(config, "num_hidden_layers", 28)
                        custom_device_map = {
                            "model.embed_tokens": 0,
                            "model.rotary_emb": 0,
                            "model.norm": "cpu",
                            "lm_head": "cpu",
                        }
                        gpu_layers = min(18, num_layers - 10)
                        for i in range(num_layers):
                            custom_device_map[f"model.layers.{i}"] = 0 if i < gpu_layers else "cpu"
                        load_kwargs["device_map"] = custom_device_map
                        logger.info("Enabling NF4 4-bit GPU acceleration with %d layers on RTX 4050 (~3.3 GB base VRAM) + %d layers on CPU", gpu_layers, num_layers - gpu_layers)
                    except Exception as bnb_err:
                        logger.warning("Could not enable 4-bit custom device_map: %s, falling back to auto", bnb_err)
                        load_kwargs["device_map"] = "auto"
                else:
                    load_kwargs["device_map"] = "auto"
            else:
                load_kwargs["device_map"] = device

            try:
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    local_files_only=True,
                    **load_kwargs,
                )
            except Exception:
                if offline:
                    raise
                logger.info("Local model weights not found, downloading %s...", model_name)
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    local_files_only=False,
                    **load_kwargs,
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

        target_dev = "cuda:0" if self.device == "cuda" else (getattr(self.model, "device", None) or self.device)
        inputs = self.tokenizer(prompt_text, return_tensors="pt").to(target_dev)
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

    def generate_stream(self, prompt_text: str, max_tokens: int = 2048, temperature: float = 0.2):
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Inference model is not loaded")

        from transformers import TextIteratorStreamer
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, skip_special_tokens=True)

        target_dev = "cuda:0" if self.device == "cuda" else (getattr(self.model, "device", None) or self.device)
        inputs = self.tokenizer(prompt_text, return_tensors="pt").to(target_dev)

        gen_kwargs = dict(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=temperature > 0.0,
            temperature=max(temperature, 1e-4),
            streamer=streamer,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )

        def _worker():
            with self._lock:
                with torch.no_grad():
                    self.model.generate(**gen_kwargs)

        t = threading.Thread(target=_worker)
        t.start()
        for token_text in streamer:
            yield token_text
        t.join()


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
        workspace_candidates = [
            os.environ.get("VELIKY_WORKSPACE"),
            "/home/Frutus/Sentinel",
            "/workspace",
            "/app",
            os.getcwd(),
        ]
        workspace_dir = next((d for d in workspace_candidates if d and os.path.exists(d)), os.getcwd())
        already_has_context = any("=== DOCUMENT:" in m.get("content", "") or "=== REQUESTED FILE" in m.get("content", "") or "=== File:" in m.get("content", "") for m in messages)
        
        if not already_has_context:
            # Read README.md if mentioned or if asking about repository/project files
            if any(w in user_lower for w in ["readme", "project", "sentinel", "analyze", "context", "files"]):
                candidates = [
                    os.path.join(workspace_dir, "README.md"),
                    os.path.join(workspace_dir, "readme.md"),
                    "/home/Frutus/Sentinel/README.md",
                    "/app/README.md"
                ]
                for c in candidates:
                    if os.path.exists(c):
                        try:
                            with open(c, "r", encoding="utf-8", errors="ignore") as f:
                                readme_content = f.read(3500)
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
            grounding_instruction = f"You are VELIKY Sovereign Agent. The workspace repository directory on the laptop is named 'Sentinel' ({workspace_dir}), containing the VELIKY Sovereign Industrial AI Workbench codebase. You have direct read access to files on the laptop host. Here is the relevant workspace file data:\n{workspace_context}\nAnswer the user's inquiry directly using this real file content."
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

        if stream:
            async def event_generator():
                loop = asyncio.get_running_loop()
                queue: asyncio.Queue[str | None] = asyncio.Queue()

                def _stream_worker():
                    try:
                        for token_chunk in engine.generate_stream(prompt_text, max_tokens, temperature):
                            loop.call_soon_threadsafe(queue.put_nowait, token_chunk)
                    except Exception as e:
                        logger.error("Streaming error: %s", e)
                    finally:
                        loop.call_soon_threadsafe(queue.put_nowait, None)

                threading.Thread(target=_stream_worker, daemon=True).start()

                first_chunk = True
                while True:
                    token_chunk = await queue.get()
                    if token_chunk is None:
                        break
                    delta: dict[str, Any] = {"content": token_chunk}
                    if first_chunk:
                        delta["role"] = "assistant"
                        first_chunk = False
                    chunk = {
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
                    yield f"data: {json.dumps(chunk)}\n\n"

                finish_chunk = {
                    "id": request_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": engine.model_name,
                    "choices": [{
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop",
                    }],
                }
                yield f"data: {json.dumps(finish_chunk)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
            )

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
    parser.add_argument("--model", default=os.environ.get("MODEL_NAME", "Qwen/Qwen2.5-7B-Instruct"), help="Hugging Face model repository or local path")
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
