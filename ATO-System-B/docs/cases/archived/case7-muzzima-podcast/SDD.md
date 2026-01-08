# SDD.md - 시스템 설계

## 1. 아키텍처 개요

```
[Client] -- HTTP --> [Express.js 서버: Podcast API] -- SQL --> [DB: medigate]
                                    |
                                    --> TTS 엔진 -- Audio 출력
```

## 2. 레거시 스키마 매핑

- **게시글 데이터**: `BOARD_MUZZIMA` 테이블 활용 (BOARD_IDX, CONTENT 등 조회)
- **댓글 데이터**: `COMMENT` 테이블 (사용 시 주의, DB 트래픽 최소화)

## 3. 데이터 흐름

### 3.1 일간 베스트 데이터 추출
- SQL: `SELECT BOARD_IDX, CONTENT FROM BOARD_MUZZIMA WHERE (READ_CNT + AGREE_CNT*3) ORDER BY SCORE LIMIT 5`
- 인덱스: `REG_DATE`, `BOARD_IDX` 활용

### 3.2 팟캐스트 대본 및 메타데이터 생성
- Python 스크립트 호출 (NLTK 요약 라이브러리 이용)
- 마스킹 로직 포함 (정규 표현식 사용)

### 3.3 TTS 처리
- 감정 태그와 발화 속도 기반 TTS 변환
- Web Speech API 연계 (무료, 권장)

## 4. API 설계

### POST /api/v1/podcast/daily-best
- 설명: 최신 인기 게시물 기반 대본 생성
- 응답 형식: JSON
  - 예시: `{ "script": "Host: 잘 알려진 대화 시작입니다...", "metadata": { "tags": ["기쁨", "중립"], "speed": 1.0 }}`

## 5. 제약사항

- 대규모 데이터 쿼리 수립 시, 인덱스 활용
- CONTENT 마스킹 필수 (`***` 기호 사용)

## Risk
- SQL 과부하 위험 (특히 `COMMENT` 테이블)
- TTS 자연스러운 호환성 우려 → 품질 검토 필요