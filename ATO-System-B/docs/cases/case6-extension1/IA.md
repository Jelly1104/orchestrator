# IA.md: 오케스트레이터 통합 검증 대시보드

> **생성일**: 2025-12-24
> **Case ID**: case7-extension1
> **PRD 버전**: 1.0.0
> **생성자**: Claude Code (Extension Mode)
> **파이프라인**: DOCUMENT_PIPELINE.md 준수

---

## 1. 라우팅 구조

```
/analytics                         # 분석 대시보드 메인
/analytics/segments                # 세그먼트 분석
/analytics/segments/:segmentId     # 세그먼트 상세
/analytics/login-patterns          # 로그인 패턴 분석
/analytics/distribution            # 전문과목별 분포
```

---

## 2. 페이지 계층 구조

```
[Analytics Dashboard] (/analytics)
├── [Header]
│   ├── 페이지 타이틀: "오케스트레이터 통합 검증 대시보드"
│   ├── [Breadcrumb]: Home > Analytics
│   └── [Date Range Picker]
│
├── [KPI Summary Cards] (4개)
│   ├── [Card] 총 활성 회원
│   │   ├── Value: {activeUserCount}
│   │   ├── Trend: +{deltaPercent}%
│   │   └── Source: USERS.U_ALIVE='Y'
│   │
│   ├── [Card] 금일 로그인
│   │   ├── Value: {todayLoginCount}
│   │   ├── Trend: vs 어제
│   │   └── Source: USER_LOGIN
│   │
│   ├── [Card] 주요 전문과목 (Top 3)
│   │   ├── Value: {topMajorCodes}
│   │   └── Source: USER_DETAIL.U_MAJOR_CODE_1
│   │
│   └── [Card] 세그먼트 수
│       ├── Value: {segmentCount}
│       └── Source: U_KIND 기준
│
├── [Filter Panel]
│   ├── [Dropdown] 회원 유형 (U_KIND)
│   │   ├── Option: 전체
│   │   ├── Option: DOC001 (의사)
│   │   ├── Option: PHA001 (약사)
│   │   └── Option: 기타
│   │
│   ├── [Dropdown] 전문과목 (U_MAJOR_CODE_1)
│   │   ├── Option: 전체
│   │   ├── Option: IM (내과)
│   │   ├── Option: GS (외과)
│   │   └── Option: ... (CODE_MASTER 조회)
│   │
│   ├── [Dropdown] 기간
│   │   ├── Option: 최근 7일
│   │   ├── Option: 최근 30일
│   │   └── Option: Custom Range
│   │
│   └── [Button] 필터 적용
│
├── [Chart Section]
│   ├── [SegmentChart] (Bar Chart)
│   │   ├── X축: U_KIND (회원 유형)
│   │   ├── Y축: 회원 수
│   │   └── Legend: 활성/비활성
│   │
│   ├── [DistributionChart] (Pie Chart)
│   │   ├── Data: 전문과목별 비율
│   │   └── Source: USER_DETAIL.U_MAJOR_CODE_1
│   │
│   └── [LoginTrendChart] (Line Chart)
│       ├── X축: 날짜/시간
│       ├── Y축: 로그인 수
│       └── Source: USER_LOGIN (LIMIT 적용)
│
├── [Data Table Section]
│   ├── [SegmentTable]
│   │   ├── Columns: 세그먼트명 | 회원수 | 활성률 | 최근 로그인
│   │   ├── Sorting: 모든 컬럼 정렬 가능
│   │   ├── Pagination: 10/20/50건
│   │   └── Export: CSV 다운로드
│   │
│   └── [LoginPatternTable]
│       ├── Columns: 시간대 | 요일 | 로그인수 | 비율
│       └── Note: ⚠️ 10,000행 제한 (DB_ACCESS_POLICY)
│
└── [Footer]
    ├── 데이터 기준일: {lastUpdated}
    ├── 쿼리 실행 시간: {queryTime}ms
    └── [Link] 전체 화면으로 보기
```

---

## 3. 세그먼트 상세 페이지

