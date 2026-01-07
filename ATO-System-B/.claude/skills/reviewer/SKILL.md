---
name: reviewer
version: 3.0.0
description: |
  산출물 품질 검증 및 PRD 정합성 확인.
  트리거: "리뷰", "검증", "품질 체크", "PRD 매칭".
  ⚠️ v3.0.0: 필수 문서 로딩 검증 단계 추가 - Phase 0 완료 후에만 Phase 1 진행 가능.
---

# Reviewer Skill (Extension용)

산출물 품질 검증 및 PRD 정합성 확인.

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

#### Role별 추가 로딩 (Reviewer 전용)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| 검증 가이드 | `.claude/rules/VALIDATION_GUIDE.md` | Quality Gates |
| 품질 규칙 | `.claude/templates/reviewer/QUALITY_RULES.md` | 점수 기준 |
| PRD 체크리스트 | `.claude/templates/reviewer/PRD_CHECKLIST.md` | PRD 매칭 항목 |

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

[Reviewer 전용]
- VALIDATION_GUIDE.md: Quality Gates {n}개
- QUALITY_RULES.md: {점수 기준 요약}
- PRD_CHECKLIST.md: PRD 매칭 항목 {n}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **위 출력이 없으면 Phase 1 검증이 무효 처리됩니다.**

---

### Phase 1: 산출물 확인

- 검증 대상 파일 목록 확인
- PRD 원문 확인

### Phase 2: 품질 검증

- Syntax/Semantic 검증
- PRD 매칭률 계산
- 점수 산정

### Phase 3: 판정 및 보고서 출력

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **Gatekeeper** | 80점 미만이면 반려, 재작업 요청 |
| **Grounding** | PRD 원문 인용 기반 객관적 판정 |

## 합격 기준

| 조건 | 기준 |
|------|------|
| 전체 점수 | 80점 이상 |
| HIGH 이슈 | 0개 |
| PRD 매칭률 | 80% 이상 |

## 제약사항

| 제약 | 설명 |
|------|------|
| PRD 원문 인용 필수 | 반려 시 PRD 섹션 명시 |
| 추측 표현 금지 | "~할 것 같다" 사용 금지 |
| Actionable | 수정 방법 구체적 제시 |

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Reviewer Skill Report]
🔧 사용된 Skill: reviewer v3.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Phase 0):
  - 공통: {n}/4개 ✅
  - Reviewer 전용: {n}/3개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: {artifact_list}
📤 출력: 검증 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Score: {score}/100  {PASS|FAIL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Syntax:    {score}/100
  Semantic:  {score}/100
  PRD Match: {score}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Issues: {n} (HIGH: {n}, MEDIUM: {n}, LOW: {n})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
