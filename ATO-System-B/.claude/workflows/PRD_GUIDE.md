# PRD 통합 가이드 v2.1

> **문서 버전**: 2.1.0
> **최종 업데이트**: 2025-12-29
> **물리적 경로**: `.claude/workflows/PRD_GUIDE.md`
> **다이어그램**: README.md 섹션 7 참조

---

## 로딩 설정

| Role | 로딩 문서 |
|------|----------|
| PRDAnalyzer | 이 문서 |
| Leader | 이 문서 (섹션 1-2만) |

---

## 1. PRD 필수 항목 (6개)

| 항목 | 질문 | 검증 기준 |
|------|------|----------|
| **목적** (Objective) | 왜 만드는가? | "~를 위해 ~를 만든다" 형태로 요약 가능 |
| **타겟 유저** (Target User) | 누가 쓰는가? | 페르소나/역할 명확 정의 |
| **핵심 기능** (Core Features) | 무엇을 하는가? | 테스트 가능한 단위 (동사+목적어) |
| **성공 지표** (Success Criteria) | 어떻게 판단? | 정량 측정 또는 명확한 완료 조건 |
| **PRD 유형** (Type) | 정량/정성/혼합? | 섹션 1.1 매트릭스 참조 |
| **파이프라인** (Pipeline) | 어떤 Phase? | type과 매칭 확인 |

### 1.1 유형-파이프라인 매칭

| Type | Pipeline | 설명 |
|------|----------|------|
| QUANTITATIVE | analysis / mixed | SQL 실행, 수치 분석 |
| QUALITATIVE | design / code | UX 설계, 제안서 |
| MIXED | mixed | 정량→정성 2단계 |

---

## 2. 유형 판별 기준

### 2.1 키워드 기반 판별

```yaml
quantitative_keywords:
  - 분석, 통계, 세그먼트, 코호트, KPI, SQL, 쿼리

qualitative_keywords:
  - 설계, UX, UI, 제안, 추천, 여정, 플로우

mixed_indicators:
  - "분석 → 제안", "데이터 기반 인사이트"
```

### 2.2 산출물 기반 판별

| 산출물 | 정량 | 정성 | 혼합 |
|--------|:----:|:----:|:----:|
| SQL 쿼리 | ✅ | | |
| 분석 테이블/차트 | ✅ | | ✅ |
| 설계 문서 (IA, Wireframe) | | ✅ | ✅ |
| 제안서/인사이트 | | ✅ | ✅ |

---

## 3. 유형별 파이프라인 요약

### 3.1 정량적 (Analysis)

```
PRD → 데이터 요구사항 파싱 → SQL 생성 → 실행 → 결과 해석
산출물: *.sql, analysis_result.json, report.md
```

### 3.2 정성적 (Design)

```
PRD → 컨텍스트 수집 → 레퍼런스 매칭 → 설계 초안 → HITL 승인 → 상세화
산출물: IA.md, Wireframe.md, proposal.md
```

> **HITL 참조**: ROLE_ARCHITECTURE.md의 HITL 체크포인트 섹션 참조

### 3.3 혼합 (Mixed)

```
Phase A: 정량 (SQL → 데이터) → Phase B: 정성 (해석 → 제안)
산출물: *.sql + insight_report.md + proposal.md
```

---

## 4. 레퍼런스 자동 매핑

| 카테고리 | 키워드 | 레퍼런스 | 핵심 패턴 |
|----------|--------|----------|----------|
| 데이터 분석 | 분석, 세그먼트 | Amplitude, Mixpanel | 필터→그룹핑→비교 |
| CRUD 서비스 | 관리, 목록, 등록 | Admin 템플릿 | 검색+필터+테이블 |
| 온보딩 | 가이드, 튜토리얼 | Slack, Notion | 단계별→체크리스트 |
| 시각화 | 차트, 대시보드 | GA, Tableau | KPI 카드+트렌드 |

---

## 5. 산출물 타입 정의

| Type | 설명 | 검증 기준 |
|------|------|----------|
| `SQL_QUERY` | SQL 쿼리 | 문법 유효, DOMAIN_SCHEMA 일치 |
| `ANALYSIS_TABLE` | 분석 테이블 | 데이터 존재, 헤더 정의 |
| `REPORT` | Markdown 리포트 | 필수 섹션 존재 |
| `PROPOSAL` | 제안서/인사이트 | 액션 아이템 포함 |
| `IA_DOCUMENT` | 정보 구조 | 레벨 구조, 네이밍 |
| `WIREFRAME` | 화면 구조 | ASCII/Markdown 형식 |
| `SDD` | 설계 명세 | API/컴포넌트 정의 |
| `CODE` | 소스 코드 | 실행/테스트 가능 |

---

## 6. 조건부 필수 항목

### 6.1 데이터 요구사항 (정량 PRD 필수)

```yaml
data_requirements:
  tables:
    - name: USERS
      columns: [U_ID, U_KIND, U_ALIVE]

db_connection:
  host: "222.122.26.242"
  database: "medigate"
```

### 6.2 산출물 체크리스트 (권장)

```yaml
deliverables:
  - name: "활성 회원 세그먼트 SQL"
    type: SQL_QUERY
    criteria: "HEAVY 조건, SELECT문"
```

---

## 7. PRD 완성도 체크

| 구분 | 항목 | 체크 |
|------|------|:----:|
| 필수 | 목적, 타겟, 기능, 지표, type, pipeline | [ ] |
| 조건부 | 데이터 요구사항 (정량 시) | [ ] |
| 선택 | 참조 서비스, 제약사항 | [ ] |

**검증 규칙**:
1. 필수 6개 미충족 → PRD 보완 요청
2. QUANTITATIVE/MIXED인데 데이터 요구사항 없음 → 보완 요청
3. type-pipeline 불일치 → 경고

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| DOMAIN_SCHEMA.md | 테이블/컬럼 정의 (정량 PRD 필수) |
| ROLE_ARCHITECTURE.md | HITL 체크포인트 |
| VALIDATION_GUIDE.md | 산출물 검증 기준 |
| README.md | 파이프라인 다이어그램 (섹션 7) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.1.0 | 2025-12-29 | 300줄 다이어트: Mermaid→README.md, 파이프라인 상세→요약 |
| 2.0.6 | 2025-12-26 | 섹션 참조 이름 기반 전환 |

---

**END OF PRD_GUIDE.md**
