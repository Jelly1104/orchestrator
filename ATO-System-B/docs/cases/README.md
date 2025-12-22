# Case 산출물 구조

> Orchestrator 발전 버전별 Case 분류

---

## 버전 구조

```
docs/cases/
├── v1_basic/           # 기본 워크플로우 (PRD → IA/Wireframe/SDD)
│   ├── case0-welcome-alert
│   ├── case1-notice-list
│   └── case2-notification
├── v2_complex/         # 복잡 워크플로우 (분석 + HITL)
│   └── case3-dr-insight
└── v3_analysis/        # 분석 중심 (AnalysisAgent 활용)
    ├── case4-analysis
    └── case5-dormancy
```

---

## v1_basic - 기본 워크플로우

**특징**: LeaderAgent의 `plan()` 기능을 통한 단순 설계 문서 생성

| Case | 기능 | 산출물 |
|------|------|--------|
| case0 | 웰컴 알림 | IA, Wireframe, SDD, HANDOFF |
| case1 | 공지사항 목록 | PRD, IA, Wireframe, SDD, RESULT |
| case2 | 푸시 알림 | PRD, IA, Wireframe, SDD, HANDOFF |

---

## v2_complex - 복잡 워크플로우

**특징**: 데이터 분석 + HITL 체크포인트 + 최종 리포트

| Case | 기능 | 산출물 |
|------|------|--------|
| case3 | Dr.Insight | IA, Wireframe, SDD, HANDOFF, CLINE_INSTRUCTION, FINAL_REPORT |

---

## v3_analysis - 분석 중심

**특징**: AnalysisAgent를 활용한 데이터 분석 리포트

| Case | 기능 | 산출물 |
|------|------|--------|
| case4 | 회원 분석 | active_member_profile_report, basic_member_analysis_report, simplified_member_analysis_report |
| case5 | 휴면 회원 | IA, Wireframe, SDD |

---

## 버전 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|----------|
| v1 | 2024-12 | 기본 설계 문서 생성 워크플로우 |
| v2 | 2024-12 | HITL 체크포인트 + 복합 분석 |
| v3 | 2024-12 | AnalysisAgent 기반 리포트 |

---

**최종 정리일**: 2025-12-19
