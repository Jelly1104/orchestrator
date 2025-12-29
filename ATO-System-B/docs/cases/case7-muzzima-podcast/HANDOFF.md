# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 Agent | 우선순위 |
|-------------------|-----------|-----------|---------|
| best_posts_query.sql | SQL_QUERY 작성, DOMAIN_SCHEMA.md 컬럼명 사용 | AnalysisAgent | P0 |
| raw_data_summary.json | 상위 5개 게시물 JSON 변환, PII 1차 마스킹 | AnalysisAgent | P0 |
| Podcast_Script.md | Host/Guest 대화 형식, 구어체 400-550단어 | LeaderAgent | P1 |
| Audio_Metadata.json | TTS용 emotion_tags, speaking_rate 메타데이터 | LeaderAgent | P1 |
| Content_Safety_Check.md | PII 완전 제거 검증, Human Review 서명란 | LeaderAgent | P1 |
| 조회수 데이터 수집 시스템 점검 | READ_CNT=0 이슈 분석 및 개선 권고안 | AnalysisAgent | P2 |

## Mode
**MIXED** (Analysis + Design)
- Phase A: Analysis (SQL 실행 → 데이터 추출)  
- Phase B: Design (콘텐츠 생성 → 대본 작성)

## Required Outputs

### Phase A 출력물 (AnalysisAgent)
1. **best_posts_query.sql**
   - BOARD_MUZZIMA 테이블 대상
   - WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR 필수
   - ORDER BY (READ_CNT + AGREE_CNT*3) DESC
   - LIMIT 5 
   - SELECT * 금지 (명시적 컬럼 선택)

2. **raw_data_summary.json**
   ```json
   {
     "extraction_date": "2025-12-29T07:00:00Z",
     "posts": [
       {
         "board_idx": 12345,
         "title": "PII 마스킹 적용된 제목",
         "summary": "핵심 내용 요약 (200자 내외)",
         "view_count": 0,
         "agree_count": 43,
         "comment_count": 15,
         "popularity_score": 129
       }
     ],
     "total_posts_analyzed": 5,
     "pii_masked_items": 15
   }
   ```

3. **조회수 데이터 수집 시스템 분석 보고서**
   - READ_CNT=0 원인 분석
   - 개선 방안 제시 (기술적 해결책)
   - 임시 대안 (AGREE_CNT 가중치 조정 등)

### Phase B 출력물 (LeaderAgent)
1. **Podcast_Script.md**
   ```markdown
   # 메디게이트 무찌마 일간 브리핑 (2025-12-29)
   
   **Host**: 안녕하세요! 오늘도 의료 현장의 핫한 이슈를 전해드리는 시간입니다.
   
   **Guest**: 네, 지난 24시간 동안 무찌마에서 가장 활발하게 논의된 주제들을 준비했는데요...
   
   [총 400-550단어, 구어체 대화 형식]
   ```

2. **Audio_Metadata.json**
   ```json
   {
     "script_metadata": {
       "total_duration_estimate": "3m 15s",
       "word_count": 487,
       "speaking_rate": 1.0
     },
     "emotion_tags": ["informative", "conversational", "professional"],
     "tts_settings": {
       "host_voice": "professional_female",
       "guest_voice": "friendly_male", 
       "pause_duration": 0.8
     }
   }
   ```

3. **Content_Safety_Check.md**
   ```markdown
   # 콘텐츠 안전성 검증 보고서
   
   ## PII 검증 결과
   - [✓] 환자명 완전 제거 확인
   - [✓] 의사 실명 완전 제거 확인
   - [✓] 병원명 완전 제거 확인
   
   ## Human Reviewer 서명
   - 검토자: ___________
   - 검토 일시: ___________
   - 승인 여부: [ ] 승인 [ ] 수정 필요
   ```

## Input Documents
1. **DOMAIN_SCHEMA.md** - 테이블 구조 및 컬럼명 확인 (Hallucination 방지)
2. **DB_ACCESS_POLICY.md** - 쿼리 실행 권한 및 제약사항  
3. **분석 결과** - 조회수=0 이슈 등 현황 참고
4. **PRD 원문** - 요구사항 상세 스펙

## Completion Criteria

### Phase A 완료 기준 (AnalysisAgent)
- [ ] SQL 실행 시간 3초 이내
- [ ] 결과 5건 정확히 추출
- [ ] PII 마스킹 패턴 100% 적용
- [ ] JSON 스키마 유효성 통과
- [ ] READ_CNT=0 이슈 원인 분석 완료

### Phase B 완료 기준 (LeaderAgent)  
- [ ] 대본 길이 400-550단어 준수
- [ ] Host/Guest 대화 형식 구현
- [ ] 구어체 톤앤매너 적용
- [ ] PII 완전 제거 (2차 검증)
- [ ] TTS 메타데이터 완성
- [ ] Human Review 체크포인트 준비

### HITL 검증 체크포인트
1. **Phase A→B 전환 시**: SQL 결과 및 PII 마스킹 품질 검토
2. **Phase B 완료 시**: 대본 자연스러움, 정보 전달력, 안전성 최종 검토

## Constraints

### 기술적 제약사항
- **DB 접근**: SELECT만 허용, 대용량 테이블 Full Scan 금지
- **PII 처리**: 환자명, 의사명, 병원명, 연락처 마스킹 필수
- **성능**: 전체 파이프라인 30초 이내 완료
- **파일 저장**: `/output/daily-briefing/YYYY-MM-DD/` 구조 준수

### 콘텐츠 제약사항
- **길이**: 팟캐스트 3분 내외 (400-550단어)
- **톤**: 전문적이면서 친근한 구어체
- **구조**: 2인 대화 (Host/Guest) 형식 고정
- **안전성**: 의료진 윤리 준수, 환자 정보 보호

### 레퍼런스 가이드라인
- **The Daily (NYT)**: 대화 흐름 및 호흡 참조
- **뉴닉**: 핵심 정보 압축 기법 적용  
- **구어체 변환**: "읽는 글"이 아닌 "듣는 말"로 작성

## 에러 시나리오 대응
1. **SQL 결과 5건 미만**: 기간 확장 (48시간) 또는 기준 완화
2. **PII 마스킹 실패**: 해당 게시물 제외 후 차순위 선택
3. **대본 생성 실패**: 템플릿 기반 fallback 스크립트 사용
4. **Human Review 불합격**: 지적 사항 반영 후 재생성

**작업 우선순위**: P0 (Phase A) → P1 (Phase B) → P2 (시스템 개선)