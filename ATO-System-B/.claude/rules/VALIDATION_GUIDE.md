# VALIDATION_GUIDE.md

> **버전**: 3.2.0 | **수정일**: 2026-01-08
> **정의**: ImLeader Phase별 검증 기준
> **대상**: ImLeader | **로딩**: 전체

---

## ImLeader 역할 개요

ImLeader는 각 Phase 완료 시점에서 **Objective Rules** 기반 품질 검증을 수행합니다.

```
Phase A (Analysis)  → 쿼리 결과 검증
Phase B (Design)    → 설계 품질 검증
Phase C (Implementation) → 코드 품질 검증
```

### 검증 결과 분기

```
Phase 완료 → ImpLeader 자동 검증 → {Objective Rules Pass?}
  ├─ YES → 다음 Phase 또는 Leader 보고 (Phase F)
  └─ NO  → HITL Review → 3-way 옵션
              ├─ Exception Approval (이번만 예외)
              ├─ Rule Override (규칙 수정 요청)
              └─ Reject → 해당 Phase 재작업
```

> **상세 흐름**: ROLE_ARCHITECTURE.md의 **HITL 체크포인트** 섹션 참조

---

## Phase A: Analysis 검증

> Analyzer 산출물 검증. 포함 파이프라인: `analysis`, `analyzed_design`, `full`
>
> **입출력 정의**: DOCUMENT_PIPELINE.md - **파이프라인 타입별 산출물** 섹션 참조

### SQL 안전성

| 검증 항목                 | 심각도     | 조치        |
| ------------------------- | ---------- | ----------- |
| INSERT/UPDATE/DELETE 포함 | 🚨 ERROR   | 즉시 차단   |
| DROP/TRUNCATE/ALTER 포함  | 🚨 ERROR   | 즉시 차단   |
| SELECT \* 사용            | ⚠️ WARNING | 경고 후 진행 |
| 대용량 테이블 LIMIT 없음  | ⚠️ WARNING | 경고 후 진행 |

> **상세 정책**: DB_ACCESS_POLICY.md 참조

### 스키마 정합성

| 검증 항목          | 심각도     | 조치                 |
| ------------------ | ---------- | -------------------- |
| 존재하지 않는 테이블 | 🚨 ERROR   | FAIL → 재작업        |
| 존재하지 않는 컬럼   | 🚨 ERROR   | FAIL → 재작업        |
| 금지된 JOIN 패턴   | ⚠️ WARNING | HITL 승인 필요       |

> **참조**: DOMAIN_SCHEMA.md의 **복합 쿼리 제한** 섹션

### 결과 품질

| 검증 항목          | 기준              | 조치           |
| ------------------ | ----------------- | -------------- |
| 결과 행 수         | > 0               | 빈 결과 시 경고 |
| 실행 시간          | < 1,000ms         | 초과 시 경고   |
| 민감 컬럼 노출     | 블랙리스트 컬럼 없음 | 위반 시 FAIL   |

---

## Phase B: Design 검증

> Designer 산출물 검증. 포함 파이프라인: `design`, `analyzed_design`, `ui_mockup`, `full`
>
> **입출력 정의**: DOCUMENT_PIPELINE.md - **파이프라인 타입별 산출물** 섹션 참조

### 자동 PASS 조건 (ROLE_ARCHITECTURE.md 참조)

| 산출물       | 검증 항목                                    |
| ------------ | -------------------------------------------- |
| IA.md        | 계층 구조 완성 (빈 섹션 없음)                |
| Wireframe.md | 필수 요소 포함 (레이아웃, 컴포넌트)          |
| SDD.md       | Schema 매핑 정합 (DOMAIN_SCHEMA 컬럼명 일치) |

### HANDOFF 기준 검증

> **핵심 원칙**: ImLeader는 PRD를 직접 참조하지 않음. HANDOFF의 Output/Constraints/CompletionCriteria만 보고 검증.

| 검증 항목          | 기준                                 |
| ------------------ | ------------------------------------ |
| CompletionCriteria | HANDOFF에 명시된 완료 조건 충족 여부 |
| 컴포넌트 구조      | Feature-Sliced Design 준수           |
| 타입 정의          | SDD에 인터페이스 명세 포함           |

---

## Phase C: Implementation 검증

> Coder 산출물 검증. 포함 파이프라인: `code`, `ui_mockup`, `full`
>
> **입출력 정의**: DOCUMENT_PIPELINE.md - **파이프라인 타입별 산출물** 섹션 참조

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

### 동적 검증 ⚠️ 필수

> 정적 분석만으로 PASS 판정 금지. 실제 빌드/실행 검증 필수.

| 유형                  | 설명                              | 명령어                              |
| --------------------- | --------------------------------- | ----------------------------------- |
| **빌드 테스트**       | TypeScript 컴파일 성공 여부       | `npm run build` 또는 `tsc --noEmit` |
| **엔트리포인트 연결** | main.tsx에서 컴포넌트 import 확인 | 파일 읽기 검증                      |
| **구동 테스트**       | 개발 서버 실행 및 렌더링 확인     | `npm run dev` (선택)                |

#### 코드 산출물 체크리스트

- [ ] 파일 존재 확인
- [ ] SDD 명세 ↔ 코드 정합성
- [ ] TypeScript 타입 정확성
- [ ] **빌드 성공 여부**
- [ ] **엔트리포인트 연결 확인**
- [ ] TailwindCSS 클래스 사용 (inline style 없음)

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

---

## 재시도 정책

```yaml
Review FAIL 시:
  1차 재시도: 피드백 반영 후 자동 수정
  2차 재시도: 피드백 반영 후 자동 수정
  3차 실패: USER_INTERVENTION_REQUIRED (HITL)

자동 PASS 기준:
  - Schema 준수율 100%
  - TypeScript 에러 0개
  - 빌드 성공
```

---

## 검증 결과 보고 형식

```markdown
# ImLeader 검증 결과

## Phase: [A / B / C]
## 판정: [PASS / FAIL → HITL]

| 검증 항목         | 결과    | 비고                |
| ----------------- | ------- | ------------------- |
| SQL 안전성        | ✅ PASS |                     |
| 스키마 정합성     | ✅ PASS |                     |
| 코드 품질         | ⚠️ WARN | 함수 길이 초과 1건  |
| 빌드 테스트       | ✅ PASS |                     |

### FAIL 사유 (해당 시)
- [구체적인 실패 항목 및 위치]

### 권장 조치
- [수정 방향 제안]
```

**END OF VALIDATION_GUIDE.md**
