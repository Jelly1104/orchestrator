# Pipeline Refactoring 계획 (DD-2025-003)

> **버전**: 5.5.0
> **작성일**: 2025-12-30
> **상태**: In Progress

---

## 1. 배경

### 1.1 문제 정의

현재 ROLE_ARCHITECTURE.md에 정의된 파이프라인 타입:

| Type          | 설명             |
| ------------- | ---------------- |
| Analysis Only | Phase A만        |
| Design Only   | Phase B만        |
| Mixed         | Phase A → B      |
| Full          | Phase A → B → C  |

그러나 실제로 필요한 파이프라인 조합이 더 있다:

| 누락된 Type | 설명 | 사용 케이스 |
|-------------|------|------------|
| Code Only | Phase C만 | HANDOFF/SDD가 이미 있고 구현만 할 때 |
| Implement | Phase B → C | 분석 없이 설계부터 구현까지 |

### 1.2 제안하는 파이프라인 타입 (총 6개)

| Type | Phase 조합 | 설명 | 사용 케이스 |
|------|-----------|------|------------|
| analysis | A만 | 데이터 분석만 | SQL 분석, 리포트 |
| design | B만 | 설계만 | IA/Wireframe/SDD 작성 |
| code | C만 | 구현만 | 이미 설계 있고 코딩만 |
| analyzed_design | A → B | 분석 후 설계 | 데이터 기반 UX 설계 |
| ui_mockup | B → C | 설계 후 화면 구현 | IA/WF 기반 UI 코드 생성 |
| full | A → B → C | 전체 | 처음부터 끝까지 |

### 1.3 코드-문서 불일치 현황

| 구분 | 문서 정의 | 코드 구현 (현재) |
|------|----------|-----------------|
| Mixed | A → B | A → B → C (잘못됨) |
| Full | A → B → C | 미구현 |
| Code | - | 미정의 |
| Implement | - | 미정의 |

---

## 2. 완료된 작업

| 작업 | 내용 |
|------|------|
| Skill → Tool 리팩토링 | skills 폴더를 tools로 이동, API 이름 변경 완료 |
| Sandbox Path Validation | backend, frontend, docs 경로 허용 추가 |
| KillSwitch 복구 방법 정리 | 상태 파일 삭제 후 재실행하면 됨 |
| PROJECT_STACK.md 정리 | v1.4.0으로 업데이트, 중복 섹션 제거 |

---

## 3. 미완료 작업 (버그)

| 문제 | 원인 | 영향 | 상태 |
|------|------|------|------|
| ToolLoader 경고 | tools 폴더에 outputvalidator 없음 | 낮음 | 🔵 낮은 우선순위 |
| Reviewer Score 오류 | scores 배열이 undefined | Phase C 실패 | 🟢 코드 수정됨, 테스트 필요 |
| DocSync 경로 불일치 | Case ID에 날짜 suffix 추가 로직 문제 | 문서 동기화 실패 | 🟢 코드 수정됨, 테스트 필요 |

**확인 결과 (2025-12-30)**
- Reviewer: `_calculateScore` 메서드에 undefined 방어 로직 있음 → 실행 테스트 필요
- DocSync: `syncCase`에서 경로를 직접 조합함, 날짜 suffix 로직 없음 → 호출부 확인 및 테스트 필요

---

## 4. 해야 할 일 (코드 수정)

### 4.1 orchestrator.js

현재 runMixedPipeline이 Phase C까지 실행하고 있음. 전면 수정 필요:

1. runAnalyzedDesignPipeline: A → B에서 종료 (기존 runMixedPipeline 수정)
2. runFullPipeline: A → B → C 신규 추가
3. runCodePipeline: C만 실행 신규 추가
4. runUiMockupPipeline: B → C 신규 추가
5. 라우터에 6개 타입 모두 케이스 추가

### 4.2 prd-analyzer.js

6개 타입 판별 로직 추가:

1. PRD에 pipeline 필드가 명시되어 있으면 우선 적용
2. 자동 판별 로직:
   - 분석만 요청 → analysis
   - 설계만 요청 → design
   - 구현만 요청 (HANDOFF 있음) → code
   - 분석 + 설계 → analyzed_design
   - 설계 + 화면구현 → ui_mockup
   - 전체 → full

### 4.3 leader.js

VALID_ROUTES 배열 확장:

```
['analysis', 'design', 'code', 'analyzed_design', 'ui_mockup', 'full']
```

---

## 5. 해야 할 일 (문서 수정 - LLM용)

파이프라인 타입이 4개 → 6개로 확장되면서 LLM이 로딩하는 문서 업데이트 필요.

### 5.1 ROLE_ARCHITECTURE.md

