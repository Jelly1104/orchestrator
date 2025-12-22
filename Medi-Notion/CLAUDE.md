# CLAUDE.md

> **문서 버전**: 3.4.1
> **최종 업데이트**: 2025-12-19
> **관리자**: 미래전략실 (ATO Team)
> **변경 이력**: Human-in-the-Loop 사이클 추가, Task ID 네이밍 규칙 추가

---

## 🤖 LLM 에이전트 연동

Leader Agent (LLM-Agnostic)는 프로젝트 루트의 `CLAUDE.md`를 **자동으로 읽습니다**.
이 파일이 진입점 역할을 하며, 상세 규칙은 `SYSTEM_MANIFEST.md에` 정의된 경로를 참조합니다.

> **Multi-LLM 지원**: Leader/Sub-agent는 Claude, GPT-4, Gemini 등으로 교체 가능합니다.

### 📋 Agent별 필수 로딩 문서

| Agent             | 필수 로딩 문서                                                                      |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Leader**        | CLAUDE.md, DOMAIN_SCHEMA, DOCUMENT_PIPELINE, AI_Playbook, QUALITY_GATES, CODE_STYLE |
| **SubAgent**      | CLAUDE.md, DOMAIN_SCHEMA, TDD_WORKFLOW, CODE_STYLE, PROJECT_STACK                   |
| **CodeAgent**     | CLAUDE.md, DOMAIN_SCHEMA, TDD_WORKFLOW, CODE_STYLE, PROJECT_STACK                   |
| **AnalysisAgent** | CLAUDE.md, DOMAIN_SCHEMA                                                            |

---

## 🎯 Context Mode (Token Diet)

작업 유형에 따라 **필요한 문서만 선택적으로 로드**하여 토큰을 절약합니다.

| 모드         | 상황      | 추가 로드할 문서                                         | 절감 |
| ------------ | --------- | -------------------------------------------------------- | ---- |
| **Planning** | 기획/설계 | `AI_Playbook.md` + `DOCUMENT_PIPELINE.md`                | ▼40% |
| **Coding**   | 구현/수정 | `TDD_WORKFLOW.md` + `CODE_STYLE.md` + `PROJECT_STACK.md` | ▼30% |
| **Review**   | 검증/QA   | `QUALITY_GATES.md` + `PRD.md`                            | ▼60% |

> **기본 로드**: `CLAUDE.md` + `DOMAIN_SCHEMA.md` (모든 모드 공통)

**사용법**: 프롬프트 시작 시 모드를 선언하세요.

```markdown
"[Coding Mode] 게시글 조회 API를 구현해줘"
```

### Context Mode별 CLAUDE.md 발췌 로딩

| 모드     | 로딩 섹션                    | 예상 토큰 |
| -------- | ---------------------------- | --------- |
| Planning | Safety Rules + 아키텍처 원칙 | ~1,500    |
| Coding   | Safety Rules + 품질 게이트   | ~1,200    |
| Review   | 품질 게이트 + 워크플로 참조  | ~1,000    |

---

## 🎯 이 문서의 목적

이 문서는 **팀 공통 "헌법"**입니다. 모든 AI 에이전트가 작업 전 반드시 읽어야 하는 최상위 컨텍스트를 제공합니다.

| 이 문서       | 팀 공통 원칙 (절대 기준)             |
| ------------- | ------------------------------------ |
| **다른 문서** | 에이전트 행동 규칙 → `AI_CONTEXT.md` |
|               | 도메인/DB 지도 → `DOMAIN_SCHEMA.md`  |
|               | 프로젝트별 스택 → `PROJECT_STACK.md` |

---

## ⚠️ 문서 우선순위 (Conflict Resolution)

```yaml
우선순위 (높음 → 낮음): 1. PROJECT_STACK.md (프로젝트별 오버라이드)
  2. CLAUDE.md (팀 공통 헌법)
  3. 기타 workflow 문서
```

**[관리 원칙]**

1. **불변성(Immutability)**: `CLAUDE.md`를 포함한 공통 문서는 프로젝트 내에서 수정하지 않는다.
2. **오버라이딩(Overriding)**: 공통 원칙과 다른 예외 사항은 반드시 `PROJECT_STACK.md`에 정의하여 우선 적용받는다.
3. 혁신과 안정의 균형 (Innovation vs Stability):

- Application Layer (Code/UX): 과감한 혁신과 리팩토링을 지향한다. (Aggressive)
- Infrastructure Layer (DB/Schema): 기존 구조의 보존과 안정성을 최우선으로 한다. (Conservative)
- 충돌 해결: "DB 스키마를 변경해야만 혁신이 가능하다"면, 혁신을 포기하고 스키마를 준수한다.

