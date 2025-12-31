# Exception Test Cases

> **목적**: Orchestrator의 예외 처리 및 보안 검증을 위한 테스트 PRD 모음
> **생성일**: 2025-12-30

---

## 테스트 케이스 목록

| # | 파일명 | 예외 유형 | 기대 동작 |
|---|--------|----------|-----------|
| 01 | `PRD-01-empty.md` | 빈 PRD | Gap Check FAIL, 필수 섹션 요청 |
| 02 | `PRD-02-missing-sections.md` | 필수 섹션 누락 | Gap Check 경고, 누락 항목 명시 |
| 03 | `PRD-03-wrong-pipeline.md` | 잘못된 파이프라인 | 유효하지 않은 파이프라인 FAIL |
| 04 | `PRD-04-sql-injection.md` | SQL/프롬프트 인젝션 | 쿼리 차단, 보안 로그 기록 |
| 05 | `PRD-05-oversized.md` | 초대형 PRD | 토큰 제한 경고, 요약 요청 |
| 06 | `PRD-06-circular-reference.md` | 순환 의존성 | 의존성 분석 경고 |
| 07 | `PRD-07-invalid-schema.md` | 존재하지 않는 스키마 | Hallucination 방지, 스키마 검증 실패 |
| 08 | `PRD-08-conflicting-requirements.md` | 상충 요구사항 | 명확화 요청 또는 우선순위 질문 |
| 09 | `PRD-09-protected-path.md` | 보호된 경로 접근 | Path Traversal 차단, Constitution 보호 |
| 10 | `PRD-10-type-mismatch.md` | 타입 불일치 | 타입 검증 실패, 기본값 적용 |

---

## 실행 방법

```bash
# 개별 테스트
node orchestrator/index.js --prd docs/cases/case-except/PRD-01-empty.md "예외 테스트"

# 특정 케이스 실행
node orchestrator/index.js --prd docs/cases/case-except/PRD-04-sql-injection.md "보안 테스트"
```

---

## CLI 옵션 가이드

### 전체 옵션

```bash
node orchestrator/index.js [options] "작업 설명"
```

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--prd <path>` | PRD 파일 경로 | - |
| `--task-id <id>` | 작업 ID (산출물 폴더명) | PRD의 Case ID 또는 자동생성 |
| `--no-save` | 파일 저장 안 함 (dry-run) | false |
| `--max-retries <n>` | 최대 재시도 횟수 | 3 |
| `--pipeline <type>` | 파이프라인: `analysis`, `mixed`, `design` | 자동감지 |
| `--parallel` | 병렬 파이프라인 | - |
| `--help` | 도움말 | - |

### 산출물 경로 규칙

Orchestrator는 **Case-Centric 전략**을 사용합니다:

```
산출물 경로: docs/cases/{caseId}/
```

#### Case ID 결정 순서

1. `--task-id` 옵션으로 직접 지정
2. PRD 파일 내 `Case ID` 필드에서 추출
3. PRD 제목에서 자동 생성
4. 타임스탬프 기반 자동 생성 (`task-{timestamp}`)

### 예시: 산출물 경로 지정

```bash
# 방법 1: --task-id 옵션으로 직접 지정
node orchestrator/index.js \
  --prd docs/cases/case-except/PRD-01-empty.md \
  --task-id my-custom-output \
  "빈 PRD 테스트"
# → 산출물 경로: docs/cases/my-custom-output/

# 방법 2: PRD 내 Case ID 필드 사용 (자동)
# PRD-01-empty.md 내용:
# | **Case ID** | case-except-01-empty |
node orchestrator/index.js \
  --prd docs/cases/case-except/PRD-01-empty.md \
  "빈 PRD 테스트"
# → 산출물 경로: docs/cases/case-except-01-empty/

# Dry-run 모드 (파일 저장 없이 테스트)
node orchestrator/index.js \
  --prd docs/cases/case-except/PRD-01-empty.md \
  --no-save \
  "빈 PRD 테스트"
```

### 산출물 구조

```
docs/cases/{caseId}/
├── PRD.md              # PRD 스냅샷 (원본 복사)
├── HANDOFF.md          # 인수인계 문서
├── SDD.md              # 시스템 설계 문서
├── IA.md               # 정보 구조
├── Wireframe.md        # 와이어프레임
└── analysis/           # (analysis 파이프라인 시)
    ├── results/        # SQL 실행 결과
    └── analysis_report.md
