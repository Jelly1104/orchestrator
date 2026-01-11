# PRD: 무찌마 일간 베스트 팟캐스트

| 항목 | 내용 |
|------|------|
| **Case ID** | case7-muzzima-podcast |
| **PRD 버전** | 2.0.0 |
| **작성일** | 2026-01-06 |
| **작성자** | ATO Team |
| **참조 문서** | DOMAIN_SCHEMA.md |

---

## Skills 연동

```yaml
skills:
  - leader      # HANDOFF 생성
  - query       # SQL 쿼리 생성 (일간 베스트 추출)
  - profiler    # 데이터 분석/요약
  - designer    # 대본 구조 설계
  - coder       # 대본 생성 로직 구현

output:
  analysis: docs/cases/case7-muzzima-podcast/analysis/
  design: docs/cases/case7-muzzima-podcast/
```

---

## 목적 (Objective)

무찌마 커뮤니티의 24시간 내 인기 게시물을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성한다.

> **요약**: "일간 베스트 게시물 5건을 3분 팟캐스트 대본으로 변환"

---

## 타겟 유저

| 항목 | 설명 |
|------|------|
| **Persona** | 시간 부족한 3040 봉직의/개원의 |
| **Pain Point** | 커뮤니티 정독 시간 부족 |
| **Needs** | 이동 중 오디오로 트렌드 파악 |
| **사용 시나리오** | 출퇴근 중 3분 팟캐스트 청취 |

---

## 핵심 기능

| ID | 기능명 | 설명 | Skill |
|----|--------|------|-------|
| F1 | 일간 베스트 추출 | BOARD_MUZZIMA에서 24시간 내 조회수/댓글 상위 5건 | query |
| F2 | PII 마스킹 | 환자/의사 개인정보 마스킹 처리 | profiler |
| F3 | 대본 생성 | Host/Guest 2인 대화 구어체 스크립트 | designer → coder |

---

## 데이터 요구사항

```yaml
tables:
  - name: BOARD_MUZZIMA
    columns: [BOARD_IDX, TITLE, CONTENT, VIEW_CNT, AGREE_CNT, REG_DATE]
    usage: 일간 베스트 게시물 추출
    constraints:
      - WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
      - LIMIT 10 이하
      - SELECT * 금지

  - name: COMMENT
    columns: [COMMENT_IDX, BOARD_IDX, CONTENT]
    usage: 댓글 반응 분석 (선택)
    constraints:
      - BOARD_IDX 인덱스 필수 사용
```

---

## 제약사항

| 카테고리 | 항목 | 설명 |
|----------|------|------|
| **보안** | PII 마스킹 | 환자/의사 식별정보 대본 포함 금지 |
| **성능** | 쿼리 시간 | 3초 미만 (인덱스 활용) |
| **규격** | 대본 길이 | 3분 (450~500 단어) |

---

## 산출물 체크리스트

- [ ] HANDOFF.md
- [ ] analysis/best_posts.sql
- [ ] analysis/analysis_report.md
- [ ] Podcast_Script.md (Host/Guest 대본)

---

**END OF PRD**
