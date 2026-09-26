# ==============================================================================
# Reinery: Sovereign Agentic AI Workbench Container
# Integrates DeepSeek Harness runtime, Local Open-Weight Models, and Industrial RAG
# ==============================================================================

FROM node:22-bookworm-slim

# 1. Install system utilities, Python 3, and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    git \
    curl \
    zstd \
    ca-certificates \
    bubblewrap util-linux poppler-utils tesseract-ocr imagemagick tar gzip grep \
 && rm -rf /var/lib/apt/lists/*

# 2. Install pnpm (exact version matched to deepseek-harness)
RUN npm install -g pnpm@11.7.0

# 3. Create isolated Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 4. Install PyTorch (CPU build to minimize image size) and Python dependencies
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir \
        transformers \
        accelerate \
        huggingface_hub \
        rich \
        pyyaml \
        pydantic \
        mcp \
        starlette \
        uvicorn \
        pytest \
        jsonschema pandas \
        rank-bm25 \
        pillow \
        sentence-transformers \
        pymilvus

# 5. Copy and build the DeepSeek Harness runtime
WORKDIR /app
COPY tools/deepseek-harness /app/tools/deepseek-harness
WORKDIR /app/tools/deepseek-harness
RUN pnpm install --frozen-lockfile && \
    pnpm run build:native-system && \
    pnpm run build:lib:host && \
    pnpm run build:lib:client && \
    pnpm run build:web

# 6. Copy RAG engine, MCP server, knowledge vault, and unified CLI
WORKDIR /app
COPY RAG /app/RAG
COPY reinery_cli.py reinery docker-entrypoint.sh veliky.cordis.patch.yml /app/
RUN chmod +x /app/reinery /app/docker-entrypoint.sh /app/RAG/harness/dsh-source

# 7. Runtime environment variables
ENV INFERENCE_ENDPOINT=http://127.0.0.1:8000/v1 \
    MODEL_NAME=deepseek-ai/DeepSeek-R1-Distill-Qwen-7B \
    ROLE=analyst \
    RETRIEVAL=hybrid \
    DSH_HOME=/app/.veliky-dsh \
    SERVE_HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1

# 8. Persistent volume mount points
VOLUME ["/app/RAG/veliky_vault", "/app/RAG/data", "/app/RAG/state", "/app/.veliky-dsh", "/root/.cache/huggingface"]

# 8000: Model inference API (OpenAI-compatible) | 3000: Harness Web GUI
EXPOSE 8000 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["chat"]
