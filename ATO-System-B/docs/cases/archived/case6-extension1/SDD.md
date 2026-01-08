# SDD.md: 오케스트레이터 통합 검증 대시보드 설계 문서

> **생성일**: 2025-12-24
> **Case ID**: case7-extension1
> **PRD 버전**: 1.0.0
> **IA 버전**: 1.0.0
> **생성자**: Claude Code (Extension Mode)
> **파이프라인**: DOCUMENT_PIPELINE.md 준수

---

## 1. 아키텍처 개요

### 1.1 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client (React + TypeScript)                       │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │AnalyticsDash  │ │ SegmentChart  │ │LoginTrendChart│ │  FilterPanel  │   │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘   │
│          └─────────────────┴─────────────────┴─────────────────┘           │
│                                      │                                      │
│                              [React Query / SWR]                            │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ HTTP/REST
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                           API Layer (Express + TypeScript)                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                     │
│  │  Controller   │ │    Service    │ │  Repository   │                     │
│  │ (Validation)  │→│(Business Logic│→│ (Query Build) │                     │
│  └───────────────┘ └───────────────┘ └───────┬───────┘                     │
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │ MySQL Connection Pool
┌──────────────────────────────────────────────┼──────────────────────────────┐
│                           Database (MySQL - Legacy)                         │
│  ┌─────────┐ ┌─────────────┐ ┌───────────┐ ┌───────────────┐               │
│  │  USERS  │ │ USER_DETAIL │ │USER_LOGIN │ │  CODE_MASTER  │               │
│  │ (500K)  │ │   (500K)    │ │  (10M+)   │ │   (Lookup)    │               │
│  └─────────┘ └─────────────┘ └───────────┘ └───────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 기술 스택

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + TypeScript | 18.x |
| State | React Query (TanStack) | 5.x |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| Backend | Express + TypeScript | 4.x |
| ORM/Query | Knex.js (Query Builder) | 3.x |
| Database | MySQL | 8.x |
| Testing | Vitest (Frontend), Jest (Backend) | Latest |

---

## 2. 레거시 스키마 매핑 (DOMAIN_SCHEMA.md 준수)

### 2.1 사용 테이블

| 개념 | 물리 테이블 | 주요 컬럼 | 제약사항 |
|------|-------------|-----------|----------|
| 회원 기본 | `USERS` | U_ID (PK), U_KIND, U_ALIVE, U_REG_DATE | - |
| 회원 상세 | `USER_DETAIL` | U_ID (FK), U_MAJOR_CODE_1, U_WORK_TYPE_1 | USERS와 1:1 |
| 로그인 이력 | `USER_LOGIN` | U_ID, LOGIN_DATE, LOGIN_IP | ⚠️ 10M+ rows, LIMIT 필수 |
| 코드 마스터 | `CODE_MASTER` | CODE_TYPE, CODE_VALUE, CODE_NAME | 조회용 |

### 2.2 컬럼 매핑 상세

#### USERS 테이블
```sql
-- 실제 스키마 (DOMAIN_SCHEMA.md 4.1 참조)
U_ID            VARCHAR(14) PRIMARY KEY  -- 회원 ID
U_KIND          CHAR(6)                   -- 회원 유형 (DOC001, PHA001 등)
U_ALIVE         CHAR(6) DEFAULT 'Y'       -- 활성 여부 ('Y'/'N')
U_REG_DATE      DATETIME                  -- 가입일

-- ⚠️ 주의: U_KIND, U_ALIVE는 CHAR(6), VARCHAR 아님
```

#### USER_DETAIL 테이블
```sql
-- 실제 스키마 (DOMAIN_SCHEMA.md 4.2 참조)
U_ID            VARCHAR(14) PRIMARY KEY  -- USERS.U_ID FK
U_MAJOR_CODE_1  CHAR(6)                   -- 전문과목 (IM, GS, PSY 등)
U_WORK_TYPE_1   CHAR(6)                   -- 근무형태 (OWN, EMP, RES 등)

-- ⚠️ 주의: 컬럼명은 U_MAJOR_CODE_1 (NOT MAJOR_CODE)
```

#### USER_LOGIN 테이블
```sql
-- 실제 스키마 (DOMAIN_SCHEMA.md 2 참조)
U_ID            VARCHAR(14)               -- 회원 ID
LOGIN_DATE      DATETIME                  -- 로그인 일시
LOGIN_IP        VARCHAR(45)               -- 로그인 IP

-- ⚠️ 대용량 테이블 (2,267만 행)
-- 인덱스: (U_ID, LOGIN_DATE)
-- 제약: LIMIT 10,000, 타임아웃 30초
```

### 2.3 테이블 JOIN 패턴

```sql
-- ✅ 허용: 회원 + 상세 정보 (DOMAIN_SCHEMA.md 6.2 준수)
SELECT u.U_ID, u.U_KIND, d.U_MAJOR_CODE_1
FROM USERS u
LEFT JOIN USER_DETAIL d ON u.U_ID = d.U_ID
WHERE u.U_ALIVE = 'Y';

-- ⚠️ 주의: USER_LOGIN JOIN 시 반드시 LIMIT 필요
SELECT u.U_ID, u.U_KIND, COUNT(l.LOGIN_DATE) as login_count
FROM USERS u
LEFT JOIN USER_LOGIN l ON u.U_ID = l.U_ID
    AND l.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.U_ID, u.U_KIND
LIMIT 10000;

-- ❌ 금지: 3개 이상 테이블 무분별 JOIN (보안 정책)
-- USERS + USER_DETAIL + USER_LOGIN + ... (Leader 승인 필요)
```

---

## 3. API 설계

### 3.1 엔드포인트 목록

| Method | Endpoint | Description | 제약 |
|--------|----------|-------------|------|
| GET | `/api/analytics/summary` | KPI 요약 | - |
| GET | `/api/analytics/segments` | 세그먼트 목록 | Pagination |
| GET | `/api/analytics/segments/:id` | 세그먼트 상세 | - |
| GET | `/api/analytics/distribution` | 전문과목 분포 | - |
| GET | `/api/analytics/login-patterns` | 로그인 패턴 | LIMIT 10000 |
| GET | `/api/analytics/login-trend` | 로그인 트렌드 | 최근 30일 |

### 3.2 상세 스펙

#### GET /api/analytics/summary

```typescript
// Request
GET /api/analytics/summary?dateFrom=2025-01-01&dateTo=2025-12-24

// Response
{
  "activeUserCount": 152340,
  "todayLoginCount": 8421,
  "topMajorCodes": ["IM", "GS", "PSY"],
  "segmentCount": 6,
  "dataAsOf": "2025-12-24T09:00:00+09:00"
}
```

#### GET /api/analytics/segments

```typescript
// Request
GET /api/analytics/segments?kind=DOC001&major=IM&page=1&pageSize=10

// Query Parameters
interface SegmentQueryDto {
  kind?: string;          // U_KIND 필터
  major?: string;         // U_MAJOR_CODE_1 필터
  page?: number;          // 페이지 (default: 1)
  pageSize?: number;      // 페이지당 건수 (default: 10, max: 50)
  sortBy?: string;        // 정렬 컬럼
  sortOrder?: 'asc' | 'desc';
}

// Response
interface SegmentListResponse {
  data: {
    segmentId: string;      // U_KIND
    segmentName: string;    // CODE_MASTER.CODE_NAME
    memberCount: number;    // 회원 수
    activeRate: number;     // 활성률 (%)
    lastLoginAt: string;    // 최근 로그인
  }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /api/analytics/login-patterns

```typescript
// Request
GET /api/analytics/login-patterns?period=30d&limit=10000

// Response
interface LoginPatternResponse {
  heatmap: {
    hour: number;       // 0-23
    dayOfWeek: number;  // 0-6 (일-토)
    count: number;
  }[];
  peak: {
    hour: number;
    dayOfWeek: number;
    avgDaily: number;
  };
  constraint: {
    appliedLimit: number;   // 10000
    actualRows: number;     // 실제 조회 행 수
    truncated: boolean;     // LIMIT으로 잘렸는지
  };
}

// ⚠️ 제약사항 (DB_ACCESS_POLICY.md)
// - LIMIT: 10,000행
// - 타임아웃: 30초
// - 권장 기간: 최근 3개월
```

---

## 4. 데이터 모델

### 4.1 DTO (Data Transfer Objects)

```typescript
// backend/src/features/analytics/dto/segment-query.dto.ts

export interface SegmentQueryDto {
  kind?: string;
  major?: string;
  workType?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
  sortBy?: 'memberCount' | 'activeRate' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SegmentResponseDto {
  segmentId: string;
  segmentName: string;
  memberCount: number;
  activeCount: number;
  activeRate: number;
  lastLoginAt: string | null;
}
```

### 4.2 Entity Mapping

```typescript
// 레거시 컬럼 → 도메인 모델 변환

interface LegacyUserRow {
  U_ID: string;
  U_KIND: string;         // CHAR(6)
  U_ALIVE: string;        // CHAR(6), 'Y' or 'N'
  U_REG_DATE: Date;
}

interface LegacyUserDetailRow {
  U_ID: string;
  U_MAJOR_CODE_1: string; // CHAR(6)
  U_WORK_TYPE_1: string;  // CHAR(6)
}

// 변환 함수
function toSegmentDto(row: LegacyUserRow, code: CodeMasterRow): SegmentResponseDto {
  return {
    segmentId: row.U_KIND.trim(),           // CHAR 공백 제거
    segmentName: code.CODE_NAME,
    memberCount: 0,  // aggregate 별도
    activeCount: 0,
    activeRate: 0,
    lastLoginAt: null,
  };
}
```

---

## 5. 쿼리 설계

### 5.1 세그먼트 조회 쿼리

```sql
-- A1: 활성 회원 세그먼트 조회 (DOMAIN_SCHEMA 5.3 패턴 적용)
SELECT
  u.U_KIND as segment_id,
  cm.CODE_NAME as segment_name,
  COUNT(*) as member_count,
  SUM(CASE WHEN u.U_ALIVE = 'Y' THEN 1 ELSE 0 END) as active_count,
  ROUND(SUM(CASE WHEN u.U_ALIVE = 'Y' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as active_rate,
  MAX(ul.LOGIN_DATE) as last_login_at
FROM USERS u
LEFT JOIN CODE_MASTER cm
  ON cm.CODE_TYPE = 'U_KIND' AND cm.CODE_VALUE = u.U_KIND
LEFT JOIN (
  SELECT U_ID, MAX(LOGIN_DATE) as LOGIN_DATE
  FROM USER_LOGIN
  WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY U_ID
) ul ON u.U_ID = ul.U_ID
GROUP BY u.U_KIND, cm.CODE_NAME
ORDER BY member_count DESC;
```

### 5.2 전문과목 분포 쿼리

```sql
-- A2: 전문과목별 분포 분석
SELECT
  d.U_MAJOR_CODE_1 as major_code,
  cm.CODE_NAME as major_name,
  COUNT(*) as total_count,
  SUM(CASE WHEN u.U_ALIVE = 'Y' THEN 1 ELSE 0 END) as active_count,
  ROUND(COUNT(*) / (SELECT COUNT(*) FROM USERS) * 100, 2) as percentage
FROM USERS u
INNER JOIN USER_DETAIL d ON u.U_ID = d.U_ID
LEFT JOIN CODE_MASTER cm
  ON cm.CODE_TYPE = 'MAJOR' AND cm.CODE_VALUE = d.U_MAJOR_CODE_1
WHERE d.U_MAJOR_CODE_1 IS NOT NULL
GROUP BY d.U_MAJOR_CODE_1, cm.CODE_NAME
ORDER BY total_count DESC
LIMIT 20;
```

### 5.3 로그인 패턴 쿼리

```sql
-- A3: 로그인 패턴 분석 (⚠️ LIMIT 필수)
SELECT
  HOUR(LOGIN_DATE) as hour,
  DAYOFWEEK(LOGIN_DATE) as day_of_week,
  COUNT(*) as login_count
FROM USER_LOGIN
WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY HOUR(LOGIN_DATE), DAYOFWEEK(LOGIN_DATE)
ORDER BY day_of_week, hour
LIMIT 10000;

-- ⚠️ 타임아웃 방지: 인덱스 (U_ID, LOGIN_DATE) 활용
-- ⚠️ DB_ACCESS_POLICY: 10,000행, 30초 제한
```

---

## 6. Frontend 컴포넌트 설계

### 6.1 디렉토리 구조 (FSD 패턴)

```
frontend/src/
├── features/
│   └── analytics/
│       ├── api/
│       │   └── analyticsApi.ts         # API 호출
│       ├── components/
│       │   ├── AnalyticsDashboard.tsx  # 메인 대시보드
│       │   ├── KpiCard.tsx             # KPI 카드
│       │   ├── SegmentChart.tsx        # 세그먼트 차트
│       │   ├── DistributionChart.tsx   # 분포 차트
│       │   ├── LoginTrendChart.tsx     # 로그인 트렌드
│       │   ├── LoginHeatmap.tsx        # 히트맵
│       │   ├── FilterPanel.tsx         # 필터 패널
│       │   └── SegmentTable.tsx        # 데이터 테이블
│       ├── hooks/
│       │   ├── useAnalytics.ts         # 데이터 페칭 훅
│       │   └── useFilters.ts           # 필터 상태 훅
│       ├── types/
│       │   └── analytics.types.ts      # TypeScript 타입
│       └── tests/
│           ├── AnalyticsDashboard.test.tsx
│           └── useAnalytics.test.ts
├── shared/
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Dropdown.tsx
│   │   └── DataTable.tsx
│   └── lib/
│       └── formatters.ts
└── app/
    └── routes/
        └── analytics.tsx
```

### 6.2 주요 컴포넌트

```typescript
// AnalyticsDashboard.tsx
interface AnalyticsDashboardProps {
  initialFilters?: FilterState;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  initialFilters
}) => {
  const { filters, setFilters } = useFilters(initialFilters);
  const { data, isLoading, error } = useAnalytics(filters);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <KpiCard label="총 활성회원" value={data.activeUserCount} />
      <KpiCard label="금일 로그인" value={data.todayLoginCount} />
      {/* ... */}
    </div>
  );
};
```

---

## 7. Backend 컴포넌트 설계

### 7.1 디렉토리 구조

```
backend/src/
├── features/
│   └── analytics/
│       ├── analytics.controller.ts   # 라우터 & 검증
│       ├── analytics.service.ts      # 비즈니스 로직
│       ├── analytics.repository.ts   # DB 쿼리
│       ├── dto/
│       │   ├── segment-query.dto.ts
│       │   └── analytics-response.dto.ts
│       └── tests/
│           ├── analytics.controller.test.ts
│           ├── analytics.service.test.ts
│           └── analytics.repository.test.ts
├── shared/
│   ├── database/
│   │   └── connection.ts
│   └── middleware/
│       ├── validation.ts
│       └── errorHandler.ts
└── config/
    └── database.ts
```

### 7.2 Repository 패턴

```typescript
// analytics.repository.ts

import { db } from '@/shared/database/connection';

export class AnalyticsRepository {
  /**
   * 세그먼트 목록 조회
   * @see DOMAIN_SCHEMA.md 4.1, 4.2
   */
  async getSegments(query: SegmentQueryDto): Promise<SegmentRow[]> {
    const qb = db('USERS as u')
      .select(
        'u.U_KIND as segment_id',
        db.raw('COUNT(*) as member_count'),
        db.raw("SUM(CASE WHEN u.U_ALIVE = 'Y' THEN 1 ELSE 0 END) as active_count")
      )
      .leftJoin('CODE_MASTER as cm', function() {
        this.on('cm.CODE_TYPE', '=', db.raw("'U_KIND'"))
            .andOn('cm.CODE_VALUE', '=', 'u.U_KIND');
      })
      .groupBy('u.U_KIND', 'cm.CODE_NAME');

    // 필터 적용
    if (query.kind) {
      qb.where('u.U_KIND', query.kind);
    }

    // 페이지네이션
    qb.limit(query.pageSize).offset((query.page - 1) * query.pageSize);

    return qb;
  }

  /**
   * 로그인 패턴 조회
   * ⚠️ DB_ACCESS_POLICY: LIMIT 10,000, 타임아웃 30초
   */
  async getLoginPatterns(period: number = 30): Promise<LoginPatternRow[]> {
    return db('USER_LOGIN')
      .select(
        db.raw('HOUR(LOGIN_DATE) as hour'),
        db.raw('DAYOFWEEK(LOGIN_DATE) as day_of_week'),
        db.raw('COUNT(*) as login_count')
      )
      .whereRaw('LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL ? DAY)', [period])
      .groupByRaw('HOUR(LOGIN_DATE), DAYOFWEEK(LOGIN_DATE)')
      .orderBy('day_of_week')
      .orderBy('hour')
      .limit(10000)  // ⚠️ 필수: DB_ACCESS_POLICY
      .timeout(30000); // ⚠️ 필수: 30초 타임아웃
  }
}
```

---

## 8. 보안 고려사항

### 8.1 DB 접근 제어 (DB_ACCESS_POLICY.md 준수)

| 규칙 | 적용 |
|------|------|
| SELECT only | ✅ 모든 쿼리 SELECT만 사용 |
| LIMIT 필수 (대용량) | ✅ USER_LOGIN 조회 시 LIMIT 10,000 |
| 타임아웃 | ✅ 30초 타임아웃 설정 |
| 인덱스 활용 | ✅ (U_ID, LOGIN_DATE) 인덱스 사용 |

### 8.2 입력 검증

```typescript
// validation.ts
export const segmentQuerySchema = z.object({
  kind: z.string().max(6).optional(),      // CHAR(6)
  major: z.string().max(6).optional(),     // CHAR(6)
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(10),
});
```

### 8.3 민감 데이터 처리

```typescript
// PII 컬럼은 조회하지 않음 (DOMAIN_SCHEMA.md 6.1)
// ❌ U_EMAIL, U_NAME (개인정보)
// ✅ U_ID, U_KIND (식별/분류 정보만)
```

---

## 9. 테스트 전략

### 9.1 단위 테스트 (목표: 90%)

```typescript
// analytics.service.test.ts
describe('AnalyticsService', () => {
  it('should return segment list with correct aggregation', async () => {
    // Given
    const mockData = [
      { segment_id: 'DOC001', member_count: 100, active_count: 90 }
    ];
    mockRepository.getSegments.mockResolvedValue(mockData);

    // When
    const result = await service.getSegments({ page: 1, pageSize: 10 });

    // Then
    expect(result.data[0].activeRate).toBe(90);
  });

  it('should apply LIMIT for login patterns (DB_ACCESS_POLICY)', async () => {
    // Given & When
    await service.getLoginPatterns(30);

    // Then
    expect(mockRepository.getLoginPatterns).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10000 })
    );
  });
});
```

### 9.2 통합 테스트

```typescript
// analytics.integration.test.ts
describe('GET /api/analytics/segments', () => {
  it('should return paginated segment list', async () => {
    const response = await request(app)
      .get('/api/analytics/segments')
      .query({ page: 1, pageSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(6);
    expect(response.body.pagination.total).toBeGreaterThan(0);
  });
});
```

---

## 10. 산출물 체크리스트

### Phase B 산출물

| 산출물 | 상태 | 검증 기준 |
|--------|------|-----------|
| IA.md | ✅ | 라우팅, 페이지 계층 정의 |
| Wireframe.md | ✅ | Desktop/Mobile 레이아웃 |
| SDD.md | ✅ | 레거시 매핑, API 설계 |

### Phase C 예상 산출물

| 경로 | 타입 | 상태 |
|------|------|------|
| `backend/src/features/analytics/*.ts` | CODE | 대기 |
| `frontend/src/features/analytics/*.tsx` | CODE | 대기 |
| `*/tests/*.test.ts` | TEST | 대기 |

---

## 11. 관련 문서

| 문서 | 역할 |
|------|------|
| `DOMAIN_SCHEMA.md` | 레거시 스키마 정의 (필수 참조) |
| `DB_ACCESS_POLICY.md` | DB 접근 권한 및 제한 |
| `CODE_STYLE.md` | 코딩 컨벤션 |
| `TDD_WORKFLOW.md` | 테스트 작성 절차 |
| `AGENT_ARCHITECTURE.md` | 파이프라인 및 HITL |

---

**END OF SDD.md**

*설계 문서는 구현의 예언서입니다. DOMAIN_SCHEMA.md를 준수하지 않은 코드는 동작해도 올바르지 않습니다.*
