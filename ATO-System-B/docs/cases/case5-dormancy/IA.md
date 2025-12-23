# IA.md - 휴면 위험 예측 CRM 대시보드 정보 구조

## 1. 사이트맵 구조

```
CRM Dashboard
├── 1. 메인 대시보드 (/)
│   ├── 1.1 실시간 세그먼트 현황
│   ├── 1.2 휴면 위험 트렌드 차트
│   └── 1.3 액션 필요 알림 패널
├── 2. 세그먼트 분석 (/segments)
│   ├── 2.1 ACTIVE 세그먼트 상세
│   ├── 2.2 AT_RISK 세그먼트 상세
│   ├── 2.3 DORMANT 세그먼트 상세
│   └── 2.4 CHURNED 세그먼트 상세
├── 3. 회원 프로파일 (/profiles)
│   ├── 3.1 LIGHT vs HEAVY 비교
│   ├── 3.2 전문과목별 분석
│   ├── 3.3 근무형태별 분석
│   └── 3.4 가입연차별 분석
├── 4. 리텐션 캠페인 (/campaigns)
│   ├── 4.1 캠페인 생성/편집
│   ├── 4.2 메시지 템플릿 관리
│   ├── 4.3 발송 스케줄 관리
│   └── 4.4 캠페인 성과 분석
└── 5. 예측 모델 (/prediction)
    ├── 5.1 위험도 예측 결과
    ├── 5.2 Feature 중요도 분석
    └── 5.3 모델 성능 모니터링
```

## 2. 주요 라우팅 정의

| Route | Component | 데이터 소스 | 업데이트 주기 |
|-------|-----------|-------------|---------------|
| `/` | MainDashboard | USER_LOGIN, USER_DETAIL | 실시간 |
| `/segments/:type` | SegmentDetail | user_risk_segments | 1시간 |
| `/profiles/comparison` | ProfileComparison | user_profiles | 일간 |
| `/campaigns` | CampaignManager | campaign_history | 실시간 |
| `/prediction` | PredictionDashboard | ml_predictions | 주간 |

## 3. 데이터 계층 구조

```
Data Layer
├── Raw Data (DOMAIN_SCHEMA.md 테이블)
│   ├── USER_LOGIN (로그인 이력)
│   ├── USER_DETAIL (회원 상세)
│   ├── BOARD_MUZZIMA (게시글 활동)
│   └── COMMENT (댓글 활동)
├── Processed Data (분석용 테이블)
│   ├── user_risk_segments (휴면 위험 라벨)
│   ├── user_engagement_features (활동 지표)
│   └── user_profiles (LIGHT/HEAVY 분류)
└── Dashboard Data (API 응답용)
    ├── segment_counts (세그먼트별 회원 수)
    ├── trend_analytics (트렌드 데이터)
    └── campaign_metrics (캠페인 성과)
```

## 4. 권한 및 접근 제어

| 역할 | 접근 범위 | 제한사항 |
|------|----------|----------|
| CRM Manager | 전체 대시보드 | 개인정보 마스킹 |
| Marketing Team | 캠페인 관리만 | 세그먼트 정보만 |
| Data Analyst | 분석 화면만 | 개인식별 불가 |
| Service Manager | 조회만 | 캠페인 실행 불가 |