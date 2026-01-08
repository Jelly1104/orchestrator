# PRD: 메디게이트 무찌마 일간 베스트 팟캐스트 (Daily Briefing)

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **Case ID**   | case7-muzzima-podcast-20251226                      |
| **PRD 버전**  | 2.0.0                                               |
| **작성일**    | 2025-12-29                                          |
| **작성자**    | ATO Team                                            |
| **Type**      | MIXED                                               |
| **Pipeline**  | mixed                                               |
| **참조 문서** | PRD_GUIDE.md, DOMAIN_SCHEMA.md, DB_ACCESS_POLICY.md |

---

## 1. 목적 (Objective)

의사 커뮤니티 '무찌마'의 지난 24시간 내 인기 게시물을 분석 및 요약하여, **2인 대화(Host-Guest) 형식의 팟캐스트 대본**으로 변환함으로써 바쁜 의사 회원들이 이동 중 오디오로 트렌드를 소비할 수 있게 한다.

> **요약**: "무찌마 인기 게시물을 분석하여 3분 팟캐스트 대본을 생성한다"

---

## 2. 타겟 유저 (Target User)

| 항목              | 설명                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| **Persona**       | 진료와 학회 일정으로 커뮤니티를 정독할 시간이 부족한 3040 봉직의/개원의 |
| **Pain Point**    | 하루 10분도 커뮤니티 확인 시간이 없음, 텍스트 피로감                    |
| **Needs**         | "오늘 동료 의사들 사이에서 가장 핫한 이슈"를 3분 내외의 오디오로 파악   |
| **사용 시나리오** | 출퇴근 운전 중, 점심시간 이동 중, 운동 중 이어폰으로 청취               |

---

## 3. 핵심 기능 (Core Features)

| ID  | Phase | 기능명           | 설명                                                                       | 검증 방법                          |
| --- | ----- | ---------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| F1  | A     | 일간 베스트 추출 | 최근 24시간 BOARD_MUZZIMA 중 `(READ_CNT + AGREE_CNT*3)` 기준 상위 5건 선정 | SQL 실행 결과 5건 반환 확인        |
| F2  | A     | PII 전처리       | 게시물 본문 내 환자명, 의사 실명, 병원명 마스킹                            | 마스킹 패턴 적용 확인 (`***` 치환) |
| F3  | B     | 대본 생성        | 요약된 내용을 2인 대화(Host/Guest) 형식의 구어체 스크립트로 변환           | 대본 내 호칭(Host:/Guest:) 존재    |
| F4  | B     | 메타데이터 생성  | TTS용 감정 태그 및 발화 속도 가이드 포함                                   | JSON 스키마 유효성                 |

---

## 4. 성공 지표 (Success Criteria)

### 4.1 정량적 지표 (Phase A - 자동 검증)

| 지표             | 목표값 | 측정 방법         | 실패 시 조치     |
| ---------------- | ------ | ----------------- | ---------------- |
| SQL 실행 시간    | < 3초  | `EXPLAIN ANALYZE` | 인덱스 힌트 추가 |
| SELECT \* 발생률 | 0%     | SQL 정적 분석     | 쿼리 수정 필수   |
| 결과 행 수       | 5건    | COUNT 체크        | LIMIT 조정       |
| PII 마스킹률     | 100%   | 패턴 매칭 검증    | 2차 마스킹 수행  |

### 4.2 정성적 지표 (Phase B - HITL 검증)

| 지표              | 판단 기준                               | 검증자                     |
| ----------------- | --------------------------------------- | -------------------------- |
| 구어체 자연스러움 | "읽는 글"이 아닌 "듣는 말"로 느껴지는가 | Human Reviewer             |
| 정보 전달력       | 원문 핵심 내용이 누락 없이 전달되는가   | Human Reviewer             |
| PII 완전 제거     | 최종 대본에 식별 가능 정보가 없는가     | Human Reviewer             |
| 대본 길이         | TTS 변환 시 2분 30초 ~ 3분 30초         | 단어 수 측정 (400~550단어) |

---

## 5. PRD 유형 및 파이프라인

```yaml
type: MIXED
pipeline: mixed
rationale: "SQL을 통한 정량적 데이터 확보(Phase A)가 선행되어야 대본 작성(Phase B)이 가능함"

phases:
  - id: A
    name: Analysis
    agent: AnalysisAgent
    input: PRD + DOMAIN_SCHEMA.md
    output: SQL, raw_data_summary.json

  - id: B
    name: Design
    agent: LeaderAgent
    input: Phase A 결과물
    output: Podcast_Script.md, Audio_Metadata.json
```

---

## 6. 데이터 요구사항 (Data Requirements)

### 6.1 대상 테이블

