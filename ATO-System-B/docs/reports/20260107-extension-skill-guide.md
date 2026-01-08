# ATO System B - Extension Skill 가이드

> **작성일**: 2026-01-07
> **목적**: Extension Skill 시스템 이해 및 실행 가이드

---

## 이게 뭔가요?

**AI가 개발 작업을 단계별로 수행하는 시스템**입니다.

사람이 "회원 분석 대시보드 만들어줘"라고 요청하면, AI가:
1. 요구사항 분석
2. 데이터 분석 → **검증**
3. 화면 설계 → **검증**
4. 코드 구현 → **검증**

을 순서대로 진행합니다.

---

## 핵심 개념

### Skill = AI의 전문 역할

| Skill | 하는 일 | 비유 |
|-------|--------|------|
| `/leader` | 전체 계획 수립, 다음 단계 지시 | PM |
| `/profiler` | 분석 대상 정의 (누구를?) | 기획자 |
| `/query` | SQL로 데이터 추출 (무엇을?) | 데이터 분석가 |
| `/designer` | 화면 설계 | UX 디자이너 |
| `/coder` | 코드 구현 | 개발자 |
| `/imleader` | 각 Phase 완료 후 품질 검증 | QA |

### 파이프라인 = 작업 유형별 Skill 조합

| 작업 유형 | 실행 순서 |
|----------|----------|
| 데이터 분석만 | leader → profiler → query → **imleader** |
| 화면 설계만 | leader → designer → **imleader** |
| 코드 구현만 | leader → coder → **imleader** |
| 설계+구현 | leader → designer → **imleader** → coder → **imleader** |
| 분석+설계 | leader → profiler → query → **imleader** → designer → **imleader** |
| 전체 | leader → profiler → query → **imleader** → designer → **imleader** → coder → **imleader** |

> **핵심**: 각 Phase 완료 후 반드시 `/imleader`로 검증

---

## 빠른 시작

### Step 1. PRD 작성
```
docs/cases/{프로젝트명}/PRD.md
```

### Step 2. Leader 실행 (시작 프롬프트)
```
/leader
.claude/skills/leader/SKILL.md 읽고 Phase 0부터 순서대로 진행해줘.
PRD.md({PRD 경로}) 기반으로 HANDOFF.md 생성.
```

### Step 3. Leader가 안내하는 다음 Skill 실행
Leader 완료 시 아래와 같이 다음 단계를 안내합니다:
```
🎯 [다음 단계]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 Skill: /designer

실행 프롬프트:
/designer
.claude/skills/designer/SKILL.md 읽고 Phase 0부터 순서대로 진행해줘.
HANDOFF.md 기반으로 IA.md, Wireframe.md, SDD.md 생성.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4. 각 Phase 완료 후 /imleader 검증
```
/imleader
.claude/skills/imleader/SKILL.md 읽고 Phase 0부터 순서대로 진행해줘.
{Phase} 산출물 검증.
```

### Step 5. 검증 PASS 후 다음 Skill 진행 (반복)

---

## 실행 흐름 예시 (ui_mockup 파이프라인)

```
사용자: PRD 작성
         ↓
/leader 실행 → HANDOFF 생성 → "다음: /designer"
         ↓
/designer 실행 → IA, WF, SDD 생성 → "다음: /imleader"
         ↓
/imleader 실행 → 설계 검증 PASS → "다음: /coder"
         ↓
/coder 실행 → React 컴포넌트 생성 → "다음: /imleader"
         ↓
/imleader 실행 → 빌드 검증 PASS
         ↓
        완료!
```

---

## 왜 매번 검증하나요?

| 검증 없이 진행 | 검증 후 진행 |
|--------------|-------------|
| 설계 오류가 코드까지 전파 | 각 단계에서 문제 조기 발견 |
| 마지막에 대규모 수정 | 작은 단위로 수정 |
| 디버깅 어려움 | 문제 원인 명확 |

---

## 산출물 위치

```
docs/cases/{프로젝트명}/
├── PRD.md           ← 사용자 작성
├── HANDOFF.md       ← /leader 생성
├── IA.md            ← /designer 생성
├── Wireframe.md     ← /designer 생성
├── SDD.md           ← /designer 생성
└── analysis/        ← /profiler, /query 생성
    ├── segment_definition.md
    ├── analysis_report.md
    └── results/*.sql

frontend/src/features/{기능명}/
├── {Component}.tsx  ← /coder 생성
└── types.ts
```

---

## 요약

| 항목 | 내용 |
|------|------|
| **목적** | AI가 개발 작업을 단계별로 수행 |
| **실행 방식** | 턴 기반 (사용자가 각 Skill 수동 실행) |
| **시작** | `/leader` + PRD 경로 |
| **검증** | 각 Phase 완료 후 `/imleader` 필수 |
| **끝** | 마지막 `/imleader` 검증 PASS |

---

## 제약 사항

| 가능 | 불가능 |
|------|--------|
| 턴 기반 순차 실행 | 실시간 감시 |
| Leader가 다음 단계 안내 | 병렬 실행 |
| 수동 Skill 호출 | 자동 연속 실행 |

> 완전 자동화가 필요하면 **Claude Agent SDK**로 별도 Orchestrator 구축 필요

---

**END OF DOCUMENT**
