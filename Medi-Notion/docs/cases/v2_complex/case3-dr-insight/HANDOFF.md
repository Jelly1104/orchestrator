# HANDOFF.md - Sub-agent 작업 지시서

> **Case**: #3 Dr. Insight (2025 의사 활동 결산)
> **Handoff ID**: case-3-dr-insight-20251217
> **작성자**: Leader Agent (Claude Code)
> **작성일**: 2025-12-17
> **수신자**: Sub-agent (Cline)

---

## Mode

**Coding Mode**

---

## 1. 작업 개요

**Dr. Insight** - 의사 회원에게 2025년 연간 활동 결산 리포트를 제공하는 기능 구현

### 1.1 핵심 기능
1. 사용자 인증 및 권한 확인 (의사 회원만)
2. 연간 활동 지표 조회 (게시글, 댓글, 추천, 포인트)
3. 월별 활동 추이 차트
4. SNS 공유용 이미지 생성

---

## 2. Input 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| **IA.md** | `docs/case-3-dr-insight/IA.md` | 정보 구조 (라우팅, 페이지 계층) |
| **Wireframe.md** | `docs/case-3-dr-insight/Wireframe.md` | 화면 설계 (컴포넌트 배치, 데이터 매핑) |
| **SDD.md** | `docs/case-3-dr-insight/SDD.md` | 시스템 설계 (API, 데이터 흐름) |

---

## 3. Output 기대

### 3.1 생성할 파일

```
src/
├── features/
│   └── dr-insight/
│       ├── index.ts                 # 모듈 진입점
│       ├── types.ts                 # 타입 정의
│       ├── api.ts                   # API 호출 함수
│       ├── hooks/
│       │   └── useInsightData.ts    # 데이터 fetching hook
│       ├── components/
│       │   ├── DrInsightPage.tsx    # 메인 페이지
│       │   ├── Header.tsx           # 헤더 컴포넌트
│       │   ├── HeroSection.tsx      # 히어로 섹션
│       │   ├── MetricCard.tsx       # 지표 카드
│       │   ├── TrendChart.tsx       # 추이 차트
│       │   └── ShareCard.tsx        # 공유 카드
│       └── utils/
│           └── shareImage.ts        # 이미지 생성 유틸
│
├── services/
│   └── InsightService.ts            # 서비스 레이어
│
tests/
└── features/
    └── dr-insight/
        ├── InsightService.test.ts   # 서비스 테스트
        ├── useInsightData.test.ts   # Hook 테스트
        └── MetricCard.test.tsx      # 컴포넌트 테스트
```

### 3.2 구현 우선순위

1. **P0 (필수)**
   - `types.ts` - 타입 정의
   - `InsightService.ts` - 서비스 레이어
   - `api.ts` - API 호출
   - `useInsightData.ts` - 데이터 fetching hook
   - `DrInsightPage.tsx` - 메인 페이지
   - `MetricCard.tsx` - 지표 카드

2. **P1 (중요)**
   - `Header.tsx`
   - `HeroSection.tsx`
   - `TrendChart.tsx`
   - 모든 테스트 파일

3. **P2 (선택)**
   - `ShareCard.tsx`
   - `shareImage.ts`

---

## 4. 제약사항 (MUST)

### 4.1 DOMAIN_SCHEMA.md 컬럼명 준수

```sql
-- 정확한 컬럼명 사용 (추측 금지)
USERS: U_ID, U_NAME, U_REG_DATE, U_KIND, U_ALIVE
BOARD_MUZZIMA: BOARD_IDX, U_ID, AGREE_CNT, REG_DATE, DEL_FLAG
COMMENT: COMMENT_IDX, U_ID, REG_DATE
POINT_GRANT: U_ID, POINT, REG_DATE
```

### 4.2 서버 데이터 정책

```
✅ SELECT만 허용 (readonly 계정)
🔴 INSERT/UPDATE/DELETE 금지
```

