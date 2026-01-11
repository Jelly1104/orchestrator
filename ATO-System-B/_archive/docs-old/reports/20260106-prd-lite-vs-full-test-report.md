# PRD_LITE vs PRD_FULL 파이프라인 테스트 보고서

> **작성일**: 2026-01-06
> **작성자**: ATO Team
> **테스트 목적**: PRD 상세도에 따른 Leader Skill 역할 검증

---

## 1. 테스트 개요

### 1.1 배경

ui_mockup 파이프라인 테스트 중 **PRD 상세도가 결과 품질에 미치는 영향** 분석.
동일 기능(Skill Dashboard)을 PRD_FULL과 PRD_LITE로 각각 구현하여 비교.

### 1.2 테스트 케이스

| 구분 | Case ID | PRD 템플릿 | PRD 줄 수 |
|------|---------|-----------|----------|
| A | 260106-skills-pipeline-test | PRD_FULL | 242줄 |
| B | 260106-lite-test | PRD_LITE | 60줄 |

---

## 2. PRD 비교 분석

### 2.1 PRD_FULL (Case A: 242줄)

```yaml
포함된 항목:
  - ASCII 레이아웃 (상세)
  - Mock 데이터 (7개 전체 구조)
  - TailwindCSS 클래스 힌트
  - 스타일 요구사항 테이블
  - Phase별 산출물 체크리스트
  - HITL 체크포인트
```

### 2.2 PRD_LITE (Case B: 60줄)

```yaml
포함된 항목:
  - 목적 (1-2문장)
  - 타겟 유저 (테이블)
  - 핵심 기능 (3개)
  - 데이터 요구사항 (Skill 이름만 7개)
  - 제약사항 (React + TailwindCSS)

누락된 항목:
  - ASCII 레이아웃 ❌
  - Mock 데이터 상세 구조 ❌
  - 스타일 스펙 상세 ❌
  - 버전 정보 ❌
```

---

## 3. Leader Skill 역할 비교

### 3.1 PRD_FULL → HANDOFF

| 항목 | PRD 제공 | Leader 역할 |
|------|----------|-------------|
| ASCII 레이아웃 | ✅ | 복사 |
| Mock 데이터 | ✅ | 복사 |
| 스타일 스펙 | ✅ | 복사 |
| Phase 정의 | ✅ | 재구성 |

**Leader 역할**: 정보 **재배치/정리** (구체화 불필요)

### 3.2 PRD_LITE → HANDOFF

| 항목 | PRD 제공 | Leader 역할 |
|------|----------|-------------|
| ASCII 레이아웃 | ❌ | **생성** |
| Mock 데이터 | 이름만 | **구조 정의** |
| 스타일 스펙 | 언급만 | **상세화** |
| 버전 정보 | ❌ | **생성** |

**Leader 역할**: 정보 **구체화/생성** (핵심 가치 발휘)

### 3.3 HANDOFF 산출물 비교

| 항목 | Case A (FULL) | Case B (LITE) |
|------|--------------|---------------|
| HANDOFF 줄 수 | 148줄 | 185줄 |
| ASCII 레이아웃 | PRD에서 복사 | Leader가 생성 |
| Mock 데이터 | PRD에서 복사 | Leader가 구조 정의 |
| 카드 구성요소 | PRD에서 복사 | Leader가 4요소 정의 |

---

## 4. 파이프라인 실행 결과

### 4.1 Case A (PRD_FULL)

```
PRD (242줄) → Leader → HANDOFF (148줄)
           → Designer → IA/WF/SDD
           → Coder → 컴포넌트 5개
           → ImLeader → PASS ✅
```

### 4.2 Case B (PRD_LITE)

```
PRD (60줄) → Leader → HANDOFF (185줄, 구체화)
          → Designer → IA/WF/SDD
          → Coder → 컴포넌트 5개
          → ImLeader → PASS ✅
```

### 4.3 최종 산출물 비교

| 항목 | Case A | Case B |
|------|--------|--------|
| 컴포넌트 수 | 5개 | 5개 |
| 타입체크 | PASS | PASS |
| 구동 테스트 | PASS | PASS |
| UI 품질 | 동일 | 동일 |

---

## 5. 핵심 발견

### 5.1 PRD 상세도 vs 결과 품질

```
PRD_FULL + Leader(정리)     = 좋은 결과 ✅
PRD_LITE + Leader(구체화)   = 좋은 결과 ✅
```

**결론**: PRD 상세도와 무관하게 **Leader의 HANDOFF 품질**이 최종 결과를 결정

### 5.2 Leader Skill 역할 분화

| PRD 유형 | Leader 역할 | 가치 |
|----------|------------|------|
| PRD_FULL | 정보 정리/재배치 | 낮음 (작업 중복) |
| PRD_LITE | 요구사항 구체화 | **높음** (해석/생성) |

### 5.3 사용자 입력 부담

| PRD 유형 | 작성 시간 | 필요 지식 |
|----------|----------|----------|
| PRD_FULL | 높음 | ASCII, 데이터 구조, 스타일 |
| PRD_LITE | **낮음** | 목적, 기능만 |

---

## 6. 권장 사항

### 6.1 PRD 템플릿 선택 가이드

| 상황 | 권장 템플릿 | 이유 |
|------|-----------|------|
| 빠른 프로토타입 | PRD_LITE | 사용자 부담 최소화 |
| 확정된 요구사항 | PRD_FULL | 의도 정확히 전달 |
| Leader 검증 목적 | PRD_LITE | Leader 역량 테스트 |

### 6.2 워크플로우 권장안

```
[일반 케이스]
PRD_LITE → Leader(구체화) → Designer → Coder → ImLeader

[복잡한 케이스]
PRD_FULL → Leader(검증) → Designer → Coder → ImLeader
```

### 6.3 PRD_LITE 템플릿 핵심 항목

```markdown
# PRD: {프로젝트명}

## 목적
{1-2문장}

## 핵심 기능
| 기능 | 설명 | Skill |
|------|------|-------|

## 데이터 (선택)
{Mock 또는 DB 테이블}

## 제약사항
{기술 스택, 스타일링 등}
```

---

## 7. 결론

1. **PRD_LITE로도 동일 품질 달성 가능**
   - Leader가 구체화 역할 수행
   - 사용자 입력 부담 75% 감소 (242줄 → 60줄)

2. **Leader Skill 가치 극대화**
   - PRD_FULL: Leader 역할 축소 (복사/정리)
   - PRD_LITE: Leader 역할 확대 (해석/생성)

3. **권장 기본 템플릿: PRD_LITE**
   - 복잡한 요구사항만 PRD_FULL 사용
   - Leader의 구체화 능력 활용

---

## 부록: 테스트 산출물 위치

| Case | 경로 |
|------|------|
| A (FULL) | `docs/cases/260106-skills-pipeline-test/` |
| B (LITE) | `docs/cases/260106-lite-test/` |
| 코드 (FULL) | `frontend/src/features/skills-dashboard/` |
| 코드 (LITE) | `frontend/src/features/skills-dashboard-lite/` |

---

**END OF REPORT**
