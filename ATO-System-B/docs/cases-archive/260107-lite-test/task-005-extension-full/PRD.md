# PRD: 무찌마 일간 베스트 팟캐스트 페이지

| 항목          | 내용                                     |
| ------------- | ---------------------------------------- |
| **Case ID**   | 260107-lite-test/task-005-extension-full |
| **PRD 버전**  | 1.0.0                                    |
| **작성일**    | 2026-01-08                               |
| **작성자**    | ATO Team                                 |
| **참조 문서** | DOMAIN_SCHEMA.md, DB_ACCESS_POLICY.md    |

---

## 목적 (Objective)

무찌마 커뮤니티의 24시간 내 인기 게시물을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, 웹 페이지에서 재생 가능한 팟캐스트 플레이어를 제공한다.

> **요약**: "일간 베스트 게시물 5건 → 3분 팟캐스트 대본 → 웹 플레이어 UI"

---

## 타겟 유저 (Target User)

| 항목              | 설명                           |
| ----------------- | ------------------------------ |
| **Persona**       | 시간 부족한 3040 봉직의/개원의 |
| **Pain Point**    | 커뮤니티 정독 시간 부족        |
| **Needs**         | 이동 중 오디오로 트렌드 파악   |
| **사용 시나리오** | 출퇴근 중 3분 팟캐스트 청취    |

---

## 시장/경쟁 분석 (Market Analysis)

> **Deep-dive 필수 섹션**: 경쟁 환경과 차별화 전략 분석

### 경쟁사 벤치마킹

| 경쟁사/서비스        | 유사 기능                 | 강점                 | 약점                         | 우리 차별점                              |
|----------------------|--------------------------|----------------------|------------------------------|-------------------------------------------|
| 커뮤니티 요약 뉴스레터 | 인기글 요약/푸시          | 빠른 소비, 정리된 포맷 | 의료 커뮤니티 특화 정보 부족 | 의료 커뮤니티 특화 + 오디오 제공          |
| 오디오 브리핑 앱      | 짧은 뉴스 오디오 요약     | 청취 경험 우수         | 실시간 커뮤니티 트렌드 반영 약함 | 24시간 커뮤니티 베스트 기반 콘텐츠        |

### 시장 기회

| 항목 | 분석 내용 |
|------|----------|
| **시장 규모** | 국내 의료 커뮤니티 활성 사용자 5만~10만, 오디오 소비 잠재 3만+ |
| **성장 트렌드** | 이동 중 오디오 소비 증가, 짧은 요약 콘텐츠 선호 확대 |
| **진입 장벽** | 의료 커뮤니티 접근 권한, PII 리스크 관리, 음성 스크립트 품질 |

---

## 핵심 기능 (Core Features)

| ID  | Phase | 기능명               | 설명                                             | 검증 방법                   |
| --- | ----- | -------------------- | ------------------------------------------------ | --------------------------- |
| F1  | A     | 일간 베스트 추출     | BOARD_MUZZIMA에서 24시간 내 조회수/댓글 상위 5건 | SQL 실행 후 5건 반환 확인   |
| F2  | A     | PII 마스킹           | 환자/의사 개인정보 마스킹 처리                   | 대본에 개인정보 포함 여부 검사 |
| F3  | C     | 대본 생성 API        | Host/Guest 2인 대화 구어체 스크립트 API          | API 호출 시 JSON 응답 확인  |
| F4  | C     | 팟캐스트 플레이어 UI | 대본 표시 + 재생 버튼 (TTS 시뮬레이션)           | 브라우저에서 UI 렌더링 확인 |

---

## 가설 검증 계획 (Hypothesis Validation)

> **Deep-dive 필수 섹션**: 핵심 가설과 검증 전략

