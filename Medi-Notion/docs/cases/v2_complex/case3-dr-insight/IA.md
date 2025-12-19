# IA.md - Information Architecture

> **Case**: #3 Dr. Insight (2025 의사 활동 결산)
> **작성자**: Leader Agent (Claude Code)
> **작성일**: 2025-12-17
> **상태**: Approved

---

## 1. 서비스 개요

**Dr. Insight**는 의사 회원에게 지난 1년간의 커뮤니티 활동(글/댓글/포인트)을 시각화하여 제공하는 연간 결산 리포트 서비스입니다.

### 1.1 핵심 가치
- "나의 영향력 확인" (Gamification)
- 충성도(Retention) 강화
- SNS 공유를 통한 바이럴 마케팅

### 1.2 타겟 유저
- 의사 회원 (`U_KIND = 'DOC001'`)
- 활성 상태 (`U_ALIVE = 'Y'`)

---

## 2. 페이지 계층 구조

```
[Root]
└── /insight
    └── /insight/2025                    # Dr. Insight 메인 페이지
        ├── [Header]                     # GNB 영역
        ├── [Hero Section]               # 타이틀 + D-Day
        ├── [Key Metrics Section]        # 4개 핵심 지표 카드
        ├── [Trend Chart Section]        # 월별 활동 추이
        └── [Share Card Section]         # SNS 공유 이미지
```

---

## 3. 라우팅 정의

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/insight/2025` | `DrInsightPage` | Required | 메인 결산 페이지 |
| `/insight/2025/share` | `ShareCardModal` | Required | 공유 이미지 생성 모달 |

### 3.1 인증 흐름

```
접속 (/insight/2025)
    │
    ├── 비로그인 → 로그인 페이지 리다이렉트
    │
    ├── 로그인 (비의사) → "의사 회원 전용" 안내
    │
    └── 로그인 (의사) → 대시보드 렌더링
```

---

## 4. 컴포넌트 트리

```
DrInsightPage
├── Header
│   ├── Logo
│   ├── UserNickname
│   └── ShareButton
│
├── HeroSection
│   ├── TitleText ("2025년, 선생님의 목소리가 닿은 곳")
│   └── DDayBadge (가입 D+XXX일)
│
├── KeyMetricsSection
│   ├── MetricCard (총 작성 글)
│   ├── MetricCard (총 댓글)
│   ├── MetricCard (받은 추천)
│   └── MetricCard (보유 포인트)
│
├── TrendChartSection
│   ├── ChartToggle (월별/주별)
│   └── LineChart
│
└── ShareCardSection
    ├── PreviewCard
    └── DownloadButton
```

---

## 5. 상태 관리

| State | Type | Source | Description |
|-------|------|--------|-------------|
| `user` | `User` | API | 현재 로그인 사용자 정보 |
| `metrics` | `Metrics` | API | 4개 핵심 지표 데이터 |
| `trendData` | `TrendPoint[]` | API | 월별 활동 추이 데이터 |
| `isLoading` | `boolean` | Local | 로딩 상태 |
| `chartMode` | `'monthly' \| 'weekly'` | Local | 차트 표시 모드 |

---

## 6. 데이터 의존성

```
┌─────────────────────────────────────────────────────────────┐
│  API Layer                                                   │
├─────────────────────────────────────────────────────────────┤
│  GET /api/insight/2025/summary                              │
│  └── { user, metrics, trendData }                           │
│                                                              │
│  참조 테이블:                                                 │
│  ├── USERS (U_ID, U_NAME, U_REG_DATE, U_KIND, U_ALIVE)      │
│  ├── BOARD_MUZZIMA (게시글 수, 추천 수)                       │
│  ├── COMMENT (댓글 수)                                       │
│  └── POINT_GRANT (포인트 합계)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 접근성 (A11y) 요구사항

- 모든 MetricCard에 `aria-label` 제공
- 차트에 대체 텍스트 데이터 테이블 제공
- 키보드 네비게이션 지원
- 색맹 대응 색상 팔레트 사용

---

**END OF IA.md**
