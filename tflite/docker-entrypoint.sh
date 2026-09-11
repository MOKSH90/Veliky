#!/usr/bin/env bash
set -e

# Default environment configuration
export INFERENCE_ENDPOINT="${INFERENCE_ENDPOINT:-http://127.0.0.1:8000/v1}"
export MODEL_NAME="${MODEL_NAME:-Qwen/Qwen2.5-0.5B-Instruct}"
export ROLE="${ROLE:-analyst}"
export RETRIEVAL="${RETRIEVAL:-hybrid}"
export DSH_HOME="${DSH_HOME:-/app/.sentinel-dsh}"
export PYTHONUNBUFFERED=1
export PATH="/opt/venv/bin:$PATH"

mkdir -p /app/RAG/state /app/.sentinel-dsh

# Helper to check if model server is reachable
check_server() {
    local base="${INFERENCE_ENDPOINT%/v1}"
    curl -sf "${base}/health" >/dev/null 2>&1 || curl -sf "${INFERENCE_ENDPOINT}/models" >/dev/null 2>&1
}

# Determine mode based on command
MODE="investigate"
if [[ "${1:-}" == "chat" ]]; then
    MODE="chat"
fi

# Dynamically calibrate Cordis patch with container-local paths
/opt/venv/bin/python /app/RAG/sentinel_harness.py configure \
  --endpoint "$INFERENCE_ENDPOINT" \
  --model "$MODEL_NAME" \
  --role "$ROLE" \
  --retrieval "$RETRIEVAL" \
  --python /opt/venv/bin/python \
  --patch /app/sentinel.cordis.patch.yml \
  --mode "$MODE" || {
    echo "[reinery-container] Warning: Dynamic patch calibration exited non-zero; continuing."
}

# If running standalone against localhost/127.0.0.1 and server is offline, auto-start in background
if [[ "${1:-}" == "chat" || "${1:-}" == "investigate" || "${1:-}" == "watch" ]]; then
    if [[ "$INFERENCE_ENDPOINT" == *"127.0.0.1"* || "$INFERENCE_ENDPOINT" == *"localhost"* ]]; then
        if ! check_server; then
            echo "[reinery-container] Starting local model server ($MODEL_NAME) on port 8000..."
            /opt/venv/bin/python /app/RAG/sentinel_llm_server.py --host 0.0.0.0 --port 8000 --model "$MODEL_NAME" &
            SERVER_PID=$!
            trap "kill $SERVER_PID 2>/dev/null || true" EXIT

            echo -n "[reinery-container] Waiting for model server to become ready"
            READY=0
            for i in {1..120}; do
                if check_server; then
                    echo " [READY]"
                    READY=1
                    break
                fi
                echo -n "."
                sleep 1
            done

            if [[ $READY -ne 1 ]]; then
                echo " [FAILED]"
                echo "[reinery-container] Error: Model server did not respond within 120 seconds."
                exit 1
            fi
        fi
    fi
fi

if [[ "${1:-}" == "chat" || "${1:-}" == "investigate" || "${1:-}" == "watch" || "${1:-}" == "rag" || "${1:-}" == "doctor" || "${1:-}" == "serve" ]]; then
    exec /app/reinery "$@"
else
    exec "$@"
fi
