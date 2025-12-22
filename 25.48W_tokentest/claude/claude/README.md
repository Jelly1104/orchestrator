프로젝트: claude 스켈레톤

- Backend: FastAPI (동기 응답, 스트리밍 미사용)
- Frontend: Next.js (TypeScript)

실행 예시:

1. 스켈레톤 생성: (이미 생성됨)
2. 백엔드 실행:
   cd claude/backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
3. 프론트 실행:
   cd claude/frontend
   npm install
   npm run dev

4. 통합 실행(수동으로 두 터미널에서):
   - 백엔드: 위 2)
   - 프론트: 위 3)

API 예시:
POST http://localhost:8000/api/v1/summarize (multipart/form-data: provider, model, text, image)

환경 변수 설정:

- 루트에서 `./create_env.sh` 실행 → `backend/.env`/`.env.example` 생성
- `backend/.env`의 `OPENAI_API_KEY`에 실제 키를 입력
- uvicorn 실행 시 `.env`가 자동 로드됨 (`dotenv`)

요약 파이프라인 개요 (gpt-5-mini):

- instructions: "이미지 → 캡션/속성 추출 → 사용자 텍스트와 결합 → 요약"을 자연어로 정의
- input_text: 사용자가 넣는 추가 텍스트
- input_image: 업로드한 이미지(또는 URL/로컬 파일을 읽어 data URL로 변환) 1장을 함께 전달
- 모델은 이미지를 보고 캡션/속성을 뽑고, input_text를 읽은 뒤 두 정보를 합쳐 한국어로 간결히 요약
