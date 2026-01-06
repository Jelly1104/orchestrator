---
name: leader
description: |
  PRD 분석 및 작업 지시 수립.
  트리거: "HANDOFF 작성", "작업 지시서", "파이프라인 분석", "PRD 분석".
  실행 전 필수 로딩: HANDOFF_PROTOCOL.md, PRD_GUIDE.md, ROLES_DEFINITION.md(Leader 섹션).
  PRD를 분석하여 하위 Skill이 실행할 수 있는 HANDOFF를 생성한다.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Leader Skill (Extension용)

PRD 분석 및 작업 지시 수립.

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **PRD 분석** | 요구사항에서 목표, 범위, 제약사항 도출 |
| **파이프라인 결정** | analysis / design / code / ui_mockup / full 중 선택 |
| **HANDOFF 생성** | 하위 Skill이 참조할 작업 지시서 작성 |

## 필수 참조 문서

- `.claude/workflows/HANDOFF_PROTOCOL.md`
- `.claude/workflows/PRD_GUIDE.md`
- `.claude/workflows/ROLES_DEFINITION.md` (Leader 섹션)

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Leader Skill Report]
🔧 사용된 Skill: leader v1.0
📚 참조 문서: HANDOFF_PROTOCOL.md ✅ | PRD_GUIDE.md ✅ | ROLES_DEFINITION.md ✅
📥 입력: PRD 내용
📤 출력: HANDOFF 내용
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 파이프라인: {pipeline_type}
✅ 포함 Skill: {skill_list}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
