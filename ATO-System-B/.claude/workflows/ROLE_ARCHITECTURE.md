# ROLE_ARCHITECTURE.md

> **문서 버전**: 3.5.0
> **최종 업데이트**: 2026-01-05
> **물리적 경로**: `.claude/workflows/ROLE_ARCHITECTURE.md` > **상위 문서**: `CLAUDE.md` > **대상**: Orchestrator, 개발자
> **다이어그램**: README.md 참조

---

## 문서 책임 경계

| 구분       | ROLE_ARCHITECTURE (본 문서) | ROLES_DEFINITION            |
| ---------- | --------------------------- | --------------------------- |
| **비유**   | 🗺️ 지도 (Map)               | 📖 매뉴얼 (Manual)          |
| **정의**   | Topology, Flow, Phase 구조  | Role별 시스템 프롬프트, R&R |
| **참조자** | Orchestrator, 개발자        | 각 LLM Role                 |

> **황금률**: "실행하는 자는 검증하지 않고, 검증하는 자는 실행하지 않는다."

---

## Role 정의 요약 (R&R)

| Role                      | Scope   | Tools           | Responsibility                                                              |
| ------------------------- | ------- | --------------- | --------------------------------------------------------------------------- |
| **Leader**                | All     | -               | PRD 분석, 파이프라인 전략 수립, 목표 하달, **HANDOFF 생성**, HITL 최종 승인 |
| **Analyzer**              | Phase A | Query, Profiler | 데이터 분석 및 전략 근거 마련                                               |
| **Designer**              | Phase B | Designer        | UX 기획(IA/WF) + 기술 설계(SDD)                                             |
| **Implementation Leader** | A,B,C   | Reviewer        | Quality Gate 관리, 각 Phase 산출물 검증                                     |
| **Coder**                 | Phase C | Coder           | HANDOFF, SDD 기반 코드 구현                                                 |

> **상세 정의**: ROLES_DEFINITION.md 참조

---

## 로딩 설정

### 섹션별 로딩 대상

| 섹션          | 대상          | 필수 여부                |
| ------------- | ------------- | ------------------------ |
| 처음 3개 섹션 | Orchestrator  | 필수                     |
| Role 상세     | 해당 Role     | ROLES_DEFINITION.md 참조 |
| 보안          | 모든 Role     | DB_ACCESS_POLICY.md 참조 |
| Handoff       | Leader, Coder | HANDOFF_PROTOCOL.md 참조 |

### Role별 로딩 예상 토큰

| Role                                    | 로딩 문서                     | 예상 토큰 |
| --------------------------------------- | ----------------------------- | --------- |
| Leader (PM & Commander)                 | Leader 정의, HANDOFF Protocol | ~800      |
| Analyzer (Data Analyst)                 | Analyzer 정의                 | ~500      |
| Designer (Architect)                    | Designer 정의                 | ~600      |
| Implementation Leader (Quality Manager) | ImpLeader 정의                | ~500      |
| Coder (Developer)                       | Coder 정의, HANDOFF Protocol  | ~600      |

### Role별 출력 토큰 제한 (maxTokens)

| Role                  | 기본값 | 용도                 |
| --------------------- | ------ | -------------------- |
| Leader                | 16,384 | 지시 및 HANDOFF 생성 |
| Analyzer              | 8,192  | SQL 생성, 결과 해석  |
| Designer              | 32,768 | IA, WF, SDD 생성     |
| Implementation Leader | 8,192  | 검증 리포트          |
| Coder                 | 32,768 | 코드 구현            |

---

## Phase 정의

| Phase | 이름           | 담당 Role    | Tools           | 설명                                                 |
| ----- | -------------- | ------------ | --------------- | ---------------------------------------------------- |
| **A** | Analysis       | Analyzer     | query, profiler | DB 분석, SQL 실행(HANDOFF 기반)                      |
| **B** | Design         | Designer     | designer        | IA/Wireframe/SDD 생성 (HANDOFF 기반)                 |
| **C** | Implementation | Coder        | coder           | **HANDOFF, SDD 기반 코드 구현 (PRD 직접 참조 금지)** |
| **D** | Security       | Orchestrator | -               | 입력 검증, 보안                                      |

