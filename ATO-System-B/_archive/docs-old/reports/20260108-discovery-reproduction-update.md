# Discovery vs Reproduction 원칙 반영 정리

## 배경

"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다" 원칙을 기준으로 문서 간 충돌(CODE_STYLE의 Mock 금지 vs TDD/구동 테스트 요구)을 해소하기 위해 5개 핵심 문서를 정리했습니다.

## 핵심 원칙

- **Phase A (Discovery)**: Read-Only Real DB로 구조/패턴/예외 케이스 발견
- **Phase C (Reproduction)**: Real DB 금지, Schema-Compliant Fixture로 UI/로직 재현
- **계약(Contract)**: Phase A 산출물은 이후 단계의 변경 불가 계약으로 간주
- **책임 분리**: 데이터 이상은 Analyzer 책임, UI 구현은 Coder 책임

## 문서별 반영 내용

### 1) CLAUDE.md

**섹션 변경**: 기존 `서버 데이터 보호` → `데이터 사용 원칙 (Discovery vs Reproduction)`

- Phase A: Real DB (Read-Only) 허용
- Phase C: Real DB 금지, Fixture/Mock 허용
- 계약/책임 분리 원칙 명문화

**Diff 스니펫**

```diff
-### 2. 서버 데이터 보호 (Data Protection)
+### 2. 데이터 사용 원칙 (Data Usage Principles) - Discovery vs Reproduction
+
+**"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다."**
+
+| Phase | 목적 | 데이터 소스 | 허용 행위 | 산출물(Contract) |
+| :--- | :--- | :--- | :--- | :--- |
+| **A (Analysis)** | **발견 (Discovery)** | ✅ **Real DB** (Read-Only) | 구조 파악, 관계 분석, 예외 케이스 발굴 | `ANALYSIS.md`, `DOMAIN_SCHEMA.md` |
+| **C (Impl)** | **재현 (Reproduction)** | ❌ **Real DB 금지**<br>✅ **Fixture/Mock** | 계약(Phase A 산출물)에 기반한 UI 렌더링 및 로직 검증 | `Source Code`, `Tests` |
+
+**원칙:**
+1. **계약의 확정:** Phase A의 산출물은 이후 단계의 '변경 불가능한 계약'이 된다.
+2. **책임의 분리:** UI는 DB 연결 상태가 아니라, 계약된 데이터 구조(Schema)에 대한 렌더링 정확성을 책임진다.
```

---

### 2) CODE_STYLE.md

**섹션 변경**: `절대 금지 사항 (Never)` 테이블 개편

- **Mock 데이터/가짜 구현** → **Fake Logic** / **Ad-hoc Mocking**으로 분리
- **Schema-Compliant Fixture**는 UI 개발 및 TDD에서 **필수 권장**으로 명시

**Diff 스니펫**

```diff
-### 절대 금지 사항 (Never)
-
-| 금지 항목                 | 설명                                                                                      |
-| ------------------------- | ----------------------------------------------------------------------------------------- |
-| **Mock 데이터/가짜 구현** | 실제 동작하는 로직만 작성 (TDD 준수)                                                      |
-| **타입 회피**             | `any`, `dynamic`, `Object` 사용 금지                                                      |
-| **Magic Number**          | 의미 불명한 숫자는 반드시 `const`로 추출                                                  |
-| **Legacy Renaming**       | **DB 컬럼명(`U_ID` 등)을 임의로 camelCase(`userId`)로 변환 금지.** (매핑 오류 원인 1순위) |
+### 절대 금지 사항 (Never)
+
+| 금지 항목           | 설명                                                                                      | 예외 (허용)                                                                                                                       |
+| ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
+| **Fake Logic**      | 비즈니스 로직을 `return true`로 하드코딩하는 행위 금지                                     | -                                                                                                                                 |
+| **Ad-hoc Mocking**  | 스키마와 무관한 임의의 JSON 데이터 사용 금지                                              | **Schema-Compliant Fixture:** `DOMAIN_SCHEMA.md` 구조와 실제 컬럼명을 따르는 Fixture는 UI 개발 및 TDD 시 **필수 권장**           |
+| **타입 회피**       | `any`, `dynamic`, `Object` 사용 금지                                                      | -                                                                                                                                 |
+| **Magic Number**    | 의미 불명한 숫자는 반드시 `const`로 추출                                                  | -                                                                                                                                 |
+| **Legacy Renaming** | **DB 컬럼명(`U_ID` 등)을 임의로 camelCase(`userId`)로 변환 금지.** (매핑 오류 원인 1순위) | -                                                                                                                                 |
```

