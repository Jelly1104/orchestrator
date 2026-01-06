---
name: designer
description: |
  IA/Wireframe/SDD 설계 문서 생성.
  트리거: "IA 작성", "Wireframe 설계", "SDD 생성", "화면 설계".
  실행 전 필수 로딩: ROLES_DEFINITION.md(Designer 섹션), IA_TEMPLATE.md, WF_TEMPLATE.md.
  PRD/HANDOFF 기반으로 정보구조, 화면설계, 기술명세를 작성한다.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Designer Skill (Extension용)

설계 문서(IA/Wireframe/SDD) 생성.

## 핵심 역할

| 산출물 | 설명 |
|--------|------|
| **IA.md** | 정보 구조 (화면 계층, 네비게이션) |
| **Wireframe.md** | 화면 설계 (ASCII 레이아웃, 컴포넌트) |
| **SDD.md** | 기술 명세 (API, 데이터 모델) |

## 제약사항

| 제약 | 설명 |
|------|------|
| 스키마 준수 | 기존 테이블 활용 우선, 신규 생성 지양 |
| 템플릿 준수 | IA_TEMPLATE.md, WF_TEMPLATE.md 형식 |
| 레거시 매핑 | SDD에 실제 컬럼명 매핑 필수 |

## 필수 참조 문서

- `.claude/workflows/ROLES_DEFINITION.md` (Designer 섹션)
- `.claude/templates/designer/IA_TEMPLATE.md`
- `.claude/templates/designer/WF_TEMPLATE.md`

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Designer Skill Report]
🔧 사용된 Skill: designer v2.0
📚 참조 문서: ROLES_DEFINITION.md ✅ | IA_TEMPLATE.md ✅ | WF_TEMPLATE.md ✅
📥 입력: {handoff_summary}
📤 출력: IA.md, Wireframe.md, SDD.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IA: {n}개 화면 정의
✅ Wireframe: {n}개 화면 설계
✅ SDD: API {n}개, 테이블 매핑 {n}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
