# Case #4 HEAVY 세그먼트 심화 분석 태스크

> **Task ID**: case4-heavy-analysis-20251222
> **생성일**: 2025-12-22
> **상태**: 🟡 In Progress
> **담당 스킬**: query-agent, profile-agent, doc-agent

---

## 1. 태스크 개요

### 배경
- 기존 분석(2025-12-17)에서 HEAVY 세그먼트 16,037명의 기본 프로파일링 완료
- System B v2.0 (Skill-Centric Architecture) 검증 목적으로 심화 분석 수행

### 목표
PO 지시사항 "Mission First Impact" 실행:
1. **전문과목 패턴 분석**: 성형외과/피부과/정형외과 집중 분석
2. **근무형태 패턴 분석**: 개원준비/개원의 행동 패턴 심화
3. **G1 Use Case Trigger 검증**: 기존 제안 3개의 실행 가능성 평가

---

## 2. 분석 요구사항

### 2.1 Query-Agent 태스크

```sql
-- Task 1: 성형외과+개원준비 교집합 정확 모수
SELECT COUNT(DISTINCT u.U_ID) AS exact_count
FROM USERS u
JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
WHERE u.U_KIND = 'DOC001'
  AND u.U_ALIVE = 'Y'
  AND ud.U_MAJOR_CODE_1 IN ('성형외과 코드')
  AND ud.U_WORK_TYPE = '개원준비 코드'
LIMIT 1000;

-- Task 2: 피부과 회원의 최근 3개월 페이지 조회 패턴
SELECT
  page_category,
  COUNT(*) AS view_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM USER_PAGE_VIEW
WHERE user_id IN (피부과 의사 목록)
  AND view_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
GROUP BY page_category
ORDER BY view_count DESC
LIMIT 10;

-- Task 3: 개원준비 의사의 콘텐츠 소비 패턴
SELECT
  content_type,
  AVG(view_duration) AS avg_duration,
  COUNT(*) AS total_views
FROM USER_CONTENT_VIEW
WHERE user_id IN (개원준비 의사 목록)
GROUP BY content_type
ORDER BY total_views DESC
LIMIT 10;
```

### 2.2 Profile-Agent 태스크

**Input:**
```json
{
  "segments": [
    {
      "name": "성형외과_개원준비",
      "definition": "전문과목=성형외과 AND 근무형태=개원준비",
      "expectedSize": 89
    },
    {
      "name": "피부과_활성",
      "definition": "전문과목=피부과 AND HEAVY 세그먼트",
      "expectedSize": 1445
    },
    {
      "name": "내과_커뮤니티_활성",
      "definition": "전문과목=내과 AND 댓글작성 10회 이상",
      "expectedSize": 647
    }
  ],
  "analysisAspects": [
    "인구통계 (연령, 지역)",
    "서비스 이용 패턴",
    "콘텐츠 소비 선호도",
    "전환 가능성 점수"
  ]
}
```

**Expected Output:**
- 3개 세그먼트별 상세 프로필
- 페르소나 3개 생성
- G1 Trigger 적합성 점수 (1-10)

### 2.3 Doc-Agent 태스크

- 분석 결과를 Notion 페이지로 동기화
- 기존 보고서 업데이트 또는 신규 페이지 생성
- 시각화 자료 포함 (테이블, 차트 권장)

---

## 3. 기존 분석 결과 참조

### 핵심 발견사항 (2025-12-17)

| 세그먼트 | 활성도 차이 | 유의성 |
|---------|-----------|--------|
| 성형외과 | +33.2%p | EXTREME |
| 개원준비 | +36.8%p | EXTREME |
| 피부과 | +16.5%p | HIGH |
| 정형외과 | +16.4%p | HIGH |
| 내과 | +6.4%p | HIGH |

### G1 Use Case Trigger 제안 (검증 필요)

1. **성형외과_개원_AI컨설팅**: 예상 전환율 35-45%
2. **피부과_입지분석_AI추천**: 예상 전환율 25-30%
3. **내과_동료네트워킹_AI**: 예상 전환율 20-25%

---

## 4. 성공 기준

- [ ] Query-Agent: 3개 쿼리 실행 완료
- [ ] Profile-Agent: 3개 세그먼트 프로파일링 완료
- [ ] Doc-Agent: 분석 보고서 Notion 동기화 완료
- [ ] G1 Trigger 실행 가능성 평가 (Go/No-Go)

---

## 5. 실행 로그

### 2025-12-22 15:XX

| 시간 | 단계 | 상태 | 비고 |
|-----|------|------|------|
| 15:52 | 태스크 생성 | ✅ | Task.md 작성 |
| - | Query-Agent 실행 | ⏳ | 대기 중 |
| - | Profile-Agent 실행 | ⏳ | 대기 중 |
| - | Doc-Agent 실행 | ⏳ | 대기 중 |

---

**Created by**: AI Orchestrator (System B v2.0)
**스킬 활용**: query-agent v1.1.0, profile-agent v1.1.0, doc-agent v2.0.0
