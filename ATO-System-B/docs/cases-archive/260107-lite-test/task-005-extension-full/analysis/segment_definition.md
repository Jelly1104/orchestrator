# Segment Definition: 무찌마 일간 베스트 팟캐스트

> **Case ID**: 260107-lite-test/task-005-extension-full
> **생성일**: 2026-01-08
> **생성자**: Profiler Skill v3.4

---

## 1. 분석 목표

BOARD_MUZZIMA 테이블에서 24시간 내 인기 게시물(상위 5건)을 추출하여 팟캐스트 대본 생성용 데이터를 확보한다.

---

## 2. 콘텐츠 세그먼트 정의

### 2.1 인기 게시물 (BEST_POSTS)

| 항목 | 정의 |
|------|------|
| **세그먼트명** | DAILY_BEST |
| **대상 테이블** | BOARD_MUZZIMA |
| **정의** | 24시간 내 조회수(READ_CNT) + 추천수(AGREE_CNT) 기준 상위 게시물 |
| **추출 건수** | 5~10건 (상위 5건 사용) |

### 2.2 SQL 조건 명세

```sql
-- 인기도 점수 계산 공식
-- popularity_score = READ_CNT + (AGREE_CNT * 2)
-- 추천은 조회보다 2배 가중치

WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
  AND REG_DATE <= NOW()
ORDER BY (READ_CNT + AGREE_CNT * 2) DESC
LIMIT 10
```

### 2.3 댓글 활발 게시물 (HOT_DISCUSSION)

| 항목 | 정의 |
|------|------|
| **세그먼트명** | HOT_DISCUSSION |
| **대상 테이블** | BOARD_MUZZIMA + COMMENT |
| **정의** | 24시간 내 댓글 수 기준 상위 게시물 |
| **추출 건수** | 5~10건 (선택적 사용) |

### 2.4 댓글 조회 SQL 조건

```sql
-- COMMENT 테이블은 대용량(1,826만 행) - BOARD_IDX 인덱스 필수
WHERE BOARD_IDX IN (
    SELECT BOARD_IDX FROM BOARD_MUZZIMA
    WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
)
GROUP BY BOARD_IDX
ORDER BY COUNT(*) DESC
LIMIT 10
```

---

## 3. 대상 컬럼 명세 (DOMAIN_SCHEMA 준수)

### BOARD_MUZZIMA

| 컬럼명 | 타입 | 설명 | 사용 여부 |
|--------|------|------|:--------:|
| BOARD_IDX | INT | 게시글 고유 ID (PK) | O |
| CTG_CODE | CHAR(6) | 카테고리 코드 | O |
| U_ID | VARCHAR(20) | 작성자 ID | X (PII) |
| TITLE | VARCHAR(200) | 제목 | O |
| CONTENT | MEDIUMTEXT | 본문 | O |
| READ_CNT | INT | 조회수 | O |
| AGREE_CNT | INT | 추천수 | O |
| REG_DATE | DATETIME | 작성일 | O |

### COMMENT (서브쿼리용)

| 컬럼명 | 타입 | 설명 | 사용 여부 |
|--------|------|------|:--------:|
| COMMENT_IDX | INT UNSIGNED | 댓글 고유 ID (PK) | O (COUNT) |
| BOARD_IDX | INT UNSIGNED | 게시글 ID (FK) | O |
| SVC_CODE | VARCHAR(10) | 서비스 구분 | O (필터) |

---

## 4. 소비자 페르소나

### 4.1 Dr. Kim (Primary Persona)

| 항목 | 내용 |
|------|------|
| **이름** | 김OO (가명) |
| **연령대** | 35-45세 |
| **근무형태** | 개원의 (OWN) |
| **전문과목** | 내과, 피부과, 성형외과 등 |
| **Pain Point** | 진료 후 피곤해서 커뮤니티 정독할 시간/에너지 부족 |
| **Needs** | 출퇴근 중 3분 만에 오늘의 핫이슈 파악 |
| **사용 시나리오** | 아침 출근길, 점심시간, 퇴근길에 오디오 청취 |

### 4.2 Dr. Lee (Secondary Persona)

| 항목 | 내용 |
|------|------|
| **이름** | 이OO (가명) |
| **연령대** | 30-40세 |
| **근무형태** | 봉직의 (EMP) |
| **전문과목** | 다양 |
| **Pain Point** | 병원 내부 업무로 바빠 트렌드 파악 어려움 |
| **Needs** | 동료 의사들 사이 화제가 무엇인지 빠르게 파악 |
| **사용 시나리오** | 이동 중, 대기 시간에 이어폰으로 청취 |

---

## 5. 제약사항 및 주의사항

### 5.1 PII 보호

| 금지 컬럼 | 사유 |
|----------|------|
| U_ID | 작성자 식별 정보 |
| U_EMAIL | 개인 연락처 |
| U_NAME | 개인 식별 정보 |

### 5.2 대용량 테이블 접근

| 테이블 | 행 수 | 주의사항 |
|--------|-------|----------|
| BOARD_MUZZIMA | 337만 | REG_DATE 인덱스 활용 필수 |
| COMMENT | 1,826만 | BOARD_IDX 인덱스 활용 필수 |

### 5.3 데이터 품질

- 24시간 내 게시물이 5건 미만일 경우: 48시간으로 범위 확장
- 빈 CONTENT: 대본 생성에서 제외
- 최소 표본: 게시물 5건 이상 확보 필요

---

## 6. /query Skill 전달 사항

### 필수 SQL 쿼리 목록

| ID | 쿼리명 | 목적 |
|----|--------|------|
| Q1 | best_posts.sql | 24시간 내 인기 게시물 상위 10건 추출 |
| Q2 | comment_counts.sql | 베스트 게시물별 댓글 수 집계 |

### Q1 조건 명세

```yaml
table: BOARD_MUZZIMA
columns: BOARD_IDX, CTG_CODE, TITLE, CONTENT, READ_CNT, AGREE_CNT, REG_DATE
filter: REG_DATE >= NOW() - INTERVAL 24 HOUR
order: (READ_CNT + AGREE_CNT * 2) DESC
limit: 10
```

### Q2 조건 명세

```yaml
table: COMMENT
columns: BOARD_IDX, COUNT(*) AS COMMENT_CNT
filter: BOARD_IDX IN (Q1 결과)
group: BOARD_IDX
index: BOARD_IDX (필수)
```

---

**END OF SEGMENT DEFINITION**
