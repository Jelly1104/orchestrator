미래전략실 AI PM으로서 **Case #5: 휴면 예정 회원 예측**에 대한 PRD를 `PRD_GUIDE.md` 표준 템플릿에 맞춰 작성하였습니다.

이 PRD는 **정량적 분석(Quantitative)** 파이프라인을 따르며, 시스템의 **안정성(Read-Only)**과 **데이터 처리 능력**을 검증하는 데 초점을 맞추고 있습니다.

---

# PRD: 휴면 예정 회원 예측 (Dormancy Prediction)

> **문서 버전**: 1.0.0
> **Task ID**: `case5-dormancy-predict-20251222` > **작성자**: ATO Senior PM
> **Type**: `QUANTITATIVE` (정량 분석)
> **Pipeline**: `analysis`

## 1. 개요 (Overview)

### 1.1 목적 (Objective)

최근 활동 빈도가 급격히 감소하여 **'휴면(Dormant)' 상태로 전환될 위험이 높은 의사 회원군(Risk Group)**을 식별한다. 이를 통해 CRM 팀이 골든타임 내에 리텐션 캠페인(복귀 유도 푸시/메일)을 수행할 수 있도록 타겟 데이터를 추출한다.

### 1.2 타겟 유저 (Target User)

- **CRM 마케터/Growth PM**: 이탈 방지 캠페인을 위해 정제된 회원 리스트가 필요한 담당자.

## 2. 핵심 기능 (Core Features)

1. **휴면 위험군 정의 (Profile Agent)**

- `SEGMENT_RULES.md`를 참조하여 **'LIGHT(이탈 위험군)'** 세그먼트 중, 최근 3개월~5개월 사이 로그인 이력이 없는 회원을 필터링한다.
- 조건: `LAST_LOGIN_DT`가 현재로부터 3개월 이전 ~ 6개월 미만인 구간.

2. **타겟 데이터 추출 (Query Agent)**

- 대상: 의사 회원 (`U_KIND = 'DOC'`) 중 탈퇴하지 않은 회원 (`U_ALIVE = 'Y'`).
- 제외: 마케팅 수신 미동의자 (`MARKETING_YN = 'N'`).
- 추출 항목: `U_ID`, `U_KIND`, `U_MAJOR_CODE_1`(전공), `LAST_LOGIN_DT`(마지막 접속일).

3. **세그먼트 프로파일링 (Analysis)**

- 추출된 위험군이 **어떤 전공(Major)**이나 **근무 형태(Work Type)**에 집중되어 있는지 분포를 분석한다. (예: "성형외과 봉직의의 이탈률이 높음")

## 3. 성공 지표 (Success Criteria)

1. **데이터 추출 성공**: `DB_ACCESS_POLICY`를 위반(Timeout, Memory Overflow)하지 않고 유효한 SQL이 실행되어야 한다.
2. **산출물 저장 위치 준수**: 결과 파일(SQL, CSV, Report)이 반드시 `workspace/analysis/case5-dormancy-predict-*/` 경로에 저장되어야 한다.
3. **인사이트 도출**: 단순 명단 추출을 넘어, "이탈 위험이 가장 높은 전공 Top 3"가 리포트에 명시되어야 한다.

## 4. 데이터 요구사항 (Data Requirements)

> **⚠️ DOMAIN_SCHEMA.md v1.1.1 기준 - 실제 컬럼명만 사용**

### 4.1 대상 테이블 (Target Tables)

| 테이블 | 사용 컬럼 | 조건 | 용도 |
|--------|----------|------|------|
| `USERS` | `U_ID`, `U_KIND`, `U_ALIVE`, `U_REG_DATE` | `U_KIND = 'DOC001'` AND `U_ALIVE = 'Y'` | 활성 의사 회원 필터링 |
| `USER_DETAIL` | `U_ID`, `U_MAJOR_CODE_1`, `U_WORK_TYPE_1` | JOIN ON `U_ID` | 전공/근무형태 분석 |
| `USER_LOGIN` | `U_ID`, `LOGIN_DATE` | `LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 6 MONTH)` | 최근 로그인 이력 (🚨 2267만건, LIMIT 필수) |
| `CODE_MASTER` | `CODE_TYPE`, `CODE_VALUE`, `CODE_NAME` | `CODE_TYPE IN ('MAJOR', 'WORK_TYPE')` | 코드 → 명칭 변환 |

### 4.2 쿼리 조건 (Query Conditions)

```sql
-- 휴면 위험군 정의: 3개월~6개월 미로그인
WHERE NOT EXISTS (
  SELECT 1 FROM USER_LOGIN ul
  WHERE ul.U_ID = u.U_ID
    AND ul.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
)
AND EXISTS (
  SELECT 1 FROM USER_LOGIN ul2
  WHERE ul2.U_ID = u.U_ID
    AND ul2.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
)
LIMIT 10000  -- 대용량 보호
```

### 4.3 DB 연결 정보

- **환경**: Production (Read-Only)
- **계정**: `medigate` (SELECT 권한만 사용)

## 5. 산출물 체크리스트 (Deliverables)

| 구분       | 파일명 패턴                 | 설명                                    |
| ---------- | --------------------------- | --------------------------------------- |
| **Query**  | `extract_dormancy_risk.sql` | 실행 가능한 SQL 쿼리 파일 (SELECT Only) |
| **Data**   | `risk_user_list.csv`        | 추출된 회원 목록 (PII 마스킹 필수)      |
| **Report** | `analysis_report.md`        | 전공별/직군별 이탈 위험도 분석 리포트   |

## 6. 제약사항 (Constraints)

1. **DB 접근 정책 준수**:

- `INSERT`, `UPDATE`, `DELETE` 구문 사용 시 즉시 실패 처리.
- 쿼리 실행 시간 30초 초과 시 `LIMIT`를 적용하여 재시도할 것.

2. **개인정보 보호 (PII)**:

- 이름, 전화번호, 이메일 등 식별 가능한 개인정보는 쿼리 결과에서 제외하거나 마스킹(`***`) 처리할 것. 오직 `U_ID`만 식별자로 사용.

3. **경로 참조**:

- 분석 과정에서 `SEGMENT_RULES.md` (.claude/rules/)에 정의된 **LIGHT** 세그먼트 기준을 준수할 것.

---

**[Next Action]**
이 PRD를 바탕으로 오케스트레이터에게 다음 명령을 내리십시오:
`"docs/case5-dormancy-predict/PRD.md 파일을 읽고, Analysis 파이프라인을 실행해줘."`
