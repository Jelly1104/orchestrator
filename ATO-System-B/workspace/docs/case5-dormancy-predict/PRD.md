# [Case #5] 휴면 예정 회원 예측 및 분석 (Quantitative Analysis)

## 1. 목적 (Objective)

- 최근 1년간 로그인 이력이 없는 '휴면 전환 임박' 의사 회원을 식별하여 마케팅 타겟 리스트를 추출함.
- **분석 목표:** 로그인 공백 기간별 회원 수 분포 파악 및 전문과목별 휴면 비율 분석.

## 2. PRD 유형 및 파이프라인

- **Type:** QUANTITATIVE (정량 분석)
- **Pipeline:** analysis

## 3. 데이터 요구사항 (Data Requirements) - 🚨 필수 매핑 정보 (DOMAIN_SCHEMA v1.1 기준)

AnalysisAgent는 아래 매핑 정보를 기반으로 SQL을 생성해야 합니다.

### 3.1 조회 대상 테이블 (Target Tables)

1. **USERS (회원 마스터)**
   - 역할: 회원 상태 확인
   - 필수 컬럼: `U_ID` (회원ID), `U_NAME` (이름), `U_STATUS` (상태)
   - 조건: `U_STATUS = 'ACTIVE'`
2. **USER_DETAIL (회원 상세)**
   - 역할: 전문과목 확인
   - 조인 키: `USERS.U_ID = USER_DETAIL.U_ID`
   - 필수 컬럼: `U_MAJOR_CODE_1` (전문과목 코드 - **주의: MAJOR_CODE 아님**)
3. **USER_LOGIN (로그인 이력)**
   - 역할: 마지막 로그인 시점 확인
   - 조인 키: `USERS.U_ID = USER_LOGIN.U_ID`
   - 필수 컬럼: `UL_LOG_DATE` (로그인 일시)
   - **전략:** 대용량 테이블이므로 반드시 `GROUP BY U_ID` 후 `MAX(UL_LOG_DATE)`를 사용해야 함.

### 3.2 분석 로직 (Analysis Logic)

- **휴면 임박 기준:** 최종 로그인 날짜가 현재(`NOW()`)로부터 **11개월 이전**인 회원.
- **필터링 조건:**
  ```sql
  WHERE last_login_date < DATE_SUB(NOW(), INTERVAL 11 MONTH)
  AND last_login_date > DATE_SUB(NOW(), INTERVAL 12 MONTH)
  ```

4. 성공 지표 및 산출물 (Success Metrics & Deliverables)
1. 성공 지표:
   ◦ 실행 가능한 SQL 쿼리 생성 (문법 오류 없음).
   ◦ 휴면 임박 회원 리스트 추출 (최소 1명 이상).
1. 산출물 체크리스트:
   ◦ [ ] query.sql: 추출 쿼리 파일 (LIMIT 1000 포함 필수).
   ◦ [ ] analysis_report.md: 전문과목(U_MAJOR_CODE_1)별 휴면 예정자 분포 테이블 포함.
