---
name: imleader
version: 3.1.0
description: |
  산출물 품질 검증 (Quality Manager).
  트리거: "검증", "리뷰", "품질 체크", "QA".
  🔴 필수: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.
allowed-tools: Read, Grep, Glob
---

# Implementation Leader Skill (Extension용)

**HANDOFF 기준** 산출물 품질 검증.

> **핵심 원칙**: PRD를 직접 참조하지 않음. HANDOFF의 Output/Constraints/CompletionCriteria만 보고 검증.

---

## Step 라우팅 규칙 🔴

> **Step 0은 항상 필수**. 이후 Step은 직전 컨텍스트를 확인하여 검증 대상으로 분기.

| 호출 시점        | 진입 Step         | 검증 대상                       |
| ---------------- | ----------------- | ------------------------------- |
| Phase A 완료 후  | Step 0 → 1 → 2 → 3 | SQL, analysis_report.md         |
| Phase B 완료 후  | Step 0 → 1 → 2 → 3 | IA.md, Wireframe.md, SDD.md     |
| Phase C 완료 후  | Step 0 → 1 → 2 → 3 | 코드 (동적 검증 필수)           |

> **입출력 정의**: DOCUMENT_PIPELINE.md - **파이프라인 타입별 산출물** 섹션 참조

---

## Step 0: 문서 참조 (필수) 🔴

> **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read

#### 확인 체크리스트

- [ ] `SYSTEM_MANIFEST.md` → Quick Context, Role별 필수 로딩
- [ ] `DOMAIN_SCHEMA.md` → 핵심 레거시 스키마, 복합 쿼리 제한
- [ ] `PROJECT_STACK.md` → 기술 스택
- [ ] `DOCUMENT_PIPELINE.md` → 파이프라인 타입별 산출물
- [ ] `ROLES_DEFINITION.md` → Implementation Leader 섹션
- [ ] `HANDOFF_PROTOCOL.md` → 완료 보고 양식
- [ ] `VALIDATION_GUIDE.md` → **해당 Phase 섹션** (상세 검증 기준)
- [ ] `CODE_STYLE.md` → 공통 원칙, 네이밍 컨벤션 (코드 검증 시)
- [ ] `DB_ACCESS_POLICY.md` → 민감 컬럼, 쿼리 제한 (SQL 검증 시)

> **참조 가이드**: `docs/reports/Role-reference-guide.md`

---

## Step 1: 산출물 확인

- [ ] 검증 대상 파일 목록 확인
- [ ] 산출물 유형 파악 (분석/설계/코드)

---

## Step 2: 검증 수행

> **상세 검증 기준**: VALIDATION_GUIDE.md - 해당 Phase 섹션 참조

### 🔴 확장 사고 (Contextual Checklist)

> VALIDATION_GUIDE.md의 **공통 원칙**을 기준으로, 현재 컨텍스트에 맞는 체크리스트를 **동적 생성**하세요.

**참조 문서** (체크리스트 확장 시):
- `PROJECT_STACK.md` → 기술 스택별 기준 (커버리지 임계값, 빌드 명령어 등)
- `HANDOFF.md` → 피쳐별 완료 조건 (CompletionCriteria)
- `SDD.md` → 컴포넌트별 요구사항

**예시**:
```
VALIDATION_GUIDE: "테스트 필수"
PROJECT_STACK: "커버리지 ≥ 85%"
HANDOFF: "DailyBestCard 컴포넌트 테스트 포함"

→ 생성된 체크리스트:
  - [ ] DailyBestCard.test.tsx 존재 확인
  - [ ] 커버리지 85% 이상 확인
```

| Phase | 참조 섹션                    |
| ----- | ---------------------------- |
| A     | Phase A: Analysis 검증       |
| B     | Phase B: Design 검증         |
| C     | Phase C: Implementation 검증 |

### 수행 확인 체크리스트

#### 분석 산출물 (Phase A)

- [ ] SQL 안전성 검증 수행
- [ ] 스키마 정합성 검증 수행
- [ ] 결과 품질 검증 수행

#### 설계 산출물 (Phase B)

- [ ] IA → Wireframe → SDD 정합성 검증 수행
- [ ] HANDOFF CompletionCriteria 충족 여부 확인
- [ ] 컴포넌트 Props 정의 완결성 확인
- [ ] 엔트리포인트 연결 가이드 포함 여부 확인 (SDD)

#### 코드 산출물 (Phase C)

- [ ] 파일 존재 확인
- [ ] SDD 명세 ↔ 코드 정합성 검증 수행
- [ ] CODE_STYLE.md 준수 여부 확인
- [ ] **빌드 테스트 실행** (PROJECT_STACK.md 빌드 명령어 참조)
- [ ] **엔트리포인트 연결 확인**

---

## Step 3: 판정 및 보고서 출력

#### 수행 확인 체크리스트

- [ ] 판정 결과 `imleader-review.md` 파일로 저장
- [ ] 저장 경로: DOCUMENT_PIPELINE.md **파이프라인 타입별 산출물** 참조

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [ImLeader Skill Report]
🔧 사용된 Skill: imleader v3.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Step 0):
  - 공통: {n}/4개 ✅
  - ImLeader 전용: {n}/3개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 검증 대상: {파일명 또는 산출물}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 정적 검증: {PASS / FAIL}
🔨 동적 검증: {PASS / FAIL / SKIP}
  - 빌드 테스트: {PASS / FAIL}
  - 엔트리포인트: {연결됨 / 미연결}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 최종 판정: {PASS / FAIL}
{FAIL 시: 문제 위치, 원인, 수정 방법}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
