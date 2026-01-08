# CODE_STYLE.md

> **버전**: 1.3.1 | **수정일**: 2025-12-23
> **정의**: 네이밍/구조 규칙, 필수 조건
> **대상**: Coder | **로딩**: 전체

---

## 🎯 목표

**"코드는 컴퓨터가 읽는 것이 아니라 사람이 읽는 것입니다."**

6개월 후의 동료(혹은 미래의 나)가 읽어도 이해할 수 있는 코드를 작성합니다.
특히, **Legacy DB(`DOMAIN_SCHEMA`)와 Modern Code가 공존하는 환경**에서의 명확한 작성 규칙을 정의합니다.

---

## 기술 스택

프로젝트별 기술 스택 및 버전은 `PROJECT_STACK.md`에서 정의합니다.

---

## 공통 원칙 (General Principles)

### 필수 조건 (전 영역 공통)

> **v1.3.0 추가**: CLAUDE.md에서 이관

```yaml
타입 안정성:
  - 엄격 모드 필수 (strict, sound null safety 등)
  - 타입 회피 금지 (any, dynamic, Object 등)
  - 명시적 타입 정의

Testing:
  - 커버리지 ≥ 90% (기본값, PROJECT_STACK.md에서 오버라이드 가능)
  - TDD 사이클 준수
```

### 절대 금지 사항 (Never)

| 금지 항목           | 설명                                                                                      | 예외 (허용)                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Fake Logic**      | 비즈니스 로직을 `return true`로 하드코딩하는 행위 금지                                     | -                                                                                                                                 |
| **Ad-hoc Mocking**  | 스키마와 무관한 임의의 JSON 데이터 사용 금지                                              | **Schema-Compliant Fixture:** `DOMAIN_SCHEMA.md` 구조와 실제 컬럼명을 따르는 Fixture는 UI 개발 및 TDD 시 **필수 권장**           |
| **타입 회피**       | `any`, `dynamic`, `Object` 사용 금지                                                      | -                                                                                                                                 |
| **Magic Number**    | 의미 불명한 숫자는 반드시 `const`로 추출                                                  | -                                                                                                                                 |
| **Legacy Renaming** | **DB 컬럼명(`U_ID` 등)을 임의로 camelCase(`userId`)로 변환 금지.** (매핑 오류 원인 1순위) | -                                                                                                                                 |

### 함수 작성 규칙

- **길이**: 최대 30줄 (SRP 준수).
- **Depth**: 들여쓰기 3단계 초과 금지 (Early Return 패턴 사용).

```javascript
// ❌ Bad (Nested)
function process() {
  if (user) {
    if (active) {
      // logic...
    }
  }
}

// ✅ Good (Early Return)
function process() {
  if (!user || !active) return;
  // logic...
}
```

### 하이브리드 네이밍 컨벤션 (Hybrid Naming)

AI는 아래 **두 가지 세계**를 명확히 구분해야 합니다.

| 대상                | 규칙          | 예시                            | 비고                           |
| ------------------- | ------------- | ------------------------------- | ------------------------------ |
| **일반 변수/함수**  | `camelCase`   | `fetchUserData()`, `isValid`    | Modern Standard                |
| **클래스/컴포넌트** | `PascalCase`  | `UserService`, `ArticleCard`    | Modern Standard                |
| **상수**            | `UPPER_SNAKE` | `MAX_RETRY_COUNT`               | Modern Standard                |
| **Legacy DB 컬럼**  | `UPPER_SNAKE` | `U_ID`, `BOARD_IDX`, `REG_DATE` | ⚠️ `DOMAIN_SCHEMA` 준수        |
| **Legacy DTO**      | `UPPER_SNAKE` | `user.U_NAME`                   | **DB 매핑용 객체는 변형 금지** |

**[가독성 vs 정합성 충돌 해결 전략]**

1. **Boundary Layer (API/DB 접점)**: 정합성 우선. 가독성이 떨어져도 `U_MAJOR_CODE_1` 등 레거시 이름을 그대로 사용하십시오.
2. **Business Layer (로직 내부)**: 가독성 우선. 레거시 데이터를 다룰 때는 현대적인 이름으로 **래핑(Wrapping)**하거나 **매핑 함수**를 사용하여 격리하십시오.
   - 예: `const userMajor = legacyUser.U_MAJOR_CODE_1;` (O)
   - 금지: `U_MAJOR_CODE_1` 컬럼 자체를 `userMajor`로 `ALTER TABLE` 하려는 시도 (X)

**END OF CODE_STYLE.md**
