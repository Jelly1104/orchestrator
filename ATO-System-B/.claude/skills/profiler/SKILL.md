---
name: profiler
description: |
  회원 프로필 분석 및 세그먼트 특성 도출.
  트리거: "프로필 분석", "세그먼트 정의", "페르소나 생성", "회원 특성".
  실행 전 필수 로딩: ROLES_DEFINITION.md(Analyzer 섹션), SEGMENT_RULES.md.
  쿼리 결과를 기반으로 회원 그룹의 인구통계/행동 특성을 분석한다.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Profiler Skill (Extension용)

회원 프로필 분석 및 세그먼트 특성 도출.

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **Who** | "누가 그랬는가?" - 사용자 프로파일링 |
| **Output** | 세그먼트 프로필, 페르소나, 인사이트 |

## 제약사항

| 제약 | 설명 |
|------|------|
| 코드 마스터 참조 | 코드값은 CODE_MASTER 기반 해석 |
| 세그먼트 규칙 | SEGMENT_RULES.md 기준 적용 |
| 비식별화 | 집계 통계만 출력, 개인정보 노출 금지 |
| 최소 표본 | 30명 이상 세그먼트만 분석 |

## 필수 참조 문서

- `.claude/workflows/ROLES_DEFINITION.md` (Analyzer 섹션)
- `.claude/templates/profiler/SEGMENT_RULES.md`

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Profiler Skill Report]
🔧 사용된 Skill: profiler v2.0
📚 참조 문서: ROLES_DEFINITION.md ✅ | SEGMENT_RULES.md ✅
📥 입력: {segment_name}
📤 출력: 프로필 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 세그먼트: {n}개 분석
✅ 페르소나: {n}개 생성
✅ 코드 매핑: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
