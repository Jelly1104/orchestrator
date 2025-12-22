# 05-ErrorHandling TO-BE

> **통합 대상**: INCIDENT_PLAYBOOK.md 1종
> **통합 결과**: ERROR_HANDLING_GUIDE.md (신규)
> **작성일**: 2025-12-19

---

## 📊 통합 결과

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 문서 수 | 1종 | 1종 (구조 개선) |
| 예상 토큰 | ~2,200 | ~2,000 |
| 로딩 Agent | ❌ 없음 | ✅ Leader + FeedbackLoop |

---

## 🎯 로딩 설정

| Agent | 로딩 시점 | 로딩 내용 |
|-------|----------|----------|
| **Leader** | Review FAIL 시 | 에스컬레이션 경로, 재시도 정책 |
| **FeedbackLoop** | 항상 | 전체 문서 (장애 분류, 대응 절차) |
| **Orchestrator** | 에러 발생 시 | 섹션 6 (Orchestrator 장애 대응) |

---

## 📄 ERROR_HANDLING_GUIDE.md (통합본)

<!--
[변경 사유]
- INCIDENT_PLAYBOOK.md를 ERROR_HANDLING_GUIDE.md로 명칭 변경
- 이유: 더 직관적인 이름 + 다른 GUIDE 문서들과 네이밍 일관성
-->

```
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/ERROR_HANDLING_GUIDE.md
```

---

# ERROR_HANDLING_GUIDE.md

> **문서 버전**: 2.0.0
> **최종 업데이트**: 2025-12-19
> **상위 문서**: CLAUDE.md
> **대상 Agent**: Leader, FeedbackLoop, Orchestrator

<!--
[v2.0.0 주요 변경]
1. 문서명 변경: INCIDENT_PLAYBOOK → ERROR_HANDLING_GUIDE
2. Agent 로딩 설정 명시 (기존에 없던 정보)
3. FeedbackLoop Agent 연동 가이드 추가
4. 심각도별 자동 대응 로직 정의
-->

---

## 🎯 이 문서의 목적

**"장애는 발생한다. 대응 절차가 문서화되어 있어야 한다."**

AI 에이전트 또는 시스템 장애 발생 시 표준 대응 절차를 정의합니다.
FeedbackLoop Agent가 이 문서를 참조하여 자동 대응을 수행합니다.

---

## 1. 장애 유형 분류

<!--
[구조 유지]
기존 장애 유형 분류 그대로 유지.
실무에서 검증된 분류 체계이므로 변경 불필요.
-->

### 1.1 LLM 오동작 (AI Malfunction)

| 유형 | 심각도 | 예시 | 자동 대응 |
|-----|--------|------|----------|
| 환각(Hallucination) | 🟡 Medium | 존재하지 않는 컬럼명 사용 | 재시도 1회 |
| 무한 루프 | 🔴 High | 같은 출력 반복, 토큰 소진 | 즉시 중단 |
| 권한 위반 | 🚨 Critical | Sub-agent가 Leader 권한 행사 | 중단 + 알림 |
| 역방향 흐름 | 🔴 High | Code→SDD 역생성 시도 | 중단 + 로깅 |
| 재시도 초과 | 🔴 High | 3회 재시도 후에도 Review FAIL | 사용자 개입 요청 |

<!--
[추가] 자동 대응 컬럼 신규 추가
- 이유: FeedbackLoop Agent가 심각도별로 어떤 액션을 취해야 하는지 명시
-->

### 1.2 데이터 위반 (Data Violation)

| 유형 | 심각도 | 예시 | 자동 대응 |
|-----|--------|------|----------|
| PII 노출 | 🚨 Critical | 개인정보 평문 출력 | 즉시 중단 + 출력 삭제 |
| 금지 쿼리 | 🚨 Critical | INSERT/UPDATE/DELETE 실행 | 쿼리 차단 + 알림 |
| Full Scan | 🔴 High | 대용량 테이블 인덱스 없이 조회 | 경고 + 쿼리 취소 |

### 1.3 보안 위반 (Security Violation)