| ID | 가설 | 검증 방법 | 성공 기준 | 실패 시 대안 |
|----|------|----------|----------|-------------|
| H1 | 일간 베스트 5건 기반 3분 대본이면 3040 의료인이 끝까지 듣는다 | 베타 사용자 청취 로그/설문 분석 | 완주율 ≥ 70% | 대본 길이 2분으로 축소 또는 토픽 수 조정 |
| H2 | Host/Guest 2인 대화 형식이 이해도와 몰입도를 높인다 | A/B 테스트 (내레이션 vs 대화체) | 만족도 평균 4.0/5 이상 | 내레이션형 스크립트 옵션 제공 |

---

## 리스크 분석 (Risk Assessment)

> **Deep-dive 필수 섹션**: 예상 리스크와 완화 전략

| ID | 리스크 | 카테고리 | 발생 확률 | 영향도 | 완화 전략 |
|----|--------|----------|----------|--------|----------|
| R1 | PII 노출로 인한 컴플라이언스 이슈 | 보안 | H | H | 블랙리스트 마스킹, 수동 검수, 로그 필터링 |
| R2 | 대본 품질 저하로 사용자 이탈 | 운영 | M | H | 샘플링 기준 강화, 품질 리뷰, 실패 시 텍스트 요약 제공 |

### 리스크 매트릭스

```
영향도 ↑
  H │ R1  │      │ 🚨   │
  M │      │ R2  │      │
  L │      │      │      │
    └──────┴──────┴──────→ 발생확률
       L      M      H
```

---

## 성공 지표 (Success Criteria)

### 정량적 지표

| 지표           | 목표값     | 측정 방법                       |
| -------------- | ---------- | ------------------------------- |
| API 응답 시간  | < 500ms    | `/api/podcast/script` 응답 시간 |
| 대본 단어 수   | 450~500    | 생성된 대본 단어 카운트         |
| 빌드 성공률    | 100%       | `npm run build` PASS            |

### 정성적 지표

| 지표           | 판단 기준                               |
| -------------- | --------------------------------------- |
| 대본 자연스러움 | Host/Guest 대화가 구어체로 자연스러운가 |
| UI 사용성      | 플레이어 UI가 직관적으로 조작 가능한가  |

---

## PRD 유형 및 파이프라인

```yaml
pipeline: full
rationale: "데이터 분석 → 설계 → 구현까지 전 과정을 포함한 Deep-dive가 필요"

phases:
  - id: A
    name: Analysis
    input: PRD.md
    output: [analysis/best_posts.sql, analysis/query_result.json, analysis/analysis_report.md]

  - id: B
    name: Design
    input: Phase A 결과물
    output: [HANDOFF.md, IA.md, Wireframe.md, SDD.md]

  - id: C
    name: Implementation
    input: Phase B 결과물 + HANDOFF.md
    output:
      - backend/src/routes/podcast/
      - frontend/src/features/podcast-player/
```

---

## 데이터 요구사항 (Data Requirements)

### 대상 테이블

```yaml
data_requirements:
  tables:
    - name: BOARD_MUZZIMA
      columns: [BOARD_IDX, TITLE, CONTENT, READ_CNT, AGREE_CNT, REG_DATE]
      row_count: 8000000
      risk_level: MEDIUM
      sampling_strategy: 최근 24시간 REG_DATE 필터 후 READ_CNT/AGREE_CNT 상위 5~10
      index_columns: [REG_DATE, READ_CNT, AGREE_CNT]

    - name: COMMENT
      columns: [COMMENT_IDX, BOARD_IDX, CONTENT]
      row_count: 50000000
      risk_level: HIGH
      sampling_strategy: 베스트 게시물 BOARD_IDX 기준 필터링
      index_columns: [BOARD_IDX]

db_connection:
  config: ".env에 구성"
  account: "ai_readonly"
  permission: SELECT_ONLY
```

### SQL 제약 사항

| #   | 제약 사항                                       | 검증 방법               |
| --- | ----------------------------------------------- | ----------------------- |
| 1   | REG_DATE >= NOW() - INTERVAL 24 HOUR           | WHERE 조건 확인         |
| 2   | LIMIT 10 이하                                   | LIMIT 값 검사           |
| 3   | SELECT * 금지                                   | 컬럼 명시 여부 확인     |
| 4   | COMMENT 조회 시 BOARD_IDX 인덱스 사용           | EXPLAIN 결과 확인       |

