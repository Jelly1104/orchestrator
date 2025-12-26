# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 | 구현 방식 | 담당 Agent | 완료 기준 |
|---------------|-----------|------------|-----------|
| best_posts_query.sql (SQL_QUERY) | BOARD_MUZZIMA 베스트 5건 추출 쿼리 | AnalysisAgent | 실행 계획 포함, 3초 이하 실행 |
| raw_data_summary.json (ANALYSIS_TABLE) | PII 마스킹된 게시물 요약 데이터 | AnalysisAgent | 5건 게시물, PII 완전 제거 |
| Podcast_Script.md (REPORT) | Host-Guest 대화형 팟캐스트 대본 | LeaderAgent | 450-500단어, 구어체 |
| Audio_Metadata.json (METADATA) | TTS용 감정태그, 속도 가이드 | LeaderAgent | JSON 형식, voice_style 포함 |
| Content_Safety_Check.md (REPORT) | PII 검증 결과 리포트 | AnalysisAgent | 마스킹 항목별 검증 완료 |

## Mode
**MIXED** (Analysis + Content Generation)

## Required Outputs

### Phase A - AnalysisAgent 담당
1. **best_posts_query.sql**
   - BOARD_MUZZIMA에서 24시간 베스트 5건 추출
   - 인덱스 활용 필수: (CTG_CODE, REG_DATE)
   - SELECT * 금지, 필요 컬럼만 명시
   - LIMIT 5 적용
   - 실행 계획(EXPLAIN) 포함

2. **raw_data_summary.json**
   - 추출된 5건 게시물의 요약 정보
   - PII 마스킹 완료된 제목/내용
   - 동의수, 댓글수, 등록일 포함

3. **Content_Safety_Check.md**
   - PII 마스킹 항목별 검증 결과
   - 환자 정보, 의사 실명, 병원명 마스킹 확인
   - 마스킹 전후 비교 테이블

### Phase B - LeaderAgent 담당  
4. **Podcast_Script.md**
   - 2인 대화(Host-Guest) 형식
   - 구어체로 자연스러운 대화
   - 450-500단어 (TTS 3분 기준)
   - 베스트 5건 게시물 내용 반영

5. **Audio_Metadata.json**
   - TTS 설정값: emotion_tags, speech_rate
   - Host/Guest별 voice_style 구분
   - pause_duration, 강조 구간 표시

## Input Documents
- `DOMAIN_SCHEMA.md` - BOARD_MUZZIMA, COMMENT 테이블 스키마 참조
- `DB_ACCESS_POLICY.md` - 대용량 테이블 접근 규칙
- `PRD` - 메디게이트 무찌마 일간 베스트 팟캐스트 요구사항

## Completion Criteria

### Phase A 완료 기준
- [ ] SQL 쿼리 실행 시간 3초 미만
- [ ] PII 마스킹 100% 완료 (환자/의사/병원 정보)
- [ ] JSON 데이터 5건 정확히 추출
- [ ] 보안 검증 리포트 작성 완료

### Phase B 완료 기준  
- [ ] 팟캐스트 대본 450-500단어 준수
- [ ] Host-Guest 역할 명확히 구분
- [ ] 구어체 대화로 자연스럽게 변환
- [ ] TTS 메타데이터 JSON 형식 정확
- [ ] 전체 산출물 5개 완성

## Constraints

### 기술적 제약
- **DB 접근**: BOARD_MUZZIMA 대용량 테이블, 반드시 인덱스 활용
- **쿼리 제한**: SELECT * 절대 금지, LIMIT 적용 필수
- **메모리 관리**: CONTENT 컬럼은 LEFT(CONTENT, 500)으로 제한 조회

### 보안 제약
- **PII 완전 제거**: 환자 개인정보, 의사 실명, 병원명 마스킹 필수
- **민감정보 로깅**: 마스킹 과정 감사 로그 보관
- **접근 권한**: 관리자 권한 API만 사용 가능

### 콘텐츠 제약
- **대본 길이**: TTS 변환 시 3분 초과 금지 (450-500단어)
- **대화 품질**: '읽는 글'이 아닌 '듣는 말'로 구어체 변환
- **브랜드 톤**: 의료 전문성 + 친근함 균형 유지

## Special Instructions

### AnalysisAgent 특별 지시사항
1. **조회수 데이터 이슈 대응**
   - READ_CNT가 모두 0으로 표시되므로 AGREE_CNT(동의수) 기준 정렬
   - 댓글수도 함께 고려하여 참여도 높은 게시물 우선 선정

2. **COMMENT 테이블 주의사항**
   - 1,826만 행의 극대용량 테이블
   - 반드시 BOARD_IDX로 필터링 후 집계
   - 서브쿼리 형태로 사용하여 성능 최적화

### LeaderAgent 특별 지시사항
1. **대본 스타일 가이드**
   - Host: 진행자 역할, 친근하고 에너지틱
   - Guest: 전문가 역할, 분석적이고 신뢰감 있게
   - 의료 전문용어는 쉽게 풀어서 설명

2. **TTS 최적화**
   - 문장 길이 적절히 조절 (너무 길면 호흡 곤란)
   - 감정 변화 포인트 명시
   - 강조할 키워드 태깅

## Error Handling
- SQL 타임아웃 시: 쿼리 최적화 후 재시도
- PII 마스킹 실패 시: 해당 게시물 제외하고 다음 순위 선정
- 대본 생성 실패 시: 템플릿 기반 기본 대본 생성

## Success Validation
전체 산출물이 완성되면 다음을 확인:
1. PRD 체크리스트 5개 항목 모두 완료
2. 보안 검증 통과 (PII 0% 포함)
3. 성능 기준 충족 (SQL 3초, 대본 3분)
4. 품질 기준 충족 (자연스러운 구어체)