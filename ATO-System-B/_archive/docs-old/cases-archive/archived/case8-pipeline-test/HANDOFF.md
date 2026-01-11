# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 Agent | 파일명 |
|-------------------|-----------|------------|--------|
| active_users.sql (SQL_QUERY) | USERS 테이블 조회 쿼리 생성 | AnalysisAgent | active_users.sql |
| SELECT문만 사용 | DML/DDL 제외, SELECT만 허용 | AnalysisAgent | - |
| LIMIT 포함 | 쿼리에 LIMIT 10 추가 | AnalysisAgent | - |
| Analysis_Report.md (REPORT) | 분석 결과 요약 리포트 | LeaderAgent | Analysis_Report.md |
| 분석 결과 요약 | SQL 실행 결과 기반 통계 생성 | LeaderAgent | - |

## Mode
**MIXED** (Analysis + Design)
- Phase A: Analysis 실행
- Phase B: Design 실행  
- Phase C: Coding 스킵

## Required Outputs

### Phase A (AnalysisAgent)
1. **active_users.sql**
   - 형식: SQL 파일
   - 내용: USERS 테이블에서 활성 사용자(U_ALIVE='Y') 조회
   - 제약: SELECT문만 사용, LIMIT 10 포함
   - 컬럼: U_ID, U_KIND, U_ALIVE (DOMAIN_SCHEMA.md 준수)

### Phase B (LeaderAgent)  
1. **Analysis_Report.md**
   - 형식: Markdown 리포트
   - 내용: Phase A SQL 실행 결과 요약
   - 섹션: 실행 요약, 분석 결과, 테스트 검증

## Input Documents
- **PRD**: Pipeline Refactoring 테스트 케이스
- **DOMAIN_SCHEMA.md**: USERS 테이블 구조 참조
- **Pipeline Config**: mixed 파이프라인 설정

## Completion Criteria

### Phase A 성공 기준
- [ ] active_users.sql 파일 생성
- [ ] SELECT문만 사용 (DML/DDL 없음)  
- [ ] LIMIT 10 포함
- [ ] DOMAIN_SCHEMA.md의 실제 컬럼명 사용
- [ ] U_ALIVE='Y' 조건 포함

### Phase B 성공 기준  
- [ ] Analysis_Report.md 파일 생성
- [ ] 분석 결과 요약 섹션 포함
- [ ] Phase A 실행 결과 반영
- [ ] 마크다운 형식 준수

### Pipeline 성공 기준
- [ ] Phase A → Phase B 순차 실행
- [ ] Phase C 스킵됨 (mixed 파이프라인)
- [ ] printCompletionReport 출력 확인
- [ ] Duration 측정 정상 작동

## Constraints

### 기술적 제약
- USERS 테이블만 접근 허용 (위험도 LOW)
- SQL Injection 방지를 위한 쿼리 검증
- 파일 생성 권한 확인 필요

### 비즈니스 제약
- 테스트 목적이므로 실제 서비스 데이터 변경 금지
- Phase C(코딩) 단계는 실행하지 않음
- 성능 측정 데이터 수집 필요

### 보안 제약
- 개인정보 노출 방지 (U_ID는 카운트만 사용)
- 분석 결과는 통계 수치만 포함
- 실제 사용자 데이터는 리포트에 포함 금지

## Special Instructions

⚠️ **Duration 버그 수정 검증**: PRD에서 언급한 Duration 버그가 파이프라인 실행 시간 측정과 관련이 있을 수 있습니다. 각 Phase별 실행 시간을 정확히 측정하고 리포트에 포함하세요.

🔍 **mixed 파이프라인 검증**: Phase C가 정상적으로 스킵되는지 확인하고, CLI에서 "SKIPPED" 상태가 올바르게 출력되는지 검증하세요.

📊 **CLI UX 검증**: 새로운 `printCompletionReport` 함수의 출력 형식이 요구사항에 맞는지 확인하세요.