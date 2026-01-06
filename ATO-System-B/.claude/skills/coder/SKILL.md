---
name: coder
description: |
  SDD 기반 코드 구현.
  트리거: "코드 구현", "API 개발", "컴포넌트 작성", "코드 생성".
  실행 전 필수 로딩: PROJECT_STACK.md, ROLES_DEFINITION.md(Coder 섹션), CODE_STYLE.md, TDD_WORKFLOW.md.
  HANDOFF/SDD를 기반으로 Backend API와 Frontend 컴포넌트를 구현한다.
  ⚠️ 기술 스택은 반드시 PROJECT_STACK.md를 따를 것.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Coder Skill (Extension용)

설계 문서 기반 코드 구현.

## 핵심 역할

| 영역         | 산출물                                |
| ------------ | ------------------------------------- |
| **Backend**  | API, Controller, Service (스택 참조)  |
| **Frontend** | 컴포넌트, Hooks, 타입 정의 (스택 참조)|
| **Test**     | 단위/통합 테스트 (스택 참조)          |

## 제약사항

| 제약               | 설명                                 |
| ------------------ | ------------------------------------ |
| 설계 준수          | SDD 명세 정확히 따름, 임의 변경 금지 |
| PRD 직접 참조 금지 | SDD를 통해서만 요구사항 확인         |
| 보안               | SQL Injection, XSS 방지 필수         |
| 테스트             | 주요 함수/컴포넌트 테스트 코드 포함  |

## 필수 참조 문서

- `.claude/project/PROJECT_STACK.md` (기술 스택 정의)
- `.claude/workflows/ROLES_DEFINITION.md` (Coder 섹션)
- `.claude/rules/CODE_STYLE.md`
- `.claude/rules/TDD_WORKFLOW.md`

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Coder Skill Report]
🔧 사용된 Skill: coder v2.0
📚 참조 문서: ROLES_DEFINITION.md ✅ | CODE_STYLE.md ✅ | TDD_WORKFLOW.md ✅
📥 입력: {sdd_summary 또는 wireframe_filename}
📤 출력: {n}개 파일 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backend: {n}개 파일
✅ Frontend: {n}개 컴포넌트
✅ Tests: {n}개 테스트
✅ 타입체크: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