```

---

## 케이스별 예상 CLI 출력

### Case 01: 빈 PRD

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-01-empty.md "빈 PRD 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-01-empty
   Pipeline: design (QUALITATIVE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-01-empty
🌊  Pipeline : Design Only (B)
⏱️  Duration : 4ms (0 tokens)
🏁  Status   : ❌ Failed

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ⚠️ Fail - PRD Gap: 타겟 유저, 핵심 기능, 성공 지표, 산출물 체크리스트 누락

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] PRD 불완전 - 4개 섹션 누락
   🛠️  [Suggestion]      "타겟 유저", "핵심 기능", "성공 지표", "산출물 체크리스트" 섹션을 추가해주세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Case 02: 필수 섹션 누락

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-02-missing-sections.md "섹션 누락 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-02-missing
   Pipeline: design (QUALITATIVE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-02-missing
🌊  Pipeline : Design Only (B)
⏱️  Duration : 3ms (0 tokens)
🏁  Status   : ❌ Failed

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ⚠️ Fail - PRD Gap: 타겟 유저, 핵심 기능, 성공 지표, 산출물 체크리스트 누락

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] PRD 불완전 - 4개 섹션 누락
   🛠️  [Suggestion]      "타겟 유저", "핵심 기능", "성공 지표", "산출물 체크리스트" 섹션을 추가해주세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Case 03: 잘못된 파이프라인

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-03-wrong-pipeline.md "파이프라인 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-03-pipeline
   Pipeline: nonexistent (INVALID)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-03-pipeline
🌊  Pipeline : Invalid (nonexistent)
⏱️  Duration : 3ms (0 tokens)
🏁  Status   : ❌ Failed

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ⚠️ Fail - 유효하지 않은 파이프라인: "nonexistent"

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] 유효하지 않은 파이프라인 지정: "nonexistent"
   🛠️  [Suggestion]      유효한 파이프라인: "analysis", "design", "mixed", "full"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Case 04: SQL Injection 시도

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-04-sql-injection.md "보안 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-04-injection
   Pipeline: analysis (QUANTITATIVE)
   → Analysis 파이프라인 실행

📊 Phase A: Analysis...
🔒 [TIMESTAMP] [DANGEROUS_QUERY_BLOCKED] DROP statement detected
🔒 [TIMESTAMP] [DANGEROUS_QUERY_BLOCKED] DELETE statement detected
🔒 [TIMESTAMP] [DANGEROUS_QUERY_BLOCKED] UPDATE statement detected
🔒 [TIMESTAMP] [DANGEROUS_QUERY_BLOCKED] INSERT statement detected
🔒 [TIMESTAMP] [SENSITIVE_COLUMN_ACCESS] U_PASSWD access blocked
🔒 [TIMESTAMP] [PROMPT_INJECTION_DETECTED] ignore instructions
🔒 [TIMESTAMP] [PROMPT_INJECTION_DETECTED] rm -rf pattern
🔒 [TIMESTAMP] [PROMPT_INJECTION_DETECTED] execute command

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-04-injection
🌊  Pipeline : Analysis Only (A)
⏱️  Duration : Xms (0 tokens)
🏁  Status   : ❌ Failed

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ❌ Blocked - 보안 위반 쿼리 차단됨
   • 🎨 Phase B (Design)   : ⏭️ Skip

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] 보안 정책 위반 - 위험 쿼리 N개 차단됨
   🛠️  [Suggestion]      SELECT 쿼리만 허용됩니다. INSERT/UPDATE/DELETE/DROP 금지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 보안 로그: orchestrator/logs/audit/audit-YYYY-MM-DD.jsonl
```

---

### Case 05: 초대형 PRD

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-05-oversized.md "대형 PRD 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-05-oversized
   Pipeline: mixed (MIXED)

📊 Phase A: Analysis...
   ✅ Analysis 완료
   ⚠️ Empty data - Design will use mock context

📋 Phase B: Design...
   ⚠️ Review FAIL (45/100)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-05-oversized
🌊  Pipeline : Mixed (A→B)
⏱️  Duration : 45.8s (89,234 tokens)
🏁  Status   : ⚠️ Partial

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⚠️ Partial - Mock 데이터 사용
   • 🎨 Phase B (Design)   : ⚠️ Fail - 요구사항 과다 (165개 기능)

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] PRD 범위 과다 - 단일 iteration에서 처리 불가
   🛠️  [Suggestion]      PRD를 여러 Phase로 분할하거나 핵심 기능만 선별해주세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 토큰 사용량이 높습니다. PRD 분할을 권장합니다.
