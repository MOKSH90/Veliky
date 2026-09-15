#!/usr/bin/env bash
set -e

export PYTHONUNBUFFERED=1
export SENTINEL_GATEWAY_HOST="${SENTINEL_GATEWAY_HOST:-0.0.0.0}"
export SENTINEL_GATEWAY_PORT="${SENTINEL_GATEWAY_PORT:-8766}"
export SENTINEL_RAG_DIR="${SENTINEL_RAG_DIR:-/app/tflite/RAG}"
export VAULT_DIR="${VAULT_DIR:-/app/tflite/sentinel_vault}"
export SENTINEL_STATE_DIR="${SENTINEL_STATE_DIR:-/app/tflite/RAG/state}"
export SENTINEL_DATA_DIR="${SENTINEL_DATA_DIR:-/app/tflite/RAG/data}"
export SENTINEL_ROLE="${SENTINEL_ROLE:-admin}"
export SENTINEL_HARNESS_WRITES="${SENTINEL_HARNESS_WRITES:-1}"
export INFERENCE_ENDPOINT="${INFERENCE_ENDPOINT:-http://model-server:8000/v1}"
export MODEL_NAME="${MODEL_NAME:-deepseek-ai/DeepSeek-R1-Distill-Qwen-7B}"

mkdir -p "$SENTINEL_STATE_DIR" "$SENTINEL_DATA_DIR" "$VAULT_DIR"

if [[ "${1:-}" == "chat" || "${1:-}" == "cli" ]]; then
    exec python3 /app/tflite/deepseek_cli.py --model "$MODEL_NAME" "${@:2}"
elif [[ "${1:-}" == "investigate" ]]; then
    exec python3 /app/tflite/reinery_cli.py investigate "${@:2}"
elif [[ "${1:-}" == "doctor" ]]; then
    exec python3 /app/tflite/reinery_cli.py doctor
elif [[ "${1:-}" == "gateway" || -z "${1:-}" ]]; then
    echo "🛡️ Starting SENTINEL API Gateway on ${SENTINEL_GATEWAY_HOST}:${SENTINEL_GATEWAY_PORT}..."
    exec python3 /app/Sentinel-Web/server/gateway.py --host "$SENTINEL_GATEWAY_HOST" --port "$SENTINEL_GATEWAY_PORT"
else
    exec "$@"
fi
