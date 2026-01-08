# SDD.md - System Design Document

> **Case**: #3 Dr. Insight (2025 의사 활동 결산)
> **작성자**: Leader Agent (Claude Code)
> **작성일**: 2025-12-17
> **상태**: Approved

---

## 1. 시스템 개요

### 1.1 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  DrInsightPage                                               ││
│  │  ├── useInsightData() hook                                   ││
│  │  ├── MetricCard components                                   ││
│  │  └── TrendChart (Chart.js / Recharts)                        ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Server                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  /api/insight/2025/summary                                   ││
│  │  └── InsightService.getSummary(userId)                       ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │ SQL (SELECT only)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MySQL (Legacy DB)                         │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────────┐  │
│  │  USERS   │  │ BOARD_MUZZIMA│  │ COMMENT │  │ POINT_GRANT │  │
│  └──────────┘  └──────────────┘  └─────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. API 명세

### 2.1 GET /api/insight/2025/summary

**Description**: 사용자의 2025년 활동 요약 데이터 조회

**Request**
```
Headers:
  Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "DOC12345",
      "name": "홍길동",
      "registeredAt": "2021-03-15T00:00:00Z",
      "dDay": 1373
    },
    "metrics": {
      "posts": {
        "count": 127,
        "label": "작성 글"
      },
      "comments": {
        "count": 456,
        "label": "댓글"
      },
      "likes": {
        "count": 789,
        "label": "받은 추천"
      },
      "points": {
        "count": 12340,
        "label": "포인트"
      }
    },
    "trend": [
      { "month": "2025-01", "posts": 10, "comments": 25 },
      { "month": "2025-02", "posts": 15, "comments": 30 },
      { "month": "2025-03", "posts": 8, "comments": 20 },
      { "month": "2025-04", "posts": 12, "comments": 35 },
      { "month": "2025-05", "posts": 18, "comments": 40 },
      { "month": "2025-06", "posts": 14, "comments": 38 },
      { "month": "2025-07", "posts": 9, "comments": 28 },
      { "month": "2025-08", "posts": 11, "comments": 32 },
      { "month": "2025-09", "posts": 7, "comments": 22 },
      { "month": "2025-10", "posts": 10, "comments": 45 },
      { "month": "2025-11", "posts": 8, "comments": 38 },
      { "month": "2025-12", "posts": 5, "comments": 25 }
    ]
  }
}
```

**Response (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다"
  }
}
```

**Response (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "의사 회원만 이용 가능합니다"
  }
}
```

---

## 3. 데이터베이스 쿼리

### 3.1 사용자 정보 조회

```sql
-- Query: getUserInfo
SELECT
  U_ID,
  U_NAME,
  U_REG_DATE,
  DATEDIFF(NOW(), U_REG_DATE) AS D_DAY
FROM USERS
WHERE U_ID = ?
  AND U_KIND = 'DOC001'
  AND U_ALIVE = 'Y';
```

### 3.2 게시글 수 조회

```sql
-- Query: getPostCount
SELECT COUNT(*) AS post_count
FROM BOARD_MUZZIMA
WHERE U_ID = ?
  AND DEL_FLAG = 'N'
  AND REG_DATE >= '2025-01-01'
  AND REG_DATE < '2026-01-01';
```

### 3.3 댓글 수 조회

```sql
-- Query: getCommentCount
-- ⚠️ 주의: COMMENT 테이블 (1,826만 행) - 인덱스 필수
SELECT COUNT(*) AS comment_count
FROM COMMENT
WHERE U_ID = ?
  AND REG_DATE >= '2025-01-01'
  AND REG_DATE < '2026-01-01';

-- 필수 인덱스: INDEX idx_comment_uid_regdate (U_ID, REG_DATE)
```

### 3.4 추천 수 조회

```sql
-- Query: getLikeCount
SELECT COALESCE(SUM(AGREE_CNT), 0) AS like_count
FROM BOARD_MUZZIMA
WHERE U_ID = ?
  AND DEL_FLAG = 'N'
  AND REG_DATE >= '2025-01-01'
  AND REG_DATE < '2026-01-01';
```

### 3.5 포인트 합계 조회

```sql
-- Query: getPointSum
SELECT COALESCE(SUM(POINT), 0) AS point_sum
FROM POINT_GRANT
WHERE U_ID = ?
  AND POINT > 0
  AND REG_DATE >= '2025-01-01'
  AND REG_DATE < '2026-01-01';
```

### 3.6 월별 활동 추이

```sql
-- Query: getMonthlyTrend
SELECT
  DATE_FORMAT(REG_DATE, '%Y-%m') AS month,
  COUNT(*) AS post_count
FROM BOARD_MUZZIMA
WHERE U_ID = ?
  AND DEL_FLAG = 'N'
  AND REG_DATE >= '2025-01-01'
  AND REG_DATE < '2026-01-01'
GROUP BY DATE_FORMAT(REG_DATE, '%Y-%m')
ORDER BY month;

-- COMMENT 테이블 별도 쿼리 후 병합
SELECT
  DATE_FORMAT(REG_DATE, '%Y-%m') AS month,
  COUNT(*) AS comment_count
FROM COMMENT
WHERE U_ID = ?
  AND REG_DATE >= '2025-01-01'
  AND REG_DATE < '2026-01-01'
GROUP BY DATE_FORMAT(REG_DATE, '%Y-%m')
ORDER BY month;
```