---

## 🚨 절대 금지 (Safety Rules)

AI 에이전트는 아래 행위를 **절대 수행하지 않습니다**.

### 1. 룰북 불변성 (Rulebook Immutability)

| 대상                  | 규칙                                    |
| --------------------- | --------------------------------------- |
| `.claude/rules/*`     | 🔴 **읽기 전용** - 수정/삭제 금지       |
| `.claude/workflows/*` | 🔴 **읽기 전용** - 수정/삭제 금지       |
| `.claude/context/*`   | 🔴 **읽기 전용** - 수정/삭제 금지       |
| `.claude/project/*`   | 🟢 수정 가능 (PROJECT_STACK.md, PRD.md) |
| `CLAUDE.md`           | 🔴 **읽기 전용** - 수정/삭제 금지       |

### 2. 서버 데이터 보호 (Data Protection)

| 행위              | 규칙                                    |
| ----------------- | --------------------------------------- |
| **조회 (SELECT)** | ✅ 허용 - 로컬에서 작업할 데이터 확보용 |
| **생성 (INSERT)** | 🔴 금지                                 |
| **수정 (UPDATE)** | 🔴 금지                                 |
| **삭제 (DELETE)** | 🔴 금지                                 |

**원칙**: 서버 데이터는 **조회만** 허용. 모든 데이터 조작은 **로컬에서만** 수행.
**위반 시**: 작업 즉시 중단, 사용자에게 확인 요청.

### 3. 보안 게이트 (Security Gates) 🔒

> **v3.2.0 추가**: 레드팀 분석 결과 반영

#### 3.1 입력 검증 (Input Validation)

| 항목                | 검증 규칙                                        | 위반 시 조치          |
| ------------------- | ------------------------------------------------ | --------------------- |
| **taskId**          | `/^[a-zA-Z0-9_-]+$/` 패턴만 허용                 | 즉시 거부, 에러 반환  |
| **taskDescription** | 최대 10,000자, 특수문자 이스케이프               | 잘라내기 후 경고 로깅 |
| **prdContent**      | 최대 50,000자, 토큰 예산 초과 방지               | DoS 공격 차단         |
| **파일 경로**       | projectRoot 외부 접근 금지 (Path Traversal 방지) | 즉시 중단, 보안 로깅  |

#### 3.2 프롬프트 인젝션 방어

```yaml
시스템/사용자 입력 경계 설정:
  - 사용자 입력은 반드시 [USER_INPUT] 태그로 구분
  - 시스템 프롬프트 내부에서 사용자 입력 참조 금지
  - "Ignore previous instructions" 패턴 감지 시 경고

방어 예시:
  ❌ 금지: "${taskDescription}" 직접 삽입
  ✅ 허용: "[USER_INPUT]...sanitized...[/USER_INPUT]"
```

#### 3.3 API 키 보호

| 위험        | 보호 조치                                            |
| ----------- | ---------------------------------------------------- |
| 메모리 노출 | API 키를 객체에 저장하지 않고 환경변수에서 직접 참조 |
| 로그 노출   | config 객체 로깅 시 apiKey 필드 마스킹 (`sk-***`)    |
| 에러 스택   | 에러 메시지에 API 키 포함 여부 검사 후 필터링        |

#### 3.4 재시도 제한 (Rate Limiting)

```yaml
MAX_RETRIES: 5 # 하드코딩 상한 (사용자 설정 무시)
RETRY_DELAY_MS: 1000 # 재시도 간 대기 시간
MAX_RETRIES_PER_HOUR: 20 # 시간당 최대 재시도 횟수

위반 시:
  - 작업 중단
  - 사용자에게 알림
  - Audit 로그 기록
```

---

## 📂 표준 프로젝트 구조 (Standard Directory Layout)

System B (HITL Orchestrator)는 아래의 구조를 따릅니다. 에이전트는 파일 탐색 시 이 구조를 가정해야 합니다.

```text
(Project Root)/
├── CLAUDE.md                    # 🔴 Root Constitution (진입점)
├── .claude/
│   ├── SYSTEM_MANIFEST.md       # 🧠 Control Tower (파일 맵 & 로딩 전략)
│   ├── rules/                   # [Group A] 제약 사항 (Code Style, DB Schema)
│   ├── workflows/               # [Group B] 실행 절차 (Pipeline, Architecture)
│   └── context/                 # [Group C] 배경 지식 (Playbook, Context)
├── src/
├── tests/
└── docs/
```

### 📚 룰북 구조

상세한 파일 매핑과 로딩 전략은 **.claude/SYSTEM_MANIFEST.md**에 정의되어 있습니다.

## Group A: Rules (Constraints)

엄격하게 준수해야 하는 제약 사항

