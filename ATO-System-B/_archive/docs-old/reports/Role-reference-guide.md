# Role-Reference-Guide.md

> **버전**: 1.0.0 | **수정일**: 2026-01-08
> **정의**: Role별 문서 참조 가이드
> **대상**: All Roles | **용도**: 선택적 문서 로딩 최적화

---

## 참조 디렉토리 구조

```
(Project Root)/
├── CLAUDE.md                           # 시스템 헌법 (ALL - 절대 금지 확인)
│
└── .claude/
    ├── SYSTEM_MANIFEST.md              # 시스템 지도, 문서 맵 (ALL)
    │
    ├── rules/                          # [Group A] 제약 사항
    │   ├── DOMAIN_SCHEMA.md            # DB 테이블/컬럼 정의 (ALL)
    │   ├── CODE_STYLE.md               # 코딩 컨벤션 (Coder, ImLeader)
    │   ├── TDD_WORKFLOW.md             # TDD 사이클 (Coder)
    │   ├── DB_ACCESS_POLICY.md         # DB 접근 정책 (Query, ImLeader)
    │   ├── VALIDATION_GUIDE.md         # 품질 검증 기준 (ImLeader)
    │   └── ANALYSIS_GUIDE.md           # 분석 가이드 (Profiler, Query)
    │
    ├── workflows/                      # [Group B] 실행 절차
    │   ├── ROLES_DEFINITION.md         # Role별 R&R (ALL - 해당 섹션만)
    │   ├── DOCUMENT_PIPELINE.md        # 산출물 정의 (ALL)
    │   ├── HANDOFF_PROTOCOL.md         # HANDOFF 양식 (Leader, ImLeader)
    │   ├── PRD_GUIDE.md                # PRD 분석 기준 (Leader)
    │   └── ROLE_ARCHITECTURE.md        # 파이프라인 흐름 (Leader)
    │
    ├── context/                        # [Group C] 배경 지식
    │   └── AI_Playbook.md              # 팀 철학/원칙 (Leader)
    │
    ├── templates/                      # [Group D] 템플릿 (SSOT)
    │   ├── designer/                   # 설계 템플릿 (Designer)
    │   │   ├── IA_TEMPLATE.md
    │   │   ├── WF_TEMPLATE.md
    │   │   └── SDD_TEMPLATE.md
    │   ├── profiler/                   # 프로파일링 템플릿 (Profiler)
    │   │   └── SEGMENT_RULES.md
    │   └── query/                      # SQL 템플릿 (Query)
    │       └── SQL_PATTERNS.md
    │
    ├── project/                        # [Group E] 프로젝트 설정
    │   └── PROJECT_STACK.md            # 기술 스택 (ALL)
    │
    └── skills/                         # [Group F] Skill 정의
        ├── leader/SKILL.md
        ├── imleader/SKILL.md
        ├── designer/SKILL.md
        ├── coder/SKILL.md
        ├── profiler/SKILL.md
        └── query/SKILL.md
```

---

## Role별 문서-섹션 참조 매트릭스

### 1. 공통 문서 (6개 Role 모두)

| 문서                   | 읽어야 할 섹션                                        |
| ---------------------- | ----------------------------------------------------- |
| `CLAUDE.md`            | ⚠️ 절대 금지                                          |
| `SYSTEM_MANIFEST.md`   | Quick Context, Role별 필수 로딩 문서                  |
| `DOMAIN_SCHEMA.md`     | 비즈니스 구조, 플랫폼 서비스 구조, 핵심 레거시 스키마 |
| `PROJECT_STACK.md`     | 기술 스택, 프로젝트 경로 구조                         |
| `DOCUMENT_PIPELINE.md` | 파이프라인 타입별 산출물                              |

### 2. Role별 추가 문서

| Role         | 추가 문서             | 읽어야 할 섹션                             |
| ------------ | --------------------- | ------------------------------------------ |
| **Leader**   | `ROLES_DEFINITION.md` | Leader 섹션만                              |
|              | `HANDOFF_PROTOCOL.md` | HANDOFF.md 양식, 필수 섹션                 |
|              | `PRD_GUIDE.md`        | PRD Gap Check, PRD 완성도 체크             |
|              | `AI_Playbook.md`      | 팀 운영 원칙                               |
| **ImLeader** | `ROLES_DEFINITION.md` | Implementation Leader 섹션만               |
|              | `HANDOFF_PROTOCOL.md` | 완료 보고 양식                             |
|              | `VALIDATION_GUIDE.md` | 전체 (Phase A/B/C 검증 기준)               |
| **Designer** | `ROLES_DEFINITION.md` | Designer 섹션만                            |
|              | `IA_TEMPLATE.md`      | 전체                                       |
|              | `WF_TEMPLATE.md`      | 전체                                       |
|              | `SDD_TEMPLATE.md`     | 전체 (특히 섹션 5: 엔트리포인트)           |
| **Coder**    | `ROLES_DEFINITION.md` | Coder 섹션만                               |
|              | `CODE_STYLE.md`       | 공통 원칙, 네이밍 컨벤션, 필수 조건        |
|              | `TDD_WORKFLOW.md`     | Red-Green-Refactor 사이클                  |
| **Profiler** | `ROLES_DEFINITION.md` | Analyzer 섹션만                            |
|              | `SEGMENT_RULES.md`    | 전체                                       |
| **Query**    | `ROLES_DEFINITION.md` | Analyzer 섹션만                            |
|              | `DB_ACCESS_POLICY.md` | 권한 레벨, 쿼리 제한, 민감 컬럼 블랙리스트 |
|              | `SQL_PATTERNS.md`     | 전체                                       |

