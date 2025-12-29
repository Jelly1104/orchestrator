# SDD.md - 시스템 설계

## 1. 아키텍처 개요

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AnalysisAgent │───▶│   ProcessorCore  │───▶│  ContentEngine  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ MySQL Database  │    │  PII Masking     │    │ Script Generator│
│ (medigate)      │    │  Service         │    │ (LLM-based)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. 레거시 스키마 매핑 (Legacy Mapping)

### 2.1 주요 테이블 매핑

| 개념 | 물리 테이블 | 사용 컬럼 | 제약사항 |
|------|------------|----------|----------|
| 인기 게시물 | `BOARD_MUZZIMA` | `BOARD_IDX`, `CTG_CODE`, `U_ID`, `TITLE`, `CONTENT`, `READ_CNT`, `AGREE_CNT`, `REG_DATE` | 대용량 테이블 (337만 행) - 인덱스 필수 |
| 댓글 수 (선택) | `COMMENT` | `BOARD_IDX`, `SVC_CODE` | 초대용량 테이블 (1,826만 행) - 조회 제한 |

### 2.2 인덱스 활용 전략

```sql
-- 필수 WHERE 조건 (인덱스 활용)
WHERE CTG_CODE IN ('BOARD01', 'BOARD02', 'BOARD03')  -- 카테고리 인덱스
  AND REG_DATE >= NOW() - INTERVAL 24 HOUR           -- 시간 인덱스
ORDER BY (READ_CNT + AGREE_CNT * 3) DESC
LIMIT 5
```

## 3. 데이터 모델 변경

### 3.1 기존 테이블 활용 (신규 테이블 없음)

- ✅ `BOARD_MUZZIMA`: 기존 구조 그대로 사용
- ✅ `COMMENT`: 선택적 사용 (댓글 수 집계)
- ❌ 신규 테이블 생성 없음 (레거시 활용 우선)

### 3.2 조회수 데이터 이슈 대응

**⚠️ Risk**: 분석 결과에 따르면 모든 게시물의 `READ_CNT = 0`으로 집계되는 문제 발견

```sql
-- 임시 대안: AGREE_CNT 가중치 증가로 보정
SELECT BOARD_IDX, TITLE, 
       (READ_CNT + AGREE_CNT * 5) AS popularity_score  -- 가중치 3→5로 증가
FROM BOARD_MUZZIMA 
WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
ORDER BY popularity_score DESC
LIMIT 5;
```

## 4. API 설계

### 4.1 Phase A: Analysis API

```yaml
POST /api/v1/daily-briefing/analyze
Request Body:
  {
    "date_range": "24h",
    "limit": 5,
    "categories": ["BOARD01", "BOARD02"]
  }

Response:
  {
    "status": "success",
    "query_execution_time": "2.3s",
    "results": [
      {
        "board_idx": 12345,
        "title": "은퇴 관련 ***님 질문",
        "content_preview": "최근 ***병원에서...",
        "popularity_score": 215,
        "reg_date": "2025-12-29T10:30:00Z"
      }
    ],
    "pii_masked_count": 15
  }
```

### 4.2 Phase B: Content Generation API

```yaml
POST /api/v1/daily-briefing/generate
Request Body:
  {
    "analysis_id": "20251229_morning",
    "script_length": "medium",  # 400-550 words
    "tone": "professional_casual"
  }

Response:
  {
    "status": "success", 
    "files_generated": [
      "Podcast_Script.md",
      "Audio_Metadata.json", 
      "Content_Safety_Check.md"
    ],
    "word_count": 487,
    "estimated_duration": "3m 12s"
  }
```

## 5. PII 처리 시스템

### 5.1 마스킹 패턴

```python
PII_PATTERNS = {
    "patient_name": r"([가-힣]{2,4})님|([가-힣]{2,4}) 환자",
    "doctor_name": r"([가-힣]{2,4}) 의사|닥터 ([가-힣]{2,4})",
    "hospital_name": r"([가-힣]+)(병원|의원|클리닉|센터)",
    "phone_number": r"\d{2,3}-\d{3,4}-\d{4}",
    "address": r"[가-힣]+[시도] [가-힣]+[시군구]"
}

MASKING_REPLACEMENTS = {
    "patient_name": "***님",
    "doctor_name": "***의사", 
    "hospital_name": "***병원",
    "phone_number": "***-****-****",
    "address": "***지역"
}
```

## 6. 성능 및 모니터링

### 6.1 성능 목표

| 메트릭 | 목표 | 모니터링 방법 |
|--------|------|-------------|
| SQL 실행 시간 | < 3초 | EXPLAIN ANALYZE |
| PII 마스킹 처리 시간 | < 1초 | 함수 실행 시간 측정 |
| 전체 파이프라인 | < 30초 | End-to-End 측정 |

### 6.2 에러 처리

```python
class DailyBriefingError(Exception):
    pass

class DataInsufficientError(DailyBriefingError):
    """24시간 내 게시물이 5건 미만인 경우"""
    pass

class PIIMaskingError(DailyBriefingError):  
    """PII 마스킹 실패"""
    pass

class ScriptGenerationError(DailyBriefingError):
    """팟캐스트 스크립트 생성 실패"""  
    pass
```

## 7. Risk 분석

| Risk Level | 항목 | 영향도 | 대응 방안 |
|-----------|------|--------|----------|
| 🚨 High | 조회수 데이터 누락 (READ_CNT=0) | 인기도 측정 왜곡 | AGREE_CNT 가중치 증가, 댓글 수 추가 고려 |
| 🔴 Medium | 대용량 테이블 Full Scan | 성능 저하 | WHERE 조건 인덱스 강제, LIMIT 엄수 |
| 🟡 Low | PII 미탐지 | 개인정보 노출 | 다중 패턴 검증, Human Review |

## 8. 배포 계획

### 8.1 Phase별 배포

```yaml
Phase A (Analysis):
  - Database 접근 권한 확보
  - SQL 쿼리 성능 테스트
  - PII 마스킹 정확도 검증

Phase B (Generation):  
  - LLM 모델 연동
  - 대본 품질 샘플 테스트
  - HITL 검증 프로세스 구축
```

### 8.2 스케줄링

- **실행 주기**: 매일 오전 7시 (KST)
- **실패 시**: 30분 후 재시도 (최대 3회)
- **결과 보관**: 30일간 파일 시스템 저장