문서,역할
CODE_STYLE.md,코딩 컨벤션
DOMAIN_SCHEMA.md,데이터베이스 스키마 (Source of Truth)
DB_ACCESS_POLICY.md,DB 접근 권한 및 보안 정책
VALIDATION_GUIDE.md,품질 검증 기준
TDD_WORKFLOW.md,TDD 개발 절차

## Group B: Workflows (Processes)

작업 순서와 협업 절차

문서,역할
DOCUMENT_PIPELINE.md,문서화 파이프라인 (PRD→SDD→Code)
AGENT_ARCHITECTURE.md,에이전트 협업 및 HITL 체크포인트
INCIDENT_PLAYBOOK.md,장애 대응 및 복구 절차
PRD_GUIDE.md,요구사항 정의 가이드

## Group C: Context (Philosophy)

팀의 철학 및 행동 강령

문서,역할
CLAUDE.md,최상위 헌법 (Safety Rules)
AI_Playbook.md,팀 철학 및 OKR
AI_CONTEXT.md,에이전트 세부 행동 수칙

## 📖 미래전략실 개발 가이드

### 팀 공통 목표

```markdown
- **미션**: 레거시 구조·업무 방식·개발 프로세스를 AI 중심으로 전면 재설계
- **목적**: AI 기반 병렬 협업 + 자동화로 개발 생산성 향상
- **최종 목표**: 인간 개입 최소화, 기능 개발 리드타임 30% 이상 단축
```

### AI 에이전트 행동 규칙

```markdown
1. Leader Agent (LLM-Agnostic): 설계 + 검증 담당

   - Planning Mode: PRD 분석 → SDD 설계 → 작업 분해
   - Review Mode: 품질 게이트 검증 → PASS/FAIL 판정

2. Sub-agent (LLM-Agnostic): 구현 담당
   - Coding Mode: 할당된 태스크 구현 → 테스트 작성
```

### 필수 조건 (전 영역 공통)

```yaml
타입 안정성:
  - 엄격 모드 필수 (strict, sound null safety 등)
  - 타입 회피 금지 (any, dynamic, Object 등)
  - 명시적 타입 정의

Testing:
  - 커버리지 ≥ 90% (기본값, PROJECT_STACK.md에서 오버라이드 가능)
  - TDD 사이클 준수
```

---

## 🏗️ 아키텍처 원칙

### Clean Architecture 기본 원칙

```
┌───────────────────────────────────────┐
│           Presentation (UI/API)       │  ← 외부
├───────────────────────────────────────┤
│           Application (Use Cases)     │
├───────────────────────────────────────┤
│           Domain (Entities/Rules)     │  ← 내부 (핵심)
├───────────────────────────────────────┤
│           Infrastructure (DB/External)│  ← 외부
└───────────────────────────────────────┘
```

### 의존성 규칙 (핵심 원칙)

```yaml
의존성은 항상 안쪽(내부)으로만 향해야 한다.

허용:
  - Presentation → Application → Domain
  - Infrastructure → Domain (Interface 구현)

금지:
  - Domain → Infrastructure  # 도메인은 DB를 몰라야 함
  - Domain → Presentation    # 도메인은 UI를 몰라야 함
  - Application → Presentation
```

---

## 🔗 워크플로 참조 맵

### 작업 유형별 워크플로

| 작업 유형        | 워크플로 문서           | 설명                                 |
| ---------------- | ----------------------- | ------------------------------------ |
| 🆕 기능 개발     | `TDD_WORKFLOW.md`       | Red-Green-Refactor 사이클            |
| 🐛 버그 수정     | `TDD_WORKFLOW.md`       | 버그 재현 → 수정 → 검증              |
| ✅ 품질 검증     | `QUALITY_GATES.md`      | 배포 전 최종 체크리스트              |
| 📝 문서 생성     | `DOCUMENT_PIPELINE.md`  | PRD→SDD→TDD 파이프라인               |
| 🤖 에이전트 협업 | `AGENT_ARCHITECTURE.md` | Leader/Sub-agent Handoff             |
| 🚨 장애 대응     | `INCIDENT_PLAYBOOK.md`  | 장애 유형별 대응 + Provider Fallback |

---

## 🚦 품질 게이트 (Quick Reference)

### PASS 조건 (기본값)

```yaml
테스트:
  - 모든 테스트 PASS
  - 커버리지 ≥ 90%

코드 품질:
  - Linter 0 errors
  - 컴파일 성공
  - 함수 길이 ≤ 30줄

아키텍처:
  - 의존성은 안쪽으로만 향함
  - Domain은 Infrastructure/Presentation을 몰라야 함

보안:
  - QUALITY_GATES.md 섹션 3 참조
```

