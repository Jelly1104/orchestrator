---
name: imleader
version: 2.0.0
description: |
  산출물 품질 검증 (Quality Manager).
  트리거: "검증", "리뷰", "품질 체크", "QA".
  ⚠️ v2.0.0: 필수 문서 로딩 검증 단계 추가 - Phase 0 완료 후에만 Phase 1 진행 가능.
  ⚠️ 코드 산출물 검증 시 동적 검증(빌드/구동) 필수.
---

# Implementation Leader Skill (Extension용)

산출물 품질 검증.

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Phase 0: 문서 로딩 (필수) 🔴

> **이 단계를 건너뛰면 Phase 1로 진행할 수 없습니다.**

아래 문서를 **반드시 Read 도구로 읽고**, 각 문서의 핵심 내용을 요약 출력하세요.

#### 공통 로딩 (모든 Skill 필수)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| 시스템 헌법 | `CLAUDE.md` | 절대 금지 사항 1가지 |
| DB 스키마 | `.claude/rules/DOMAIN_SCHEMA.md` | 스키마 검증 대상 |
| 기술 스택 | `.claude/project/PROJECT_STACK.md` | 검증 기준 스택 |
| 산출물 정의 | `.claude/workflows/DOCUMENT_PIPELINE.md` | 검증 대상 산출물 |

#### Role별 추가 로딩 (ImLeader 전용)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| Role 정의 | `.claude/workflows/ROLES_DEFINITION.md` | ImLeader 섹션 - 검증 항목 |
| HANDOFF 양식 | `.claude/workflows/HANDOFF_PROTOCOL.md` | 보고 형식 |
| 검증 가이드 | `.claude/rules/VALIDATION_GUIDE.md` | Quality Gates |

### Phase 0 출력 (검증용) 🔴

**아래 형식으로 요약을 출력해야 Phase 1 진행 가능:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [문서 로딩 확인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[공통]
- CLAUDE.md: {절대 금지 사항 1가지}
- DOMAIN_SCHEMA.md: {스키마 검증 대상}
- PROJECT_STACK.md: {검증 기준 스택}
- DOCUMENT_PIPELINE.md: {검증 대상 산출물}

[ImLeader 전용]
- ROLES_DEFINITION.md#ImLeader: {역할 1줄 요약}
- HANDOFF_PROTOCOL.md: {보고 형식 요약}
- VALIDATION_GUIDE.md: Quality Gates {n}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **위 출력이 없으면 Phase 1 검증이 무효 처리됩니다.**

---

### Phase 1: 산출물 확인

- 검증 대상 파일 목록 확인
- 산출물 유형 파악 (분석/설계/코드)

### Phase 2: 검증 수행

| 유형 | 검증 항목 |
|------|----------|
| **정적 검증** | 파일 존재, SDD↔코드 정합성, 타입 |
| **동적 검증** | 빌드 테스트, 엔트리포인트, 구동 |

### Phase 3: 판정 및 보고서 출력

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **산출물 검증** | 분석/설계/코드 산출물의 품질 검증 |
| **PASS/FAIL 판정** | 검증 기준 충족 여부 판정 |
| **피드백 제공** | FAIL 시 Actionable Feedback 필수 |

## 검증 유형

### 정적 검증 (Static)

| 유형 | 설명 |
|------|------|
| 파일 존재 | 산출물 파일 존재 여부 |
| SDD ↔ 코드 정합성 | 타입, Props, 클래스명 일치 |
| TypeScript 문법 | any 타입, 타입 정의 확인 |

### 동적 검증 (Dynamic) ⚠️ 필수

| 유형 | 설명 | 명령어 |
|------|------|--------|
| **빌드 테스트** | TypeScript 컴파일 성공 여부 | `npm run build` 또는 `tsc --noEmit` |
| **엔트리포인트 연결** | main.tsx에서 컴포넌트 import 확인 | 파일 읽기 검증 |
| **구동 테스트** | 개발 서버 실행 및 렌더링 확인 | `npm run dev` (선택) |

> ⚠️ **중요**: 코드 산출물 검증 시 반드시 빌드 테스트를 실행해야 합니다.

---

## 검증 체크리스트

### 코드 산출물 검증 시 필수 항목

- [ ] 파일 존재 확인
- [ ] SDD 명세 ↔ 코드 정합성
- [ ] TypeScript 타입 정확성
- [ ] **빌드 성공 여부** (`npm run build` 또는 `tsc --noEmit`)
- [ ] **엔트리포인트 연결 확인** (main.tsx에서 import 여부)
- [ ] TailwindCSS 클래스 사용 (inline style 없음)

### 설계 산출물 검증 시 필수 항목

- [ ] IA → Wireframe → SDD 정합성
- [ ] PRD 요구사항 충족률
- [ ] 컴포넌트 Props 정의 완결성
- [ ] **엔트리포인트 연결 가이드 포함 여부** (SDD에 명시)

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [ImLeader Skill Report]
🔧 사용된 Skill: imleader v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Phase 0):
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
