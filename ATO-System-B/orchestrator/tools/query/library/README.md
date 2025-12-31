# Query Library

**Version**: 1.0.0
**Created**: 2025-12-26
**Status**: P2-1 구현 완료

## 개요

Query Library는 AnalysisAgent가 데이터 분석 시 참조할 수 있는 **사전 검증된 SQL 쿼리 템플릿**을 제공합니다.

## 보안 준수

모든 쿼리 템플릿은 다음 보안 규칙을 준수합니다:

1. **SELECT * 금지**: 필요한 컬럼만 명시적으로 나열
2. **민감 컬럼 배제**: `DB_ACCESS_POLICY.md` 블랙리스트 준수
3. **LIMIT 적용**: 대용량 테이블 조회 시 결과 제한

## 템플릿 목록

| 파일명 | 카테고리 | 설명 |
|--------|----------|------|
| `active_users.sql` | 사용자 분석 | 활성 사용자 현황, 유형별 분포, 신규 가입자 추이 |
| `job_posting.sql` | 채용 분석 | 채용공고 현황, 월별 추이, 인기 공고 |

## 사용 방법

```javascript
// AnalysisAgent에서 Query Library 참조
const templates = await loadQueryLibrary();
const userQueries = templates['active_users'];
```

## 파라미터 규칙

- `{{since_date}}`: 조회 시작일 (형식: YYYY-MM-DD)
- `{{kind_filter}}`: 사용자/기업 유형 필터
- `{{status_filter}}`: 상태 필터

## 허용된 컬럼 (DOMAIN_SCHEMA.md 기준)

### USERS 테이블
- U_ID, U_KIND, U_ALIVE, U_REG_DATE

### USER_DETAIL 테이블
- U_ID, U_MAJOR_CODE_1, U_MAJOR_CODE_2, U_WORK_TYPE_1

### BOARD_RECRUIT 테이블
- BW_ID, BW_TITLE, BW_REG_DATE, BW_VIEW_COUNT, BW_STATUS

### CODE_MASTER 테이블
- CODE_TYPE, CODE_VALUE, CODE_NAME, CODE_ORDER, USE_FLAG

## 추가 예정 템플릿

- [ ] `user_engagement.sql`: 사용자 참여도 분석
- [ ] `content_analytics.sql`: 콘텐츠 성과 분석
- [ ] `conversion_funnel.sql`: 전환율 퍼널 분석
