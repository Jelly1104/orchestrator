# DOCUMENT_PIPELINE.md

> **문서 버전**: 1.4.1
> **최종 업데이트**: 2026-01-05
> **변경 이력**: 섹션 이모지/번호 제거, 스타일 통일

> **물리적 경로**: `.claude/workflows/DOCUMENT_PIPELINE.md` > **상위 문서**: `CLAUDE.md` > **대상**: 리더 에이전트

---

## 이 문서의 목적

**"설계도 없는 집은 무너집니다."**

요구사항(PRD)부터 구현(TDD)까지 문서가 물 흐르듯 이어지는 파이프라인을 정의합니다.
특히, **기획(PRD)과 레거시(Schema) 사이의 간극을 SDD 단계에서 메우는 것**이 핵심입니다.

---

## 전체 파이프라인

> **다이어그램**: README.md 섹션 8 참조

1. **PRD 입력** → Gap Check → [HITL: 기획 승인] → Leader가 HANDOFF.md 생성
2. **Phase A** (Optional): Analyzer가 HANDOFF 기반 SQL 실행 → ImpLeader 검증 → 분석 리포트
3. **Phase B**: Designer가 HANDOFF 기반 IA/Wireframe/SDD 작성 → ImpLeader 검증 → [HITL: 설계 승인]
4. **Phase C**: Coder가 HANDOFF/SDD 기반 TDD Cycle 실행 → ImpLeader 검증 → [HITL: 배포 승인] → Deploy

---

## 파이프라인 타입별 흐름

Leader의 `{ router: "..." }` 출력에 따라 6가지 파이프라인 중 하나가 실행됩니다.

| 타입              | Phase 조합 | 흐름 요약                                                 |
| ----------------- | ---------- | --------------------------------------------------------- |
| `analysis`        | A만        | PRD → HANDOFF → Analyzer(SQL) → 분석 리포트               |
| `design`          | B만        | PRD → HANDOFF → Designer(IA/WF/SDD) → 설계 ㅈ문서         |
| `code`            | C만        | HANDOFF → Coder(구현) → 소스코드                          |
| `analyzed_design` | A→B        | PRD → HANDOFF → Analyzer → Designer → 설계 문서           |
| `ui_mockup`       | B→C        | PRD → HANDOFF → Designer → Coder → UI 코드                |
| `full`            | A→B→C      | PRD → HANDOFF → Analyzer → Designer → Coder → 전체 산출물 |

### 타입별 상세

**analysis (A만)**: 데이터 분석만 필요한 경우

- 산출물: `*.sql`, `analysis_result.json`, `report.md`
- 예: 세그먼트 분석, KPI 리포트

**design (B만)**: 설계만 필요한 경우

- 산출물: `IA.md`, `Wireframe.md`, `SDD.md`
- 예: 신규 화면 기획, UX 개선 제안

**code (C만)**: 이미 설계(SDD)가 있고 구현만 필요한 경우

- 산출물: `backend/src/*`, `frontend/src/*`, `tests/*`
- 예: SDD, HANDOFF 기반 코딩, 버그 수정

**analyzed_design (A→B)**: 분석 후 설계가 필요한 경우

- 산출물: `*.sql`, `analysis_result.json`, `report.md`, `IA.md`, `Wireframe.md`, `SDD.md`
- 예: 데이터 기반 UX 설계, 인사이트 → 제안

**ui_mockup (B→C)**: 분석 없이 설계부터 화면 구현까지

- 산출물: `IA.md`, `Wireframe.md`, `SDD.md`, `frontend/src/*`, `tests/*`
- 예: 신규 기능 개발 (IA/WF → React 컴포넌트)

**full (A→B→C)**: 전체 파이프라인

- 산출물: `*.sql`, `analysis_result.json`, `report.md`, `IA.md`, `Wireframe.md`, `SDD.md`, `backend/src/*`, `frontend/src/*`, `tests/*`
- 예: 데이터 분석부터 화면 구현까지 전체 흐름

---

## 역방향 흐름 금지 (Reverse Flow Protection)

**"코드에서 문서를 역생성하는 행위는 문서 변조로 간주합니다."**

### 허용되는 방향 (Forward Flow)

```
PRD → HANDOFF → IA/Wireframe → SDD → API Spec → TDD Spec → Code
      ─────────────────────────────────────────────────────────→
```

### 금지되는 방향 (Reverse Flow)

```
Code → SDD 수정     ❌ 금지
Code → PRD 수정     ❌ 금지
구현 → 설계 변경     ❌ 금지
```

### 위반 시 대응

| 상황                                | 대응                                  |
| ----------------------------------- | ------------------------------------- |
| Coder가 코드 기반으로 SDD 수정 요청 | 즉시 거부, Leader에게 보고            |
| 구현 중 설계 변경 필요 발견         | 작업 중단 → Leader에게 설계 변경 요청 |
| 코드 리뷰 중 PRD 불일치 발견        | 코드 수정 (PRD 변경 아님)             |

> **원칙**: 설계 변경은 반드시 Leader를 통해 정방향으로만 진행

---

## 문서 생성 단계

### PRD (Product Requirements Document)

**입력:** 사용자가 `PRD_GUIDE.md` 양식에 맞춰 작성한 PRD (+ 선택적 Task 문장)
**출력:** Gap Check 통과된 PRD → Leader가 HANDOFF.md 생성
**참조:** `AI_Playbook.md` (비즈니스 목표)

