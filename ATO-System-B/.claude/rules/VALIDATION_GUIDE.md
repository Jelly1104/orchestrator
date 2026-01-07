# VALIDATION_GUIDE.md

> **버전**: 2.3.0 | **수정일**: 2026-01-06
> **정의**: Quality Gates, 검증 기준
> **대상**: ImLeader | **로딩**: 전체

---

## Output Validation

### Syntax/Lint 검증

| 대상     | 검증 항목                 | 심각도     |
| -------- | ------------------------- | ---------- |
| SQL      | INSERT/UPDATE/DELETE 금지 | 🚨 ERROR   |
| SQL      | DROP/TRUNCATE/ALTER 금지  | 🚨 ERROR   |
| SQL      | SELECT \* 사용            | ⚠️ WARNING |
| SQL      | 대용량 테이블 LIMIT 없음  | ⚠️ WARNING |
| Markdown | 내용 비어있음             | 🚨 ERROR   |

> **구현 참조**: DB_ACCESS_POLICY.md의 **쿼리 검증** 섹션

### PRD 체크리스트 매칭

```
1단계: 파일명 직접 매칭 (fuzzy)
2단계: 콘텐츠 키워드 매칭 (도메인 특화)
3단계: SQL 블록 개별 매칭

⚡ 매칭률 ≥ 50% → MATCHED
```

### 스키마 정합성 검증

```
SQL 쿼리 파싱 → 테이블/컬럼 추출 → DOMAIN_SCHEMA.md 대조

결과:
  - 알 수 없는 테이블: WARNING
  - 알 수 없는 컬럼: ERROR
  - 금지된 JOIN 패턴: WARNING
```

---

## Quality Gates

### 코드 품질

| 항목                | 기준                              |
| ------------------- | --------------------------------- |
| Schema Compliance   | DOMAIN_SCHEMA.md 실제 컬럼명 사용 |
| Hallucination Check | 존재하지 않는 테이블/컬럼 금지    |
| 함수 길이           | ≤ 30줄                            |
| 중첩 깊이           | ≤ 3단계                           |
| TypeScript          | `any` 타입 금지                   |

### 테스트

- [ ] 커버리지 ≥ 90%
- [ ] 모든 테스트 PASS
- [ ] 테스트 독립성

### 보안

> **상세 정책**: DB_ACCESS_POLICY.md의 **민감 컬럼 블랙리스트** 섹션 참조

- [ ] PHI 보호: 주민번호, 진료내역 평문 노출 금지
- [ ] 로그 마스킹: 이메일, 전화번호 로그 금지
- [ ] Full Scan 방지: COMMENT, USER_LOGIN 조회 시 인덱스 필수
- [ ] SQL Injection: 파라미터 바인딩 사용

### 성능

| 유형        | 목표    | 최대 허용 |
| ----------- | ------- | --------- |
| 단순 조회   | < 100ms | 200ms     |
| 복합 조회   | < 200ms | 500ms     |
| 대용량 조회 | < 500ms | 1,000ms   |

### Safety Check

- [ ] `.claude/rules/` 내 파일 변경 없음
- [ ] `CLAUDE.md` 변경 없음
- [ ] INSERT/UPDATE/DELETE 쿼리 없음

### 동적 검증 (v2.3.0 추가) ⚠️ 코드 산출물 필수

> 정적 분석만으로 PASS 판정 금지. 실제 빌드/실행 검증 필수.

| 유형                  | 설명                              | 명령어                              |
| --------------------- | --------------------------------- | ----------------------------------- |
| **빌드 테스트**       | TypeScript 컴파일 성공 여부       | `npm run build` 또는 `tsc --noEmit` |
| **엔트리포인트 연결** | main.tsx에서 컴포넌트 import 확인 | 파일 읽기 검증                      |
| **구동 테스트**       | 개발 서버 실행 및 렌더링 확인     | `npm run dev` (선택)                |

#### 코드 산출물 검증 체크리스트

- [ ] 파일 존재 확인
- [ ] SDD 명세 ↔ 코드 정합성
- [ ] TypeScript 타입 정확성
- [ ] **빌드 성공 여부** (`npm run build` 또는 `tsc --noEmit`)
- [ ] **엔트리포인트 연결 확인** (main.tsx에서 import 여부)
- [ ] TailwindCSS 클래스 사용 (inline style 없음)

---

## 재시도 정책

```yaml
Review FAIL 시:
  1차 재시도: 피드백 반영 후 자동 수정
  2차 재시도: 피드백 반영 후 자동 수정
  3차 실패: USER_INTERVENTION_REQUIRED

자동 PASS 기준:
  - Schema 준수율 100%
  - TypeScript 에러 0개
  - 테스트 코드 포함
```

---

## 도메인 키워드 맵

```yaml
회원: ["u_alive", "active", "segment", "활성"]
세그먼트: ["segment", "heavy", "medium", "light"]
전문과목: ["u_major_code", "major", "분포"]
근무형태: ["u_work_type", "work_type", "근무"]
로그인: ["user_login", "login", "login_date"]
댓글: ["comment", "comment_idx", "댓글"]
게시글: ["board", "board_idx", "게시"]
```

---

## 보안 게이트

> **상세 정책**: DB_ACCESS_POLICY.md의 **쿼리 검증** 섹션 참조

### 입력 검증

| 항목            | 검증 규칙             | 위반 시 조치 |
| --------------- | --------------------- | ------------ |
| taskId          | `/^[a-zA-Z0-9_-]+$/`  | 즉시 거부    |
| taskDescription | 최대 10,000자         | 잘라내기     |
| prdContent      | 최대 50,000자         | DoS 차단     |
| 파일 경로       | projectRoot 외부 금지 | 즉시 중단    |

### 프롬프트 인젝션 방어

```
❌ 금지: "${taskDescription}" 직접 삽입
✅ 허용: "[USER_INPUT]...sanitized...[/USER_INPUT]"
```

### Rate Limiting

```yaml
MAX_RETRIES: 5
RETRY_DELAY_MS: 1000
MAX_RETRIES_PER_HOUR: 20
```

---

## 검증 결과 보고 형식

```markdown
# 검증 결과 종합

## 전체 평가: [PASS / FAIL]

| Phase             | 결과    | 핵심 지표                 |
| ----------------- | ------- | ------------------------- |
| Output Validation | ✅ PASS | Syntax 6/6, PRD 매칭 100% |
| Quality Gates     | ✅ PASS | Schema 100%, 테스트 93%   |
```

**END OF VALIDATION_GUIDE.md**
