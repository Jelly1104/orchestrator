# Case 산출물 구조

> Flat Structure (v2.0.0) - 2025-12-23 리팩토링

---

## 디렉토리 구조

```
docs/cases/
├── README.md                    # 이 파일
├── case0-welcome-alert/
├── case1-notice-list/
├── case2-notification/
├── case3-dr-insight/
├── case4-analysis/
├── case5-dormancy/
│   ├── PRD.md
│   ├── IA.md
│   ├── Wireframe.md
│   ├── SDD.md
│   ├── HANDOFF.md
│   └── visuals/                 # 시각화 산출물 (선택)
│       └── IA_VISUAL.html
└── job-recommendation/
    └── PRD.md
```

---

## 케이스 분류 (메타데이터)

| Case | Type | 설명 | 산출물 |
|------|------|------|--------|
| case0-welcome-alert | basic | 웰컴 알림 | IA, Wireframe, SDD, HANDOFF |
| case1-notice-list | basic | 공지사항 목록 | PRD, IA, Wireframe, SDD, RESULT |
| case2-notification | basic | 푸시 알림 | PRD, IA, Wireframe, SDD, HANDOFF |
| case3-dr-insight | complex | Dr.Insight (HITL 포함) | IA, Wireframe, SDD, HANDOFF, CLINE_INSTRUCTION, FINAL_REPORT |
| case4-analysis | analysis | 회원 분석 리포트 | analysis_report, SQL 쿼리 |
| case5-dormancy | analysis | 휴면 회원 예측 | PRD, IA, Wireframe, SDD |
| job-recommendation | basic | 채용 추천 에이전트 | PRD |

---

## Type 정의

| Type | 설명 | 특징 |
|------|------|------|
| **basic** | 단순 설계 워크플로우 | LeaderAgent `plan()` 기반 |
| **complex** | HITL 체크포인트 포함 | 인간 승인 단계 필수 |
| **analysis** | 데이터 분석 중심 | AnalysisAgent + SQL 실행 |

---

## 경로 규칙

- **caseId**: `case5-dormancy-20251223` → `case5-dormancy` (날짜/타임스탬프 제거)
- **설계 문서**: `docs/cases/{caseId}/`
- **시각화**: `docs/cases/{caseId}/visuals/`
- **분석 결과**: `workspace/analysis/{taskId}/` (런타임 산출물)

---

## 버전 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|----------|
| v1.0 | 2024-12 | 기본 설계 문서 생성 워크플로우 |
| v1.5 | 2024-12 | HITL 체크포인트 + 복합 분석 |
| v2.0 | 2025-12-23 | **Flatten 구조로 리팩토링** (v1/v2/v3 계층 제거) |

---

**최종 정리일**: 2025-12-23
