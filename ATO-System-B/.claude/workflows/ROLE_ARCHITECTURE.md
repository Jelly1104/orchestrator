# ROLE_ARCHITECTURE.md

> **버전**: 3.7.0 | **수정일**: 2026-01-06
> **정의**: Topology, Phase, HITL, Role 흐름
> **대상**: Orchestrator | **로딩**: 전체

---

## Role 정의 요약 (R&R)

> **황금률**: "실행하는 자는 검증하지 않고, 검증하는 자는 실행하지 않는다."

| Role                              | Scope       | Tools (Orchestrator)      | Skills (Extension)       | Responsibility                                            |
| --------------------------------- | ----------- | ------------------------- | ------------------------ | --------------------------------------------------------- |
| **1. Leader (PM & Commander)**    | All         | -                         | `/leader` ⭐             | PRD 분석, 파이프라인 전략 수립, 목표 하달, HITL 최종 승인 |
| **2. Analyzer**                   | Phase A     | ProfilerTool, QueryTool   | `/profiler`, `/query`    | 데이터 분석 및 전략 근거 마련                             |
| **3. Designer (Architect)**       | Phase B     | DesignerTool              | `/designer`              | UX 기획(IA/WF) + 기술 설계(SDD), 화면-데이터 정합성 책임  |
| **4. Implementation Leader (QM)** | Phase A,B,C | ReviewerTool              | `/imleader` ⚠️           | Quality Gate 관리, 각 Phase 산출물 검증                   |
| **5. Coder**                      | Phase C     | CoderTool                 | `/coder`                 | HANDOFF 기반 코드 구현, **SDD 준수 구현**, Self-Check     |

> **범례**: ⭐ Extension에만 존재 (Orchestrator Tool 없음) | ⚠️ Tool/Skill 이름 다름 (ReviewerTool → /imleader)
>
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

| 타입              | Phase 조합 | Role 흐름                                                                                                                                        |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `analysis`        | A만        | PRD → Leader → Analyzer → ImpLeader → Leader 보고 → HITL                                                                                         |
| `design`          | B만        | PRD → Leader → Designer → ImpLeader → Leader 보고 → HITL                                                                                         |
| `analyzed_design` | A → B      | PRD → Leader → Analyzer → ImpLeader → HITL → Designer → ImpLeader → Leader 보고 → HITL                                                           |
| `code`            | C만        | PRD + SDD → Leader → Coder → ImpLeader → Leader 보고 → HITL **(SDD 필수)**                                                                       |
| `ui_mockup`       | B → C      | PRD → Leader → Designer → ImpLeader → HITL → Coder → ImpLeader → Leader 보고 → HITL                                                              |
| `full`            | A → B → C  | PRD → Leader → Analyzer → ImpLeader → HITL → Designer → ImpLeader → HITL → Coder → ImpLeader → Leader 보고 → HITL                                |

> **입력/산출물**: 타입별 입력 및 산출물은 `DOCUMENT_PIPELINE.md`의 **타입별 산출물 요약** 섹션 참조
>
> **Extension 모드**: Skills를 사용하는 Extension의 경우 HITL은 파이프라인 최종 완료 후 한 번만 진행합니다.
>
> **상세 플로우 다이어그램**: README.md 섹션 2 참조

### Extension 경량 모드

> **용도**: VSCode Extension에서 Orchestrator 없이 Skill 직접 호출

| 항목       | Orchestrator 모드               | Extension 모드              |
| ---------- | ------------------------------- | --------------------------- |
| PRD        | PRD_FULL.md                     | PRD_LITE.md                 |
| Skill 정의 | `orchestrator/tools/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| 실행       | 파이프라인 자동 라우팅          | `skills` 배열 순차 실행     |

> **상세**: PRD_GUIDE.md의 **Extension 경량 실행 모드** 섹션 참조

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

## Role-Tool/Skill 권한 매트릭스

| Tool     | Skill     | 소유 Role    | Phase |
| -------- | --------- | ------------ | ----- |
| query    | /query    | Analyzer     | A     |
| profiler | /profiler | Analyzer     | A     |
| designer | /designer | Designer     | B     |
| coder    | /coder    | Coder        | C     |
| reviewer | /imleader | Impl Leader  | All   |
| -        | /leader   | Leader       | All   |
| doc-sync | -         | Orchestrator | All   |
| viewer   | -         | Orchestrator | -     |

### 권한 매트릭스

| Role         | Tool                                                   ||| Skill                                              ||
|              | query | profiler | designer | coder | reviewer | doc-sync | viewer | /leader | /query | /profiler | /designer | /imleader | /coder |
| ------------ | :---: | :------: | :------: | :---: | :------: | :------: | :----: | :-----: | :----: | :-------: | :-------: | :-------: | :----: |
| Leader       | -     | -        | -        | -     | -        | -        | -      | ✅      | -      | -         | -         | -         | -      |
| Analyzer     | ✅    | ✅       | -        | -     | -        | -        | -      | -       | ✅     | ✅        | -         | -         | -      |
| Designer     | -     | -        | ✅       | -     | -        | -        | -      | -       | -      | -         | ✅        | -         | -      |
| Impl Leader  | -     | -        | -        | -     | ✅       | -        | -      | -       | -      | -         | -         | ✅        | -      |
| Coder        | -     | -        | -        | ✅    | -        | -        | -      | -       | -      | -         | -         | -         | ✅     |
| Orchestrator | -     | -        | -        | -     | -        | ✅       | ✅     | -       | -      | -         | -         | -         | -      |

---

## Orchestrator 규칙

> Orchestrator는 Role이 아닌 **JavaScript 워크플로우 제어 모듈**

| 항목   | 내용                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| 역할   | 기계적 파이프라인 스위칭 + 보안 게이트웨이                                      |
| 담당   | PRD 파싱, Role 호출, HITL 관리, 재시도, 로그, **Leader 출력 → HANDOFF.md 저장** |
| 스위칭 | Leader 출력 `{ pipeline : "..." }` 기반                                         |

### 스위칭 예시

| Leader 출력                       | 실행 Phase              |
| --------------------------------- | ----------------------- |
| `{ pipeline: "analysis" }`        | A만                     |
| `{ pipeline: "design" }`          | B만                     |
| `{ pipeline: "code" }`            | **C만 (SDD 존재 필수)** |
| `{ pipeline: "analyzed_design" }` | A → B                   |
| `{ pipeline: "ui_mockup" }`       | B → C                   |
| `{ pipeline: "full" }`            | A → B → C               |

> **💡 code 타입 가드**: 실제 구현에서는 `if (!exists(SDD.md)) → HITL: Design Skip Approval` 체크 필요

### 금지 패턴

```
❌ if (prd.includes("분석")) → AnalysisAgent  (판단 금지)
❌ leader.call("Notion에 올려줘")              (Leader의 doc-sync 지시)

✅ if (leader.output.pipeline === "analysis")   (기계적 스위칭)
✅ onPhaseComplete → docSyncTool.execute()    (Hook 자동화)
```

> **산출물 경로**: SYSTEM_MANIFEST.md `Paths` 섹션 참조

---

## 보안 요약

> **상세 정책**: DB_ACCESS_POLICY.md 참조

| Layer | 담당         | 핵심 기능                               |
| ----- | ------------ | --------------------------------------- |
| L1    | Orchestrator | Input Validation, Rate Limit, Path 검증 |
| L2    | Leader       | Prompt Injection 방어                   |
| L3    | Coder        | Output Validation, Protected Path 차단  |
| L4    | Utils        | Audit Log, Rulebook 무결성              |

**END OF ROLE_ARCHITECTURE.md**
