📝 PRD: 메디게이트 무찌마 일간 베스트 팟캐스트 (Daily Briefing)
Case ID: case7-muzzima-podcast-20251226 PRD 버전: 1.1.0 (Refined) 작성일: 2025-12-26 작성자: ATO Team Type: MIXED (데이터 분석 + 콘텐츠 생성) Pipeline: mixed 참조 문서: PRD_GUIDE.md, DOMAIN_SCHEMA.md

1. 목적 (Objective)
   의사 커뮤니티 '무찌마'의 지난 24시간 내 인기 게시물을 분석 및 요약하여, 2인 대화(Host-Guest) 형식의 팟캐스트 대본으로 변환함으로써 바쁜 의사 회원들이 이동 중 오디오로 트렌드를 소비할 수 있게 한다.
2. 타겟 유저 (Target User)
   • Persona: 진료와 학회 일정으로 커뮤니티를 정독할 시간이 부족한 3040 봉직의/개원의.
   • Needs: "오늘 동료 의사들 사이에서 가장 핫한 이슈"를 3분 내외의 오디오로 파악하고 싶음.
3. 핵심 기능 (Core Features)
   ID
   Phase
   기능명
   설명
   구현 담당
   F1
   A
   일간 베스트 추출
   최근 24시간 BOARD_MUZZIMA 중 조회수/댓글 상위 게시물 5건 선정 (SQL)
   AnalysisAgent
   F2
   A
   PII 전처리
   게시물 본문 내 환자 개인정보, 의사 실명 등 민감 정보 1차 마스킹
   AnalysisAgent
   F3
   B
   대본 생성
   요약된 내용을 2인 대화(Host/Guest) 형식의 구어체 스크립트로 변환
   LeaderAgent
   F4
   B
   메타데이터 생성
   TTS용 감정 태그(Emotion Tag) 및 발화 속도 가이드 포함
   LeaderAgent
4. 성공 지표 (Success Criteria)
   정량적 지표 (Phase A)
   • SQL 성능: 대용량 테이블(BOARD_MUZZIMA) 조회 시 쿼리 실행 시간 3초 미만 (인덱스 활용 필수).
   • 안정성: SELECT \* 발생률 0% (필요 컬럼만 명시).
   정성적 지표 (Phase B)
   • 대본 품질: '읽는 글'이 아닌 '듣는 말(구어체)'로 자연스럽게 변환되었는가?
   • 보안 준수: 최종 대본에 PII(환자/의사 식별 정보)가 포함되지 않았는가?.
5. PRD 유형 및 파이프라인
   • Type: MIXED (데이터 추출 후 창작물 생성 필요).
   • Rationale: SQL을 통한 정량적 데이터 확보(Phase A)가 선행되어야 대본 작성(Phase B)이 가능함.
6. 데이터 요구사항 (Data Requirements)
   대상 테이블 (Source)
   • BOARD_MUZZIMA: 337만 행, 위험도 High.
   • COMMENT: 1,826만 행, 위험도 Extreme (필요 시 댓글 반응 분석용).
   필수 제약 사항 (Constraints for AnalysisAgent)
7. 인덱스 강제: WHERE REG_DATE >= ... 조건을 사용하여 반드시 (CTG_CODE, REG_DATE) 복합 인덱스를 타야 함.
8. 조회 제한: LIMIT 10 이하로 제한하여 메모리 오버헤드 방지.
9. 컬럼 화이트리스트: CONTENT 전체 조회 시 텍스트 양이 많으므로, 필요 시 LEFT(CONTENT, 500) 등으로 요약 조회 권장.
10. 금지 사항: SELECT \* 절대 사용 금지. (TITLE, VIEW_CNT, REG_DATE 등 명시).
11. 산출물 체크리스트 (Artifacts)
    Phase A (Analysis)
    • [ ] best_posts_query.sql (Type: SQL_QUERY) - 실행 계획 포함 권장
    • [ ] raw_data_summary.json (Type: ANALYSIS_TABLE) - PII 마스킹 된 원본 요약
    Phase B (Design)
    • [ ] Podcast_Script.md (Type: REPORT) - Host/Guest 대화형 대본
    • [ ] Audio_Metadata.json (Type: METADATA) - TTS 설정 값
    • [ ] Content_Safety_Check.md (Type: REPORT) - Reviewer의 PII 검증 결과.
12. 제약사항 (Constraints)
    • 보안: DB_ACCESS_POLICY.md에 따라 환자 정보가 포함될 수 있는 텍스트는 반드시 마스킹 처리 후 대본으로 가공해야 함.
    • 규격: 대본 길이는 TTS 변환 시 3분(약 450~500 단어)을 넘지 않도록 조절.
