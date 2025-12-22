# DOCUMENT_PIPELINE.md

> **문서 버전**: 1.2.1
> **최종 업데이트**: 2025-12-22
> **상위 문서**: `CLAUDE.md` > **대상**: 리더 에이전트

---

## 🎯 이 문서의 목적

**"설계도 없는 집은 무너집니다."**

요구사항(PRD)부터 구현(TDD)까지 문서가 물 흐르듯 이어지는 파이프라인을 정의합니다.
특히, **기획(PRD)과 레거시(Schema) 사이의 간극을 SDD 단계에서 메우는 것**이 핵심입니다.

---

## 🔄 전체 파이프라인

```
Feature Request → PRD → IA/User Flow → SDD → API Spec → TDD Spec → Code Implementation
                                        ↑
                              DOMAIN_SCHEMA (필수 참조)
```

---

## 🚫 역방향 흐름 금지 (Reverse Flow Protection)

**"코드에서 문서를 역생성하는 행위는 문서 변조로 간주합니다."**

### 허용되는 방향 (Forward Flow)

```
PRD → IA/Wireframe → SDD → API Spec → TDD Spec → Code
       ────────────────────────────────────────────→
```

### 금지되는 방향 (Reverse Flow)

```
Code → SDD 수정     ❌ 금지
Code → PRD 수정     ❌ 금지
구현 → 설계 변경     ❌ 금지
```

### 위반 시 대응

| 상황                                    | 대응                                  |
| --------------------------------------- | ------------------------------------- |
| Sub-agent가 코드 기반으로 SDD 수정 요청 | 즉시 거부, Leader에게 보고            |
| 구현 중 설계 변경 필요 발견             | 작업 중단 → Leader에게 설계 변경 요청 |
| 코드 리뷰 중 PRD 불일치 발견            | 코드 수정 (PRD 변경 아님)             |

> **원칙**: 설계 변경은 반드시 Leader Agent를 통해 정방향으로만 진행

---

## 📝 문서 생성 단계

### 1️⃣ PRD (Product Requirements Document)

**입력:** `FEATURE_REQUEST`, `AI_Playbook.md`
**출력:** 구조화된 요구사항 문서

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

### 2️⃣ IA & User Flow

**입력:** `PRD`
**출력:** 화면 구조 및 흐름도 (Mermaid)

- **핵심 질문:** 사용자의 동선이 끊기지 않는가?

### 3️⃣ SDD (Software Design Document) - 🚨 가장 중요

**입력:** `PRD`, `User Flow`, `DOMAIN_SCHEMA.md`
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

### 4️⃣ API Spec

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

### 5️⃣ TDD Spec

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

### 📋 리더 에이전트 체크리스트 (Quality Gate)

문서를 다음 단계로 넘기기 전, 반드시 아래 항목을 검증하세요.

**PRD → SDD 단계**

- [ ] 기획된 기능이 `DOMAIN_SCHEMA.md`의 기존 테이블로 소화 가능한가?
- [ ] 대용량 테이블(로그인, 댓글)을 건드리는 기능인가? (위험도 체크)

**SDD → TDD 단계**

- [ ] 테스트 케이스가 "실제 컬럼명(`U_ID` 등)"을 사용하고 있는가?
- [ ] 레거시 데이터(삭제 플래그, 승인 플래그) 처리가 시나리오에 있는가?

---

## 📚 관련 문서

| 문서               | 역할                             |
| ------------------ | -------------------------------- | ------------------------------------------ |
| `DOMAIN_SCHEMA.md` | `.claude/rules/DOMAIN_SCHEMA.md` | **SDD 작성 시 필수 참조** (DB 구조 확인)   |
| `TDD_WORKFLOW.md`  | `.claude/rules/TDD_WORKFLOW.md`  | **TDD Spec 작성 시 필수 참조** (규칙/절차) |
| `AI_Playbook.md`   | `.claude/context/AI_Playbook.md` | PRD 작성 시 필수 참조 (비즈니스 목표)      |

---

**END OF DOCUMENT_PIPELINE.MD**

문서는 죽어있는 글자가 아니라, **실행될 코드의 예언서**여야 합니다.