| 섹션 | 현재 상태 | 수정 필요 |
|------|----------|----------|
| 섹션 3 (파이프라인 타입) | 4개만 정의됨 | 📋 6개로 확장 |
| 섹션 6 (Orchestrator 규칙) | 스위칭 예시에 mixed만 | 📋 6개 예시 모두 추가 |

수정 내용:
- 파이프라인 타입 테이블에 code, analyzed_design, ui_mockup 추가
- 스위칭 예시에 6개 타입 모두 포함

### 5.2 ROLES_DEFINITION.md

| 섹션 | 현재 상태 | 수정 필요 |
|------|----------|----------|
| 섹션 2.1 (Leader 역할 개요) | 4개만 | 📋 6개로 확장 |
| 섹션 2.3 (Leader 입출력) | 4개만 | 📋 6개로 확장 |
| 섹션 7.1 (Orchestrator) | mixed만 | 📋 6개 예시 추가 |

수정 내용:
- Leader 출력 router 값에 code, analyzed_design, ui_mockup 추가
- Orchestrator 스위칭 예시 6개로 확장

### 5.3 PRD_GUIDE.md

| 섹션 | 현재 상태 | 수정 필요 |
|------|----------|----------|
| 섹션 1.1 (유형-파이프라인 매칭) | 3개 매핑만 | 📋 6개로 확장 |
| 섹션 2.1 (키워드 판별) | 3개만 | 📋 6개 키워드 추가 |
| 섹션 3 (유형별 파이프라인) | 3.1~3.3만 | 📋 3.4~3.6 추가 |

수정 내용:
- 유형-파이프라인 매칭 테이블 6개로 확장
- 키워드 판별에 code_keywords, analyzed_design_keywords, ui_mockup_keywords, full_keywords 추가
- 섹션 3.4 Code Only, 3.5 UI_Mockup, 3.6 Full 추가

### 5.4 DOCUMENT_PIPELINE.md

| 섹션 | 현재 상태 | 수정 필요 |
|------|----------|----------|
| 전체 파이프라인 설명 | A → B → C 순차 설명 | 📋 6개 타입별 분기 설명 추가 |

수정 내용:
- 파이프라인 타입별 흐름 설명 추가
- 각 타입이 어느 Phase에서 시작/종료하는지 명시

---

## 6. 해야 할 일 (문서 수정 - 인간용)

README.md는 LLM이 로딩하지 않는 인간 개발자용 시각적 문서입니다.

### 6.1 README.md (.claude/)

| 섹션 제목 | 현재 상태 | 수정 필요 |
|----------|----------|----------|
| Role-Based Collaboration Model | "Data / Design / Mixed" 3개만 | 📋 6개 타입으로 확장 |
| Phase 기반 파이프라인 흐름 | Mixed만 분기 | 📋 6개 타입 분기 |
| Orchestrator vs Leader 역할 구분 | `{ router: "mixed" }` 예시만 | 📋 6개 router 예시 추가 |
| PRD 파이프라인 라우팅 | 분기 부족 | 📋 6개 분기 추가 |
| 문서 파이프라인 플로우 | 불완전 | 📋 전체 재작성 |

수정 내용:
- Role-Based Collaboration Model: Leader 파이프라인 전략 수립 부분에 6개 타입 명시
- Orchestrator vs Leader 역할 구분: 스위칭 예시에 6개 router 값 추가
- 다이어그램에 6개 파이프라인 타입 분기 추가
- 각 타입별 시작/종료 Phase 명시

---

## 7. 체크리스트

### 문서 수정 (LLM용)

- [ ] ROLE_ARCHITECTURE.md: 섹션 3 파이프라인 타입 6개로 확장
- [ ] ROLE_ARCHITECTURE.md: 섹션 6 스위칭 예시 6개 추가
- [ ] ROLES_DEFINITION.md: 섹션 2.1, 2.3 router 값 6개로 확장
- [ ] ROLES_DEFINITION.md: 섹션 7.1 스위칭 예시 6개 추가
- [ ] PRD_GUIDE.md: 섹션 1.1 유형-파이프라인 매칭 6개로 확장
- [ ] PRD_GUIDE.md: 섹션 2.1 키워드 판별 6개로 확장
- [ ] PRD_GUIDE.md: 섹션 3.4~3.6 추가 (Code, UI_Mockup, Full)
- [ ] DOCUMENT_PIPELINE.md: 6개 타입별 흐름 설명 추가

### 문서 수정 (인간용)

- [ ] README.md: 섹션 1.1 Role-Based Collaboration Model 6개 타입으로 확장
- [ ] README.md: 섹션 2.1 다이어그램 6개 분기 추가
- [ ] README.md: 섹션 5.2 Orchestrator 스위칭 예시 6개 router 값 추가
- [ ] README.md: 섹션 7 라우팅 다이어그램 6개 분기
- [ ] README.md: 섹션 8 파이프라인 플로우 전체 재작성

