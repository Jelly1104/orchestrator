# 폭염 위험 동네 대시보드

LightRAG를 활용한 실시간 폭염 위험 분석 및 시각화 대시보드

## 프로젝트 소개

기상청 기후정보포털 API 데이터와 LightRAG (Graph-based RAG)를 결합하여 전국 지역별 폭염 위험도를 실시간으로 분석하고 시각화하는 웹 애플리케이션입니다.

## 주요 기능

### 🌡️ 실시간 폭염 모니터링
- 전국 16개 지역 폭염 데이터 실시간 수집
- 지역별 위험도 점수 계산 (0-100점)
- 4단계 위험 등급 (낮음/보통/높음/매우 높음)

### 🗺️ 인터랙티브 히트맵
- 지역별 폭염 현황 시각화
- 위험도에 따른 색상 구분
- 클릭으로 상세 정보 확인

### 🤖 AI 기반 분석 (LightRAG)
- 지역별 폭염 위험 분석
- 자연어 질의응답
- 맞춤형 행동 권장사항 제공

## 기술 스택

### Backend
- **FastAPI**: 고성능 비동기 웹 프레임워크
- **LightRAG**: 그래프 기반 RAG 시스템 (https://github.com/HKUDS/LightRAG)
- **OpenAI API**: LLM 및 임베딩
- **httpx**: 비동기 HTTP 클라이언트

### Frontend
- **React 18**: UI 라이브러리
- **Vite**: 빠른 개발 서버
- **Axios**: HTTP 클라이언트

### Data Source
- 기상청 기후정보포털 API (https://climate.gg.go.kr/ols/api)

## 설치 및 실행

### 사전 요구사항
- Python 3.9+
- Node.js 18+
- OpenAI API Key (LightRAG 사용 시 필수)

### 1. 저장소 클론
```bash
cd /Users/m2-mini/Desktop/eunah/Ontology-based-RAG
```

### 2. Backend 설정

```bash
cd backend

# 가상환경 생성
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어서 OPENAI_API_KEY 추가
```

### 3. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install
```

### 4. 실행

#### Backend 실행 (터미널 1)
```bash
cd backend
source .venv/bin/activate
python main.py
# 또는
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs

#### Frontend 실행 (터미널 2)
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000

## 환경 변수 설정

### backend/.env
```env
# OpenAI API Key (LightRAG 필수)
OPENAI_API_KEY=sk-your-openai-api-key-here

# 기상청 API Key (optional)
WEATHER_API_KEY=

# Server Port
PORT=8000

# Environment
ENV=development
```

## API 엔드포인트

### Weather API
- `GET /api/heatwave/data?region={code}&days={n}` - 특정 지역 폭염 데이터
- `GET /api/heatwave/regions` - 전국 지역별 통계
- `GET /api/risk/level?region={code}` - 지역 위험도
- `GET /api/risk/dashboard` - 대시보드 데이터

### RAG API
- `POST /api/rag/query` - RAG 질의응답
- `POST /api/rag/analyze?region_code={code}` - 지역 분석
- `GET /api/rag/recommendations?risk_level={level}` - 권장사항

### Health Check
- `GET /health` - 서비스 상태 확인

## 프로젝트 구조

```
Ontology-based-RAG/
├── backend/
│   ├── main.py                 # FastAPI 앱
│   ├── weather_api.py          # 기상청 API 클라이언트
│   ├── lightrag_service.py     # LightRAG 서비스
│   ├── requirements.txt        # Python 의존성
│   └── .env.example            # 환경변수 템플릿
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # 메인 앱
│   │   ├── api/client.js       # API 클라이언트
│   │   └── components/
│   │       ├── RiskDashboard.jsx   # 위험도 대시보드
│   │       ├── HeatwaveMap.jsx     # 폭염 지도
│   │       └── RAGChat.jsx         # RAG 채팅
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 사용 방법

### 1. 대시보드 확인
- 메인 화면에서 전국 16개 지역의 실시간 폭염 위험도 확인
- 위험도는 색상으로 구분 (빨강 > 주황 > 노랑 > 초록)

### 2. 지역 선택
- 대시보드 또는 지도에서 특정 지역 클릭
- 선택한 지역의 상세 정보 표시

### 3. AI 분석 활용
- RAG 채팅에서 폭염 관련 질문 입력
- 빠른 질문 버튼 활용
- AI 기반 맞춤형 권장사항 확인

## 위험도 계산 방식

폭염 위험도는 다음 요소를 종합하여 계산됩니다:

- **최고 기온**: 35°C 이상 (40점), 33-35°C (30점), 31-33°C (20점)
- **폭염 일수**: 1일당 10점 (최대 40점)
- **평균 기온**: 28°C 이상 (20점)

**위험 등급**:
- 매우 높음: 80점 이상
- 높음: 60-79점
- 보통: 40-59점
- 낮음: 39점 이하

## LightRAG 소개

LightRAG는 HKUDS에서 개발한 그래프 기반 RAG 시스템입니다.

### 주요 특징
- Knowledge Graph 기반 정보 검색
- Naive, Local, Global, Hybrid 4가지 검색 모드
- 효율적인 벡터 인덱싱
- 실시간 지식 업데이트

### 참고 자료
- GitHub: https://github.com/HKUDS/LightRAG
- Paper: [LightRAG: Simple and Fast Retrieval-Augmented Generation]

## 문제 해결

### Backend가 시작되지 않을 때
```bash
# 의존성 재설치
pip install -r requirements.txt --force-reinstall

# OpenAI API 키 확인
cat .env
```

### Frontend가 API를 호출하지 못할 때
```bash
# Backend가 실행 중인지 확인
curl http://localhost:8000/health

# CORS 설정 확인 (main.py)
```

### RAG 서비스가 작동하지 않을 때
- `.env` 파일에 `OPENAI_API_KEY` 설정 확인
- LightRAG 패키지 설치 확인: `pip install lightrag-hku`
- Backend 로그 확인

## 개발 모드

현재 기상청 API 연동이 완료되지 않아 Mock 데이터를 사용합니다.

실제 API 연동 시 `weather_api.py`의 `_get_mock_heatwave_data` 함수를 실제 API 호출로 교체하세요.

## 라이선스

MIT License

## 기여

Issues와 Pull Requests를 환영합니다!

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Powered by**:
- 🌤️ 기상청 기후정보포털
- 🤖 LightRAG (HKUDS)
- ⚡ FastAPI + React
