# SDD.md - 공지사항 목록 시스템 설계서

> **문서 버전**: 1.0.0  
> **최종 업데이트**: 2025-12-16  
> **기반 PRD**: `PRD.md`  
> **대상**: 개발팀, QA팀

---

## 🎯 시스템 개요

**목적**: 메디게이트 회원의 개인 프로필(전문과목, 근무형태, 경력)을 기반으로 관련성 높은 공지사항을 우선 노출하는 개인화 추천 시스템

**핵심 가치**: 
- 개인화된 공지사항 추천으로 사용자 참여도 향상
- 중요 공지사항의 전달률 극대화
- 사용자별 맞춤 컨텐츠 제공

---

## 🏗️ 시스템 아키텍처

### 전체 구조
```
[Frontend - React/TypeScript]
    ↓ HTTP API
[Backend - Node.js/Express] 
    ↓ MySQL Query
[Legacy DB - MySQL 8.x]
    └── BOARD_NOTICE (공지사항)
    └── USERS + USER_DETAIL (회원정보)
    └── CODE_MASTER (코드정보)
```

### 개인화 추천 로직
```
회원 프로필 분석 → 공지사항 매칭 → 점수 산출 → 우선순위 정렬
```

---

## 📊 데이터베이스 설계

### 사용 테이블 (DOMAIN_SCHEMA.md 준수)

#### BOARD_NOTICE (공지사항)
```sql
CREATE TABLE BOARD_NOTICE (
  BOARD_IDX       INT PRIMARY KEY AUTO_INCREMENT,
  CTG_CODE        CHAR(6),              -- 카테고리 (전체공지, 의사전용 등)
  TARGET_MAJOR    VARCHAR(100),         -- 대상 전문과목 (JSON: ["IM","GS"])
  TARGET_WORK     VARCHAR(100),         -- 대상 근무형태 (JSON: ["OWN","EMP"])
  TITLE           VARCHAR(200),
  CONTENT         MEDIUMTEXT,
  IMPORTANCE      TINYINT DEFAULT 1,    -- 중요도 (1~5)
  U_ID            VARCHAR(14),          -- 작성자
  REG_DATE        DATETIME,
  DISPLAY_FLAG    CHAR(1) DEFAULT 'Y',
  DEL_FLAG        CHAR(1) DEFAULT 'N',
  INDEX idx_display (DISPLAY_FLAG, DEL_FLAG, REG_DATE),
  INDEX idx_category (CTG_CODE, REG_DATE)
);
```

#### USERS + USER_DETAIL (회원정보)
- DOMAIN_SCHEMA.md의 기존 구조 활용
- `U_MAJOR_CODE_1`, `U_WORK_TYPE_1` 컬럼 사용

---

## 🔧 API 명세서

### 1. 공지사항 목록 조회
```
GET /api/notices

Query Parameters:
- page: number (기본값: 1)
- limit: number (기본값: 20, 최대: 100)
- category: string (선택적)

Response:
{
  "success": true,
  "data": {
    "notices": [
      {
        "BOARD_IDX": 1,
        "TITLE": "신규 서비스 오픈 안내",
        "CONTENT": "...",
        "IMPORTANCE": 3,
        "REG_DATE": "2025-12-16T10:00:00Z",
        "RELEVANCE_SCORE": 0.85,  // 개인화 점수
        "MATCH_REASONS": ["전문과목 일치", "근무형태 일치"]
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

### 2. 개인화 점수 산출 알고리즘
```javascript
function calculateRelevanceScore(notice, userProfile) {
  let score = 0.5; // 기본 점수
  
  // 전문과목 매칭 (가중치: 0.3)
  if (notice.TARGET_MAJOR.includes(userProfile.U_MAJOR_CODE_1)) {
    score += 0.3;
  }
  
  // 근무형태 매칭 (가중치: 0.2)  
  if (notice.TARGET_WORK.includes(userProfile.U_WORK_TYPE_1)) {
    score += 0.2;
  }
  
  // 중요도 반영 (가중치: 0.1 * importance)
  score += (notice.IMPORTANCE / 5) * 0.1;
  
  return Math.min(score, 1.0);
}
```

---

## 🎨 UI/UX 설계

### 컴포넌트 구조
```
<NoticeListPage>
  ├── <NoticeFilters>     // 카테고리 필터
  ├── <NoticeList>
  │   └── <NoticeCard>    // 개별 공지사항
  └── <Pagination>
```

### NoticeCard 레이아웃
```
┌─────────────────────────────────┐
│ [중요도★★★] 신규 서비스 오픈 안내    │
│ 추천 이유: 전문과목 일치 • 근무형태 일치 │
│ 2025.12.16 | 조회수 1,234        │
└─────────────────────────────────┘
```

---

## 🔒 보안 고려사항

### 1. SQL Injection 방지
```javascript
// ❌ 위험한 방식
const query = `SELECT * FROM BOARD_NOTICE WHERE TITLE LIKE '%${keyword}%'`;

// ✅ 안전한 방식 (Prepared Statement)
const query = 'SELECT * FROM BOARD_NOTICE WHERE TITLE LIKE ?';
const params = [`%${keyword}%`];
```

### 2. 개인정보 보호
- 사용자 프로필 정보는 추천 로직에만 사용
- API 응답에서 개인식별정보 제외
- 로그에서 민감정보 마스킹

### 3. 성능 최적화
- 대용량 테이블 조회 시 필수 인덱스 활용
- 페이징으로 한 번에 최대 100개만 조회
- 캐싱 적용 (Redis, 5분 TTL)

---

## 📈 성공 지표 정의

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **추천 정확도** | 개인화 점수 0.7 이상 비율 60% | 일일 배치 분석 |
| **API 응답시간** | 평균 200ms 이하 | APM 모니터링 |
| **사용자 참여도** | 공지사항 클릭률 15% 향상 | GA 이벤트 트래킹 |
| **시스템 안정성** | 99.9% 가용성 | 헬스체크 API |

---

## 🧪 테스트 전략

### Unit Test (90% 커버리지 목표)
- 개인화 점수 산출 로직
- API 라우터 함수
- 데이터 검증 로직

### Integration Test
- DB 연동 테스트
- API 엔드포인트 테스트
- 인증/권한 테스트

### E2E Test
- 공지사항 목록 조회 플로우
- 필터링 및 페이징 동작
- 반응형 UI 테스트

---

## 🚀 배포 계획

### Phase 1: 기본 구현 (1주차)
- [x] SDD 작성
- [ ] 기본 CRUD API 구현
- [ ] 단위 테스트 작성

### Phase 2: 개인화 추가 (2주차)  
- [ ] 추천 알고리즘 구현
- [ ] 프론트엔드 UI 구현
- [ ] 통합 테스트

### Phase 3: 최적화 (3주차)
- [ ] 성능 최적화
- [ ] 캐싱 적용  
- [ ] 모니터링 구축

---

**관련 문서**: `PRD.md` | `DOMAIN_SCHEMA.md` | `CODE_STYLE.md`