### 코드 수정

- [ ] orchestrator.js: runAnalyzedDesignPipeline 수정 (A→B로 종료)
- [ ] orchestrator.js: runFullPipeline 추가 (A→B→C)
- [ ] orchestrator.js: runCodePipeline 추가 (C만)
- [ ] orchestrator.js: runUiMockupPipeline 추가 (B→C)
- [ ] orchestrator.js: 라우터에 6개 케이스 추가
- [ ] prd-analyzer.js: 6개 타입 판별 로직 추가
- [ ] leader.js: VALID_ROUTES 6개로 확장

### 버그 수정 (테스트 필요)

- [ ] reviewer/index.js: 실행 테스트로 scores 오류 해결 확인
- [ ] doc-sync/index.js: 실행 테스트로 경로 불일치 해결 확인

### 테스트

#### 파이프라인 실행 테스트

- [ ] analysis 파이프라인: Phase A만 실행되는지
- [ ] design 파이프라인: Phase B만 실행되는지
- [ ] code 파이프라인: Phase C만 실행되는지
- [ ] analyzed_design 파이프라인: Phase A → B에서 종료되는지
- [ ] ui_mockup 파이프라인: Phase B → C 실행되는지
- [ ] full 파이프라인: Phase A → B → C 실행되는지

#### PRD 자동 판별 테스트

- [ ] PRD의 pipeline 필드가 올바르게 파싱되는지
- [ ] 분석 키워드만 있는 PRD → analysis 선택되는지
- [ ] 설계 키워드만 있는 PRD → design 선택되는지
- [ ] 구현 키워드 + HANDOFF 존재 → code 선택되는지
- [ ] 분석 + 설계 키워드 → analyzed_design 선택되는지
- [ ] 설계 + 화면구현 키워드 → ui_mockup 선택되는지
- [ ] 전체 키워드 → full 선택되는지

#### Phase 전환 테스트

- [ ] Phase A → B 전환 시 분석 결과가 정상 전달되는지
- [ ] Phase B → C 전환 시 HANDOFF/SDD가 정상 전달되는지
- [ ] 전환 실패 시 롤백 또는 에러 처리가 되는지

#### 에러 처리 테스트

- [ ] 잘못된 파이프라인 타입 입력 시 적절한 에러 반환
- [ ] 필수 입력 누락 시 에러 반환 (PRD 없음 등)
- [ ] Phase 실패 시 후속 Phase 실행 방지

#### HITL (Human-in-the-Loop) 테스트

- [ ] Phase A 완료 후 사용자 승인 대기 정상 작동
- [ ] Phase B 완료 후 사용자 승인 대기 정상 작동
- [ ] 사용자 거부 시 재작업 요청 정상 작동

#### 산출물 검증 테스트

- [ ] analysis 파이프라인: SQL, 분석 결과 JSON, 리포트 생성 확인
- [ ] design 파이프라인: IA, Wireframe, SDD 생성 확인
- [ ] code 파이프라인: 소스 코드 생성 확인
- [ ] analyzed_design 파이프라인: 분석 결과 + 설계 문서 생성 확인
- [ ] ui_mockup 파이프라인: 설계 문서 + UI 코드 생성 확인
- [ ] full 파이프라인: 전체 산출물 생성 확인

#### 예외 케이스 테스트 (입력 검증)

- [ ] Case 01: 빈 PRD → Gap Check FAIL, 필수 섹션 요청
- [ ] Case 02: 필수 섹션 누락 → Gap Check 경고, 누락 항목 명시
- [ ] Case 03: 잘못된 파이프라인 타입 → 유효하지 않은 파이프라인 FAIL
- [ ] Case 05: 초대형 PRD → 토큰 제한 경고, 요약 요청
- [ ] Case 10: 타입 불일치 → 타입 검증 실패, 기본값 적용

#### 예외 케이스 테스트 (보안)