---

## 레퍼런스 서비스 (Reference, 선택)

> 필요 시 이 섹션을 부록으로 복사해 사용

| 서비스                 | 참고 패턴                 | 적용 포인트                    |
| ---------------------- | ------------------------- | ------------------------------ |
| 데일리 커뮤니티 브리핑 | 상위 토픽 요약             | 3분 내 핵심 요약 포맷          |
| 짧은 뉴스 오디오       | 간결한 오디오 스크립트      | Host/Guest 대화체 구성 참고    |

---

## 산출물 체크리스트 (Deliverables)

### Phase A (Analysis)

```yaml
deliverables:
  - name: "analysis/best_posts.sql"
    type: SQL_QUERY
    criteria:
      - REG_DATE 24시간 필터
      - LIMIT 10 이하
      - SELECT * 없음
    validation: SQL 정적 검증 + 샘플 실행

  - name: "analysis/query_result.json"
    type: ANALYSIS_TABLE
    criteria:
      - 상위 5건 포함
      - 필드 누락 없음
    validation: 결과 스키마 검사

  - name: "analysis/analysis_report.md"
    type: REPORT
    criteria:
      - 요약/인사이트 포함
      - 리스크 항목 기술
    validation: 문서 리뷰
```

### Phase B (Design)

```yaml
deliverables:
  - name: "HANDOFF.md"
    type: REPORT
    criteria:
      - Output/Constraints/CompletionCriteria 포함
      - 파일 경로 명시
    validation: 프로토콜 체크

  - name: "IA.md"
    type: REPORT
    criteria:
      - 페이지 구조 정의
      - 사용자 흐름 포함
    validation: 리뷰 승인

  - name: "Wireframe.md"
    type: REPORT
    criteria:
      - 필수 컴포넌트 포함
      - 플레이어 상태 정의
    validation: 리뷰 승인

  - name: "SDD.md"
    type: METADATA
    criteria:
      - API/컴포넌트 명세
      - 스키마 매핑
    validation: 스키마 정합성 체크
```

### Phase C (Implementation)

```yaml
deliverables:
  - name: "backend/src/routes/podcast/"
    type: SOURCE_CODE
    location: "backend/src/routes/podcast/"
    criteria:
      - GET /api/podcast/script 구현
      - GET /api/podcast/best-posts 구현
    validation: API 응답 형식 검증

  - name: "frontend/src/features/podcast-player/"
    type: SOURCE_CODE
    location: "frontend/src/features/podcast-player/"
    criteria:
      - PodcastPlayer/ScriptDisplay/PlayButton 포함
      - 상태 전이 정의
    validation: UI 렌더링 확인
```

---

## 제약사항 (Constraints)

| 카테고리     | 항목       | 설명                              |
| ------------ | ---------- | --------------------------------- |
| **보안**     | PII 마스킹 | 환자/의사 식별정보 대본 포함 금지 |
| **성능**     | 쿼리 시간  | 3초 미만 (인덱스 활용)            |
| **규격**     | 대본 길이  | 3분 (450~500 단어)                |
| **톤앤매너** | 대화체     | 전문적이되 부담 없는 톤 유지      |

---

## HITL 체크포인트

| Phase  | 체크포인트               | 승인 조건                             | 실패 시            |
| ------ | ------------------------ | ------------------------------------- | ------------------ |
| A→B    | 베스트 게시물 추출 승인  | 상위 5건 품질 확인, PII 없음          | Phase A 재실행     |
| B→C    | 설계 산출물 승인         | IA/SDD/Wireframe 정합성 확인          | 대본 수정 요청     |
| C 완료 | API/UI 기능 검증         | 빌드 성공, API 응답 형식 일치         | 코드 수정 요청     |
| 최종   | 릴리스 리스크 승인       | 보안/성능 기준 충족                   | 배포 보류          |

---

**END OF PRD**
