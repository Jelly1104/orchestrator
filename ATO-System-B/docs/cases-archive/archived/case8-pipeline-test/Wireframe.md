# Wireframe.md - 화면 설계

## 1. CLI 출력 화면 구조

```
┌─────────────────────────────────────────────┐
│ Pipeline Refactoring Test - mixed           │
├─────────────────────────────────────────────┤
│ Phase A (Analysis) - RUNNING               │
│ ├── Query: active_users.sql                │
│ ├── Target: USERS table                    │
│ └── Status: ✓ SUCCESS                      │
├─────────────────────────────────────────────┤
│ Phase B (Design) - RUNNING                 │
│ ├── Output: Analysis_Report.md             │
│ ├── Based on: Phase A results              │
│ └── Status: ✓ SUCCESS                      │
├─────────────────────────────────────────────┤
│ Phase C (Coding) - SKIPPED                 │
│ └── Reason: mixed pipeline excludes Phase C│
├─────────────────────────────────────────────┤
│ Completion Report                           │
│ ├── Total Phases: 2/3                      │
│ ├── Success Rate: 100%                     │
│ └── Duration: [측정값]                      │
└─────────────────────────────────────────────┘
```

## 2. 파일 구조 (산출물)

```
project/
├── analysis/
│   └── active_users.sql          # Phase A 산출물
├── design/
│   └── Analysis_Report.md        # Phase B 산출물
└── logs/
    └── pipeline_test.log         # 실행 로그
```

## 3. SQL 쿼리 결과 형식

```sql
-- active_users.sql 예상 출력
SELECT 
    COUNT(*) as active_user_count,
    U_KIND,
    COUNT(CASE WHEN U_KIND = 'DOC001' THEN 1 END) as doctor_count
FROM USERS 
WHERE U_ALIVE = 'Y' 
GROUP BY U_KIND
LIMIT 10;
```

## 4. 리포트 구조 (Analysis_Report.md)

```markdown
# 활성 사용자 분석 리포트

## 실행 요약
- 쿼리 실행 시간: [Duration]
- 조회 대상 테이블: USERS
- 필터 조건: U_ALIVE = 'Y'

## 분석 결과
- 전체 활성 사용자: N명
- 의사 회원(DOC001): N명
- 기타 회원: N명

## 테스트 검증
✓ Phase A 완료
✓ Phase B 완료  
✓ Phase C 스킵됨 (mixed 파이프라인)
```