### 파이프라인 타입

| 타입              | Phase 조합 | 설명                                                    | 사용 케이스             |
| ----------------- | ---------- | ------------------------------------------------------- | ----------------------- |
| `analysis`        | A만        | 데이터 분석만                                           | SQL 분석, 리포트        |
| `design`          | B만        | 설계만                                                  | IA/Wireframe/SDD 작성   |
| `analyzed_design` | A → B      | 분석 후 설계                                            | 데이터 기반 UX 설계     |
| `code`            | C만        | **SDD/HANDOFF가 이미 존재하는 경우에 한해 구현만 수행** | 이미 설계 있고 코딩만   |
| `ui_mockup`       | B → C      | 설계 후 화면 구현                                       | IA/WF 기반 UI 코드 생성 |
| `full`            | A → B → C  | 전체 파이프라인                                         | 처음부터 끝까지         |

> **상세 플로우 다이어그램**: README.md 섹션 2 참조

---

## HITL 체크포인트 (TO-BE: 검증 실패 시에만)

> **원칙**: Objective 규칙은 ImpLeader가 자동 검증, 검증 통과 시 HITL 없이 진행

### 검증 흐름

```
Phase 완료 → ImpLeader 자동 검증 → {Objective Rules Pass?}
  ├─ YES → DocSync → 다음 Phase 또는 완료
  └─ NO  → HITL Review → 3-way 옵션
              ├─ Exception Approval (이번만 예외)
              ├─ Rule Override (규칙 수정 요청)
              └─ Reject → 해당 Phase 재작업
```

### HITL 트리거 조건

| Phase   | 트리거 조건                              | 3-way 옵션                        |
| ------- | ---------------------------------------- | --------------------------------- |
| 진입 전 | PRD 필수 항목 누락, type/pipeline 불일치 | PRD 보완 / 강제 진행 / 취소       |
| A       | 결과 0행, 타임아웃 30초, 스키마 불일치   | 쿼리 수정 / 예외 승인 / 재분석    |
| B       | SDD-Schema 불일치, IA-WF 정합성 실패     | 설계 수정 / 예외 승인 / 재설계    |
| C       | 테스트 FAIL, 보안 위반, 재시도 ≥3회      | 코드 수정 / 예외 승인 / 수동 수정 |

### 자동 PASS 조건 (HITL 없이 진행)

```yaml
Phase A:
  - SQL 문법 유효
  - 결과 행 존재 (≥1)
  - 스키마 컬럼명 일치

Phase B:
  - IA 계층 구조 완성
  - Wireframe 필수 요소 포함
  - SDD-Schema 매핑 정합

Phase C:
  - 테스트 전체 PASS
  - 타입체크 PASS
  - 빌드 성공
```

### 3-way 옵션 설명

| 옵션               | 동작                                   | 사용 케이스                |
| ------------------ | -------------------------------------- | -------------------------- |
| Exception Approval | 이번 건만 예외 허용, 다음 Phase 진행   | 긴급 배포, 알려진 제약     |
| Rule Override      | 규칙 자체 수정 요청 → 관리자 검토 필요 | 규칙이 현실과 맞지 않을 때 |
| Reject             | 해당 Phase 재작업 지시                 | 품질 미달, 재수정 필요     |

---

## Role-Tool 권한 매트릭스

| Tool     | 소유 Role    | Phase |
| -------- | ------------ | ----- |
| query    | Analyzer     | A     |
| profiler | Analyzer     | A     |
| designer | Designer     | B     |
| coder    | Coder        | C     |
| reviewer | Impl Leader  | All   |
| doc-sync | Orchestrator | All   |
| viewer   | Orchestrator | -     |

### 권한 매트릭스

| Role         | query | profiler | designer | coder | reviewer | doc-sync | viewer |
| ------------ | ----- | -------- | -------- | ----- | -------- | -------- | ------ |
| Leader       | -     | -        | -        | -     | -        | -        | -      |
| Analyzer     | ✅    | ✅       | -        | -     | -        | -        | -      |
| Designer     | -     | -        | ✅       | -     | -        | -        | -      |
| Impl Leader  | -     | -        | -        | -     | ✅       | -        | -      |
| Coder        | -     | -        | -        | ✅    | -        | -        | -      |
| Orchestrator | -     | -        | -        | -     | -        | ✅       | ✅     |

