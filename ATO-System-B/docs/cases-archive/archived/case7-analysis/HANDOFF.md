# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

PRD의 핵심 기능을 다음과 같이 구현하세요:

| PRD 항목 | 구현 방식 | 산출물 |
|---------|-----------|--------|
| F1 Phase A - 일간 베스트 추출 | `DailyBestExtractor` 클래스 구현 | Python 모듈 + SQL 쿼리 |
| F2 Phase A - PII 전처리 | `PIIProcessor` 클래스 구현 | 정규식 기반 마스킹 로직 |
| F3 Phase B - 대본 생성 | `PodcastScriptGenerator` 클래스 구현 | LLM 연동 + 프롬프트 엔지니어링 |
| F4 Phase B - 메타데이터 생성 | TTS용 메타데이터 자동 생성 | JSON 구조화된 감정/타이밍 태그 |
| 데이터 요구사항 | BOARD_MUZZIMA/COMMENT 최적화 쿼리 | 인덱스 활용 SQL + 성능 모니터링 |

## Mode
**Coding**

## Required Outputs

### Phase A 구현체
1. **DailyBestExtractor.py**
   - BOARD_MUZZIMA에서 24시간 내 상위 5건 추출
   - 조회수*0.7 + 댓글수*0.3 점수 계산
   - REG_DATE 인덱스 강제 활용 (WHERE REG_DATE >= 조건)
   - LIMIT 10 이하 준수

2. **PIIProcessor.py**
   - 병원명 → A병원, B의원 변환
   - 의사명 → 김○○ 선생님 마스킹
   - 연락처, 이메일 완전 제거
   - 정규식 패턴 기반 자동 마스킹

### Phase B 구현체  
3. **PodcastScriptGenerator.py**
   - Host/Guest 2인 대화형 대본 생성
   - OpenAI API 연동 (또는 대안 LLM)
   - 구어체 자연스러운 스크립트
   - 8-10분 분량 목표

4. **MetadataGenerator.py**
   - TTS용 감정 태그 (밝음, 진지함, 놀람, 걱정)
   - 발화 속도 설정 (빠름, 보통, 느림)
   - 강조 단어 마킹
   - 휴지 시간 계산

### API 및 인프라
5. **FastAPI 엔드포인트**
   - `GET /api/v1/podcast/daily-briefing/extract`
   - `GET /api/v1/podcast/daily-briefing/preprocess` 
   - `POST /api/v1/podcast/daily-briefing/generate`
   - `GET /api/v1/podcast/daily-briefing/metadata`

6. **Celery 배치 작업**
   - 매일 오전 6시 자동 실행
   - 실패 시 알림 및 재시도 로직
   - 로그 및 모니터링

### 데이터 저장
7. **MySQL 테이블 설계**
   - `podcast_scripts`: 생성된 대본 저장
   - `podcast_source_posts`: 소스 게시물 연결
   - JSON 컬럼 활용한 메타데이터 저장

8. **테스트 코드**
   - Phase A 데이터 추출 테스트
   - PII 마스킹 정확도 테스트  
   - 대본 생성 품질 테스트
   - API 엔드포인트 통합 테스트

## Input Documents
- `SDD.md`: 상세 기술 설계 및 API 스펙
- `Wireframe.md`: 관리자 화면 컴포넌트 구조
- `DOMAIN_SCHEMA.md`: BOARD_MUZZIMA, COMMENT 테이블 스키마
- `TDD_WORKFLOW.md`: 테스트 작성 규칙 및 절차

## Completion Criteria

### 기능 완성도
- [ ] 24시간 내 베스트 게시물 5건 정확 추출
- [ ] PII 마스킹 100% 적용 (병원명, 의사명, 연락처)  
- [ ] Host/Guest 역할 구분된 자연스러운 대본 생성
- [ ] TTS 메타데이터 (감정, 속도, 강조) 완전 태깅
- [ ] 8-10분 분량 대본 길이 준수

### 성능 기준
- [ ] 베스트 추출 API 응답시간 < 5초
- [ ] 대본 생성 API 응답시간 < 30초  
- [ ] BOARD_MUZZIMA 쿼리 인덱스 활용률 > 95%
- [ ] 메모리 사용량 < 1GB (대용량 테이블 대비)

### 품질 기준
- [ ] 단위 테스트 커버리지 > 80%
- [ ] PII 마스킹 정확도 > 99%
- [ ] 생성된 대본의 문법 오류 < 1%
- [ ] API 응답 JSON 스키마 100% 준수

### 운영 기준  
- [ ] 매일 자동 배치 실행 성공
- [ ] 실패 시 Slack 알림 발송
- [ ] 로그 레벨별 적절한 기록
- [ ] 관리자 대시보드 실시간 상태 표시

## Constraints

### 데이터 접근 제약
- **절대 금지**: SELECT * FROM BOARD_MUZZIMA (337만 행)
- **절대 금지**: SELECT * FROM COMMENT (1,826만 행)
- **필수**: WHERE REG_DATE >= 조건으로 24시간 범위 제한
- **필수**: LIMIT 10 이하로 결과 제한
- **권장**: 필요한 컬럼만 SELECT (BOARD_IDX, TITLE, CONTENT, READ_CNT 등)

### PII 보안 제약
- 개인정보 원본을 로그에 기록 금지
- 마스킹 전 데이터 외부 API 전송 금지  
- 생성된 대본도 재검토 후 저장
- 데이터베이스 연결은 읽기 전용 계정 사용

### 성능 제약
- Phase A 처리시간 5초 이내
- Phase B 처리시간 30초 이내
- 동시 사용자 10명 이상 지원
- 메모리 사용량 1GB 이하 유지

### LLM 사용 제약
- OpenAI API 호출 비용 일일 $10 이하
- 생성 실패 시 3회 재시도 후 중단
- 부적절한 콘텐츠 필터링 적용
- 한국어 의료 용어 정확성 검증 필요

## 우선순위
1. **P0 (필수)**: Phase A 데이터 추출 + PII 마스킹
2. **P1 (중요)**: Phase B 대본 생성 + 기본 메타데이터  
3. **P2 (권장)**: 관리자 대시보드 + 배치 스케줄링
4. **P3 (향후)**: 음성 합성 연동 + 고급 분석 기능

작업 시작 전 `DOMAIN_SCHEMA.md`에서 BOARD_MUZZIMA와 COMMENT 테이블의 정확한 컬럼명을 확인하고, TDD_WORKFLOW.md의 테스트 작성 규칙을 준수하세요.