---

## 문서별 섹션 참조 상세

### SYSTEM_MANIFEST.md

| 섹션                  | 참조 Role       | 비고                     |
| --------------------- | --------------- | ------------------------ |
| Quick Context         | ALL             | ✅ 공통 - 시스템 개요    |
| Document Map          | ALL             | ✅ 공통 - 문서 위치 파악 |
| Role별 필수 로딩 문서 | ALL             | ✅ 공통 - 해당 Role 행만 |
| Output Paths          | Coder, Designer | 산출물 저장 위치         |
| Safety Rules          | ALL             | ✅ 공통 - 수정 금지 대상 |

### DOMAIN_SCHEMA.md

| 섹션                     | 참조 Role              | 비고                 | 삭제 여부 |
| ------------------------ | ---------------------- | -------------------- | --------- |
| 비즈니스 구조            | ALL                    | ✅ 공통              | -         |
| 플랫폼 서비스 구조       | ALL                    | ✅ 공통              | -         |
| 데이터 규모 및 성능 제약 | Query, ImLeader        | 대용량 테이블 인덱스 | -         |
| 개념-물리 매핑           | Coder, Designer, Query | 레거시 매핑          | -         |
| 핵심 레거시 스키마       | ALL                    | ✅ 공통              | -         |
| 자주 사용하는 쿼리 패턴  | Query, Profiler        | WHERE절 패턴         | -         |
| 보안 및 접근 제어        | Query                  | 민감 데이터 분류만   | -         |
| 복합 쿼리 제한           | Query, ImLeader        | JOIN 패턴 제한       | -         |
| **AI 학습용 데이터셋**   | ❌ 없음                | 🔴 미참조            | ✅ 완료   |

### ROLES_DEFINITION.md

| 섹션                       | 참조 Role            | 비고                             | 삭제 여부 |
| -------------------------- | -------------------- | -------------------------------- | --------- |
| Role 정의 요약             | Leader (개요 파악용) | 선택적                           | -         |
| 파이프라인 흐름            | Leader               | HITL 분기 파악                   | -         |
| Leader 섹션                | Leader               | ✅                               | -         |
| Analyzer 섹션              | Profiler, Query      | ✅                               | -         |
| Designer 섹션              | Designer             | ✅                               | -         |
| Implementation Leader 섹션 | ImLeader             | ✅                               | -         |
| Coder 섹션                 | Coder                | ✅                               | -         |
| **Orchestrator 섹션**      | ❌ 없음              | 🔴 미참조 (Extension에서 불필요) | -         |

### HANDOFF_PROTOCOL.md

| 섹션                       | 참조 Role        | 비고      | 삭제 여부 |
| -------------------------- | ---------------- | --------- | --------- |
| HANDOFF 개요               | Leader, ImLeader | ✅        | -         |
| HANDOFF.md 양식            | Leader           | ✅ 작성용 | -         |
| Role별 HANDOFF 예시        | Leader           | 참고용    | -         |
| 완료 보고 양식             | ImLeader, Coder  | ✅        | -         |
| HandoffValidator 검증 항목 | ImLeader         | ✅        | -         |
| 보안 필터링                | ImLeader         | ✅        | -         |

### PRD_GUIDE.md

| 섹션             | 참조 Role | 비고                  | 삭제 여부 |
| ---------------- | --------- | --------------------- | --------- |
| PRD Gap Check    | Leader    | ✅ 필수               | -         |
| 파이프라인 정의  | Leader    | 참조 링크만           | -         |
| 조건부 필수 항목 | Leader    | analysis 파이프라인용 | -         |
| PRD 완성도 체크  | Leader    | ✅                    | -         |

### AI_Playbook.md