```yaml
data_requirements:
  tables:
    - name: BOARD_MUZZIMA
      columns:
        [
          BOARD_IDX,
          CTG_CODE,
          U_ID,
          TITLE,
          CONTENT,
          READ_CNT,
          AGREE_CNT,
          REG_DATE,
        ]
      row_count: 3,370,000
      risk_level: HIGH
      index_columns: [CTG_CODE, REG_DATE]

    - name: COMMENT
      columns: [COMMENT_IDX, BOARD_IDX, SVC_CODE, CONTENT, REG_DATE]
      row_count: 18,260,000
      risk_level: EXTREME
      usage: optional (댓글 수 집계용)

db_connection:
  host: "222.122.26.242"
  database: "medigate"
  account: "ai_readonly"
  permission: SELECT_ONLY
```

### 6.2 SQL 제약 사항

| #   | 제약 사항                                         | 검증 방법             |
| --- | ------------------------------------------------- | --------------------- |
| 1   | `WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR` 필수 | SQL 파싱              |
| 2   | `LIMIT 10` 이하                                   | SQL 파싱              |
| 3   | `SELECT *` 금지                                   | 정규식 매칭           |
| 4   | `CONTENT` 전체 조회 시 `LEFT(CONTENT, 500)` 권장  | WARNING               |
| 5   | 민감 컬럼(U_NAME, U_EMAIL 등) 조회 금지           | DB_ACCESS_POLICY 참조 |

---

## 7. 레퍼런스 서비스 (Reference)

| 서비스              | 참고 패턴              | 적용 포인트                           |
| ------------------- | ---------------------- | ------------------------------------- |
| **The Daily (NYT)** | 2인 대화 팟캐스트      | Host-Guest 대화 구조, 자연스러운 호흡 |
| **뉴닉 (NEWNEEK)**  | 콘텐츠 큐레이션 + 요약 | 핵심만 추출, MZ 친화적 톤앤매너       |
| **요약봇 서비스**   | 긴 글 3줄 요약         | 정보 압축 기법                        |

---

## 8. 산출물 체크리스트 (Deliverables)

### Phase A (Analysis) - AnalysisAgent

```yaml
deliverables:
  - name: "best_posts_query.sql"
    type: SQL_QUERY
    criteria:
      - SELECT문만 사용
      - DOMAIN_SCHEMA.md 컬럼명 정확 사용
      - 인덱스 활용 WHERE 조건 포함
      - LIMIT 10 이하
    validation: VALIDATION_GUIDE.md 섹션 2.1

  - name: "raw_data_summary.json"
    type: ANALYSIS_TABLE
    criteria:
      - 상위 5개 게시물 정보 포함
      - PII 1차 마스킹 완료
      - 필수 필드: title, summary, view_count, agree_count, comment_count
    validation: JSON 스키마 검증
```

### Phase B (Design) - LeaderAgent

```yaml
deliverables:
  - name: "Podcast_Script.md"
    type: REPORT
    criteria:
      - Host/Guest 대화 형식
      - 구어체 사용 (문어체 금지)
      - 총 단어 수 400~550
      - PII 완전 제거
    validation: Human Review (HITL)

  - name: "Audio_Metadata.json"
    type: METADATA
    criteria:
      - emotion_tags 배열 존재
      - speaking_rate 값 존재 (0.8~1.2)
      - total_duration_estimate 존재
    validation: JSON 스키마 검증

  - name: "Content_Safety_Check.md"
    type: REPORT
    criteria:
      - PII 검증 결과 포함
      - 민감 표현 검토 결과 포함
      - Reviewer 서명
    validation: Human Review (HITL)
```

---

## 9. 제약사항 (Constraints)

| 카테고리     | 항목       | 설명                                          |
| ------------ | ---------- | --------------------------------------------- |
| **보안**     | PII 마스킹 | 환자명, 의사 실명, 병원명, 연락처 마스킹 필수 |
| **보안**     | DB 접근    | `DB_ACCESS_POLICY.md` 준수, SELECT만 허용     |
| **성능**     | 쿼리 제한  | 대용량 테이블 Full Scan 금지                  |
| **규격**     | 대본 길이  | TTS 변환 시 3분 (400~550 단어)                |
| **톤앤매너** | 구어체     | 존댓말, 자연스러운 대화체                     |

---

## 10. HITL 체크포인트

| Phase  | 체크포인트     | 승인 조건                        | 실패 시        |
| ------ | -------------- | -------------------------------- | -------------- |
| A→B    | SQL 결과 검증  | 5건 추출, PII 마스킹 확인        | Phase A 재실행 |
| B 완료 | 대본 품질 검증 | 구어체 자연스러움, PII 완전 제거 | 대본 수정 요청 |
| 최종   | 안전성 검증    | Content_Safety_Check 통과        | 배포 보류      |

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                                                                                 |
| ----- | ---------- | --------------------------------------------------------------------------------------------------------- |
| 2.0.0 | 2025-12-29 | PRD_GUIDE.md v2.1 기준 전면 개정, YAML 형식 정규화, 성공 지표 정량화, 레퍼런스 추가, HITL 체크포인트 명시 |
| 1.1.0 | 2025-12-26 | 초기 버전                                                                                                 |

---

**END OF PRD**
