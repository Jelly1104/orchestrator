# IA.md - 정보 구조

## 1. 페이지 계층 구조

```
/dashboard
├── /user-dashboard (활성 사용자 현황 대시보드)
│   ├── 개요 섹션 (Overview)
│   ├── 통계 카드 섹션 (Statistics Cards)
│   ├── 차트 섹션 (Charts)
│   └── 테이블 섹션 (Data Table)
```

## 2. 라우팅 구조

| 경로 | 컴포넌트 | 목적 |
|------|----------|------|
| `/dashboard/user-dashboard` | UserDashboard | 메인 대시보드 |
| `/dashboard/user-dashboard/stats` | UserStats | 통계 상세 |
| `/dashboard/user-dashboard/trends` | UserTrends | 추이 분석 |

## 3. 정보 계층 구조

### Level 1: 핵심 KPI
- 전체 활성 사용자 수
- 전체 등록 사용자 수
- 월간 신규 가입자 수
- 활성화율 (계산된 지표)

### Level 2: 분석 차트
- 유형별 사용자 분포 (파이 차트)
- 월별 신규 가입자 추이 (라인 차트)
- 최근 6개월 활성도 트렌드

### Level 3: 상세 테이블
- 사용자 유형별 상세 통계
- 월별 가입자 현황 테이블
- 전문과목별 분포 (USER_DETAIL 기반)

## 4. 데이터 흐름

```
USERS 테이블 → 활성 사용자 집계
USER_DETAIL 테이블 → 전문과목 분포
시계열 데이터 → 월별 추이 분석
```