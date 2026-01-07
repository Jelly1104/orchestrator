# TDD_WORKFLOW.md

> **버전**: 1.3.2 | **수정일**: 2025-12-23
> **정의**: Red-Green-Refactor 사이클
> **대상**: Coder | **로딩**: 작업 시

---

## 이 문서의 목적

**"테스트 없는 코드는 레거시(Legacy)다."**

AI 에이전트는 이 문서의 프로세스를 따르지 않는 기능 구현을 거부해야 합니다.
`DOMAIN_SCHEMA.md`의 실제 스키마를 준수하며 안전하게 코드를 변경하는 표준 절차입니다.

---

## 사전 조건

- [ ] `CLAUDE.md` 아키텍처 원칙 숙지
- [ ] `DOMAIN_SCHEMA.md`의 관련 테이블 및 컬럼 확인 (필수)
- [ ] 요구사항/버그 리포트의 모호함 제거

---

## AI 사고 프로세스 (Thinking Process)

작업 시작 전, 반드시 다음 `<thinking>` 블록을 출력하고 스스로 검토해야 합니다.

```xml
<thinking>
1. 요구사항 분석: 사용자가 원하는 기능의 핵심 가치는 무엇인가?
2. 스키마 체크:
   - 사용할 테이블은 무엇인가? (예: BOARD_MUZZIMA)
   - 실제 컬럼명은 무엇인가? (예: id(x) -> BOARD_IDX(o))
3. 테스트 전략:
   - Happy Path와 Edge Case는 무엇인가?
   - 대용량 테이블(COMMENT 등) 조회 시 인덱스 전략은?
4. 토큰 전략: 전체 파일을 다시 출력할 필요가 있는가? (부분 수정 권장)
</thinking>
```

---

## 기능 개발 시

### 🔴 Phase 1: Red - 실패하는 테스트 작성

**목표**: 기능 요구사항을 실패하는 테스트로 명확히 정의합니다.

1. **테스트 파일 생성**: `tests/unit/[feature].unit.spec.tsx`
2. **Schema 준수**: 테스트 데이터(Mock) 생성 시 `DOMAIN_SCHEMA.md`의 실제 컬럼명을 사용하세요.

```typescript
// ✅ 좋은 예: 실제 레거시 스키마 반영
describe("게시글 생성", () => {
  it("필수 값(제목/내용/작성자)이 있으면 성공해야 한다", () => {
    // Arrange
    const input = {
      TITLE: "테스트 제목",
      CONTENT: "내용",
      U_ID: "doc123", // (NOT userId - 스키마 준수)
    };
    // Act
    const result = createBoard(input);
    // Assert
    expect(result.BOARD_IDX).toBeDefined();
  });
});
```

**체크리스트**

- [ ] `.unit.spec.tsx` 파일 생성
- [ ] `DOMAIN_SCHEMA.md`의 실제 컬럼명 사용 확인
- [ ] 테스트 실행 결과: **FAIL** (Assertion Error여야 함, 컴파일 에러 지양)
- [ ] **금지**: 구현 코드 먼저 작성 ❌ / 여러 기능 한 테스트에 포함 ❌

---

### 🟢 Phase 2: Green - 최소 구현

**목표:** 테스트를 통과하는 **최소한의 코드**만 작성합니다.

1. **타입 정의**: `.types.ts` (Legacy 스키마 매핑 고려)
2. **구현**: 비즈니스 로직에 집중

```typescript
// *.ts
export function createBoard(input: CreateBoardInput): BoardResult {
  // 최소 구현: 입력받은 값을 그대로 리턴하는 수준이라도 OK
  return {
    BOARD_IDX: 1,
    ...input,
    REG_DATE: new Date(),
  };
}
```

**체크리스트**

- [ ] 테스트 통과하는 최소 코드 작성
- [ ] **오버엔지니어링 금지** (미래 확장 고려 X)
- [ ] 모든 테스트 **PASS** 확인
- [ ] **금지**: 성능 최적화 미리 하기 ❌, 관련 없는 파일 건드리기 ❌

---

### 🔵 Phase 3: Refactor - 리팩토링

**목표**: 테스트 통과 상태를 유지하며 코드 품질을 높입니다.

**우선순위**

1. **가독성**: 변수명 명확화 (단, DB 컬럼명 매핑은 유지)
2. **중복 제거**: 공통 로직 분리
3. **성능**: N+1 문제 체크, 인덱스 활용 확인

**체크리스트**

- [ ] 중복 코드 제거
- [ ] Magic Number → 상수(`consts.ts`) 추출
- [ ] **매 수정마다 테스트 실행** (녹색 유지)
- [ ] 함수 길이 ≤ 30줄

---

### 사이클 반복

새로운 요구사항마다 **Red → Green → Refactor** 반복

---

## 버그 수정 시

### 🔴 Phase 1: 버그 재현(Reproduction)

**목표**: "버그가 있다"는 것을 테스트 코드로 증명해야 합니다.

- **분석**: 예상 동작 vs 실제 동작 차이 파악
- **작성**: 버그 상황을 그대로 코드로 옮김

```typescript
describe("Bug #1234 - 댓글 카운트 오류", () => {
  it("댓글이 삭제되면 댓글 수가 감소해야 한다", () => {
    // 현재 이 테스트는 FAIL 해야 함 (버그가 있으므로 안 줄어듦)
    const initialCount = 10;
    const result = deleteComment(mockCommentId);
    expect(result.currentCount).toBe(9);
  });
});
```

---

### 🟢 Phase 2: 최소 수정 (Fix)

**목표**: 다른 곳에 영향을 주지 않고 딱 그 버그만 잡습니다.

**작업 순서**

1. 근본 원인(Root Cause) 파악
2. 영향 범위(Side Effect) 파악 (특히 레거시 테이블 의존성)
3. 코드 수정

---

### 🔵 Phase 3: 회귀 검증(Regression)

**목표**: 고쳤던 버그가 다시 발생하지 않음을 보장합니다.

**체크리스트**

- [ ] 재현 테스트가 이제 **PASS** 하는가?
- [ ] 기존의 다른 테스트들이 여전히 **PASS** 하는가?
- [ ] `DOMAIN_SCHEMA.md`의 제약사항(대용량 테이블 등)을 위반하지 않았는가?

---

## 품질 게이트 (Definition of Done)

작업을 완료했다고 보고하기 전, 스스로 검증하세요.

**필수 조건**

- [ ] **Test Coverage**: ≥ 90% (yarn test:coverage)
- [ ] **Lint**: 0 errors (yarn lint)
- [ ] **Type Check**: Pass (yarn type-check)
- [ ] **Legacy Check**: 없는 컬럼명(Hallucination) 사용 없음
- [ ] **Token Check**: 불필요한 전체 코드 출력 없음 (Output Throttling 참조)

**END OF TDD_WORKFLOW.md**