---

## Orchestrator 규칙

> Orchestrator는 Role이 아닌 **JavaScript 워크플로우 제어 모듈**

| 항목   | 내용                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| 역할   | 기계적 파이프라인 스위칭 + 보안 게이트웨이                                      |
| 담당   | PRD 파싱, Role 호출, HITL 관리, 재시도, 로그, **Leader 출력 → HANDOFF.md 저장** |
| 스위칭 | Leader 출력 `{ pipeline : "..." }` 기반                                         |

### 스위칭 예시

| Leader 출력                     | 실행 Phase              |
| ------------------------------- | ----------------------- |
| `{ router: "analysis" }`        | A만                     |
| `{ router: "design" }`          | B만                     |
| `{ router: "code" }`            | **C만 (SDD 존재 필수)** |
| `{ router: "analyzed_design" }` | A → B                   |
| `{ router: "ui_mockup" }`       | B → C                   |
| `{ router: "full" }`            | A → B → C               |

> **💡 code 타입 가드**: 실제 구현에서는 `if (!exists(SDD.md)) → HITL: Design Skip Approval` 체크 필요

### 금지 패턴

```
❌ if (prd.includes("분석")) → AnalysisAgent  (판단 금지)
❌ leader.call("Notion에 올려줘")              (Leader의 doc-sync 지시)

✅ if (leader.output.router === "analysis")   (기계적 스위칭)
✅ onPhaseComplete → docSyncTool.execute()    (Hook 자동화)
```

### 산출물 경로

```
docs/cases/{caseId}/                       # Case 루트
docs/cases/{caseId}/{taskId}/              # Task별 산출물 (HANDOFF, IA, SDD, Wireframe)
docs/cases/{caseId}/{taskId}/analysis/     # 분석 결과 (SQL, JSON, 리포트)
backend/src/{feature}/                     # 백엔드 코드
frontend/src/{feature}/                    # 프론트엔드 코드
workspace/logs/{caseId}/{taskId}.json      # 실행 로그 (Case/Task별 그룹화)
```

> **구조**: 하나의 Case(프로젝트)에 여러 Task(작업)가 존재할 수 있음

---

## 보안 요약

> **상세 정책**: DB_ACCESS_POLICY.md 참조

| Layer | 담당         | 핵심 기능                               |
| ----- | ------------ | --------------------------------------- |
| L1    | Orchestrator | Input Validation, Rate Limit, Path 검증 |
| L2    | Leader       | Prompt Injection 방어                   |
| L3    | Coder        | Output Validation, Protected Path 차단  |
| L4    | Utils        | Audit Log, Rulebook 무결성              |

---

## 관련 문서

| 문서                | 역할                             |
| ------------------- | -------------------------------- |
| ROLES_DEFINITION.md | Role별 시스템 프롬프트, R&R 상세 |
| HANDOFF_PROTOCOL.md | Leader → Role 업무 지시서 양식   |
| DB_ACCESS_POLICY.md | DB 보안 정책                     |
| VALIDATION_GUIDE.md | 품질 검증 기준                   |
| README.md           | 다이어그램, 상세 설명 (인간용)   |

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                                                                 |
| ----- | ---------- | ----------------------------------------------------------------------------------------- |
| 3.5.0 | 2026-01-05 | 파이프라인 구현 상태 업데이트: 6개 타입 전체 구현 완료, mixed 제거 (analyzed_design 사용) |
| 3.4.0 | 2026-01-05 | HITL 체크포인트 섹션 TO-BE 방식으로 재정의 (검증 실패 시에만 + 3-way 옵션)                |
| 3.3.0 | 2026-01-05 | HANDOFF 흐름 명확화: Leader 생성 책임 추가, Orchestrator 저장, 경로 {caseId}/{taskId}     |
| 3.2.0 | 2025-12-30 | 파이프라인 타입 4개→6개 확장 (code, analyzed_design, ui_mockup 추가), 스위칭 예시 추가    |

**END OF ROLE_ARCHITECTURE.md**
