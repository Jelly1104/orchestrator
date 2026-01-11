# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 에이전트 |
|-------------------|-----------|--------------|
| Query Library에서 active_users.sql 템플릿 로드 | SQL 쿼리 실행 및 결과 분석 | Data Analysis Agent |
| 4개 이상 쿼리 실행 성공 | 통계/분포/추이/상세 쿼리 실행 | Data Analysis Agent |
| Phase B 설계 문서 4종 생성 | IA, Wireframe, SDD 문서 (완료됨) | Leader Agent |
| **Doc-Sync 로그 출력** | **문서 동기화 결과 로그 출력** | **Document Agent** |

## Mode
**Analysis + Design** (Mixed Mode)

## Required Outputs

### 1. Doc-Sync 로그 출력 (유형: OTHER)
- **목적**: 문서 생성 및 동기화 결과 확인
- **형식**: 
```
[Doc-Sync Log]
✅ IA.md - 생성 완료 (2025-12-26 14:30:15)
✅ Wireframe.md - 생성 완료 (2025-12-26 14:30:16)  
✅ SDD.md - 생성 완료 (2025-12-26 14:30:17)
✅ HANDOFF.md - 생성 완료 (2025-12-26 14:30:18)

총 4개 문서 생성 완료
파이프라인: mixed → 설계 단계 완료
다음 단계: Implementation 대기
```

### 2. 데이터 분석 결과 (Phase A 완료됨)
- 활성 사용자 통계: 0명 (데이터 이슈 발견)
- 전체 사용자: 203,184명
- 유형별 분포: UKD001(63%), UKD002(15%), 기타(22%)
- 월별 신규 가입자: 평균 408명, 최고 532명(3월)

## Input Documents
- PRD: 활성 사용자 현황 대시보드
- DOMAIN_SCHEMA.md: USERS, USER_DETAIL, CODE_MASTER 테이블 구조
- 분석 결과: 사용자 통계 데이터 (참조용)

## Completion Criteria

### Phase A (Analysis) - ✅ 완료됨
- [x] USERS 테이블 기반 활성 사용자 통계 완료
- [x] 유형별(U_KIND) 분포 분석 완료  
- [x] 시계열 추이 분석 완료
- [x] 데이터 품질 이슈 발견 및 문서화 완료

### Phase B (Design) - ✅ 완료됨
- [x] IA: 대시보드 정보 구조 완료
- [x] Wireframe: 차트 및 테이블 레이아웃 완료
- [x] SDD: 데이터 조회 API 설계 완료
- [x] HANDOFF: Sub-agent 작업 지시서 완료

### 최종 완료 조건
- [ ] **Doc-Sync 로그 출력 완료** ← 🎯 핵심 완료 조건
- [x] 4개 설계 문서 생성 완료
- [x] PRD 산출물 체크리스트 4개 항목 모두 매핑 완료

## Constraints

### 데이터 접근 제약
- SELECT only (DML 금지)
- USERS, USER_DETAIL 테이블만 사용
- 민감 정보 조회 금지 (이메일, 연락처 제외)

### 성능 제약  
- USERS 테이블 Full Scan 금지 (20만+ 레코드)
- 인덱스 활용 필수: U_ALIVE, U_REG_DATE, U_KIND
- 쿼리 실행 시간 < 2초 권장

### 설계 제약
- 레거시 스키마 변경 불가
- 기존 컬럼명 사용 필수 (추측 금지)
- REST API 표준 준수

## Special Instructions

### 데이터 정합성 이슈 처리
⚠️ **중요**: 활성 사용자 0명 vs 신규 가입자 지속 유입 이슈 발견
- 이 이슈는 설계에 반영됨 (SDD Risk 섹션 참조)
- 대시보드에는 현재 데이터 기준으로 표시
- 향후 U_ALIVE 컬럼 정의 검토 권장사항 포함

### Doc-Sync 로그 요구사항
- 각 문서별 생성 시간 포함
- 전체 파이프라인 상태 요약
- 다음 단계 안내 포함

### 문서 연결성 확인
- IA → Wireframe → SDD 일관성 유지 확인
- PRD 요구사항 누락 없이 모든 설계에 반영 확인
- DOMAIN_SCHEMA.md 컬럼명 정확성 검증 완료