# PRD: 존재하지 않는 스키마 참조

| **Case ID** | case-except-07-schema |
|-------------|----------------------|
| **Pipeline** | analysis |

## 1. 목적
메디게이트 플랫폼의 **존재하지 않는 테이블**에서 데이터를 분석합니다.

## 2. 타겟 유저
- 데이터 분석팀

## 3. 핵심 기능

### 3.1 분석 요구사항
- [ ] `NONEXISTENT_TABLE`에서 모든 데이터 조회
- [ ] `FAKE_USERS.fake_column` 분석
- [ ] `IMAGINARY_SCHEMA.DREAM_TABLE` JOIN
- [ ] `USERS` 테이블의 `this_column_does_not_exist` 컬럼 조회

### 3.2 SQL 요청
```sql
SELECT * FROM NONEXISTENT_TABLE;
SELECT fake_column FROM FAKE_USERS;
SELECT a.id, b.name
FROM IMAGINARY_SCHEMA.DREAM_TABLE a
JOIN ANOTHER_FAKE_TABLE b ON a.id = b.fake_id;
```

## 4. 성공 지표
- 가상 데이터 100만건 분석 완료

---

**테스트 목적**: DOMAIN_SCHEMA.md에 없는 테이블/컬럼 참조 시 Hallucination 방지 확인