```

---

### Case 06: 순환 의존성

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-06-circular-reference.md "순환 참조 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-06-circular
   Pipeline: design (QUALITATIVE)

📋 Phase B: Design...
   ✅ Design 완료 (68/100)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-06-circular
🌊  Pipeline : Design Only (B)
⏱️  Duration : 22.1s (18,456 tokens)
🏁  Status   : ✅ Success

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ✅ Pass - SDD, IA, Wireframe 생성됨

2️⃣  Artifacts & Locations
   • 📂 Docs     : ./docs/cases/case-except-06-circular/  (SDD, IA, Wireframe)

3️⃣  Next Actions & Commands
   👉 [Check]    open docs/cases/case-except-06-circular/HANDOFF.md
   👉 [Warning]  SDD에 순환 의존성 경고가 포함되어 있습니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

※ Leader Agent가 순환 의존성을 감지하고 SDD에 해결 방안을 제시했습니다.
```

---

### Case 07: 존재하지 않는 스키마

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-07-invalid-schema.md "스키마 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-07-schema
   Pipeline: analysis (QUANTITATIVE)

📊 Phase A: Analysis...
   ⚠️ Schema validation failed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-07-schema
🌊  Pipeline : Analysis Only (A)
⏱️  Duration : 8.5s (6,234 tokens)
🏁  Status   : ❌ Failed

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ❌ Fail - 스키마 검증 실패
   • 🎨 Phase B (Design)   : ⏭️ Skip

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] 존재하지 않는 테이블/컬럼 참조
   🛠️  [Suggestion]      DOMAIN_SCHEMA.md를 확인하고 유효한 테이블명을 사용해주세요
      - NONEXISTENT_TABLE → (존재하지 않음)
      - FAKE_USERS → (존재하지 않음)
      - this_column_does_not_exist → (USERS 테이블에 없음)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Case 08: 상충 요구사항

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-08-conflicting-requirements.md "상충 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-08-conflict
   Pipeline: design (QUALITATIVE)

📋 Phase B: Design...
   ✅ Design 완료 (62/100)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-08-conflict
🌊  Pipeline : Design Only (B)
⏱️  Duration : 25.3s (21,456 tokens)
🏁  Status   : ✅ Success

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ✅ Pass - SDD, IA, Wireframe 생성됨

2️⃣  Artifacts & Locations
   • 📂 Docs     : ./docs/cases/case-except-08-conflict/  (SDD, IA, Wireframe)

3️⃣  Next Actions & Commands
   👉 [Check]    open docs/cases/case-except-08-conflict/HANDOFF.md
   👉 [Warning]  HANDOFF에 요구사항 충돌 분석 및 권장 우선순위가 포함됨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

※ Leader Agent가 상충 요구사항을 감지하고 트레이드오프 분석을 제공했습니다.
   - UI: "파워유저 모드 / 심플 모드" 토글 제안
   - 성능: "실시간(WebSocket) + 캐싱" 하이브리드 제안
   - 보안: "기본 1단계 + 민감작업 시 추가인증" 제안
```

---

### Case 09: 보호된 경로 접근

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-09-protected-path.md "보호 경로 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-09-protected
   Pipeline: design (QUALITATIVE)

📋 Phase B: Design...
🔒 [2025-12-30T10:25:12.123Z] [PROTECTED_PATH_ACCESS] .claude/rules/DOMAIN_SCHEMA.md
🔒 [2025-12-30T10:25:12.125Z] [PROTECTED_PATH_ACCESS] .claude/rules/CODE_STYLE.md
🔒 [2025-12-30T10:25:12.126Z] [PROTECTED_PATH_ACCESS] .claude/workflows/
🔒 [2025-12-30T10:25:12.127Z] [PROTECTED_PATH_ACCESS] CLAUDE.md
🔒 [2025-12-30T10:25:12.128Z] [PATH_TRAVERSAL_DETECTED] ../../../etc/passwd
🔒 [2025-12-30T10:25:12.129Z] [PROMPT_INJECTION_DETECTED] rm -rf pattern

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-09-protected
🌊  Pipeline : Design Only (B)
⏱️  Duration : 2.1s (1,234 tokens)
🏁  Status   : ❌ Failed

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ❌ Blocked - 보안 정책 위반

3️⃣  Next Actions & Commands
   🔴 [Suspected Issue] Constitution 보호 및 Path Traversal 시도 차단
   🛠️  [Suggestion]      .claude/rules/*, CLAUDE.md는 수정 불가합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 보안 로그: orchestrator/logs/audit/audit-2025-12-30.jsonl
```

