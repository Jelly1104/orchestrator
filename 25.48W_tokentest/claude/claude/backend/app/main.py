from dotenv import load_dotenv

# .env 파일 자동 로드 (최대한 빨리 호출)
load_dotenv()

from fastapi import FastAPI
from app.api.v1 import routes
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 자동 로드 (개발 편의)
load_dotenv()

app = FastAPI(title="claude-skeleton-api")

app.add_middleware(
    CORSMiddleware,
    # 로컬/동일망/포워딩된 도메인 모두 허용 (배포시 필요 범위로 좁히세요)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"ok": True}

app.include_router(routes.router, prefix="/api/v1")
