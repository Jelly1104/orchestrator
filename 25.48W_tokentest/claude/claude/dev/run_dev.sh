#!/usr/bin/env zsh
set -euo pipefail

BASE_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

export BACKEND_PORT=${BACKEND_PORT:-8000}
export FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo "Start backend (uvicorn) at port $BACKEND_PORT..."
(
  cd "$BACKEND_DIR"
  if [ -f requirements.txt ]; then
    pip install -r requirements.txt || true
  fi
  uvicorn app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT &
  BACKEND_PID=$!
)

echo "Start frontend (next) at port $FRONTEND_PORT..."
(
  cd "$FRONTEND_DIR"
  if [ -f package.json ]; then
    npm ci || true
  fi
  npm run dev &
  FRONTEND_PID=$!
)

trap 'echo "Stopping..."; kill $BACKEND_PID $FRONTEND_PID >/dev/null 2>&1 || true; exit' INT TERM
wait