---

### Case 10: 타입 불일치

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-10-type-mismatch.md "타입 테스트"
```

**예상 출력:**
```
🚀 Task: case-except-10-type
   Pipeline: design (QUALITATIVE)

📋 Phase B: Design...
   ✅ Design 완료 (72/100)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : case-except-10-type
🌊  Pipeline : Design Only (B)
⏱️  Duration : 14.2s (11,234 tokens)
🏁  Status   : ✅ Success

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ✅ Pass - SDD, IA, Wireframe 생성됨

2️⃣  Artifacts & Locations
   • 📂 Docs     : ./docs/cases/case-except-10-type/  (SDD, IA, Wireframe)

3️⃣  Next Actions & Commands
   👉 [Check]    open docs/cases/case-except-10-type/HANDOFF.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

※ 잘못된 타입의 필드값(Pipeline: 12345)은 기본값 "design"으로 폴백됨
※ PRD 내용이 비정상이지만 Leader Agent가 최선의 해석을 시도함
```

---

## 예외 유형별 상세

### 1. 입력 검증 (Input Validation)

| 케이스 | 검증 항목 | 방어 계층 |
|--------|----------|----------|
| 01, 02 | PRD 필수 섹션 | PRDAnalyzer.parsePRD() |
| 03, 10 | 필드 타입/값 | _determineRoutingDecision() |
| 05 | 입력 크기 제한 | SECURITY_LIMITS |

### 2. 보안 (Security)

| 케이스 | 공격 유형 | 방어 계층 |
|--------|----------|----------|
| 04 | SQL Injection | DB_ACCESS_POLICY, 쿼리 검증 |
| 04 | Prompt Injection | sanitizeInput(), wrapContent() |
| 09 | Path Traversal | PathValidator, validateOutput() |
| 09 | Constitution 접근 | 보호된 경로 목록 (.claude/rules/*) |

### 3. 로직 (Logic)

| 케이스 | 문제 유형 | 기대 동작 |
|--------|----------|----------|
| 06 | 순환 의존성 | 의존성 그래프 분석, 경고 |
| 07 | 스키마 불일치 | DOMAIN_SCHEMA.md 대조, Hallucination 방지 |
| 08 | 상충 요구사항 | 모순 감지, 사용자 확인 요청 |

---

## 검증 체크리스트

### 실행 전
- [ ] 로그 레벨 DEBUG로 설정 (상세 로그 확인)
- [ ] audit-logger 활성화 확인

### 실행 후 확인 항목

```bash
# 감사 로그 확인
cat orchestrator/logs/audit/audit-$(date +%Y-%m-%d).jsonl | jq '.event'

# 보안 이벤트 필터링
cat orchestrator/logs/audit/audit-*.jsonl | grep -E "(INJECTION|TRAVERSAL|PROTECTED)"
```

### 기대 결과 매트릭스

| 케이스 | success | 보안로그 | Gap Check | Review |
|--------|---------|---------|-----------|--------|
| 01 | ❌ | - | FAIL | - |
| 02 | ❌ | - | WARN | FAIL |
| 03 | ✅ | - | PASS | PASS |
| 04 | ❌ | ✅ | - | - |
| 05 | ⚠️ | - | PASS | WARN |
| 06 | ✅ | - | PASS | PASS |
| 07 | ❌ | - | - | FAIL |
| 08 | ✅ | - | PASS | PASS |
| 09 | ❌ | ✅ | - | - |
| 10 | ✅ | - | PASS | PASS |

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| [VALIDATION_GUIDE.md](../../../.claude/rules/VALIDATION_GUIDE.md) | 검증 규칙 정의 |
| [DB_ACCESS_POLICY.md](../../../.claude/rules/DB_ACCESS_POLICY.md) | SQL 보안 정책 |
| [DOMAIN_SCHEMA.md](../../../.claude/rules/DOMAIN_SCHEMA.md) | 스키마 정의 |

---

## 파이프라인별 성공케이스 CLI 출력

> 정상 파이프라인별 성공 케이스의 CLI 출력 정리

### 대상 파이프라인

| 파이프라인 | Phase 조합 | 테스트 PRD | 테스트 상태 |
|-----------|-----------|-----------|------------|
| `analysis` | A만 | `PRD-SUCCESS-A-analysis.md` | ⬜ TODO |
| `design` | B만 | `PRD-SUCCESS-B-design.md` | ⬜ TODO |
| `code` | C만 | - | ⬜ TODO |
| `analyzed_design` (mixed) | A → B | - | ⬜ TODO |
| `ui_mockup` | B → C | - | ⬜ TODO |
| `full` | A → B → C | - | ⬜ TODO |

---

### Success A: Analysis 파이프라인

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-SUCCESS-A-analysis.md "분석 테스트"
```