상세 기준: `QUALITY_GATES.md` 참조

---

## 👤 Human-in-the-Loop (HITL) 사이클

> **v3.4.1 추가**: 인간 개입 타이밍 명시

### HITL 체크포인트 정의

AI 에이전트 실행 중 **인간 검토가 필수**인 시점을 명시합니다.

| 체크포인트    | 타이밍                 | 검토 항목                      | 담당자        |
| ------------- | ---------------------- | ------------------------------ | ------------- |
| **PRD 승인**  | 파이프라인 시작 전     | 요구사항 완전성, 비즈니스 로직 | PM/기획자     |
| **설계 검토** | Planning Phase 완료 후 | IA, Wireframe, SDD 품질        | Tech Lead     |
| **분석 검증** | Analysis Phase 완료 후 | SQL 정확성, 인사이트 타당성    | 데이터 분석가 |
| **코드 리뷰** | Coding Phase 완료 후   | 보안, 성능, 코드 품질          | 개발자        |
| **최종 승인** | 모든 Phase 완료 후     | PRD 충족 여부, 배포 준비       | PM            |

### HITL 개입 트리거

다음 상황에서 AI는 **자동으로 작업을 중단**하고 인간에게 확인을 요청합니다:

```yaml
자동 중단 트리거:
  - PRD 체크리스트 매칭률 < 80%
  - 재시도 횟수 >= 3회
  - 보안 게이트 위반 감지
  - DB 스키마 불일치 발견
  - 예상치 못한 에러 발생

중단 시 행동: 1. 현재까지 산출물 저장
  2. 에러/경고 로그 기록
  3. 사용자에게 상황 설명
  4. 명시적 승인 대기
```

### 실행 완료 후 인간 액션

파이프라인 완료 시 AI는 **완료 보고서**를 출력하며, 인간은 다음을 수행합니다:

| 순서 | 인간 액션                  | 참조 자료                    |
| ---- | -------------------------- | ---------------------------- |
| 1    | 산출물 위치 확인           | 완료 보고서의 📁 산출물 위치 |
| 2    | PRD 충족 여부 검토         | HANDOFF.md, 원본 PRD         |
| 3    | 품질 기준 확인             | QUALITY_GATES.md             |
| 4    | 피드백 반영 요청 (필요 시) | 재실행 또는 수동 수정        |
| 5    | 개발팀 전달                | HANDOFF.md                   |

### Task ID 네이밍 규칙

> 인간이 산출물을 쉽게 찾을 수 있도록 Task ID는 의미있는 형식을 사용합니다.

**형식**: `{case번호}-{short-name}-{YYYYMMDD}`

| 패턴        | 예시                              | 설명                    |
| ----------- | --------------------------------- | ----------------------- |
| 분석 케이스 | `case4-heavy-segment-20251219`    | Case 번호 + 핵심 키워드 |
| 설계 케이스 | `recruit-agent-design-20251219`   | 기능명 + design         |
| 혼합 케이스 | `case5-dormancy-predict-20251219` | Case 번호 + 핵심 동사   |

**산출물 경로 규칙**:

```
docs/{task-id}/           # 설계 문서 (IA, SDD, Wireframe)
src/analysis/{task-id}/   # 분석 결과 (SQL, JSON, 리포트)
src/features/{feature}/   # 구현 코드
orchestrator/logs/{task-id}.json  # 실행 로그
```

---

## 📚 관련 문서

| 문서                    | 역할                                       |
| ----------------------- | ------------------------------------------ |
| `AI_CONTEXT.md`         | 에이전트 행동 규칙·토큰 전략               |
| `AI_Playbook.md`        | 팀 철학·OKR·R&R                            |
| `PROJECT_STACK.md`      | **[필독]** 프로젝트별 기술 스택 템플릿     |
| `AGENT_ARCHITECTURE.md` | Leader/Sub-agent 협업 아키텍처 + Multi-LLM |
| `OUTPUT_VALIDATION.md`  | 산출물 자체 검증 (PRD 체크리스트 매칭)     |
| `PRD_GAP_CHECK.md`      | PRD 간극 분석 + 산출물 체크리스트          |
| `INCIDENT_PLAYBOOK.md`  | 장애 대응 플레이북 + Provider Fallback     |

---

## 🔧 Orchestrator 결과 뷰어

실행 로그, 생성 파일, 설계 문서를 웹 대시보드로 확인할 수 있습니다.

```bash
# 서버 시작
node orchestrator/viewer/server.js

# 접속
http://localhost:3000
```

---

**END OF CLAUDE.md**

_이 문서는 팀 공통 "헌법"입니다. 프로젝트별 기술 스택은 PROJECT_STACK.md를 참조하세요._
