# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 |
|-------------------|----------|------|
| Doc-Sync 로그 출력 | 콘솔 로그 형태로 작업 진행 상황 출력 | Sub-agent |
| 4개 이상 쿼리 실행 성공 | Dashboard Summary, Monthly Trends, User Distribution, Code Master 조회 | Sub-agent |
| Query Library에서 active_users.sql 템플릿 로드 | 기존 템플릿 활용하여 사용자 통계 쿼리 작성 | Sub-agent |
| Phase B 설계 문서 4종 생성 | IA, Wireframe, SDD, HANDOFF 문서 (이미 완성됨) | 완료 |

## Mode
**Analysis** (데이터 분석 중심)

## Required Outputs

### 1. React Dashboard 컴포넌트
```jsx
// UserDashboard.jsx
// - KPI Cards (총 4개)
// - Line Chart (월별 추이)  
// - Pie Chart (유형별 분포)
// - Data Table (상세 현황)
```

### 2. API 엔드포인트 (3개)
- `GET /api/v1/admin/users/dashboard/summary`
- `GET /api/v1/admin/users/dashboard/trends`  
- `GET /api/v1/admin/users/dashboard/distribution`

### 3. SQL 쿼리 라이브러리
```sql
-- user_dashboard_summary.sql
-- user_monthly_trends.sql  
-- user_type_distribution.sql
-- code_master_lookup.sql
```

### 4. Doc-Sync 로그
작업 진행 상황을 실시간으로 콘솔에 출력:
```
[Doc-Sync] Dashboard component created
[Doc-Sync] API endpoints implemented  
[Doc-Sync] SQL queries validated
[Doc-Sync] Integration testing passed
```

## Input Documents
- IA.md - 정보 구조 및 탐색 흐름
- Wireframe.md - 컴포넌트 배치 및 데이터 매핑  
- SDD.md - API 설계 및 레거시 스키마 매핑
- DOMAIN_SCHEMA.md - 실제 테이블 구조 (필수 참조)

## Completion Criteria

### 기능적 요구사항
- [ ] 전체 사용자 수 정확히 표시 (203,914명)
- [ ] 월별 신규 가입자 추이 차트 정상 렌더링
- [ ] 유형별 분포 파이차트에서 UKD001 63% 비중 확인
- [ ] 데이터 테이블에서 CODE_MASTER 조인 결과 정상 표시

### 기술적 요구사항  
- [ ] 모든 SQL에서 DOMAIN_SCHEMA.md의 실제 컬럼명 사용
- [ ] U_KIND, U_ALIVE, U_REG_DATE 등 정확한 컬럼명 준수
- [ ] API 응답시간 2초 이내 달성
- [ ] React 컴포넌트 에러 없이 마운트

### 품질 요구사항
- [ ] PRD 산출물 체크리스트 모든 항목 완성
- [ ] Doc-Sync 로그 최소 4회 이상 출력  
- [ ] 활성 사용자 0명 이슈에 대한 경고 메시지 포함

## Constraints

### 데이터 제약사항
- **SELECT Only**: DML 쿼리 실행 절대 금지
- **테이블 제한**: USERS, CODE_MASTER 테이블만 사용
- **민감정보 금지**: U_EMAIL, U_NAME 등 개인정보 노출 금지

### 성능 제약사항  
- USERS 테이블 Full Scan 지양 (20만 행)
- 가능한 경우 INDEX 활용 (U_REG_DATE, U_KIND)
- 복잡한 JOIN 자제

### 보안 제약사항
- 관리자 권한으로만 접근 가능한 API
- 개인 식별 가능 정보 응답에서 제외
- SQL Injection 방지 처리 필수

## 특별 지시사항

⚠️ **Critical**: 활성 사용자 정의 기준 불명확
- `U_ALIVE = 'Y'` 조건 시 결과 0건
- 임시방안으로 전체 사용자 수를 표시
- UI에 "활성 사용자 정의 기준 검토 필요" 경고 메시지 표시

⚠️ **Data Quality Issue**: 
- PRD에서 요구한 "활성 사용자 통계"와 실제 데이터 간 불일치
- 비즈니스팀과 활성 사용자 정의 기준 재협의 필요
- 현재는 전체 사용자 통계로 대체하여 구현

## 작업 순서
1. DOMAIN_SCHEMA.md에서 USERS, CODE_MASTER 테이블 구조 확인
2. SQL 쿼리 작성 및 테스트  
3. API 엔드포인트 구현
4. React 컴포넌트 개발
5. 통합 테스트 및 Doc-Sync 로그 출력
6. 활성 사용자 이슈 경고 메시지 추가