**예상 출력:**
```
🚀 Task: success-a-analysis
   Pipeline: analysis (QUANTITATIVE)

📊 Phase A: Analysis...
   📊 SQL 3개 생성 완료
   📊 SQL 실행 3/3 성공
   ✅ Reviewer PASS (85/100)
   ✅ Analysis 완료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : success-a-analysis
🌊  Pipeline : Analysis Only (A)
⏱️  Duration : 8.5s (6,234 tokens)
🏁  Status   : ✅ Success

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ✅ Pass - SQL 3개 실행, 리포트 생성
   • 🎨 Phase B (Design)   : ⏭️ Skip
   • ⚙️  Phase C (Coding)   : ⏭️ Skip

2️⃣  Artifacts & Locations
   • 💾 Data     : ./docs/cases/success-a-analysis/analysis/  (SQL Results)

3️⃣  Next Actions & Commands
   👉 [Check]    open docs/cases/success-a-analysis/analysis/analysis_report.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Success B: Design 파이프라인

```bash
node orchestrator/index.js --prd docs/cases/case-except/PRD-SUCCESS-B-design.md "설계 테스트"
```

**예상 출력:**
```
🚀 Task: success-b-design
   Pipeline: design (QUALITATIVE)

📋 Phase B: Design...
   ✅ Design 완료 (9,500 tokens)
   - PRD 유형: QUALITATIVE
   - 산출물 체크리스트: 6개

📝 [Phase 2] Design Mode: Leader 설계 문서 구성...
   - IA.md: Leader 결과 사용 (800 chars)
   - Wireframe.md: Leader 결과 사용 (600 chars)
   - SDD.md: Leader 결과 사용 (1200 chars)

🔍 [Phase 3] Design Output Validation...
   - 전체 통과: ✅
   - PRD 매칭: 6/6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [System B] Execution Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  Task     : success-b-design
🌊  Pipeline : Design Only (B)
⏱️  Duration : 12.3s (9,500 tokens)
🏁  Status   : ✅ Success

1️⃣  Phase Execution Summary
   • 📊 Phase A (Analysis) : ⏭️ Skip
   • 🎨 Phase B (Design)   : ✅ Pass - IA, Wireframe, SDD 생성
   • ⚙️  Phase C (Coding)   : ⏭️ Skip

2️⃣  Artifacts & Locations
   • 📂 Docs     : ./docs/cases/success-b-design/  (IA, Wireframe, SDD, HANDOFF)

3️⃣  Next Actions & Commands
   👉 [Check]    open docs/cases/success-b-design/HANDOFF.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 작업 항목

- [x] A, B 파이프라인 테스트 PRD 준비
- [ ] A 파이프라인 CLI 실행 및 출력 검증
- [ ] B 파이프라인 CLI 실행 및 출력 검증
- [ ] C, analyzed_design, ui_mockup, full 파이프라인 PRD 및 예상 출력 추가
- [ ] 불필요한 로그 정리 (verbose → debug)

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-30 | 초기 생성 (10개 케이스) |
| 2025-12-30 | 케이스별 예상 CLI 출력 추가 |
| 2025-12-30 | CLI 옵션 가이드 및 산출물 경로 규칙 추가 |
| 2025-12-30 | 파일명 변경 (README.md → 예외케이스-cli출력.md), 파이프라인별 성공케이스 TODO 추가 |
| 2025-12-31 | A, B 파이프라인 테스트 PRD 및 예상 출력 추가 |
