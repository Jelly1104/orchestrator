# HANDOFF.md

> **Case ID**: 260107-lite-test/task-005-extension-full
> **생성일**: 2026-01-08
> **생성자**: Leader

---

## Pipeline

full

## TargetRole

Analyzer → Designer → Coder (순차 실행)

## TaskSummary

무찌마 커뮤니티의 24시간 내 인기 게시물(조회수/댓글 상위 5건)을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, 웹 플레이어 UI를 구현한다.

---

## Phase A: Analysis

### Input

- docs/cases/260107-lite-test/task-005-extension-full/PRD.md
- .claude/rules/DOMAIN_SCHEMA.md
- .claude/rules/DB_ACCESS_POLICY.md

### Output

- docs/cases/260107-lite-test/task-005-extension-full/analysis/best_posts.sql
- docs/cases/260107-lite-test/task-005-extension-full/analysis/query_result.json
- docs/cases/260107-lite-test/task-005-extension-full/analysis/analysis_report.md

### Constraints

- SELECT 쿼리만 사용
- REG_DATE >= NOW() - INTERVAL 24 HOUR 조건 필수
- LIMIT 10 이하
- SELECT * 금지, 명시적 컬럼만 사용
- COMMENT 조회 시 BOARD_IDX 인덱스 활용
- PII 컬럼(U_EMAIL, U_NAME, U_TEL 등) 조회 금지

### CompletionCriteria

- SQL 문법 유효
- 상위 5건 게시물 추출 완료
- 분석 리포트에 인사이트 포함

---

## Phase B: Design

### Input

- docs/cases/260107-lite-test/task-005-extension-full/PRD.md
- docs/cases/260107-lite-test/task-005-extension-full/analysis/analysis_report.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

- docs/cases/260107-lite-test/task-005-extension-full/IA.md
- docs/cases/260107-lite-test/task-005-extension-full/Wireframe.md
- docs/cases/260107-lite-test/task-005-extension-full/SDD.md

### Constraints

- 기존 레거시 스키마(DOMAIN_SCHEMA.md) 활용
- 신규 테이블 생성 금지
- 컴포넌트는 Feature-Sliced Design 준수
- SDD에 엔트리포인트 연결 섹션 필수

### CompletionCriteria

- IA 계층 구조 완성 (빈 섹션 없음)
- Wireframe에 플레이어 UI 상태 정의 (idle/playing/paused)
- SDD에 API 엔드포인트 및 컴포넌트 명세 포함
- 엔트리포인트 연결 방법 명시

---

## Phase C: Implementation

### Input

- docs/cases/260107-lite-test/task-005-extension-full/HANDOFF.md
- docs/cases/260107-lite-test/task-005-extension-full/IA.md
- docs/cases/260107-lite-test/task-005-extension-full/Wireframe.md
- docs/cases/260107-lite-test/task-005-extension-full/SDD.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

**Backend**:
- backend/src/routes/podcast/index.ts (라우터)
- backend/src/routes/podcast/controller.ts (컨트롤러)
- backend/src/routes/podcast/service.ts (서비스)
- backend/src/routes/podcast/types.ts (타입 정의)

**Frontend**:
- frontend/src/features/podcast-player/index.tsx (엔트리포인트)
- frontend/src/features/podcast-player/components/PodcastPlayer.tsx
- frontend/src/features/podcast-player/components/ScriptDisplay.tsx
- frontend/src/features/podcast-player/components/PlayButton.tsx
- frontend/src/features/podcast-player/types.ts
- frontend/src/features/podcast-player/hooks/usePodcast.ts

### Constraints

- TypeScript strict mode 필수
- TDD 방식 (테스트 먼저)
- DOMAIN_SCHEMA.md 컬럼명 준수
- PRD 직접 참조 금지 (SDD/HANDOFF만 참조)
- any 타입 사용 금지
- PII 마스킹 처리 (대본에 개인정보 포함 금지)

### CompletionCriteria

- 빌드 성공 (`npm run build` 또는 `tsc --noEmit`)
- 타입체크 PASS
- **Backend 엔트리포인트 연결** (app.ts 또는 index.ts에 라우터 등록)
- **Frontend 엔트리포인트 연결** (main.tsx에서 import/렌더링)
- **구동 테스트** (`npm run dev` 실행 후 렌더링 확인)
- API 응답 형식 검증 (GET /api/podcast/script, GET /api/podcast/best-posts)

---

## API Specification (참고)

### GET /api/podcast/best-posts

24시간 내 베스트 게시물 목록 조회

```typescript
Response: {
  posts: Array<{
    BOARD_IDX: number;
    TITLE: string;
    READ_CNT: number;
    AGREE_CNT: number;
    COMMENT_CNT: number;
    REG_DATE: string;
  }>;
}
```

### GET /api/podcast/script

팟캐스트 대본 생성 (Host-Guest 2인 대화 형식)

```typescript
Response: {
  script: Array<{
    speaker: 'HOST' | 'GUEST';
    text: string;
  }>;
  metadata: {
    generatedAt: string;
    wordCount: number;
    estimatedDuration: string; // "약 3분"
  };
}
```

---

## HITL Checkpoints

| Phase | 체크포인트 | 승인 조건 |
|-------|-----------|----------|
| A→B | 베스트 게시물 추출 승인 | 상위 5건 품질 확인, PII 없음 |
| B→C | 설계 산출물 승인 | IA/SDD/Wireframe 정합성 확인 |
| C 완료 | API/UI 기능 검증 | 빌드 성공, API 응답 형식 일치 |

---

**END OF HANDOFF.md**
