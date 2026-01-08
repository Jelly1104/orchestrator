# PRD: 무찌마 일간 베스트 팟캐스트 페이지

| 항목          | 내용                           |
| ------------- | ------------------------------ |
| **Case ID**   | 260107-lite-test/task-003-extension |
| **PRD 버전**  | 3.0.0                          |
| **작성일**    | 2026-01-07                     |
| **작성자**    | ATO Team                       |
| **참조 문서** | DOMAIN_SCHEMA.md               |

---

## Skills 연동

```yaml
skills:
  - leader # HANDOFF 생성
  - profiler # 데이터 분석/요약
  - query # SQL 쿼리 생성 (일간 베스트 추출)
  - designer # UI/API 설계
  - coder # Frontend + Backend 구현

output:
  analysis: docs/cases/260107-lite-test/task-003-extension/analysis/
  design: docs/cases/260107-lite-test/task-003-extension/
  code:
    frontend: frontend/src/features/podcast-player/
    backend: backend/src/routes/podcast/
```

---

## 목적 (Objective)

무찌마 커뮤니티의 24시간 내 인기 게시물을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, **웹 페이지에서 재생 가능한 팟캐스트 플레이어**를 제공한다.

> **요약**: "일간 베스트 게시물 5건 → 3분 팟캐스트 대본 → 웹 플레이어 UI"

---

## 타겟 유저

| 항목              | 설명                           |
| ----------------- | ------------------------------ |
| **Persona**       | 시간 부족한 3040 봉직의/개원의 |
| **Pain Point**    | 커뮤니티 정독 시간 부족        |
| **Needs**         | 이동 중 오디오로 트렌드 파악   |
| **사용 시나리오** | 출퇴근 중 3분 팟캐스트 청취    |

---

## 핵심 기능

| ID  | 기능명               | 설명                                             | 검증 방법                        | Skill            |
| --- | -------------------- | ------------------------------------------------ | -------------------------------- | ---------------- |
| F1  | 일간 베스트 추출     | BOARD_MUZZIMA에서 24시간 내 조회수/댓글 상위 5건 | SQL 실행 후 5건 반환 확인        | query            |
| F2  | PII 마스킹           | 환자/의사 개인정보 마스킹 처리                   | 대본에 개인정보 포함 여부 검사   | profiler         |
| F3  | 대본 생성 API        | Host/Guest 2인 대화 구어체 스크립트 API          | API 호출 시 JSON 응답 확인       | coder (backend)  |
| F4  | 팟캐스트 플레이어 UI | 대본 표시 + TTS 재생 버튼 (시뮬레이션)           | 브라우저에서 UI 렌더링 확인      | coder (frontend) |

---

## 성공 지표 (Success Criteria)

### 정량적 지표

| 지표           | 목표값     | 측정 방법                          |
| -------------- | ---------- | ---------------------------------- |
| API 응답 시간  | < 500ms    | `/api/podcast/script` 응답 시간    |
| 대본 단어 수   | 450~500    | 생성된 대본 단어 카운트            |
| 빌드 성공률   | 100%       | `npm run build` PASS               |

### 정성적 지표

| 지표           | 판단 기준                                |
| -------------- | ---------------------------------------- |
| 대본 자연스러움 | Host/Guest 대화가 구어체로 자연스러운가  |
| UI 사용성      | 플레이어 UI가 직관적으로 조작 가능한가   |

---

## 데이터 요구사항

```yaml
tables:
  - name: BOARD_MUZZIMA
    columns: [BOARD_IDX, TITLE, CONTENT, READ_CNT, AGREE_CNT, REG_DATE]
    usage: 일간 베스트 게시물 추출
    constraints:
      - WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
      - LIMIT 10 이하
      - SELECT * 금지

  - name: COMMENT
    columns: [COMMENT_IDX, BOARD_IDX, CONTENT]
    usage: 댓글 반응 분석 (선택)
    constraints:
      - BOARD_IDX 인덱스 필수 사용
```

---

## 제약사항

| 카테고리 | 항목       | 설명                              |
| -------- | ---------- | --------------------------------- |
| **보안** | PII 마스킹 | 환자/의사 식별정보 대본 포함 금지 |
| **성능** | 쿼리 시간  | 3초 미만 (인덱스 활용)            |
| **규격** | 대본 길이  | 3분 (450~500 단어)                |

---

## 산출물 체크리스트

### Phase A (Analysis)
- [ ] analysis/best_posts.sql
- [ ] analysis/query_result.json
- [ ] analysis/analysis_report.md

### Phase B (Design)
- [ ] HANDOFF.md
- [ ] IA.md
- [ ] Wireframe.md
- [ ] SDD.md

### Phase C (Implementation)
- [ ] **Backend**: `backend/src/routes/podcast/` (API 엔드포인트)
  - `GET /api/podcast/script` - 대본 조회 API
  - `GET /api/podcast/best-posts` - 베스트 게시물 조회 API
- [ ] **Frontend**: `frontend/src/features/podcast-player/`
  - `PodcastPlayer.tsx` - 메인 플레이어 컴포넌트
  - `ScriptDisplay.tsx` - 대본 표시 컴포넌트
  - `PlayButton.tsx` - 재생 버튼 (TTS 시뮬레이션)
- [ ] **엔트리포인트 연결**
  - Backend: `backend/src/index.ts`에 라우터 등록
  - Frontend: `frontend/src/main.tsx`에 컴포넌트 렌더링

---

## API 명세 (예상)

### GET /api/podcast/script

```json
{
  "title": "무찌마 데일리 핫토픽",
  "date": "2026-01-07",
  "duration": "3:00",
  "script": [
    { "speaker": "Host", "text": "안녕하세요, 무찌마 데일리입니다." },
    { "speaker": "Guest", "text": "오늘도 핫한 토픽 들고 왔습니다!" }
  ]
}
```

### GET /api/podcast/best-posts

```json
{
  "posts": [
    { "BOARD_IDX": 123, "TITLE": "...", "AGREE_CNT": 19 }
  ]
}
```

---

**END OF PRD**