---

### 3) TDD_WORKFLOW.md

**추가 섹션**: `데이터 전략: Fixture as a Contract`

- Discovery 완료 상태 전제
- Reproduction 단계에서 Real DB 연결 금지
- Red 단계에서 Fixture 정의를 "계약"으로 명문화

**Diff 스니펫**

```diff
+## 데이터 전략: Fixture as a Contract
+
+**"UI는 DB가 아니라 스키마(계약)를 믿어야 한다."**
+
+- **Discovery (Phase A):** 이미 완료됨. 우리는 DB를 탐색하는 것이 아니라, 확정된 `DOMAIN_SCHEMA.md`를 재현해야 함.
+- **Reproduction (Phase C):** 테스트 코드와 UI 스토리북에는 **Real DB 연결을 금지**하고, **Schema-Compliant Fixture**를 사용해야 함.
+
+---
@@
-2. **Schema 준수**: 테스트 데이터(Mock) 생성 시 `DOMAIN_SCHEMA.md`의 실제 컬럼명을 사용하세요.
+2. **Fixture 정의 (The Contract)**:
+   - 테스트 데이터는 임의로 만들지 말고, `DOMAIN_SCHEMA.md` 또는 `ANALYSIS_RESULT.json`에서 발견된 실제 데이터 구조를 복사하여 Fixture로 정의하세요.
+   - **목표:** "실제 DB가 끊겨도, UI는 약속된 데이터가 들어오면 완벽하게 렌더링되어야 한다."
+3. **Schema 준수**: 테스트 데이터(Fixture) 생성 시 `DOMAIN_SCHEMA.md`의 실제 컬럼명을 사용하세요.
```

---

### 4) DB_ACCESS_POLICY.md

**추가 섹션**: `접근 규칙 (Role-Based Access)`

| Role     | 허용      | 금지                 | 목적               |
| -------- | --------- | -------------------- | ------------------ |
| Analyzer | SELECT    | INSERT/UPDATE/DELETE | 발견(Discovery)    |
| Coder    | 접근 차단 | ALL (SELECT 포함)    | 재현(Reproduction) |

**Diff 스니펫**

```diff
 ## 권한 레벨

+### 접근 규칙 (Role-Based Access)
+
+| Role | 계정 | 허용 | 금지 | 목적 |
+| :--- | :--- | :--- | :--- | :--- |
+| **Analyzer** | `ai_readonly` | **SELECT** | INSERT/UPDATE/DELETE | **발견(Discovery):** 데이터 구조 및 패턴 파악 |
+| **Coder** | - | **접근 차단** | **ALL (SELECT 포함)** | **재현(Reproduction):** 계약/Fixture 기반 구현 |
```

---

### 5) ROLES_DEFINITION.md

**역할 보강**

- **Analyzer**: 데이터 계약(Contract) 확정 + `Fixture_Source.json` 포함
- **Coder**: 계약 기반 재현, 데이터 이상은 Analyzer에 이슈 제기
- Coder 제약에 **DB 접근 금지(SELECT 포함)** 명시

**Diff 스니펫**

