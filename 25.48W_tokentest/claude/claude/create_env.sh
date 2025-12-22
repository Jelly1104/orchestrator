#!/usr/bin/env bash
set -euo pipefail

# 프로젝트 루트(이 스크립트가 위치한 곳)에서 backend/.env* 파일을 생성한다.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
ENV_EXAMPLE_PATH="$BACKEND_DIR/.env.example"
ENV_PATH="$BACKEND_DIR/.env"

mkdir -p "$BACKEND_DIR"

cat > "$ENV_EXAMPLE_PATH" <<'EOF'
# OpenAI / gpt-5-mini 설정
OPENAI_API_KEY="key"

# 필요 시 커스텀 엔드포인트를 지정하세요.
OPENAI_BASE_URL=https://api.openai.com/v1
EOF

if [[ ! -f "$ENV_PATH" ]]; then
  cp "$ENV_EXAMPLE_PATH" "$ENV_PATH"
  echo "backend/.env 파일을 새로 생성했습니다. OPENAI_API_KEY 값을 채워주세요."
else
  echo "backend/.env 이 이미 존재합니다. 내용은 backend/.env.example 을 참고해 수정하세요."
fi

echo "샘플 env 파일 위치: $ENV_EXAMPLE_PATH"