### 4.3 PROJECT_STACK.md 기술 스택 준수

- TypeScript strict mode
- React 18+
- 차트 라이브러리: Recharts 또는 Chart.js

### 4.4 코딩 스타일 (CODE_STYLE.md)

- 함수 길이 ≤ 30줄
- 명시적 타입 정의 (any 금지)
- 에러 핸들링 필수

---

## 5. TDD 요구사항

### 5.1 필수 테스트 케이스

**InsightService.test.ts**
```typescript
describe('InsightService', () => {
  it('should return summary for valid doctor user');
  it('should throw ForbiddenError for non-doctor user');
  it('should handle user with no activity data');
  it('should calculate D-Day correctly');
});
```

**useInsightData.test.ts**
```typescript
describe('useInsightData', () => {
  it('should return loading state initially');
  it('should return data on successful fetch');
  it('should return error on failed fetch');
});
```

**MetricCard.test.tsx**
```typescript
describe('MetricCard', () => {
  it('should render metric value and label');
  it('should format large numbers with comma');
  it('should display 0 for zero value');
});
```

### 5.2 테스트 커버리지 목표

- 서비스 레이어: ≥ 90%
- 컴포넌트: ≥ 80%
- 전체: ≥ 85%

---

## 6. 엣지 케이스 처리

| 케이스 | 예상 동작 |
|--------|----------|
| 신규 가입 (D-Day < 7) | "가입을 환영합니다!" 메시지 |
| 데이터 없는 유저 | "아직 활동 내역이 없습니다" 화면 |
| 탈퇴 회원 접근 | 401 + 로그인 페이지 리다이렉트 |
| 비의사 회원 접근 | 403 + "의사 회원 전용" 안내 |
| 데이터 로딩 실패 | Skeleton → Error 화면 |
| 작성 글 0건 | 해당 카드에 "0건" 표시 |

---

## 7. MCP Server 연동

### 7.1 작업 시작 시

```bash
# REST API로 시작 알림
curl -X POST http://localhost:3002/api/handoff/start \
  -H "Content-Type: application/json" \
  -d '{"id":"case-3-dr-insight-20251217", "totalFiles":12}'
```

### 7.2 파일 생성 시마다

```bash
# 진행상황 업데이트
curl -X PATCH http://localhost:3002/api/handoff/progress \
  -H "Content-Type: application/json" \
  -d '{"completedFiles":N, "currentTask":"파일명"}'
```

### 7.3 작업 완료 시

```bash
# 완료 알림
curl -X POST http://localhost:3002/api/handoff/complete \
  -H "Content-Type: application/json" \
  -d '{"success":true, "files":[...]}'
```

---

## 8. 체크리스트

### 작업 전
- [ ] IA.md, Wireframe.md, SDD.md 확인
- [ ] DOMAIN_SCHEMA.md 컬럼명 확인
- [ ] MCP Server 연결 확인

### 작업 중
- [ ] 타입 정의 먼저 작성
- [ ] TDD 방식 (테스트 → 구현)
- [ ] 파일 생성 시마다 MCP 진행상황 업데이트

### 작업 후
- [ ] 모든 테스트 PASS
- [ ] 린트 0 errors
- [ ] 타입체크 PASS
- [ ] MCP 완료 알림 전송
- [ ] 완료 보고서 작성

---

## 9. 완료 보고 형식

```markdown
## Cline 작업 완료 보고

### 생성된 파일
- src/features/dr-insight/index.ts
- src/features/dr-insight/types.ts
- ...

### 실행 결과
- 테스트: PASS (X개 중 X개)
- 린트: 0 errors
- 타입체크: PASS

### 이슈/질문
- [있으면 기재, 없으면 "없음"]

### 정책 준수 여부
- .clinerules 위반: 없음
```

---

**END OF HANDOFF.md**

---

**Leader Agent 서명**: Claude Code
**Handoff 시간**: 2025-12-17T10:00:00+09:00
