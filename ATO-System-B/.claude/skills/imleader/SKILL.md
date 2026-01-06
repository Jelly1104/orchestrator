---
name: imleader
description: |
  산출물 품질 검증 (Quality Manager).
  트리거: "검증", "리뷰", "품질 체크", "QA".
  실행 전 필수 로딩: VALIDATION_GUIDE.md, ROLES_DEFINITION.md(Implementation Leader 섹션).
  각 Skill의 산출물(SQL, 설계문서, 코드)을 검증하고 PASS/FAIL을 판정한다.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Implementation Leader Skill (Extension용)

산출물 품질 검증.

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **산출물 검증** | 분석/설계/코드 산출물의 품질 검증 |
| **PASS/FAIL 판정** | 검증 기준 충족 여부 판정 |
| **피드백 제공** | FAIL 시 Actionable Feedback 필수 |

## 필수 참조 문서

- `.claude/rules/VALIDATION_GUIDE.md`
- `.claude/workflows/ROLES_DEFINITION.md` (Implementation Leader 섹션)

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [ImLeader Skill Report]
🔧 사용된 Skill: imleader v1.0
📚 참조 문서: VALIDATION_GUIDE.md ✅ | ROLES_DEFINITION.md ✅
📥 검증 대상: {파일명 또는 산출물}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 판정: {PASS / FAIL}
{FAIL 시: 문제 위치, 원인, 수정 방법}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