- [ ] Case 04: SQL Injection 시도 → 쿼리 차단, 보안 로그 기록
- [ ] Case 04: Prompt Injection 시도 → 감지 및 차단
- [ ] Case 09: Path Traversal 시도 → 경로 접근 차단
- [ ] Case 09: Constitution 보호 경로 접근 → .claude/rules/* 수정 차단

#### 예외 케이스 테스트 (로직)

- [ ] Case 06: 순환 의존성 → 의존성 분석 경고, SDD에 해결 방안 제시
- [ ] Case 07: 존재하지 않는 스키마 → Hallucination 방지, 스키마 검증 실패
- [ ] Case 08: 상충 요구사항 → 모순 감지, 명확화 요청 또는 트레이드오프 분석

---

## 8. HITL 아키텍처 변경 (AS-IS → TO-BE)

### 8.1 AS-IS: 고정 체크포인트 방식

```
Phase A 완료 → [HITL: 분석 결과 승인] → Phase B
Phase B 완료 → [HITL: 설계 승인] → Phase C
Phase C 완료 → [HITL: 배포 승인] → Deploy
```

**문제점**:
- 모든 Phase 완료 시 HITL 대기 발생 → 불필요한 지연
- 규칙 기반 자동 검증 없이 무조건 사람 개입 필요
- Objective한 품질 기준과 Subjective한 판단 구분 없음

### 8.2 TO-BE: 검증 실패 시에만 HITL

```
Phase 완료 → ImpLeader 자동 검증 → {Objective Rules Pass?}
  ├─ YES → DocSync → 다음 Phase 또는 완료
  └─ NO  → HITL Review → 3-way 옵션
              ├─ Exception Approval (이번만 예외)
              ├─ Rule Override (규칙 수정)
              └─ Reject → 해당 Phase 재작업
```

**개선점**:
- Objective한 규칙은 ImpLeader가 자동 검증 (Schema, Lint, Test)
- 검증 통과 시 HITL 없이 즉시 진행 → 처리 속도 향상
- 실패 시에만 HITL → 3가지 옵션으로 유연한 대응
- 규칙 자체를 수정하는 "Rule Override" 경로 제공

### 8.3 영향받는 문서/코드

| 구분 | 파일 | 수정 내용 |
|------|------|----------|
| 문서 | ROLE_ARCHITECTURE.md | 섹션 4 HITL 체크포인트 재정의 |
| 문서 | ROLES_DEFINITION.md | 섹션 5 ImpLeader 역할에 검증 로직 추가 |
| 문서 | DOCUMENT_PIPELINE.md | HITL 설명 변경 |
| 코드 | orchestrator.js | Phase 완료 후 HITL 3-way 핸들링 |
| 코드 | reviewer/index.js | hitlRequired 플래그 반환 로직 |
| 코드 | leader.js | 검증 결과 기반 라우팅 로직 |

---

## 9. 파일 현황

### 코드 파일

| 파일 | 상태 |
|------|------|
| orchestrator/orchestrator.js | 📋 대규모 수정 필요 |
| orchestrator/agents/leader.js | 📋 VALID_ROUTES 확장 |
| orchestrator/agents/prd-analyzer.js | 📋 판별 로직 확장 |
| orchestrator/security/sandbox.js | ✅ 완료 |
| orchestrator/security/path-validator.js | ✅ 완료 |
| orchestrator/tools/reviewer/index.js | 🟢 테스트 필요 |
| orchestrator/tools/doc-sync/index.js | 🟢 테스트 필요 |

### 문서 파일

| 파일 | 상태 |
|------|------|
| .claude/workflows/ROLE_ARCHITECTURE.md | 📋 파이프라인 타입 확장 |
| .claude/workflows/ROLES_DEFINITION.md | 📋 router 값 확장 |
| .claude/workflows/PRD_GUIDE.md | 📋 전면 업데이트 |
| .claude/workflows/DOCUMENT_PIPELINE.md | 📋 타입별 흐름 추가 |
| .claude/README.md | 📋 다이어그램 전면 수정 |
| .claude/project/PROJECT_STACK.md | ✅ 완료 |

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 5.6.0 | 2025-12-31 | HITL 아키텍처 변경 (AS-IS → TO-BE) 섹션 8 추가 |
| 5.5.0 | 2025-12-30 | 파이프라인 이름 변경: mixed→analyzed_design, implement→ui_mockup |
| 5.4.0 | 2025-12-30 | 문서 수정 섹션 분리 (LLM용 vs 인간용) |
| 5.3.0 | 2025-12-30 | 예외 케이스 테스트 추가 (입력 검증 5개, 보안 4개, 로직 3개) |
| 5.2.0 | 2025-12-30 | README.md 수정 항목 추가 (섹션 1.1, 5.2) |
| 5.1.0 | 2025-12-30 | 테스트 체크리스트 확장 (6개 카테고리, 28개 항목) |
| 5.0.0 | 2025-12-30 | 파이프라인 타입 4개→6개 확장, 문서 업데이트 범위 전면 재검토 |
| 4.0.0 | 2025-12-30 | 문서 전체 재작성, 섹션 구조 정리 |
| 3.2.0 | 2025-12-30 | 문서 수정 섹션 추가 |
| 3.1.0 | 2025-12-30 | 코드 블록 제거 |
| 3.0.0 | 2025-12-30 | 초기 버전 |

---

**END OF DOCUMENT**
