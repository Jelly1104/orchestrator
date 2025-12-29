# ROLE_ARCHITECTURE.md

> **문서 버전**: 3.1.0
> **최종 업데이트**: 2025-12-29
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

## 1. Role 정의 요약 (R&R)

| Role                      | Scope   | Tools           | Responsibility                                            |
| ------------------------- | ------- | --------------- | --------------------------------------------------------- |
| **Leader**                | All     | -               | PRD 분석, 파이프라인 전략 수립, 목표 하달, HITL 최종 승인 |
| **Analyzer**              | Phase A | Query, Profiler | 데이터 분석 및 전략 근거 마련                             |
| **Designer**              | Phase B | Designer        | UX 기획(IA/WF) + 기술 설계(SDD)                           |
| **Implementation Leader** | A,B,C   | Reviewer        | Quality Gate 관리, 각 Phase 산출물 검증                   |
| **Coder**                 | Phase C | Coder           | HANDOFF 기반 코드 구현                                    |

> **상세 정의**: ROLES_DEFINITION.md 참조

---

## 2. 로딩 설정

### 2.1 섹션별 로딩 대상

| 섹션      | 대상          | 필수 여부                |
| --------- | ------------- | ------------------------ |
| 섹션 1-3  | Orchestrator  | 필수                     |
| Role 상세 | 해당 Role     | ROLES_DEFINITION.md 참조 |
| 보안      | 모든 Role     | DB_ACCESS_POLICY.md 참조 |
| Handoff   | Leader, Coder | HANDOFF_PROTOCOL.md 참조 |

### 2.2 Role별 로딩 예상 토큰

| Role                  | 로딩 문서                     | 예상 토큰 |
| --------------------- | ----------------------------- | --------- |
| Leader                | ROLES_DEFINITION(§2), HANDOFF | ~800      |
| Analyzer              | ROLES_DEFINITION(§3)          | ~500      |
| Designer              | ROLES_DEFINITION(§4)          | ~600      |
| Implementation Leader | ROLES_DEFINITION(§5)          | ~500      |
| Coder                 | ROLES_DEFINITION(§6), HANDOFF | ~600      |

### 2.3 Role별 출력 토큰 제한 (maxTokens)

| Role                  | 기본값 | 용도                 |
| --------------------- | ------ | -------------------- |
| Leader                | 16,384 | 지시 및 HANDOFF 생성 |
| Analyzer              | 8,192  | SQL 생성, 결과 해석  |
| Designer              | 32,768 | IA, WF, SDD 생성     |
| Implementation Leader | 8,192  | 검증 리포트          |
| Coder                 | 32,768 | 코드 구현            |

---

## 3. Phase 정의

| Phase | 이름           | 담당 Role    | Tools           | 설명                          |
| ----- | -------------- | ------------ | --------------- | ----------------------------- |
| **A** | Analysis       | Analyzer     | query, profiler | DB 분석, SQL 실행             |
| **B** | Design         | Designer     | designer        | IA/Wireframe/SDD/HANDOFF 생성 |
| **C** | Implementation | Coder        | coder           | 코드 구현                     |
| **D** | Security       | Orchestrator | -               | 입력 검증, 보안               |

### 파이프라인 타입

| Type          | 설명                 |
| ------------- | -------------------- |
| Analysis Only | Phase A만 실행       |
| Design Only   | Phase B만 실행       |
| Mixed (기본)  | Phase A → B 순차     |
| Full          | Phase A → B → C 전체 |

> **상세 플로우 다이어그램**: README.md 섹션 2 참조

---

## 4. HITL 체크포인트

| 체크포인트 | Phase   | 트리거 조건               | 인간 액션      |
| ---------- | ------- | ------------------------- | -------------- |
| PRD 보완   | 진입 전 | 필수 항목 누락            | PRD 보완       |
| 쿼리 검토  | A       | 결과 이상 (0행, 타임아웃) | 쿼리 수정/승인 |
| 설계 승인  | B       | 설계 완료                 | 검토 및 승인   |
| 수동 수정  | C       | 3회 연속 FAIL             | 직접 수정      |
| 배포 승인  | C       | 프론트 배포 필요          | 최종 승인      |

### 자동 중단 트리거

```yaml
PRD Gap Check: 필수 6개 항목 누락, type/pipeline 불일치
Phase A: 결과 0행, 타임아웃 30초, 스키마 불일치
Phase C: PRD 매칭률 < 80%, 보안 위반, 재시도 >= 3회
```

---

## 5. Role-Tool 권한 매트릭스

| Tool     | Version | 소유 Role    | Phase |
| -------- | ------- | ------------ | ----- |
| query    | v1.2.0  | Analyzer     | A     |
| profiler | v1.2.0  | Analyzer     | A     |
| designer | v2.2.0  | Designer     | B     |
| coder    | v3.0.1  | Coder        | C     |
| reviewer | v2.0.0  | Impl Leader  | All   |
| doc-sync | v2.1.0  | Orchestrator | All   |
| viewer   | v1.5.0  | Orchestrator | -     |

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

## 6. Orchestrator 규칙

> Orchestrator는 Role이 아닌 **JavaScript 워크플로우 제어 모듈**

| 항목   | 내용                                         |
| ------ | -------------------------------------------- |
| 역할   | 기계적 파이프라인 스위칭 + 보안 게이트웨이   |
| 담당   | PRD 파싱, Role 호출, HITL 관리, 재시도, 로그 |
| 스위칭 | Leader 출력 `{ router: "mixed" }` 기반       |

### 금지 패턴

```
❌ if (prd.includes("분석")) → AnalysisAgent  (판단 금지)
❌ leader.call("Notion에 올려줘")              (Leader의 doc-sync 지시)

✅ if (leader.output.router === "analysis")   (기계적 스위칭)
✅ onPhaseComplete → docSyncTool.execute()    (Hook 자동화)
```

### 산출물 경로

```
docs/cases/{caseId}/              # 설계 문서 (PRD, IA, SDD, Wireframe, HANDOFF)
docs/cases/{caseId}/analysis/     # 분석 결과 (SQL, JSON, 리포트)
backend/src/{feature}/            # 백엔드 코드
frontend/src/{feature}/           # 프론트엔드 코드
workspace/logs/{task-id}.json     # 실행 로그
```

---

## 7. 보안 요약

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
| HANDOFF_PROTOCOL.md | Leader → Coder 업무 지시 양식    |
| DB_ACCESS_POLICY.md | DB 보안 정책                     |
| VALIDATION_GUIDE.md | 품질 검증 기준                   |
| README.md           | 다이어그램, 상세 설명 (인간용)   |

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                                           |
| ----- | ---------- | ------------------------------------------------------------------- |
| 3.1.0 | 2025-12-29 | 300줄 다이어트: 다이어그램→README.md, Role 상세→ROLES_DEFINITION.md |
| 3.0.1 | 2025-12-29 | 문서 책임 경계 섹션 추가                                            |
| 3.0.0 | 2025-12-29 | Role-Based Collaboration Model 적용                                 |

---

**END OF ROLE_ARCHITECTURE.md**