| 섹션                | 참조 Role | 비고                  | 삭제 여부 |
| ------------------- | --------- | --------------------- | --------- |
| 팀 정의             | Leader    | 배경 지식             | -         |
| 핵심 목적           | Leader    | 배경 지식             | -         |
| **팀 OKR**          | ❌ 없음   | 🔴 미참조 (경영 지표) | -         |
| **Operating Model** | ❌ 없음   | 🔴 미참조 (조직 구조) | -         |
| **R&R 매트릭스**    | ❌ 없음   | 🔴 미참조 (인간 R&R)  | -         |
| 팀 운영 원칙        | Leader    | ✅ 필수               | -         |

### CODE_STYLE.md

| 섹션                                  | 참조 Role       | 비고                       | 삭제 여부 |
| ------------------------------------- | --------------- | -------------------------- | --------- |
| 공통 원칙                             | Coder, ImLeader | ✅                         | -         |
| TypeScript/JavaScript (FE)            | Coder (FE)      | ✅                         | ✅ 완료   |
| TypeScript/Node.js (BE)               | Coder (BE)      | ✅                         | ✅ 완료   |
| **Java/Kotlin (BE)**                  | ❌ 없음         | 🔴 미참조 (현재 스택 아님) | ✅ 완료   |
| **Dart/Flutter (App)**                | ❌ 없음         | 🔴 미참조 (현재 스택 아님) | ✅ 완료   |
| **Infrastructure (Terraform/Docker)** | ❌ 없음         | 🔴 미참조 (현재 스택 아님) | ✅ 완료   |

### DB_ACCESS_POLICY.md

| 섹션                 | 참조 Role       | 비고                  | 삭제 여부 |
| -------------------- | --------------- | --------------------- | --------- |
| 핵심 원칙            | Query, ImLeader | ✅                    | -         |
| 권한 레벨            | Query           | ✅                    | -         |
| 쿼리 제한            | Query, ImLeader | ✅                    | -         |
| 민감 컬럼 블랙리스트 | Query, ImLeader | ✅                    | -         |
| 접근 제한 테이블     | Query           | ✅                    | -         |
| 마스킹 처리          | Query           | 선택적                | -         |
| 쿼리 검증            | Query, ImLeader | ✅                    | -         |
| **감사 로깅**        | ❌ 없음         | 🔴 미참조 (운영 담당) | ✅ 완료   |
| **비상 대응**        | ❌ 없음         | 🔴 미참조 (운영 담당) | ✅ 완료   |
| **규정 준수**        | ❌ 없음         | 🔴 미참조 (법무 담당) | ✅ 완료   |

### TDD_WORKFLOW.md

| 섹션                              | 참조 Role       | 비고 | 삭제 여부 |
| --------------------------------- | --------------- | ---- | --------- |
| AI 사고 프로세스                  | Coder           | ✅   | -         |
| 기능 개발 시 (Red-Green-Refactor) | Coder           | ✅   | -         |
| 버그 수정 시                      | Coder           | ✅   | -         |
| 품질 게이트                       | Coder, ImLeader | ✅   | -         |

### VALIDATION_GUIDE.md

| 섹션                         | 참조 Role | 비고 | 삭제 여부 |
| ---------------------------- | --------- | ---- | --------- |
| Phase A: Analysis 검증       | ImLeader  | ✅   | -         |
| Phase B: Design 검증         | ImLeader  | ✅   | -         |
| Phase C: Implementation 검증 | ImLeader  | ✅   | -         |
| 재시도 정책                  | ImLeader  | ✅   | -         |
| 검증 결과 보고 형식          | ImLeader  | ✅   | -         |

---

## 미참조 섹션 요약 (제거/분리 후보)

> **정의**: 어떤 Role도 읽지 않는 섹션. 문서 경량화 또는 별도 분리 검토 대상.

| 문서                  | 미참조 섹션                               | 사유                                   |
| --------------------- | ----------------------------------------- | -------------------------------------- |
| `DOMAIN_SCHEMA.md`    | AI 학습용 데이터셋                        | AI 모델 훈련용 (Skill 작업과 무관)     |
| `ROLES_DEFINITION.md` | Orchestrator 섹션                         | Extension 환경에서 Orchestrator 미사용 |
| `AI_Playbook.md`      | 팀 OKR, Operating Model, R&R 매트릭스     | 경영/조직 구조 (AI Role 작업과 무관)   |
| `CODE_STYLE.md`       | Java/Kotlin, Dart/Flutter, Infrastructure | 현재 프로젝트 스택 아님                |
| `DB_ACCESS_POLICY.md` | 감사 로깅, 비상 대응, 규정 준수           | 운영/법무 담당 영역                    |

---

## 로딩 최적화 원칙

> **공식 문서 기준**: 대용량 파일 컨텍스트 페널티 없음. 실제로 읽기 전까지 토큰 소모 없음.

1. **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read
2. **요약 출력 불필요** - 체크리스트로 확인 여부만 표시
3. **필요 시점 로딩** - Phase 0에서 모두 읽지 말고, 작업 단계에서 필요할 때 읽기

**END OF Role-Reference-Guide.md**