| 유형 | 심각도 | 예시 | 자동 대응 |
|-----|--------|------|----------|
| 룰북 수정 시도 | 🚨 Critical | .claude/global/* 수정 | 작업 거부 + 로깅 |
| 크레덴셜 노출 | 🚨 Critical | API 키, 비밀번호 출력 | 출력 마스킹 + 알림 |
| SQL Injection | 🔴 High | 파라미터 바인딩 없는 쿼리 | 쿼리 거부 |

---

## 2. 에스컬레이션 경로

<!--
[구조 유지]
에스컬레이션 다이어그램은 ASCII art로 유지.
Agent가 이해하기 쉬운 형태.
-->

### 2.1 에스컬레이션 흐름도

```
장애 감지
    │
    ▼
┌─────────┐    🟡 Medium     ┌─────────────┐
│ AI Agent │ ──────────────▶ │ Leader Agent │
└─────────┘                  └─────────────┘
    │                              │
    │ 🔴 High                      │ 해결 불가
    ▼                              ▼
┌─────────────┐              ┌─────────────┐
│ Leader Agent│              │ 운영자(Human)│
└─────────────┘              └─────────────┘
    │                              │
    │ 🚨 Critical                  │
    ▼                              ▼
┌─────────────┐              ┌─────────────┐
│ 운영자(Human)│              │  DBA / 보안팀 │
└─────────────┘              └─────────────┘
```

### 2.2 심각도별 대응 주체

| 심각도 | 1차 대응 | 2차 대응 | 알림 방식 |
|--------|---------|---------|----------|
| 🟡 Medium | FeedbackLoop | Leader Agent | 로그 기록 |
| 🔴 High | Leader Agent | 운영자 | 콘솔 경고 |
| 🚨 Critical | 운영자 | DBA/보안팀 | 즉시 중단 + 알림 |

<!--
[변경] 1차 대응 주체에 FeedbackLoop 추가
- 이유: Medium 심각도는 FeedbackLoop이 자동 처리하도록 설계
-->

---

## 3. 즉시 대응 절차

### 3.1 LLM 오동작 발생 시

**Step 1. 즉시 중단**
- 현재 작업 중단
- 출력 버퍼 클리어

**Step 2. 상태 보고**
- 어떤 오동작이 발생했는지 명시
- 영향 범위 파악

**Step 3. 롤백 여부 판단**
- 파일 변경이 있었는가? → 롤백 필요
- 데이터 변경이 있었는가? → 긴급 에스컬레이션

### 3.2 데이터 위반 발생 시

**Step 1. 즉시 중단**
- 쿼리 실행 중단
- 트랜잭션 롤백 (가능한 경우)

**Step 2. 증거 보존**
- 실행된 쿼리 로그 저장
- 영향받은 테이블/행 식별

**Step 3. 에스컬레이션**
- 🚨 Critical → 운영자 + DBA 즉시 알림
- 복구 계획 수립

### 3.3 보안 위반 발생 시

**Step 1. 즉시 중단**
- 모든 작업 중단
- 세션 격리

**Step 2. 증거 보존**
- 전체 대화 로그 저장
- 노출된 정보 식별

**Step 3. 긴급 에스컬레이션**
- 보안팀 즉시 알림
- 크레덴셜 노출 시 → 즉시 키 로테이션

---

## 4. 롤백 절차

### 4.1 코드 롤백

Git 명령어를 사용하여 롤백합니다:
- 변경 사항 확인: `git status`, `git diff`
- 커밋 전 취소: `git checkout -- [file]`
- 커밋 후 롤백: `git revert HEAD`

### 4.2 문서 롤백

1. 변경된 문서 식별
2. Git 히스토리에서 이전 버전 복원
3. 변경 사유 기록

---

## 5. 포스트모템 템플릿

<!--
[구조 유지]
포스트모템 템플릿은 실무 표준 형식이므로 유지.
-->

장애 해결 후 반드시 포스트모템을 작성합니다.

**포스트모템 필수 항목:**

| 섹션 | 내용 |
|------|------|
| 요약 | 발생일시, 해결일시, 심각도, 영향범위 |
| 타임라인 | 시간순 이벤트 기록 |
| 근본 원인 | Root Cause 분석 |
| 대응 내역 | 수행한 조치 |
| 재발 방지 대책 | 체크리스트 형태 |
| 교훈 | Lessons Learned |

---

## 6. Orchestrator 장애 대응

<!--
[구조 유지 + 표 형식 개선]
Orchestrator 관련 내용은 실무에서 자주 참조되므로 유지.
-->

### 6.1 실패 유형별 대응

| 유형 | 상태 | 원인 | 대응 |
|------|------|------|------|
| API 키 오류 | 시작 불가 | ANTHROPIC_API_KEY 미설정 | .env 파일 확인 |
| Planning 실패 | Phase 1 중단 | PRD 불명확, 토큰 초과 | PRD 수정 후 재시도 |
| Coding 실패 | Phase 2 중단 | HANDOFF 불완전 | Leader에게 재요청 |
| Review 3회 FAIL | 사용자 개입 필요 | 품질 기준 미달 | 수동 수정 필요 |

### 6.2 USER_INTERVENTION_REQUIRED 대응

**Step 1. 로그 확인**
- 위치: `orchestrator/logs/<task-id>.json`
- 각 Review의 FAIL 사유 분석

**Step 2. 원인 분류**
- Schema 위반 → DOMAIN_SCHEMA.md 확인
- 구조 문제 → SDD 수정 필요
- 테스트 누락 → TDD_WORKFLOW.md 참조

**Step 3. 수동 수정**
- 생성된 파일 수동 편집
- 또는 PRD/SDD 수정 후 Orchestrator 재실행

### 6.3 토큰 소진 대응

**작업 분할**
- 큰 작업을 여러 개의 작은 작업으로 분리
- 각 작업별 별도 task-id 부여

**컨텍스트 최적화**
- PRD에서 불필요한 내용 제거
- 핵심 요구사항만 명시

**모델 변경**
- ANTHROPIC_MODEL 환경 변수로 경량 모델 사용

---

## 7. FeedbackLoop Agent 연동

<!--
[신규 섹션]
- 이유: FeedbackLoop Agent가 이 문서를 로딩하므로 연동 방법 명시 필요
- AS-IS에서는 Agent 연동 정보가 전혀 없었음
-->

### 7.1 FeedbackLoop 역할

| 역할 | 설명 |
|------|------|
| 에러 수집 | 모든 Agent의 에러 로그 수집 |
| 심각도 판정 | 장애 유형 분류 기준에 따라 심각도 자동 판정 |
| 자동 대응 | Medium 이하는 자동 재시도/롤백 수행 |
| 에스컬레이션 | High 이상은 상위 Agent 또는 운영자에게 전달 |

### 7.2 자동 대응 규칙

| 심각도 | 자동 대응 | 알림 |
|--------|----------|------|
| 🟡 Medium | 재시도 1회 → 실패 시 Leader 전달 | 로그만 |
| 🔴 High | 즉시 중단 → Leader 전달 | 콘솔 경고 |
| 🚨 Critical | 즉시 중단 → 사용자 알림 | USER_INTERVENTION_REQUIRED |

### 7.3 로그 저장 형식

FeedbackLoop이 수집하는 에러 로그는 다음 정보를 포함합니다:

| 필드 | 설명 |
|------|------|
| timestamp | 발생 시각 (ISO 8601) |
| agentType | 에러 발생 Agent |
| errorType | 장애 유형 (LLM/Data/Security) |
| severity | 심각도 (Medium/High/Critical) |
| message | 에러 메시지 |
| context | 발생 컨텍스트 (task-id, phase 등) |
| resolution | 자동 대응 결과 |

---

## 📚 관련 문서

| 문서 | 역할 |
|------|------|
| CLAUDE.md | 팀 헌법, Safety Rules |
| QUALITY_GATES.md | 품질 검증 기준 |
| AGENT_ARCHITECTURE.md | Leader/Sub-agent 권한 |
| VALIDATION_GUIDE.md | 산출물 검증 절차 |

---

**END OF ERROR_HANDLING_GUIDE.md**

*장애 대응은 속도보다 정확성이 중요합니다. 당황하지 말고 절차를 따르세요.*

---

## 🔧 구현 가이드

### 기존 파일 처리

| 파일 | 조치 |
|------|------|
| INCIDENT_PLAYBOOK.md | 삭제 (ERROR_HANDLING_GUIDE.md로 대체) |

### Agent 로딩 구현

**Leader (leader.js)**
- Review FAIL 발생 시 섹션 2, 6 선택적 로딩
- 에스컬레이션 판단에 활용

**FeedbackLoop (feedback-loop.js)**
- 전체 문서 로딩
- 심각도 판정 및 자동 대응 로직 구현

**Orchestrator (orchestrator.js)**
- 에러 발생 시 섹션 6만 참조
- USER_INTERVENTION_REQUIRED 판단에 활용

---

## 📊 기대 효과

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| Agent 로딩 | ❌ 없음 | ✅ 3개 Agent |
| 자동 대응 | ❌ 수동만 | ✅ Medium 자동 처리 |
| 에스컬레이션 | ❌ 미구현 | ✅ 심각도별 경로 명시 |
| 로그 수집 | ❌ 없음 | ✅ FeedbackLoop 연동 |
