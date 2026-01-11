# HANDOFF.md

> **버전**: 1.0.0 | **생성일**: 2026-01-07
> **Case ID**: 260107-lite-test/task-002-extension
> **생성자**: Leader Skill v2.0

---

## Pipeline

full

## TargetRole

Analyzer → Designer → Coder (순차 실행)

## TaskSummary

무찌마 커뮤니티 24시간 내 인기 게시물 5건을 분석하여 Host/Guest 2인 대화 형식의 3분 팟캐스트 대본을 생성한다.

---

## Phase A: Analysis (Analyzer)

### Input

- docs/cases/260107-lite-test/task-002-extension/PRD.md
- .claude/rules/DOMAIN_SCHEMA.md
- .claude/templates/query/SQL_PATTERNS.md

### Output

- docs/cases/260107-lite-test/task-002-extension/analysis/best_posts.sql
- docs/cases/260107-lite-test/task-002-extension/analysis/analysis_report.md

### Tasks

1. **일간 베스트 게시물 추출 SQL 작성**
   - 테이블: `BOARD_MUZZIMA`
   - 컬럼: `BOARD_IDX`, `TITLE`, `CONTENT`, `READ_CNT`, `AGREE_CNT`, `REG_DATE`
   - 조건: `REG_DATE >= NOW() - INTERVAL 24 HOUR`
   - 정렬: `READ_CNT + AGREE_CNT DESC`
   - 제한: `LIMIT 5`

2. **댓글 반응 분석 (선택)**
   - 테이블: `COMMENT`
   - 조건: `BOARD_IDX` 인덱스 활용 필수
   - 용도: 베스트 게시물별 댓글 수 집계

3. **분석 리포트 작성**
   - 게시물별 주제 요약
   - 트렌드 키워드 추출
   - 대본 소재로 활용할 핵심 포인트

### Constraints

- SELECT 쿼리만 사용
- DOMAIN_SCHEMA.md 컬럼명 정확히 준수
- 대용량 테이블(COMMENT) 접근 시 LIMIT/WHERE 필수
- 쿼리 실행 시간 3초 미만

### CompletionCriteria

- SQL 문법 유효
- 5건 이상 결과 반환
- 리포트에 게시물별 요약 포함

---

## Phase B: Design (Designer)

### Input

- docs/cases/260107-lite-test/task-002-extension/PRD.md
- docs/cases/260107-lite-test/task-002-extension/analysis/analysis_report.md
- .claude/templates/designer/IA_TEMPLATE.md

### Output

- docs/cases/260107-lite-test/task-002-extension/IA.md
- docs/cases/260107-lite-test/task-002-extension/Wireframe.md
- docs/cases/260107-lite-test/task-002-extension/SDD.md

### Tasks

1. **IA (정보 구조) 작성**
   - 팟캐스트 대본 구조 정의
   - Host/Guest 역할 분담
   - 섹션별 시간 배분 (Intro/Main/Outro)

2. **Wireframe 작성**
   - 대본 포맷 시각화
   - 발화자 구분 형식
   - 타임코드 표기 방식

3. **SDD (설계 명세) 작성**
   - 대본 생성 컴포넌트 정의
   - 입력: 분석 결과 (베스트 5건)
   - 출력: Podcast_Script.md
   - PII 마스킹 로직 명세

### Constraints

- 대본 길이: 3분 (450~500 단어)
- Host/Guest 2인 대화 구어체
- PII 마스킹 필수 (환자/의사 식별정보)

### CompletionCriteria

- IA 계층 구조 완성
- Wireframe 대본 포맷 정의
- SDD 컴포넌트/함수 명세 포함
- 엔트리포인트 연결 가이드 포함

---

## Phase C: Implementation (Coder)

### Input

- docs/cases/260107-lite-test/task-002-extension/HANDOFF.md
- docs/cases/260107-lite-test/task-002-extension/SDD.md
- docs/cases/260107-lite-test/task-002-extension/analysis/analysis_report.md
- .claude/rules/DOMAIN_SCHEMA.md

### Output

- docs/cases/260107-lite-test/task-002-extension/Podcast_Script.md

### Tasks

1. **대본 생성 로직 구현**
   - 분석 결과 기반 대본 템플릿 적용
   - Host/Guest 대화 흐름 생성
   - 구어체 변환

2. **PII 마스킹 처리**
   - 환자 정보 마스킹
   - 의사 식별정보 마스킹
   - 개인정보 패턴 탐지

3. **최종 대본 생성**
   - 450~500 단어 (3분 분량)
   - Intro (30초) / Main (2분) / Outro (30초)
   - 발화자 구분 명확

### Constraints

- PRD 직접 참조 금지 (SDD만 참조)
- TypeScript 사용 (코드 산출물인 경우)
- PII 마스킹 필수

### CompletionCriteria

- Podcast_Script.md 생성
- 단어 수 450~500 범위
- PII 마스킹 적용 확인
- Host/Guest 발화 구분

---

## Skills 실행 순서

```yaml
Phase A:
  - /query   # SQL 쿼리 생성
  - /profiler # 분석 리포트 작성

Phase B:
  - /designer # IA, Wireframe, SDD 작성

Phase C:
  - /coder   # 대본 생성 로직 구현
```

---

## 참조 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| PRD | docs/cases/260107-lite-test/task-002-extension/PRD.md | 요구사항 원본 |
| DB 스키마 | .claude/rules/DOMAIN_SCHEMA.md | 테이블/컬럼 정의 |
| SQL 패턴 | .claude/templates/query/SQL_PATTERNS.md | 쿼리 작성 가이드 |
| 세그먼트 규칙 | .claude/templates/profiler/SEGMENT_RULES.md | 분석 규칙 |

**END OF HANDOFF.md**
