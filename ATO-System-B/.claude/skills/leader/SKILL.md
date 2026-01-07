---
name: leader
version: 2.0.0
description: |
  PRD 분석 및 작업 지시 수립.
  트리거: "HANDOFF 작성", "작업 지시서", "파이프라인 분석", "PRD 분석".
  ⚠️ v2.0.0: 필수 문서 로딩 검증 단계 추가 - Phase 0 완료 후에만 Phase 1 진행 가능.
---

# Leader Skill (Extension용)

PRD 분석 및 작업 지시 수립.

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Phase 0: 문서 로딩 (필수) 🔴

> **이 단계를 건너뛰면 Phase 1로 진행할 수 없습니다.**

아래 문서를 **반드시 Read 도구로 읽고**, 각 문서의 핵심 내용을 요약 출력하세요.

#### 공통 로딩 (모든 Skill 필수)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| 시스템 헌법 | `CLAUDE.md` | 절대 금지 사항 1가지 |
| DB 스키마 | `.claude/rules/DOMAIN_SCHEMA.md` | 주요 테이블 카테고리 |
| 기술 스택 | `.claude/project/PROJECT_STACK.md` | 프로젝트 스택 요약 |
| 산출물 정의 | `.claude/workflows/DOCUMENT_PIPELINE.md` | Leader 산출물 목록 |

#### Role별 추가 로딩 (Leader 전용)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| Role 정의 | `.claude/workflows/ROLES_DEFINITION.md` | Leader 섹션 - 역할/권한 |
| HANDOFF 양식 | `.claude/workflows/HANDOFF_PROTOCOL.md` | HANDOFF 필수 섹션 |
| PRD 가이드 | `.claude/workflows/PRD_GUIDE.md` | 파이프라인 판별 기준 |
| AI 철학 | `.claude/context/AI_Playbook.md` | 핵심 원칙 1가지 |

### Phase 0 출력 (검증용) 🔴

**아래 형식으로 요약을 출력해야 Phase 1 진행 가능:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [문서 로딩 확인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[공통]
- CLAUDE.md: {절대 금지 사항 1가지}
- DOMAIN_SCHEMA.md: {주요 테이블 카테고리}
- PROJECT_STACK.md: {프로젝트 스택 요약}
- DOCUMENT_PIPELINE.md: {Leader 산출물 목록}

[Leader 전용]
- ROLES_DEFINITION.md#Leader: {역할 1줄 요약}
- HANDOFF_PROTOCOL.md: 필수 섹션 {n}개
- PRD_GUIDE.md: 파이프라인 {n}가지
- AI_Playbook.md: {핵심 원칙 1가지}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **위 출력이 없으면 Phase 1 Write가 무효 처리됩니다.**

---

### Phase 1: PRD 분석

- PRD.md 읽기
- 요구사항에서 목표, 범위, 제약사항 도출

### Phase 2: 파이프라인 결정

| 파이프라인 | 조건 |
|------------|------|
| `analysis` | 데이터 분석만 필요 |
| `design` | 설계만 필요 |
| `code` | SDD 존재 + 코드만 필요 |
| `ui_mockup` | 설계 → 코드 |
| `analyzed_design` | 분석 → 설계 |
| `full` | 분석 → 설계 → 코드 |

### Phase 3: HANDOFF 생성 및 보고서 출력

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **PRD 분석** | 요구사항에서 목표, 범위, 제약사항 도출 |
| **파이프라인 결정** | analysis / design / code / ui_mockup / full 중 선택 |
| **HANDOFF 생성** | 하위 Skill이 참조할 작업 지시서 작성 |

## 제약사항

| 제약 | 설명 |
|------|------|
| 직접 실행 금지 | SQL 작성, 설계 문서 생성, 코드 작성 금지 |
| 파이프라인 명시 | 반드시 파이프라인 타입 결정 |
| HANDOFF 필수 | 하위 Role 실행을 위한 작업 지시서 생성 |

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Leader Skill Report]
🔧 사용된 Skill: leader v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Phase 0):
  - 공통: {n}/4개 ✅
  - Leader 전용: {n}/4개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: PRD 내용
📤 출력: HANDOFF 내용
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 파이프라인: {pipeline_type}
✅ 포함 Skill: {skill_list}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