- **핵심 질문:** 이 기능이 `AI_Playbook.md`의 수익 모델(B2B/B2C)과 연결되는가?

```markdown
## 문제 정의

[사용자가 겪고 있는 문제]

## 비즈니스 임팩트 (Why)

- 수익 모델: [채용공고(B2C) / 제약광고(B2B) 등]
- 예상 효과: [매출 증대 / 트래픽 확보]

## 범위 (Scope)

- In Scope: [포함 기능]
- Out of Scope: [제외 기능]

## 사용자 스토리

1. [User]는 [Goal]을 위해 [Action]을 할 수 있다.
```

### IA & User Flow

**입력:** `HANDOFF.md` (PRD 기반)
**출력:** 화면 구조 및 흐름도 (Mermaid)

- **핵심 질문:** 사용자의 동선이 끊기지 않는가?

### SDD (Software Design Document)

> **HITL 참조**: SDD 생성 완료 후 **Human-in-the-Loop 설계 승인** 체크포인트가 트리거됩니다.
> 상세 정의는 `ROLE_ARCHITECTURE.md`의 **HITL 체크포인트** 섹션을 참조하세요.

**입력:** `HANDOFF.md`, `User Flow`, `DOMAIN_SCHEMA.md`
**출력:** 기술 설계 문서 (구현의 진실 공급원)

- **핵심 질문:** **이 기획이 실제 레거시 DB 구조에서 구현 가능한가?**
- **필수 행동:** `DOMAIN_SCHEMA.md`를 열고 매핑되는 테이블을 찾으십시오.

```markdown
## 1. 아키텍처 개요

[시스템 구조 다이어그램]

## 2. 레거시 스키마 매핑 (Legacy Mapping)

- **사용자 정보**: `USERS` 테이블 (U_ID, U_KIND 사용)
- **게시글**: `BOARD_MUZZIMA` (신규 테이블 생성 X, 기존 활용)
- **제약사항**: `COMMENT` 테이블 조회 시 반드시 페이징 처리 필수

## 3. 데이터 모델 변경

- [ ] 기존 테이블 컬럼 추가 필요? (최대한 지양)
- [ ] 신규 테이블 생성 필요? (DBA 승인 필요)

## 4. API 설계 (Draft)

- GET /api/v1/board/{board_idx}
```

### API Spec

**입력:** `SDD`
**출력:** OpenAPI/Swagger 스펙

```yaml
openapi: 3.0.0
paths:
  /api/v1/board/{board_idx}:
    get:
      summary: 게시글 상세 조회 (레거시 BOARD_* 매핑)
      parameters:
        - name: board_idx
          description: Legacy BOARD_IDX
```

### TDD Spec

**입력:** `SDD`, `API Spec`, `TDD_WORKFLOW.md`
**출력:** 테스트 요구사항 문서

```markdown
## TC-001: 게시글 조회 성공

- **Given**: `BOARD_MUZZIMA`에 유효한 `BOARD_IDX=100` 데이터 존재
- **When**: `GET /api/v1/board/100` 호출
- **Then**: 200 OK 및 `TITLE`, `CONTENT` 반환 확인

## TC-002: 삭제된 게시글 조회 (Legacy Logic)

- **Given**: `DEL_FLAG='Y'`인 데이터
- **When**: 조회 시도
- **Then**: 404 Not Found 또는 삭제된 게시글 메시지
```

---

### Quality Gate (문서 단계별 검증)

> **검증 주체**: ImpLeader가 1차 검증 → Leader가 최종 승인
> **상세 기준**: `VALIDATION_GUIDE.md`의 **Quality Gates** 섹션 참조

문서를 다음 단계로 넘기기 전, 아래 항목을 검증합니다.

**HANDOFF → SDD 단계**

- [ ] 기획된 기능이 `DOMAIN_SCHEMA.md`의 기존 테이블로 소화 가능한가?
- [ ] 대용량 테이블(로그인, 댓글)을 건드리는 기능인가? (위험도 체크)

**SDD → TDD 단계**

- [ ] 테스트 케이스가 "실제 컬럼명(`U_ID` 등)"을 사용하고 있는가?
- [ ] 레거시 데이터(삭제 플래그, 승인 플래그) 처리가 시나리오에 있는가?

---

## 관련 문서

| 문서                   | 물리적 경로                              | 역할                                       |
| ---------------------- | ---------------------------------------- | ------------------------------------------ |
| `ROLE_ARCHITECTURE.md` | `.claude/workflows/ROLE_ARCHITECTURE.md` | **HITL 체크포인트** 섹션                   |
| `DOMAIN_SCHEMA.md`     | `.claude/rules/DOMAIN_SCHEMA.md`         | **SDD 작성 시 필수 참조** (DB 구조 확인)   |
| `TDD_WORKFLOW.md`      | `.claude/rules/TDD_WORKFLOW.md`          | **TDD Spec 작성 시 필수 참조** (규칙/절차) |
| `AI_Playbook.md`       | `.claude/context/AI_Playbook.md`         | PRD 작성 시 필수 참조 (비즈니스 목표)      |
| `PRD_GUIDE.md`         | `.claude/workflows/PRD_GUIDE.md`         | PRD 양식 및 작성 가이드                    |

---

**END OF DOCUMENT_PIPELINE.MD**

문서는 죽어있는 글자가 아니라, **실행될 코드의 예언서**여야 합니다.
