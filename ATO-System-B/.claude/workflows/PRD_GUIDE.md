# PRD 통합 가이드 v2.4

> **문서 버전**: 2.5.0
> **최종 업데이트**: 2026-01-06
> **물리적 경로**: `.claude/workflows/PRD_GUIDE.md`
> **다이어그램**: README.md 참조

---

## 로딩 설정

| Role        | 로딩 문서                            |
| ----------- | ------------------------------------ |
| PRDAnalyzer | 이 문서                              |
| Leader      | 이 문서 (PRD 필수 항목, 파이프라인 정의만) |

---

## PRD 필수 항목 (5개)

| 항목                             | 질문           | 검증 기준                              |
| -------------------------------- | -------------- | -------------------------------------- |
| **목적** (Objective)             | 왜 만드는가?   | "~를 위해 ~를 만든다" 형태로 요약 가능 |
| **타겟 유저** (Target User)      | 누가 쓰는가?   | 페르소나/역할 명확 정의                |
| **핵심 기능** (Core Features)    | 무엇을 하는가? | 테스트 가능한 단위 (동사+목적어)       |
| **성공 지표** (Success Criteria) | 어떻게 판단?   | 정량 측정 또는 명확한 완료 조건        |
| **파이프라인** (Pipeline)        | 어떤 Phase?    | 파이프라인 정의 섹션 참조 (6개 중 택1) |

---

## 파이프라인 정의

> **파이프라인 타입**: 6가지 파이프라인(analysis, design, code, analyzed_design, ui_mockup, full) 정의는 `ROLE_ARCHITECTURE.md`의 **파이프라인 타입** 섹션 참조

> **🔑 HANDOFF 필수**: 모든 파이프라인은 Leader가 생성한 `HANDOFF.md`를 기반으로 실행됩니다.
>
> - Leader → `{ pipeline: "...", handoff: {...} }` 출력
> - Orchestrator → `docs/cases/{caseId}/{taskId}/HANDOFF.md`로 저장
> - 해당 Phase의 Role이 HANDOFF를 입력으로 받아 작업 수행

---

## Extension 경량 실행 모드

> **용도**: VSCode Extension에서 Orchestrator 없이 개별 Skill 직접 호출

| 항목 | Orchestrator (Full) | Extension (Lite) |
|------|---------------------|------------------|
| PRD 템플릿 | PRD_FULL.md | PRD_LITE.md |
| Skill 정의 | `orchestrator/tools/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| 실행 방식 | 파이프라인 자동 라우팅 | `skills` 배열 순차 실행 |
| HITL | 자동 체크포인트 | 수동 확인 |

### Extension 호출 예시

```yaml
# PRD_LITE.md
skills: [query, profiler]  # /query → /profiler 순차 실행
```

> **Skill 정의**: `.claude/skills/` 폴더의 SKILL.md 참조

---

## 파이프라인 판별 기준

### 키워드 기반 판별

```yaml
# Pipeline: analysis (A만)
analysis_keywords:
  - 분석, 통계, 세그먼트, 코호트, KPI, SQL, 쿼리, 리포트

# Pipeline: design (B만)
design_keywords:
  - 설계, UX, UI, 제안, IA, Wireframe, 화면구조

# Pipeline: code (C만)
code_keywords:
  - 구현만, 코딩, 이미 설계됨, HANDOFF 기반

# Pipeline: analyzed_design (A→B)
analyzed_design_keywords:
  - 분석 → 설계, 데이터 기반 UX, 인사이트 → 제안

# Pipeline: ui_mockup (B→C)
ui_mockup_keywords:
  - 설계 → 화면구현, IA/WF 기반 UI 코드, 화면만 구현

# Pipeline: full (A→B→C)
full_keywords:
  - 전체 파이프라인, 처음부터 끝까지, 분석→설계→구현
