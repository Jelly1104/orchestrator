---
name: reviewer
description: |
  산출물 품질 검증 및 PRD 정합성 확인.
  트리거: "리뷰", "검증", "품질 체크", "PRD 매칭".
  실행 전 필수 로딩: VALIDATION_GUIDE.md, QUALITY_RULES.md, PRD_CHECKLIST.md.
  생성된 산출물이 PRD 요구사항을 충족하는지 검증하고 품질 점수를 산정한다.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Reviewer Skill (Extension용)

산출물 품질 검증 및 PRD 정합성 확인.

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

## 필수 참조 문서

- `.claude/rules/VALIDATION_GUIDE.md`
- `.claude/templates/reviewer/QUALITY_RULES.md`
- `.claude/templates/reviewer/PRD_CHECKLIST.md`

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Reviewer Skill Report]
🔧 사용된 Skill: reviewer v2.0
📚 참조 문서: VALIDATION_GUIDE.md ✅ | QUALITY_RULES.md ✅ | PRD_CHECKLIST.md ✅
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
