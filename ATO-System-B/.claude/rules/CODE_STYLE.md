# CODE_STYLE.md - 코딩 스타일 가이드 (범용)

> **문서 버전**: 1.2.1
> **최종 업데이트**: 2025-12-22
> **상위 문서**: `CLAUDE.md` > **대상**: 모든 AI 에이전트

---

## 🎯 목표

**"코드는 컴퓨터가 읽는 것이 아니라 사람이 읽는 것입니다."**

6개월 후의 동료(혹은 미래의 나)가 읽어도 이해할 수 있는 코드를 작성합니다.
특히, **Legacy DB(`DOMAIN_SCHEMA`)와 Modern Code가 공존하는 환경**에서의 명확한 작성 규칙을 정의합니다.

---

## 🛠️ 기술 스택

프로젝트별 기술 스택 및 버전은 `PROJECT_STACK.md`에서 정의합니다.

```
프로젝트/
├── CLAUDE.md              # Claude Code 자동 로딩 (진입점)
└── .claude/
    ├── rules/             # [Group A] 제약 사항 (Code Style, DB Schema)
    │   └── PROJECT_STACK.md
    ├── workflows/         # [Group B] 실행 절차
    └── context/           # [Group C] 배경 지식
```

---

## 📐 공통 원칙 (General Principles)

### 1.1 절대 금지 사항 (Never)

| 금지 항목                 | 설명                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Mock 데이터/가짜 구현** | 실제 동작하는 로직만 작성 (TDD 준수)                                                      |
| **타입 회피**             | `any`, `dynamic`, `Object` 사용 금지                                                      |
| **Magic Number**          | 의미 불명한 숫자는 반드시 `const`로 추출                                                  |
| **Legacy Renaming**       | **DB 컬럼명(`U_ID` 등)을 임의로 camelCase(`userId`)로 변환 금지.** (매핑 오류 원인 1순위) |

### 1.2 함수 작성 규칙

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

### 1.3 하이브리드 네이밍 컨벤션 (Hybrid Naming)

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

---

## 🟦 2. TypeScript/JavaScript (FE)

### 2.1 타입 안정성 (Type Safety)

`tsconfig.json`의 `strict: true`를 절대적으로 준수합니다.

```typescript
// ❌ 금지: 레거시 컬럼을 마음대로 camelCase로 변경
interface User {
  userId: string; // 실제 DB엔 U_ID로 되어 있어 매핑 에러 발생함
}

// ✅ 권장: 레거시 스키마와 일치시킴
interface UserLegacyDto {
  U_ID: string;
  U_NAME: string;
  U_ALIVE: "Y" | "N";
}
```

### 2.2 React 컴포넌트 & 파일 구조

**Feature-Sliced Design (FSD)** 패턴을 지향합니다.

```
src/
├── entities/           # 도메인 (User, Board)
│   └── board/
│       ├── model/      # types, store
│       └── ui/         # Dumb Components
├── features/           # 기능 (LikeBoard, WriteComment)
├── shared/             # 공용 (UI Kit, Libs)
└── pages/              # 라우팅 페이지
```

---

## ☕ 3. Java/Kotlin (BE)

### 3.1 Legacy Entity Mapping

JPA/MyBatis 사용 시, **DB 컬럼명과 필드명을 매핑**할 때 주의합니다.

```java
// ✅ Good: 명시적 매핑으로 혼란 방지
@Entity
@Table(name = "USERS")
public class User {

    @Id
    @Column(name = "U_ID") // 레거시 컬럼명 명시
    private String uId;    // Java 내부는 camelCase 허용하되, 매핑 명시 필수

    @Column(name = "U_NAME")
    private String uName;
}
```

### 3.2 JavaDoc 필수 대상

- `public` 메서드 전체
- 복잡한 비즈니스 로직 (특히 **예외 처리** 로직)

---

## 🐦 4. Dart/Flutter (App)

### 4.1 Null Safety

Dart의 강점인 Null Safety를 무력화하지 마십시오.

```dart
// ❌ Bad
String? name;
print(name!); // 런타임 에러 위험

// ✅ Good
print(name ?? 'Unknown');
```

### 4.2 Widget 구조

- **const 생성자**를 적극 사용하여 리빌드 성능을 최적화합니다.
- 비즈니스 로직은 Widget에서 분리하여 `Provider`나 `Bloc`으로 위임합니다.

---

## ☁️ 5. Infrastructure (Terraform/Docker)

### 5.1 Terraform

- **리소스명**: `snake_case` (예: `aws_s3_bucket`)
- **변수명**: 명확한 설명(`description`) 필수 포함

### 5.2 SQL (Legacy Schema)

- **`DOMAIN_SCHEMA.md` 위반 시 코드 리뷰 즉시 반려**

```sql
-- ❌ Bad: 인덱스 안 타는 쿼리, 컬럼명 추측
SELECT * FROM COMMENT WHERE content LIKE '%욕설%';

-- ✅ Good: 인덱스 활용, 실제 컬럼명 사용
SELECT COMMENT_IDX, CONTENT
FROM COMMENT
WHERE REG_DATE > '2025-01-01'
AND BOARD_IDX = 100;
```

---

## 📚 Updated Related Docs

| 문서               | 역할                                                |
| ------------------ | --------------------------------------------------- |
| `CLAUDE.md`        | 최상위 헌법 (충돌 시 이 문서가 우선)                |
| `PROJECT_STACK.md` | 프로젝트별 기술 스택/버전 정의 (.claude/rules/)     |
| `DOMAIN_SCHEMA.md` | 필독 DB 컬럼명 및 네이밍 기준 원천 (.claude/rules/) |
| `QUALITY_GATES.md` | 스타일 준수 여부 최종 검증 체크리스트               |

---

**END OF CODE_STYLE.md**

스타일은 취향이 아니라 **약속**입니다. 약속을 지킬 때 협업이 시작됩니다.
