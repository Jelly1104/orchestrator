# 파일: create_claude.sh
#!/usr/bin/env zsh
set -euo pipefail

BASE="claude"

mkdir -p $BASE/backend/app/api/v1
mkdir -p $BASE/backend/app/services/providers
mkdir -p $BASE/frontend/app
mkdir -p $BASE/frontend/components
mkdir -p $BASE/dev

# Create files with content
cat > $BASE/.env.example <<'EOF'
# 복사해서 .env로 저장 후 값을 채우세요
OPENAI_API_KEY=
BACKEND_PORT=8000
FRONTEND_PORT=3000
EOF

cat > $BASE/README.md <<'EOF'
프로젝트: claude 스켈레톤
- Backend: FastAPI (동기 응답, 스트리밍 미사용)
- Frontend: Next.js (TypeScript)

실행 예시:
1) 스켈레톤 생성: (이미 생성됨)
2) 백엔드 실행:
   cd claude/backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port \$BACKEND_PORT

3) 프론트 실행:
   cd claude/frontend
   npm install
   npm run dev

4) 통합 실행(수동으로 두 터미널에서):
   - 백엔드: 위 2)
   - 프론트: 위 3)

API 예시:
POST http://localhost:8000/api/v1/summarize (multipart/form-data: provider, model, text, image)
EOF

cat > $BASE/dev/run_dev.sh <<'EOF'
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
EOF

chmod +x $BASE/dev/run_dev.sh

cat > $BASE/backend/requirements.txt <<'EOF'
fastapi
uvicorn[standard]
httpx
pillow
python-multipart
pydantic
EOF

cat > $BASE/backend/app/main.py <<'EOF'
from fastapi import FastAPI
from app.api.v1 import routes

app = FastAPI(title="claude-skeleton-api")

app.include_router(routes.router, prefix="/api/v1")
EOF

cat > $BASE/backend/app/api/v1/routes.py <<'EOF'
from fastapi import APIRouter, UploadFile, File, Form
from app.schemas import SummarizeRequest, SummarizeResponse

router = APIRouter()

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    provider: str = Form("gpt5"),
    model: str = Form("gpt-5-mini"),
    system_prompt: str = Form(None),
    output_mode: str = Form("내용 요약"),
    text: str = Form(None),
    image: UploadFile = File(None),
):
    # TODO: validate, call provider wrapper, return response
    return {"summary": "여기에 요약 결과가 들어갑니다.", "provider": provider, "model": model}
    
@router.get("/models")
async def models():
    return {"providers": [{"id":"gpt5","models":["gpt-5-mini"]}]}
EOF

cat > $BASE/backend/app/schemas.py <<'EOF'
from pydantic import BaseModel
from typing import Optional

class SummarizeRequest(BaseModel):
    provider: str
    model: str
    system_prompt: Optional[str]
    output_mode: str
    text: Optional[str]

class SummarizeResponse(BaseModel):
    summary: str
    provider: str
    model: str
EOF

cat > $BASE/backend/app/services/image_utils.py <<'EOF'
from PIL import Image
from io import BytesIO

def preprocess_image_bytes(data: bytes, max_size=(1024,1024)) -> bytes:
    img = Image.open(BytesIO(data))
    img.thumbnail(max_size)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()
EOF

cat > $BASE/backend/app/services/providers/gpt5_provider.py <<'EOF'
import os
import httpx

OPENAI_KEY = os.getenv("OPENAI_API_KEY")

def call_gpt5_sync(prompt: str, model: str="gpt-5-mini"):
    # TODO: 실제 API 호출 로직을 여기에 구현
    # 현재는 더미 응답 반환
    return {"text": f"요약(더미): {prompt[:200]}"}
EOF

cat > $BASE/frontend/package.json <<'EOF'
{
  "name": "claude-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0"
  }
}
EOF

cat > $BASE/frontend/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "ESNext"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

cat > $BASE/frontend/app/page.tsx <<'EOF'
import React, { useState } from "react";
import ModelSelector from "../components/ModelSelector";
import SystemPromptEditor from "../components/SystemPromptEditor";
import UploadInput from "../components/UploadInput";
import ResultViewer from "../components/ResultViewer";
import axios from "axios";

export default function Page() {
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const resp = await axios.post("/api/v1/summarize", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setResult(resp.data.summary);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>claude 요약 데모 (gpt-5-mini)</h1>
      <ModelSelector />
      <SystemPromptEditor />
      <UploadInput onSubmit={handleSubmit} />
      <ResultViewer result={result} />
    </main>
  );
}
EOF

cat > $BASE/frontend/components/ModelSelector.tsx <<'EOF'
import React from "react";

export default function ModelSelector() {
  return (
    <div>
      <label>모델 선택: </label>
      <select defaultValue="gpt-5-mini">
        <option value="gpt-5-mini">gpt-5-mini</option>
      </select>
    </div>
  );
}
EOF

cat > $BASE/frontend/components/SystemPromptEditor.tsx <<'EOF'
import React from "react";

export default function SystemPromptEditor() {
  return (
    <div>
      <label>시스템 인스트럭션:</label>
      <textarea placeholder="예: 요약은 3문장 이내로."></textarea>
    </div>
  );
}
EOF

cat > $BASE/frontend/components/UploadInput.tsx <<'EOF'
import React, { useRef } from "react";

export default function UploadInput({ onSubmit }: { onSubmit: (fd: FormData) => void }) {
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("provider", "gpt5");
    fd.append("model", "gpt-5-mini");
    fd.append("output_mode", "내용 요약");
    if (textRef.current?.value) fd.append("text", textRef.current.value);
    if (fileRef.current?.files?.[0]) fd.append("image", fileRef.current.files[0]);
    onSubmit(fd);
  };

  return (
    <form onSubmit={submit}>
      <div>
        <textarea ref={textRef} placeholder="요약할 텍스트를 입력하세요." />
      </div>
      <div>
        <input ref={fileRef} type="file" accept="image/*" />
      </div>
      <button type="submit">요약 실행</button>
    </form>
  );
}
EOF

cat > $BASE/frontend/components/ResultViewer.tsx <<'EOF'
import React from "react";

export default function ResultViewer({ result }: { result: string | null }) {
  return (
    <div>
      <h3>결과</h3>
      <pre>{result ?? "결과 없음"}</pre>
    </div>
  );
}
EOF

echo "Skeleton created under ./$BASE — files written."
EOFso