```

### 산출물 기반 판별

| 산출물                    | analysis | design | analyzed_design | ui_mockup | full |
| ------------------------- | :------: | :----: | :-------------: | :-------: | :--: |
| SQL 쿼리                  |    ✅    |        |       ✅        |           |  ✅  |
| 분석 테이블/차트          |    ✅    |        |       ✅        |           |  ✅  |
| 설계 문서 (IA, Wireframe) |          |   ✅   |       ✅        |    ✅     |  ✅  |
| 소스 코드                 |          |        |                 |    ✅     |  ✅  |

---

## 파이프라인별 흐름

> **상세 흐름**: 각 파이프라인의 입력/산출물 및 상세 흐름은 `DOCUMENT_PIPELINE.md`의 **타입별 상세** 섹션 참조

> **HITL 참조**: ROLE_ARCHITECTURE.md의 **HITL 체크포인트** 섹션 참조

---

## 레퍼런스 자동 매핑

| 카테고리    | 키워드           | 레퍼런스            | 핵심 패턴         |
| ----------- | ---------------- | ------------------- | ----------------- |
| 데이터 분석 | 분석, 세그먼트   | Amplitude, Mixpanel | 필터→그룹핑→비교  |
| CRUD 서비스 | 관리, 목록, 등록 | Admin 템플릿        | 검색+필터+테이블  |
| 온보딩      | 가이드, 튜토리얼 | Slack, Notion       | 단계별→체크리스트 |
| 시각화      | 차트, 대시보드   | GA, Tableau         | KPI 카드+트렌드   |

---

## 산출물 타입 정의

| Type             | 설명            | 검증 기준                                                   |
| ---------------- | --------------- | ----------------------------------------------------------- |
| `SQL_QUERY`      | SQL 쿼리        | 문법 유효, DOMAIN_SCHEMA 일치                               |
| `ANALYSIS_TABLE` | 분석 테이블     | 데이터 존재, 헤더 정의                                      |
| `REPORT`         | Markdown 리포트 | 필수 섹션 존재                                              |
| `PROPOSAL`       | 제안서/인사이트 | 액션 아이템 포함                                            |
| `IA_DOCUMENT`    | 정보 구조       | 레벨 구조, 네이밍                                           |
| `WIREFRAME`      | 화면 구조       | ASCII/Markdown 형식                                         |
| `SDD`            | 설계 명세       | API/컴포넌트 정의                                           |
| `CODE`           | 소스 코드       | 실행 가능한 코드 (FE: 실행/렌더링 가능, BE: 동작 검증 가능) |

---

## 조건부 필수 항목

### 데이터 요구사항 (analysis 파이프라인 필수)

```yaml
data_requirements:
  tables:
    - name: USERS
      columns: [U_ID, U_KIND, U_ALIVE]

db_connection:
  host: "222.122.26.242"
  database: "medigate"
```

### 산출물 체크리스트 (권장)

```yaml
deliverables:
  - name: "활성 회원 세그먼트 SQL"
    type: SQL_QUERY
    criteria: "HEAVY 조건, SELECT문"
```

---

## PRD 완성도 체크

| 구분   | 항목                              | 체크 |
| ------ | --------------------------------- | :--: |
| 필수   | 목적, 타겟, 기능, 지표, pipeline  | [ ]  |
| 조건부 | 데이터 요구사항 (analysis 포함 시) | [ ]  |
| 선택   | 참조 서비스, 제약사항             | [ ]  |

**검증 규칙**:

1. 필수 5개 미충족 → PRD 보완 요청
2. analysis/analyzed_design/full인데 데이터 요구사항 없음 → 보완 요청

---

## 관련 문서

| 문서                 | 역할                                  |
| -------------------- | ------------------------------------- |
| DOMAIN_SCHEMA.md     | 테이블/컬럼 정의 (analysis 포함 시 필수) |
| ROLE_ARCHITECTURE.md | HITL 체크포인트                       |
| VALIDATION_GUIDE.md  | 산출물 검증 기준                      |
| README.md            | 파이프라인 다이어그램                 |

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                                                 |
| ----- | ---------- | ------------------------------------------------------------------------- |
| 2.5.0 | 2026-01-06 | Extension 경량 실행 모드 섹션 추가                                        |
| 2.4.0 | 2026-01-05 | type 필드 제거, pipeline만 사용, 섹션 번호 제거, 섹션 이름 기반 참조 전환 |
| 2.3.0 | 2026-01-05 | HANDOFF 필수 입력 명시                                                    |
| 2.2.0 | 2025-12-30 | 파이프라인 타입 3개→6개 확장                                              |
| 2.1.0 | 2025-12-29 | 300줄 다이어트: Mermaid→README.md                                         |

---

**END OF PRD_GUIDE.md**
