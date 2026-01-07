# PRD: Skill Dashboard (LITE 버전)

| 항목 | 내용 |
|------|------|
| **Case ID** | 260106-lite-test |
| **PRD 버전** | 1.0.0 |
| **작성일** | 2026-01-06 |
| **템플릿** | PRD_LITE |

---

## Skills 연동

```yaml
skills:
  - leader      # HANDOFF 생성
  - designer    # IA/Wireframe/SDD
  - coder       # React 구현

output:
  design: docs/cases/260106-lite-test/
  code:
    frontend: frontend/src/features/skills-dashboard-lite/
```

---

## 목적 (Objective)

ATO 시스템의 Skill 현황을 대시보드로 표시한다.

> **요약**: "Skill 목록을 카드로 보여주는 React UI"

---

## 타겟 유저

| 항목 | 설명 |
|------|------|
| **Persona** | ATO 시스템 관리자 |
| **Pain Point** | Skill 현황 파악이 어려움 |
| **Needs** | 한눈에 Skill 상태 확인 |

---

## 핵심 기능

| ID | 기능명 | 설명 | Skill |
|----|--------|------|-------|
| F1 | Skill 카드 | 이름, 버전, 상태 표시 | designer → coder |
| F2 | 상태 구분 | active/inactive 색상 구분 | designer → coder |
| F3 | 통계 표시 | 전체/활성/비활성 개수 | coder |

---

## 데이터 요구사항

7개 Skill 정보 (정적 데이터):
- leader, designer, coder, reviewer, imleader, query, profiler

---

## 제약사항

| 카테고리 | 항목 | 설명 |
|----------|------|------|
| 기술 | React + TypeScript | strict mode |
| 스타일 | TailwindCSS | inline style 금지 |

---

## 산출물 체크리스트

- [ ] HANDOFF.md
- [ ] IA.md, Wireframe.md, SDD.md
- [ ] React 컴포넌트
- [ ] 빌드/구동 테스트 통과

---

**END OF PRD**