```
[Segment Detail] (/analytics/segments/:segmentId)
├── [Header]
│   ├── [Back Button] ← 목록으로
│   ├── 세그먼트명: {segmentName}
│   └── 회원 수: {memberCount}명
│
├── [Segment Info Card]
│   ├── U_KIND: {kindCode} ({kindName})
│   ├── 활성 회원: {activeCount} ({activePercent}%)
│   └── 최근 30일 로그인: {recentLoginCount}
│
├── [Member Distribution]
│   ├── [Chart] 전문과목 분포 (해당 세그먼트 내)
│   └── [Chart] 근무형태 분포 (U_WORK_TYPE_1)
│
├── [Activity Analysis]
│   ├── [Chart] 로그인 트렌드 (해당 세그먼트)
│   └── [Table] 최근 활동 회원 목록
│
└── [Actions]
    ├── [Button] CSV 내보내기
    └── [Button] 리포트 생성
```

---

## 4. 로그인 패턴 분석 페이지

```
[Login Patterns] (/analytics/login-patterns)
├── [Header]
│   ├── 타이틀: "로그인 패턴 분석"
│   └── [Alert] ⚠️ USER_LOGIN 대용량 테이블 - 조회 제한 적용 중
│
├── [Heatmap Section]
│   ├── [Heatmap] 시간대 x 요일 로그인 분포
│   │   ├── X축: 시간 (0-23시)
│   │   ├── Y축: 요일 (월-일)
│   │   └── Color: 로그인 빈도 (연한색 → 진한색)
│   │
│   └── [Legend] 색상 범례
│
├── [Trend Chart]
│   ├── [LineChart] 일별 로그인 추이
│   │   ├── Period: 최근 30일
│   │   └── Granularity: 일 단위
│   │
│   └── [Stats] 평균 일 로그인, 피크 시간대
│
├── [Peak Analysis]
│   ├── 최다 로그인 시간대: {peakHour}시
│   ├── 최다 로그인 요일: {peakDay}
│   └── 평균 세션 시간: {avgSessionTime}
│
└── [Constraints Notice]
    ├── 조회 제한: 10,000행 (DB_ACCESS_POLICY.md)
    ├── 타임아웃: 30초
    └── 조회 기간: 최근 3개월 권장
```

---

## 5. 데이터 흐름

```
[사용자] → [대시보드 접속]
         → [API: GET /api/analytics/summary]
         → [DB: USERS + USER_DETAIL JOIN]
         → [KPI 카드 렌더링]

[사용자] → [필터 변경]
         → [API: GET /api/analytics/segments?kind={}&major={}]
         → [DB: 조건부 쿼리 실행]
         → [차트/테이블 업데이트]

[사용자] → [로그인 패턴 조회]
         → [API: GET /api/analytics/login-patterns?limit=10000]
         → [DB: USER_LOGIN (LIMIT 10000, 인덱스 사용)]
         → [Heatmap 렌더링]

[사용자] → [세그먼트 클릭]
         → [API: GET /api/analytics/segments/:id]
         → [DB: 세그먼트별 상세 조회]
         → [상세 페이지 렌더링]
```

---

## 6. 레거시 스키마 매핑 (DOMAIN_SCHEMA.md 준수)

| UI 요소 | 데이터 소스 | 컬럼 매핑 |
|---------|-------------|-----------|
| 회원 유형 필터 | USERS | U_KIND (CHAR(6)) |
| 활성 여부 | USERS | U_ALIVE='Y' |
| 전문과목 | USER_DETAIL | U_MAJOR_CODE_1 (CHAR(6)) |
| 전문과목명 | CODE_MASTER | CODE_TYPE='MAJOR', CODE_NAME |
| 로그인 이력 | USER_LOGIN | LOGIN_DATE, U_ID |
| 회원 ID | USERS | U_ID (VARCHAR(14)) |

---

## 7. 접근성 및 반응형

### 7.1 반응형 브레이크포인트

| 뷰포트 | 레이아웃 |
|--------|----------|
| Desktop (≥1024px) | 4열 KPI, 2열 차트 |
| Tablet (768-1023px) | 2열 KPI, 1열 차트 |
| Mobile (<768px) | 1열, 스크롤 차트 |

### 7.2 접근성 요구사항

- 차트에 aria-label 필수
- 테이블 th scope 명시
- 색상 대비 WCAG AA 준수
- 키보드 네비게이션 지원

---

**END OF IA.md**