```diff
@@ Analyzer 시스템 프롬프트
 - SELECT 쿼리만 사용하며, 데이터 수정은 절대 금지입니다.
+- UI가 믿고 쓸 수 있는 **데이터 계약(Contract)**을 발견하고 확정합니다.
+- 분석 결과에 `Fixture_Source.json` (실제 DB에서 추출한 예시 데이터)을 포함합니다.
@@ Coder 역할 개요
-| **제약**   | `.claude/{rules, workflows, context}/*` 수정 금지      |
+| **제약**   | DB 접근 금지(SELECT 포함), `.claude/{rules, workflows, context}/*` 수정 금지 |
@@ Coder 시스템 프롬프트
 - TDD 방식으로 테스트와 함께 개발합니다.
 - Self-Check를 수행합니다.
+- 확정된 계약(Schema/Fixture)을 기반으로 **재현(Reproduction)** 구현을 수행합니다.
+- 데이터 이상은 Phase A의 문제로 보고하고 Analyzer에게 이슈를 제기합니다.
```

## 변경된 파일 목록

- `CLAUDE.md`
- `.claude/rules/CODE_STYLE.md`
- `.claude/rules/TDD_WORKFLOW.md`
- `.claude/rules/DB_ACCESS_POLICY.md`
- `.claude/workflows/ROLES_DEFINITION.md`

## 후속 정리 제안

- Fixture 산출물의 **파일명/경로 표준화** (예: `analysis/fixture_source.json`)
- Discovery/Reproduction/Contract 용어 통일 규칙(대문자/한글 표기) 정의

---

## 추가 반영 (2026-01-08)

### 6) .claude/README.md

**섹션 4-1 Analyzer 박스 수정**

```diff
 │  🕵️ ANALYZER (Data Analyst)                               │
 │  • SQL 쿼리 작성/실행                                        │
 │  • 데이터 추출 및 분석                                       │
+│  • **데이터 계약(Contract) 확정**                            │
 │  Tool: profiler, query                                  │
-│  Output: docs/cases/{caseId}/{taskId}/analysis/*.sql,*.json│
+│  Output: analysis/*.sql, *.json, Fixture_Source.json    │
```

**섹션 4-1 Coder 박스 수정**

```diff
 │  💻 CODER (Developer)                          │
 │  • HANDOFF.md 기반 코드 구현                     │
+│  • **계약 기반 재현(Reproduction) 구현**         │
 │  • Self-Check (qualityGate.md)                 │
+│  • ⚠️ DB 접근 금지 (SELECT 포함)                │
 │  Tool: coder                                   │
```

---

### 7) .claude/skills/README.md

**섹션 3 테이블 수정**

```diff
-| `/query`    | SQL 쿼리 생성/실행         | HANDOFF.md, 세그먼트 정의              | `*.sql`, `analysis_result.json`, `report.md`         |
+| `/query`    | SQL 쿼리 생성/실행         | HANDOFF.md, 세그먼트 정의              | `*.sql`, `analysis_result.json`, `report.md`, `Fixture_Source.json` |
```

**섹션 7 신규 항목 추가**

```diff
+### Discovery vs Reproduction 원칙
+
+> **"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다."**
+
+| Phase | Skill | 데이터 소스 | 역할 |
+|-------|-------|-------------|------|
+| **Phase A** | `/profiler`, `/query` | ✅ Real DB (Read-Only) | 구조 파악, 계약 확정 |
+| **Phase C** | `/coder` | ❌ Real DB 금지<br>✅ Fixture/Mock | 계약 기반 UI 재현 |
+
+**⚠️ Coder 제약**: `/coder`는 DB에 접근하지 않습니다. `Fixture_Source.json` 또는 SDD의 스키마를 기반으로 구현합니다.
```

---

---

### 8) .claude/SYSTEM_MANIFEST.md

**Output Paths 섹션 확장**

```diff
 ## Output Paths (산출물 저장 위치)

 | 용도            | 경로                                     | 예시                      |
 | --------------- | ---------------------------------------- | ------------------------- |
 | Case 산출물     | `docs/cases/{caseId}/{taskId}/`          | HANDOFF.md, IA.md, SDD.md |
-| 분석 결과       | `docs/cases/{caseId}/{taskId}/analysis/` | _.sql, _.json, report.md  |
+| 분석 결과       | `docs/cases/{caseId}/{taskId}/analysis/` | *.sql, *.json, report.md  |
 | 백엔드 코드     | `backend/src/{feature}/`                 | API, Service, Repository  |
-| 프론트엔드 코드 | `frontend/src/{feature}/`                | Components, Pages         |
+| 프론트엔드 코드 | `frontend/src/features/{feature}/`       | Components, Pages         |
 | 실행 로그       | `workspace/logs/{caseId}/{taskId}.json`  | 실행 이력                 |
+
+### Discovery vs Reproduction 데이터 경로
+
+> **"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다."**
+
+| Phase | 용도 | 경로 | 설명 |
+|-------|------|------|------|
+| **Phase A** | Fixture Source | `docs/cases/{caseId}/{taskId}/analysis/fixture_source.json` | Real DB에서 추출한 계약 데이터 |
+| **Phase C** | Mock Handlers | `frontend/src/mocks/handlers.ts` | MSW 기반 API Mocking |
+
+- **Phase A (Discovery)**: `/query`가 Real DB에서 추출한 데이터를 `fixture_source.json`으로 저장
+- **Phase C (Reproduction)**: `/coder`는 `fixture_source.json` 또는 SDD 스키마 기반으로 `handlers.ts` 작성
```

---

## 변경된 파일 목록 (최종)

- `CLAUDE.md`
- `.claude/rules/CODE_STYLE.md`
- `.claude/rules/TDD_WORKFLOW.md`
- `.claude/rules/DB_ACCESS_POLICY.md`
- `.claude/workflows/ROLES_DEFINITION.md`
- `.claude/README.md`
- `.claude/skills/README.md`
- `.claude/SYSTEM_MANIFEST.md` ← **추가**

---

**END OF REPORT**

# Discovery vs Reproduction 원칙 반영 정리 (2026-01-08)

## 배경

"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다" 원칙을 기준으로 문서 간 충돌(CODE_STYLE의 Mock 금지 vs TDD/구동 테스트 요구)을 해소하기 위해 핵심 문서를 정리했습니다.

## 핵심 원칙

- **Phase A (Discovery)**: Read-Only Real DB로 구조/패턴/예외 케이스 발견
- **Phase C (Reproduction)**: Real DB 금지, Schema-Compliant Fixture로 UI/로직 재현
- **계약(Contract)**: Phase A 산출물은 이후 단계의 변경 불가 계약으로 간주
- **책임 분리**: 데이터 이상은 Analyzer 책임, UI 구현은 Coder 책임

## 문서별 반영 내용

### 1) CLAUDE.md

**섹션 변경**: 기존 `서버 데이터 보호` → `데이터 사용 원칙 (Discovery vs Reproduction)`

- Phase A: Real DB (Read-Only) 허용
- Phase C: Real DB 금지, Fixture/Mock 허용
- 계약/책임 분리 원칙 명문화

**Diff 스니펫**

```diff
-### 2. 서버 데이터 보호 (Data Protection)
+### 2. 데이터 사용 원칙 (Data Usage Principles) - Discovery vs Reproduction
+
+**"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다."**
+
+| Phase | 목적 | 데이터 소스 | 허용 행위 | 산출물(Contract) |
+| :--- | :--- | :--- | :--- | :--- |
+| **A (Analysis)** | **발견 (Discovery)** | ✅ **Real DB** (Read-Only) | 구조 파악, 관계 분석, 예외 케이스 발굴 | `ANALYSIS.md`, `DOMAIN_SCHEMA.md` |
+| **C (Impl)** | **재현 (Reproduction)** | ❌ **Real DB 금지**<br>✅ **Fixture/Mock** | 계약(Phase A 산출물)에 기반한 UI 렌더링 및 로직 검증 | `Source Code`, `Tests` |
+
+**원칙:**
+1. **계약의 확정:** Phase A의 산출물은 이후 단계의 '변경 불가능한 계약'이 된다.
+2. **책임의 분리:** UI는 DB 연결 상태가 아니라, 계약된 데이터 구조(Schema)에 대한 렌더링 정확성을 책임진다.
```

---

### 2) CODE_STYLE.md

**섹션 변경**: `절대 금지 사항 (Never)` 테이블 개편

- **Mock 데이터/가짜 구현** → **Fake Logic** / **Ad-hoc Mocking**으로 분리
- **Schema-Compliant Fixture**는 UI 개발 및 TDD에서 **필수 권장**으로 명시

**Diff 스니펫**

```diff
-### 절대 금지 사항 (Never)
-
-| 금지 항목                 | 설명                                                                                      |
-| ------------------------- | ----------------------------------------------------------------------------------------- |
-| **Mock 데이터/가짜 구현** | 실제 동작하는 로직만 작성 (TDD 준수)                                                      |
-| **타입 회피**             | `any`, `dynamic`, `Object` 사용 금지                                                      |
-| **Magic Number**          | 의미 불명한 숫자는 반드시 `const`로 추출                                                  |
-| **Legacy Renaming**       | **DB 컬럼명(`U_ID` 등)을 임의로 camelCase(`userId`)로 변환 금지.** (매핑 오류 원인 1순위) |
+### 절대 금지 사항 (Never)
+
+| 금지 항목           | 설명                                                                                      | 예외 (허용)                                                                                                                       |
+| ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
+| **Fake Logic**      | 비즈니스 로직을 `return true`로 하드코딩하는 행위 금지                                     | -                                                                                                                                 |
+| **Ad-hoc Mocking**  | 스키마와 무관한 임의의 JSON 데이터 사용 금지                                              | **Schema-Compliant Fixture:** `DOMAIN_SCHEMA.md` 구조와 실제 컬럼명을 따르는 Fixture는 UI 개발 및 TDD 시 **필수 권장**           |
+| **타입 회피**       | `any`, `dynamic`, `Object` 사용 금지                                                      | -                                                                                                                                 |
+| **Magic Number**    | 의미 불명한 숫자는 반드시 `const`로 추출                                                  | -                                                                                                                                 |
+| **Legacy Renaming** | **DB 컬럼명(`U_ID` 등)을 임의로 camelCase(`userId`)로 변환 금지.** (매핑 오류 원인 1순위) | -                                                                                                                                 |
```

---

### 3) TDD_WORKFLOW.md

**추가 섹션**: `데이터 전략: Fixture as a Contract`

- Discovery 완료 상태 전제
- Reproduction 단계에서 Real DB 연결 금지
- Red 단계에서 Fixture 정의를 "계약"으로 명문화

**Diff 스니펫**

```diff
+## 데이터 전략: Fixture as a Contract
+
+**"UI는 DB가 아니라 스키마(계약)를 믿어야 한다."**
+
+- **Discovery (Phase A):** 이미 완료됨. 우리는 DB를 탐색하는 것이 아니라, 확정된 `DOMAIN_SCHEMA.md`를 재현해야 함.
+- **Reproduction (Phase C):** 테스트 코드와 UI 스토리북에는 **Real DB 연결을 금지**하고, **Schema-Compliant Fixture**를 사용해야 함.
+
+---
@@
-2. **Schema 준수**: 테스트 데이터(Mock) 생성 시 `DOMAIN_SCHEMA.md`의 실제 컬럼명을 사용하세요.
+2. **Fixture 정의 (The Contract)**:
+   - 테스트 데이터는 임의로 만들지 말고, `DOMAIN_SCHEMA.md` 또는 `ANALYSIS_RESULT.json`에서 발견된 실제 데이터 구조를 복사하여 Fixture로 정의하세요.
+   - **목표:** "실제 DB가 끊겨도, UI는 약속된 데이터가 들어오면 완벽하게 렌더링되어야 한다."
+3. **Schema 준수**: 테스트 데이터(Fixture) 생성 시 `DOMAIN_SCHEMA.md`의 실제 컬럼명을 사용하세요.
```

---

### 4) DB_ACCESS_POLICY.md

**추가 섹션**: `접근 규칙 (Role-Based Access)`

| Role     | 허용      | 금지                 | 목적               |
| -------- | --------- | -------------------- | ------------------ |
| Analyzer | SELECT    | INSERT/UPDATE/DELETE | 발견(Discovery)    |
| Coder    | 접근 차단 | ALL (SELECT 포함)    | 재현(Reproduction) |

**Diff 스니펫**

```diff
 ## 권한 레벨

+### 접근 규칙 (Role-Based Access)
+
+| Role | 계정 | 허용 | 금지 | 목적 |
+| :--- | :--- | :--- | :--- | :--- |
+| **Analyzer** | `ai_readonly` | **SELECT** | INSERT/UPDATE/DELETE | **발견(Discovery):** 데이터 구조 및 패턴 파악 |
+| **Coder** | - | **접근 차단** | **ALL (SELECT 포함)** | **재현(Reproduction):** 계약/Fixture 기반 구현 |
```

---

### 5) ROLES_DEFINITION.md

**역할 보강**

- **Analyzer**: 데이터 계약(Contract) 확정 + `Fixture_Source.json` 포함
- **Coder**: 계약 기반 재현, 데이터 이상은 Analyzer에 이슈 제기
- Coder 제약에 **DB 접근 금지(SELECT 포함)** 명시

**Diff 스니펫**

```diff
@@ Analyzer 시스템 프롬프트
 - SELECT 쿼리만 사용하며, 데이터 수정은 절대 금지입니다.
+- UI가 믿고 쓸 수 있는 **데이터 계약(Contract)**을 발견하고 확정합니다.
+- 분석 결과에 `Fixture_Source.json` (실제 DB에서 추출한 예시 데이터)을 포함합니다.
@@ Coder 역할 개요
-| **제약**   | `.claude/{rules, workflows, context}/*` 수정 금지      |
+| **제약**   | DB 접근 금지(SELECT 포함), `.claude/{rules, workflows, context}/*` 수정 금지 |
@@ Coder 시스템 프롬프트
 - TDD 방식으로 테스트와 함께 개발합니다.
 - Self-Check를 수행합니다.
+- 확정된 계약(Schema/Fixture)을 기반으로 **재현(Reproduction)** 구현을 수행합니다.
+- 데이터 이상은 Phase A의 문제로 보고하고 Analyzer에게 이슈를 제기합니다.
```

---

### 6) coder/SKILL.md

**Step 2, 제약사항, 완료 조건 보강**

- Fixture 생성 단계 추가
- 구동 테스트를 Fixture 기반으로 명확화
- DB 접근 금지 및 Fixture 의무 명시

**Diff 스니펫**

```diff
-### Step 2: 코드 구현
+### Step 2: 코드 구현 및 데이터 재현
@@
-| **Backend** | API, Controller, Service |
-| **Frontend** | 컴포넌트, Hooks, 타입 정의 |
-| **Test** | 단위/통합 테스트 |
+| **Fixture** (New) | `src/mocks/handlers.ts` 또는 `fixtures/*.json` | **필수 선행:** `DOMAIN_SCHEMA.md`와 동일한 구조의 Mock 데이터 생성 |
+| **Backend** | API, Controller, Service | Real DB 연결 로직은 환경변수(`USE_MOCK=true`)로 분기 처리 |
+| **Frontend** | 컴포넌트, Hooks, 타입 정의 | API 호출 실패 시 Fixture Fallback 구현 |
+| **Test** | 단위/통합 테스트 | Fixture 기반 테스트 작성 |
@@
-- [ ] **구동 테스트** (개발 서버 실행 후 확인)
+- [ ] **Fixture 기반 구동 테스트** (DB 연결 없이 `npm run dev` 실행 시, Fixture 데이터로 정상 렌더링되고 Console에 DB 에러 없음)
```

### 7) DOCUMENT_PIPELINE.md

**파이프라인 산출물 및 데이터 계약 명시**

- `code/ui_mockup/full` 산출물에 `src/mocks/*` 추가
- Coder 입력 의존성에 `DOMAIN_SCHEMA.md` 명시
- 데이터 흐름/계약(Data Flow & Contract) 섹션 신설

**Diff 스니펫**

```diff
-| `code`      | `PRD.md`, `SDD.md` | `HANDOFF.md` | `backend/src/*`, `frontend/src/*`, `tests/*.test.ts` |
-| `ui_mockup` | `PRD.md` | `HANDOFF.md`, `IA.md`, `Wireframe.md`, `SDD.md` | `frontend/src/*`, `tests/*.test.ts` |
-| `full`      | `PRD.md` | `HANDOFF.md`, `segment_definition.md`, `*.sql`, `analysis_result.json`, `analysis_report.md`, `IA.md`, `Wireframe.md`, `SDD.md` | `backend/src/*`, `frontend/src/*`, `tests/*` |
+| `code`      | `PRD.md`, `SDD.md` | `HANDOFF.md`, `DOMAIN_SCHEMA.md` | `backend/src/*`, `frontend/src/*`, `src/mocks/*`, `tests/*.test.ts` |
+| `ui_mockup` | `PRD.md` | `HANDOFF.md`, `IA.md`, `Wireframe.md`, `SDD.md`, `DOMAIN_SCHEMA.md` | `frontend/src/*`, `src/mocks/*`, `tests/*.test.ts` |
+| `full`      | `PRD.md` | `HANDOFF.md`, `segment_definition.md`, `*.sql`, `analysis_result.json`, `analysis_report.md`, `IA.md`, `Wireframe.md`, `SDD.md`, `DOMAIN_SCHEMA.md` | `backend/src/*`, `frontend/src/*`, `src/mocks/*`, `tests/*` |
+
+## 데이터 흐름 및 계약 (Data Flow & Contract)
+
+**"Phase A에서 발견하고, Phase C에서 재현한다."**
+
+| 단계 | 역할 | 데이터 성격 | 참조 문서 (Source of Truth) | 산출물 (Artifact) |
+| :--- | :--- | :--- | :--- | :--- |
+| **Phase A** | **Discovery** | **Real Data** (DB 조회) | Legacy DB | `DOMAIN_SCHEMA.md` (계약 확정) |
+| **Phase C** | **Reproduction** | **Fixture** (계약 기반) | `DOMAIN_SCHEMA.md` | `src/mocks/*.ts` |
+
+**규칙:**
+1. **Contract First:** Phase C의 모든 Fixture는 Phase A에서 검증된 `DOMAIN_SCHEMA`의 컬럼명과 구조를 100% 따라야 한다.
+2. **No Ad-hoc:** 스키마에 없는 컬럼을 UI 편의를 위해 Fixture에 임의로 추가하는 것은 금지한다 (Schema Drift 방지).
```

---

## 변경된 파일 목록

- `CLAUDE.md`
- `.claude/rules/CODE_STYLE.md`
- `.claude/rules/TDD_WORKFLOW.md`
- `.claude/rules/DB_ACCESS_POLICY.md`
- `.claude/workflows/ROLES_DEFINITION.md`
- `.claude/skills/coder/SKILL.md`
- `.claude/workflows/DOCUMENT_PIPELINE.md`

## 후속 정리 제안

- Fixture 산출물의 **파일명/경로 표준화** (예: `analysis/fixture_source.json`)
- Discovery/Reproduction/Contract 용어 통일 규칙(대문자/한글 표기) 정의

---

**END OF REPORT**
