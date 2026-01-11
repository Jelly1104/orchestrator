# PRD: 활성 사용자 현황 대시보드

## 메타데이터
- **type**: MIXED
- **pipeline**: mixed
- **version**: 1.0.0
- **created**: 2025-12-26

## 1. 목적 (Objective)

활성 사용자 현황을 조회하고 시각화하는 대시보드를 설계합니다.

**핵심 분석 요구사항:**
- **활성 사용자 통계**: 전체 활성 사용자 수 파악
- **사용자 현황 분석**: 유형별 사용자 분포 분석
- **신규 가입자 추이**: 월별 신규 가입자 추이 확인
- **회원 현황 대시보드** 구축

## 2. 범위 (Scope)

### 데이터 분석 (Phase A)
- USERS 테이블 기반 활성 사용자 통계
- 유형별(U_KIND) 분포 분석
- 시계열 추이 분석

### 설계 문서 (Phase B)
- IA: 대시보드 정보 구조
- Wireframe: 차트 및 테이블 레이아웃
- SDD: 데이터 조회 API 설계

## 3. 성공 지표 (Success Metrics)

- [ ] Query Library에서 active_users.sql 템플릿 로드
- [ ] 4개 이상 쿼리 실행 성공
- [ ] Phase B 설계 문서 4종 생성
- [ ] Doc-Sync 로그 출력

## 4. 제약 조건 (Constraints)

- SELECT only (DML 금지)
- USERS, USER_DETAIL 테이블만 사용
- 민감 정보 조회 금지
