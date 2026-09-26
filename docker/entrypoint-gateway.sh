#!/usr/bin/env bash
set -e

export PYTHONUNBUFFERED=1
export VELIKY_GATEWAY_HOST="${VELIKY_GATEWAY_HOST:-0.0.0.0}"
export VELIKY_GATEWAY_PORT="${VELIKY_GATEWAY_PORT:-8766}"
export VELIKY_RAG_DIR="${VELIKY_RAG_DIR:-/app/tflite/RAG}"
export VAULT_DIR="${VAULT_DIR:-/app/tflite/veliky_vault}"
export VELIKY_STATE_DIR="${VELIKY_STATE_DIR:-/app/tflite/RAG/state}"
export VELIKY_DATA_DIR="${VELIKY_DATA_DIR:-/app/tflite/RAG/data}"
export VELIKY_ROLE="${VELIKY_ROLE:-admin}"
export VELIKY_HARNESS_WRITES="${VELIKY_HARNESS_WRITES:-1}"
export INFERENCE_ENDPOINT="${INFERENCE_ENDPOINT:-http://model-server:8000/v1}"
export MODEL_NAME="${MODEL_NAME:-deepseek-ai/DeepSeek-R1-Distill-Qwen-7B}"

mkdir -p "$VELIKY_STATE_DIR" "$VELIKY_DATA_DIR" "$VAULT_DIR"

if [[ "${1:-}" == "chat" || "${1:-}" == "cli" ]]; then
    exec python3 /app/tflite/deepseek_cli.py --model "$MODEL_NAME" "${@:2}"
elif [[ "${1:-}" == "investigate" ]]; then
    exec python3 /app/tflite/reinery_cli.py investigate "${@:2}"
elif [[ "${1:-}" == "doctor" ]]; then
    exec python3 /app/tflite/reinery_cli.py doctor
elif [[ "${1:-}" == "gateway" || -z "${1:-}" ]]; then
    echo "🛡️ Starting VELIKY API Gateway on ${VELIKY_GATEWAY_HOST}:${VELIKY_GATEWAY_PORT}..."
    exec python3 /app/Veliky-Web/server/gateway.py --host "$VELIKY_GATEWAY_HOST" --port "$VELIKY_GATEWAY_PORT"
else
    exec "$@"
fi