---

## 4. 서비스 레이어

### 4.1 InsightService

```typescript
// src/services/InsightService.ts

interface InsightSummary {
  user: UserInfo;
  metrics: Metrics;
  trend: TrendPoint[];
}

interface UserInfo {
  id: string;
  name: string;
  registeredAt: Date;
  dDay: number;
}

interface Metrics {
  posts: MetricItem;
  comments: MetricItem;
  likes: MetricItem;
  points: MetricItem;
}

interface MetricItem {
  count: number;
  label: string;
}

interface TrendPoint {
  month: string;
  posts: number;
  comments: number;
}

class InsightService {
  async getSummary(userId: string): Promise<InsightSummary> {
    // 1. 사용자 검증
    const user = await this.getUserInfo(userId);
    if (!user) throw new ForbiddenError('의사 회원만 이용 가능');

    // 2. 병렬 쿼리 실행
    const [posts, comments, likes, points, trend] = await Promise.all([
      this.getPostCount(userId),
      this.getCommentCount(userId),
      this.getLikeCount(userId),
      this.getPointSum(userId),
      this.getMonthlyTrend(userId),
    ]);

    // 3. 응답 조립
    return {
      user,
      metrics: {
        posts: { count: posts, label: '작성 글' },
        comments: { count: comments, label: '댓글' },
        likes: { count: likes, label: '받은 추천' },
        points: { count: points, label: '포인트' },
      },
      trend,
    };
  }
}
```

---

## 5. 프론트엔드 구조

### 5.1 폴더 구조

```
src/
├── features/
│   └── dr-insight/
│       ├── index.ts                 # 모듈 진입점
│       ├── types.ts                 # 타입 정의
│       ├── api.ts                   # API 호출
│       ├── hooks/
│       │   └── useInsightData.ts    # 데이터 fetching hook
│       ├── components/
│       │   ├── DrInsightPage.tsx    # 메인 페이지
│       │   ├── Header.tsx
│       │   ├── HeroSection.tsx
│       │   ├── MetricCard.tsx
│       │   ├── TrendChart.tsx
│       │   └── ShareCard.tsx
│       └── utils/
│           └── shareImage.ts        # 이미지 생성 유틸
│
tests/
└── features/
    └── dr-insight/
        ├── InsightService.test.ts
        ├── useInsightData.test.ts
        └── MetricCard.test.tsx
```

### 5.2 주요 컴포넌트

```typescript
// src/features/dr-insight/components/DrInsightPage.tsx

import { useInsightData } from '../hooks/useInsightData';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { MetricCard } from './MetricCard';
import { TrendChart } from './TrendChart';
import { ShareCard } from './ShareCard';

export const DrInsightPage: React.FC = () => {
  const { data, isLoading, error } = useInsightData();

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorView error={error} />;
  if (!data) return <EmptyState />;

  return (
    <div className="dr-insight-page">
      <Header user={data.user} />
      <HeroSection dDay={data.user.dDay} />
      <MetricsSection metrics={data.metrics} />
      <TrendChart data={data.trend} />
      <ShareCard data={data} />
    </div>
  );
};
```

---

## 6. 성능 최적화

### 6.1 쿼리 최적화

| 테이블 | 예상 행 수 | 최적화 방안 |
|-------|-----------|------------|
| `USERS` | 20만 | PK 조회, 성능 이슈 없음 |
| `BOARD_MUZZIMA` | 337만 | `U_ID + REG_DATE` 복합 인덱스 |
| `COMMENT` | 1,826만 | **필수**: `U_ID + REG_DATE` 인덱스 |
| `POINT_GRANT` | 64만 | `U_ID + REG_DATE` 인덱스 |

### 6.2 캐싱 전략

```
Cache Key: insight:2025:{userId}
TTL: 1 hour (데이터 갱신 주기)
Invalidation: 사용자 활동 시 캐시 삭제
```

---

## 7. 테스트 계획

### 7.1 단위 테스트

| 대상 | 테스트 케이스 |
|-----|-------------|
| `InsightService` | 정상 조회, 비의사 회원 거부, 데이터 없음 처리 |
| `useInsightData` | 로딩 상태, 에러 상태, 성공 상태 |
| `MetricCard` | 숫자 포맷팅, 0 표시, 큰 숫자 처리 |
| `TrendChart` | 데이터 바인딩, 월별/주별 전환 |

### 7.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|----------|
| 의사 회원 접속 | 정상 데이터 렌더링 |
| 비의사 회원 접속 | 403 에러 처리 |
| 비로그인 접속 | 401 에러 → 로그인 페이지 |
| 데이터 없는 신규 회원 | 빈 상태 UI |

### 7.3 성능 테스트

| 지표 | 목표 |
|-----|------|
| API 응답 시간 | < 500ms |
| 페이지 렌더링 | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |

---

## 8. 보안 고려사항

### 8.1 인증/인가
- JWT 토큰 검증 필수
- `U_KIND = 'DOC001'` 검증

### 8.2 데이터 보호
- 본인 데이터만 조회 가능 (`U_ID` 일치 확인)
- SQL Injection 방지 (Prepared Statement)

### 8.3 DB 접근 정책
- **SELECT만 허용** (DB_ACCESS_POLICY.md 준수)
- 쓰기 작업 없음

---

**END OF SDD.md**
