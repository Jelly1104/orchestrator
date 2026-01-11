# HANDOFF: 무찌마 일간 베스트 팟캐스트 페이지

| 항목        | 내용                                      |
| ----------- | ----------------------------------------- |
| **Case ID** | 260107-lite-test/task-003-extension       |
| **버전**    | 1.0.0                                     |
| **작성일**  | 2026-01-07                                |
| **작성자**  | Leader                                    |

---

## Pipeline

full

---

## TargetRole

Analyzer → Designer → Coder

---

## TaskSummary

무찌마 커뮤니티의 24시간 내 인기 게시물을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, 웹 페이지에서 재생 가능한 팟캐스트 플레이어를 구현한다.

> **핵심 가치**: "일간 베스트 게시물 5건 → 3분 팟캐스트 대본 → 웹 플레이어 UI"

---

## Phase A: Analysis (Analyzer)

### 목표

BOARD_MUZZIMA 테이블에서 24시간 내 조회수/댓글 상위 5건 추출

### Input

- docs/cases/260107-lite-test/task-003-extension/PRD.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

- docs/cases/260107-lite-test/task-003-extension/analysis/best_posts.sql
- docs/cases/260107-lite-test/task-003-extension/analysis/query_result.json
- docs/cases/260107-lite-test/task-003-extension/analysis/analysis_report.md

### Constraints

- SELECT 쿼리만 사용
- BOARD_MUZZIMA 테이블 사용 (CTG_CODE, REG_DATE 인덱스 활용)
- 컬럼: BOARD_IDX, TITLE, CONTENT, READ_CNT, AGREE_CNT, REG_DATE
- WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
- LIMIT 5 (상위 5건)
- SELECT * 금지

### CompletionCriteria

- [ ] SQL 문법 유효
- [ ] 24시간 내 게시물만 조회
- [ ] 5건 결과 반환 확인
- [ ] 분석 리포트에 인사이트 포함

---

## Phase B: Design (Designer)

### 목표

팟캐스트 플레이어 UI 설계 및 API 엔드포인트 정의

### Input

- docs/cases/260107-lite-test/task-003-extension/PRD.md
- docs/cases/260107-lite-test/task-003-extension/analysis/analysis_report.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

- docs/cases/260107-lite-test/task-003-extension/IA.md
- docs/cases/260107-lite-test/task-003-extension/Wireframe.md
- docs/cases/260107-lite-test/task-003-extension/SDD.md

### Constraints

- Feature-Sliced Design 패턴 적용
- TailwindCSS 사용 (inline style 금지)
- RESTful API 설계
- 대본 길이: 450~500 단어 (3분)

### SDD 필수 포함 사항

| 항목                  | 설명                                        |
| --------------------- | ------------------------------------------- |
| API 명세              | GET /api/podcast/script, GET /api/podcast/best-posts |
| 컴포넌트 명세         | PodcastPlayer, ScriptDisplay, PlayButton    |
| 타입 정의             | PodcastScript, ScriptLine, BestPost         |
| **엔트리포인트 연결** | frontend/src/main.tsx, backend/src/index.ts |

### CompletionCriteria

- [ ] IA 계층 구조 완성
- [ ] Wireframe ASCII 다이어그램 포함
- [ ] SDD API 엔드포인트 정의
- [ ] SDD 엔트리포인트 연결 섹션 포함

---

## Phase C: Implementation (Coder)

### 목표

Backend API 및 Frontend 팟캐스트 플레이어 구현

### Input

- docs/cases/260107-lite-test/task-003-extension/HANDOFF.md
- docs/cases/260107-lite-test/task-003-extension/SDD.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

#### Backend

| 파일 | 설명 |
| ---- | ---- |
| backend/src/routes/podcast/index.ts | 라우터 등록 |
| backend/src/routes/podcast/script.ts | GET /api/podcast/script |
| backend/src/routes/podcast/best-posts.ts | GET /api/podcast/best-posts |
| backend/src/routes/podcast/types.ts | 타입 정의 |

#### Frontend

| 파일 | 설명 |
| ---- | ---- |
| frontend/src/features/podcast-player/PodcastPlayer.tsx | 메인 플레이어 컴포넌트 |
| frontend/src/features/podcast-player/ScriptDisplay.tsx | 대본 표시 컴포넌트 |
| frontend/src/features/podcast-player/PlayButton.tsx | 재생 버튼 (TTS 시뮬레이션) |
| frontend/src/features/podcast-player/types.ts | 타입 정의 |
| frontend/src/features/podcast-player/index.ts | 배럴 export |

### Constraints

- TypeScript 필수
- TDD 방식 (테스트 먼저)
- DOMAIN_SCHEMA.md 컬럼명 준수
- PRD 직접 참조 금지 (SDD만 참조)
- TailwindCSS 사용 (inline style 금지)
- PII 마스킹 처리 (환자/의사 개인정보)

### 엔트리포인트 연결

| 유형 | 엔트리포인트 | 연결 방법 |
| ---- | ------------ | --------- |
| **Backend** | backend/src/index.ts | `app.use('/api/podcast', podcastRouter)` |
| **Frontend** | frontend/src/main.tsx | `import { PodcastPlayer } from './features/podcast-player'` |

### CompletionCriteria

- [ ] 빌드 성공 (`npm run build`)
- [ ] 테스트 PASS
- [ ] 타입체크 PASS
- [ ] **Backend 엔트리포인트 연결** (index.ts에서 라우터 등록)
- [ ] **Frontend 엔트리포인트 연결** (main.tsx에서 import/렌더링)
- [ ] **구동 테스트** (`npm run dev` 실행 후 렌더링 확인)
- [ ] API 응답 시간 < 500ms
- [ ] 대본 단어 수 450~500

---

## 성공 기준 (전체)

| 지표           | 목표값     | 측정 방법                          |
| -------------- | ---------- | ---------------------------------- |
| API 응답 시간  | < 500ms    | `/api/podcast/script` 응답 시간    |
| 대본 단어 수   | 450~500    | 생성된 대본 단어 카운트            |
| 빌드 성공률    | 100%       | `npm run build` PASS               |

---

## 다음 단계

1. **Phase A 시작**: `/profiler` → `/query` → `/imleader` (검증)
2. **Phase B 시작**: `/designer` → `/imleader` (검증)
3. **Phase C 시작**: `/coder` → `/imleader` (검증)

---

**END OF HANDOFF**
