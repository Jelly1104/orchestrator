# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 Agent | 우선순위 |
|-------------------|-----------|------------|----------|
| best_posts_query.sql | BOARD_MUZZIMA + COMMENT 조인 쿼리 작성 | DB Agent | P0 |
| raw_data_summary.json | PII 마스킹 후 JSON 구조화 | Data Agent | P0 |
| Podcast_Script.md | Host/Guest 2인 대화 스크립트 생성 | Content Agent | P1 |
| Audio_Metadata.json | TTS용 감정 태그 및 타이밍 정보 | Content Agent | P1 |

## Mode
**MIXED** (Coding + Analysis + Content Generation)

## Required Outputs

### Phase A 산출물
1. **best_posts_query.sql**
   - 레거시 테이블 기반 베스트 게시물 추출 쿼리
   - BOARD_MUZZIMA.REG_DATE >= 24시간 조건 필수
   - LIMIT 5, SELECT * 금지
   - 댓글수 가중치 적용 정렬

2. **raw_data_summary.json**
   - PII 마스킹 완료된 게시물 데이터
   - engagement_score 포함
   - 구조화된 JSON 형식

### Phase B 산출물
3. **Podcast_Script.md**
   - Host/Guest 2인 대화형 대본
   - 타임스탬프 포함 ([mm:ss] 형식)
   - 구어체 톤앤매너
   - 총 9분 분량

4. **Audio_Metadata.json**
   - TTS 설정 정보 (voice, speed, emotion)
   - 세그먼트별 타이밍
   - 감정 태그 매핑

## Input Documents

### 필수 참조 문서
- **DOMAIN_SCHEMA.md**: 레거시 DB 구조 (실제 컬럼명)
- **SDD.md**: 시스템 설계 및 API 스펙
- **IA.md**: Phase 구조 및 데이터 흐름

### 보조 참조 문서
- **AI_Playbook.md**: 톤앤매너 가이드라인
- **WIREFRAME.md**: 컴포넌트 구조

## Completion Criteria

### Phase A 완료 기준
- [ ] SQL 쿼리가 DOMAIN_SCHEMA.md의 실제 컬럼명 사용
- [ ] REG_DATE >= 24시간 조건 포함
- [ ] COMMENT 테이블 안전한 조회 (IN 절 사용)
- [ ] PII 마스킹 3단계 적용 (이름, 병원명, 연락처)
- [ ] JSON 구조가 SDD 스키마와 일치

### Phase B 완료 기준
- [ ] 대본에 타임스탬프 정확히 표기
- [ ] Host/Guest 역할 구분 명확
- [ ] 의료진 대상 적절한 톤앤매너
- [ ] TTS 메타데이터에 감정 태그 포함
- [ ] 총 재생시간 9분 내외

## Constraints

### 데이터 보안
- **PII 처리 필수**: 개인명, 의료기관명, 연락처 마스킹
- **민감 정보 보관 금지**: 원본 데이터 처리 후 즉시 삭제

### 성능 제약
- **대용량 테이블 주의**: COMMENT(1,826만), BOARD_MUZZIMA(337만)
- **쿼리 제한**: LIMIT 10 이하, WHERE 조건 필수
- **인덱스 활용**: (BOARD_IDX, SVC_CODE), (REG_DATE) 인덱스 사용

### 품질 기준
- **콘텐츠 품질**: 의료진이 이해하기 쉬운 용어 사용
- **팩트 체크**: 게시물 내용 왜곡 없이 요약
- **톤앤매너**: 전문적이면서도 친근한 대화체

### 기술 스택
- **쿼리 언어**: MySQL 8.0 문법
- **JSON 스키마**: RFC 7159 준수
- **마크다운**: CommonMark 스펙
- **TTS 호환성**: Azure Speech Services 형식

## Error Handling

### Phase A 에러 대응
- 베스트 게시물 5건 미만 시 → 가용한 만큼 처리 후 경고
- PII 마스킹 실패 시 → 해당 게시물 제외 후 대체 게시물 선택

### Phase B 에러 대응  
- 대본 생성 실패 시 → 템플릿 기반 기본 대본 생성
- 메타데이터 생성 실패 시 → 기본 TTS 설정으로 폴백

## Success Metrics
- **데이터 추출 정확도**: 베스트 게시물 선정 기준 100% 준수
- **PII 보호율**: 개인정보 마스킹 100% 완료
- **콘텐츠 품질**: 의료진 대상 가독성 80% 이상
- **기술 준수**: 레거시 DB 제약사항 100% 준수

---

**⚠️ 중요 알림**: 
1. 모든 SQL 쿼리는 DOMAIN_SCHEMA.md의 실제 컬럼명을 사용해야 합니다
2. COMMENT 테이블 접근 시 반드시 BOARD_IDX IN 절로 범위 제한
3. PII 마스킹 없이는 어떤 콘텐츠도 생성하지 마세요
4. Phase A 완료 후 Phase B 진행 (순차 실행)