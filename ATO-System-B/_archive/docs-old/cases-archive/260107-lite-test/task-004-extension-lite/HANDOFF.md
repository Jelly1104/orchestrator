# HANDOFF.md

> **Case ID**: 260107-lite-test/task-004-extension-lite
> **작성일**: 2026-01-08
> **작성자**: Leader

---

## Pipeline

full

## TargetRole

Analyzer → Designer → Coder (순차 실행)

## TaskSummary

무찌마 커뮤니티의 24시간 내 인기 게시물을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, 웹 페이지에서 재생 가능한 팟캐스트 플레이어를 구현한다.

---

## Phase A: Analysis (Analyzer)

### Input

- docs/cases/260107-lite-test/task-004-extension-lite/PRD.md
- .claude/rules/DOMAIN_SCHEMA.md
- .claude/rules/DB_ACCESS_POLICY.md

### Output

- docs/cases/260107-lite-test/task-004-extension-lite/analysis/*.sql
- docs/cases/260107-lite-test/task-004-extension-lite/analysis/analysis_result.json
- docs/cases/260107-lite-test/task-004-extension-lite/analysis/analysis_report.md

### Constraints

- SELECT 쿼리만 사용
- BOARD_MUZZIMA: CTG_CODE, REG_DATE 인덱스 활용
- COMMENT: BOARD_IDX, SVC_CODE 인덱스 활용
- 대용량 테이블 LIMIT 필수 (최대 10건)
- DOMAIN_SCHEMA.md 컬럼명 정확히 사용
- 민감 컬럼 조회 금지 (U_EMAIL, U_NAME 등)

### CompletionCriteria

- SQL 문법 유효
- 24시간 내 게시물 조건 정확 (REG_DATE >= NOW() - INTERVAL 24 HOUR)
- 조회수(READ_CNT) + 댓글 수 기준 상위 5건 추출
- 실행 결과 5건 이상 존재

---

## Phase B: Design (Designer)

### Input

- docs/cases/260107-lite-test/task-004-extension-lite/HANDOFF.md
- docs/cases/260107-lite-test/task-004-extension-lite/analysis/analysis_report.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

- docs/cases/260107-lite-test/task-004-extension-lite/IA.md
- docs/cases/260107-lite-test/task-004-extension-lite/Wireframe.md
- docs/cases/260107-lite-test/task-004-extension-lite/SDD.md

### Constraints

- 기존 레거시 스키마 활용 (BOARD_MUZZIMA, COMMENT)
- 신규 테이블 생성 금지
- PII 마스킹 로직 SDD에 명시

### CompletionCriteria

- IA: 화면 계층 구조 완성
- Wireframe: 팟캐스트 플레이어 UI 레이아웃 포함
- SDD: API 엔드포인트 정의 (/api/podcast/best, /api/podcast/script)
- SDD: 엔트리포인트 연결 섹션 포함 (Frontend + Backend)

---

## Phase C: Implementation (Coder)

### Input

- docs/cases/260107-lite-test/task-004-extension-lite/HANDOFF.md
- docs/cases/260107-lite-test/task-004-extension-lite/IA.md
- docs/cases/260107-lite-test/task-004-extension-lite/Wireframe.md
- docs/cases/260107-lite-test/task-004-extension-lite/SDD.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

- backend/src/routes/podcast/index.ts (라우터)
- backend/src/routes/podcast/best.ts (일간 베스트 API)
- backend/src/routes/podcast/script.ts (대본 생성 API)
- frontend/src/features/podcast-player/PodcastPlayer.tsx
- frontend/src/features/podcast-player/components/*.tsx

### Constraints

- TypeScript 필수
- DOMAIN_SCHEMA.md 컬럼명 준수 (BOARD_IDX, TITLE, CONTENT, READ_CNT, AGREE_CNT, REG_DATE)
- PRD 직접 참조 금지 (SDD만 참조)
- PII 마스킹 처리 필수
- TailwindCSS 사용 (inline style 금지)

### CompletionCriteria

- 빌드 성공 (`npm run build` 또는 `tsc --noEmit`)
- 타입체크 PASS
- API 응답 시간 < 500ms
- 대본 단어 수 450~500
- 엔트리포인트 연결 (main.tsx에서 import)
- 구동 테스트 (`npm run dev` 실행 후 렌더링 확인)

---

## 핵심 기능 매핑

| PRD 기능 | Phase | 산출물 |
|----------|-------|--------|
| F1. 일간 베스트 추출 | A → C | SQL → API (/api/podcast/best) |
| F2. PII 마스킹 | B → C | SDD 정의 → 코드 구현 |
| F3. 대본 생성 API | B → C | SDD 정의 → API (/api/podcast/script) |
| F4. 팟캐스트 플레이어 UI | B → C | Wireframe → React 컴포넌트 |

---

## 스키마 참조 (DOMAIN_SCHEMA.md)

### BOARD_MUZZIMA

| 컬럼 | 타입 | 설명 |
|------|------|------|
| BOARD_IDX | INT | PK, 게시글 ID |
| CTG_CODE | CHAR(6) | 카테고리 코드 |
| U_ID | VARCHAR(20) | 작성자 ID |
| TITLE | VARCHAR(200) | 제목 |
| CONTENT | MEDIUMTEXT | 본문 |
| READ_CNT | INT | 조회수 |
| AGREE_CNT | INT | 추천수 |
| REG_DATE | DATETIME | 등록일 |

### COMMENT

| 컬럼 | 타입 | 설명 |
|------|------|------|
| COMMENT_IDX | INT UNSIGNED | PK, 댓글 ID |
| BOARD_IDX | INT UNSIGNED | FK, 게시글 ID |
| SVC_CODE | VARCHAR(10) | 게시판 구분 |
| CONTENT | MEDIUMTEXT | 댓글 내용 |
| REG_DATE | DATETIME | 등록일 |

---

**END OF HANDOFF.md**
