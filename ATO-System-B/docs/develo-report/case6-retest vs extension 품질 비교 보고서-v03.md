# case6-retest vs extension 품질 비교 보고서 v03

> **작성일**: 2025-12-24
> **작성자**: ATO-System-B 개발팀
> **버전**: v03
> **목적**: case6-retest6 (최종 개선) vs case6-extension1 (확장 모드) 산출물 품질 비교

---

## 핵심 요약 (Executive Summary)

### 결론: 용도에 따른 선택 권장

| 관점 | 우세 | 점수 |
|------|------|------|
| 화면 설계 풍부함 | 🏆 **retest6** | Wireframe +25% |
| 구현 준비도 | 🏆 **extension1** | SDD 포함 |
| 레거시 호환성 | 🏆 **extension1** | DOMAIN_SCHEMA 명시 |
| 실제 배포 가능성 | 🏆 **extension1** | 에러 상태 + DB 제약 |

**권장 사용 시나리오**:
- **화면 기획 단계** → retest6 참조 (7개 화면, 11개 컴포넌트)
- **실제 구현 단계** → extension1 참조 (SDD + 레거시 매핑 + 쿼리)

---

## 1. 파일 크기 비교

### 1.1 전체 산출물 크기

| 산출물 | retest6 | extension1 | 차이 | 평가 |
|--------|---------|------------|------|------|
| IA.md | 7,246 bytes | 7,243 bytes | -3 bytes | 🟢 동일 |
| Wireframe.md | **40,331 bytes** | 32,218 bytes | **+8,113 (+25%)** | 🟢 retest6 우세 |
| SDD.md | ❌ 없음 | **20,359 bytes** | - | 🟢 extension1만 보유 |
| **합계** | ~48KB | ~60KB | +12KB | extension1 (SDD 포함) |

### 1.2 크기 비교 그래프

```
IA.md 크기 (bytes)
8000 ┤ ▲ retest6 (7,246)    ▲ extension1 (7,243)
7000 ┤ █                    █
6000 ┤ █                    █
5000 ┤ █                    █
4000 ┤ █                    █
3000 ┤ █                    █
2000 ┤ █                    █
1000 ┤ █                    █
   0 ┼────────────────────────
         retest6         extension1
                 (거의 동일)


Wireframe.md 크기 (bytes)
45000 ┤ ▲ retest6 (40,331)
40000 ┤ █
35000 ┤ █                    ▲ extension1 (32,218)
30000 ┤ █                    █
25000 ┤ █                    █
20000 ┤ █                    █
15000 ┤ █                    █
10000 ┤ █                    █
 5000 ┤ █                    █
    0 ┼────────────────────────
         retest6         extension1
              (+25% 우세)


SDD.md 크기 (bytes)
25000 ┤                      ▲ extension1 (20,359)
20000 ┤                      █
15000 ┤                      █
10000 ┤                      █
 5000 ┤                      █
    0 ┤ ░░ 없음              █
      ┼────────────────────────
         retest6         extension1
              (extension1만 보유)
```

---

## 2. IA.md 품질 상세 비교

### 2.1 섹션별 비교

| 섹션 | retest6 | extension1 | 평가 |
|------|---------|------------|------|
| 라우팅 구조 | 32개 라우팅 | 5개 메인 라우트 | 🟢 retest6 상세 |
| 페이지 계층 | 5 Level, 8섹션 | 7섹션 | 🟢 동등 |
| 데이터 흐름 | 입출력 상세 흐름 | 상세 흐름 다이어그램 | 🟢 동등 |
| 반응형 구조 | Desktop/Tablet/Mobile | Desktop/Tablet/Mobile | 🟢 동등 |
| 사용자 권한별 뷰 | AI PM, QA, DevOps | ❌ 없음 | 🟢 retest6 우세 |
| **레거시 스키마 매핑** | ❌ 없음 | ✅ DOMAIN_SCHEMA 테이블 | 🟢 **extension1 우세** |
| 접근성 | 키보드/스크린리더 | WCAG AA 준수 | 🟢 동등 |
| 성능 최적화 | 캐싱 전략 포함 | ❌ 없음 | 🟢 retest6 우세 |

### 2.2 retest6 IA.md 특징

```
✅ 강점:
├─ 5 Level 계층구조 (8개 메인 섹션)
├─ 32개 상세 라우팅 정의
├─ 사용자 권한별 뷰 구조 (AI PM, QA, DevOps)
├─ 검색 및 필터링 구조
├─ 알림 및 상태 시스템
├─ 성능 최적화 (캐싱 전략)
└─ 접근성 (키보드/스크린리더)

❌ 약점:
└─ 레거시 스키마 매핑 없음
```

### 2.3 extension1 IA.md 특징

```
✅ 강점:
├─ 명확한 5개 라우팅 구조
├─ 상세 페이지 계층 (Header → KPI → Filter → Chart → Table → Footer)
├─ 데이터 흐름 다이어그램
├─ 🌟 레거시 스키마 매핑 테이블 (DOMAIN_SCHEMA.md 참조)
│   ├─ USERS: U_KIND, U_ALIVE
│   ├─ USER_DETAIL: U_MAJOR_CODE_1
│   ├─ USER_LOGIN: LOGIN_DATE, U_ID
│   └─ CODE_MASTER: CODE_TYPE, CODE_NAME
├─ 반응형 브레이크포인트 테이블
└─ WCAG AA 접근성 명시

❌ 약점:
├─ 권한별 뷰 구조 없음
└─ 성능 최적화 전략 없음
```

---

## 3. Wireframe.md 품질 상세 비교

### 3.1 화면 구성 비교

| 항목 | retest6 | extension1 | 평가 |
|------|---------|------------|------|
| **화면 수** | **7개** | 4개 | 🟢 retest6 +75% |
| ASCII 와이어프레임 | 50+ lines/화면 | 40+ lines/화면 | 🟢 retest6 우세 |
| 모바일 레이아웃 | ✅ Bottom Tab 포함 | ✅ 모바일 전용 | 🟢 동등 |
| **컴포넌트 매핑** | **11개** | 3개 | 🟢 retest6 +267% |
| 상호작용 정의 | 애니메이션 포함 | 인터랙션 플로우 | 🟢 동등 |
| **에러/로딩 상태** | ❌ 없음 | ✅ 3가지 상태 | 🟢 **extension1 우세** |
| **DB 제약 표시** | ❌ 없음 | ✅ LIMIT, 타임아웃 | 🟢 **extension1 우세** |

### 3.2 화면 목록 비교

| # | retest6 화면 | extension1 화면 |
|---|-------------|-----------------|
| 1 | Overview (메인 대시보드) | 메인 대시보드 (Desktop/Mobile) |
| 2 | Phase A: 정량적 분석 | 로그인 패턴 분석 (Heatmap) |
| 3 | Phase B: 정성적 설계 | 세그먼트 상세 |
| 4 | Phase C: 코드 구현 | 컴포넌트 명세 |
| 5 | HITL 체크포인트 | - |
| 6 | 모바일 반응형 | - |
| 7 | 시스템 모니터링 | - |

### 3.3 retest6 Wireframe.md 특징

```
✅ 강점:
├─ 7개 화면 (Phase A/B/C + HITL + 모바일)
├─ 11개 컴포넌트 매핑 테이블
│   ├─ 공통: AppHeader, ProgressBar, StatusBadge, TabNavigation, PhaseCard, AlertCard
│   └─ 특화: QueryList, DocumentViewer, CodeProgress, ApprovalCard, MetricsPanel
├─ 상호작용 및 애니메이션 정의
├─ 반응형 전환 규칙 (slide-left, slide-up)
├─ 데이터 흐름 다이어그램
└─ 50+ lines 상세 와이어프레임

❌ 약점:
├─ 에러/로딩/Empty 상태 UI 없음
└─ DB 제약사항 (LIMIT, 타임아웃) 표시 없음
```

### 3.4 extension1 Wireframe.md 특징

```
✅ 강점:
├─ 🌟 에러 상태 UI 정의
│   ├─ 로딩 상태: "◌ 로딩 중..."
│   ├─ 에러 상태: "⚠️ 오류 발생" + 재시도 버튼
│   └─ Empty 상태: "📭 데이터 없음" + 필터 초기화
├─ 🌟 DB 제약사항 명시
│   ├─ "⚠️ USER_LOGIN 대용량 테이블 - 10,000행 제한"
│   ├─ "타임아웃: 30초"
│   └─ "권장 조회 기간: 최근 3개월"
├─ 상세 컴포넌트 Props 정의 (TypeScript)
├─ 인터랙션 플로우 다이어그램
└─ Heatmap 전용 화면 (시간대 x 요일)

❌ 약점:
├─ 4개 화면만 정의
└─ 컴포넌트 3개만 명세
```

---

## 4. SDD.md 비교 (extension1만 보유)

### 4.1 extension1 SDD.md 구성

| 섹션 | 내용 | 가치 |
|------|------|------|
| 아키텍처 개요 | 3-Tier 다이어그램 (Client → API → DB) | 🟢 구현 가이드 |
| 기술 스택 | React 18, Express, Knex, MySQL 8 | 🟢 환경 설정 |
| **레거시 스키마 매핑** | USERS, USER_DETAIL, USER_LOGIN 상세 | 🟢 **핵심** |
| API 설계 | 6개 엔드포인트, TypeScript 인터페이스 | 🟢 구현 명세 |
| 쿼리 설계 | 3개 SQL (세그먼트, 분포, 로그인패턴) | 🟢 **핵심** |
| Frontend 구조 | FSD 패턴, 디렉토리 구조 | 🟢 구현 가이드 |
| Backend 구조 | Repository 패턴, 코드 예시 | 🟢 구현 가이드 |
| 보안 고려 | DB_ACCESS_POLICY 준수 | 🟢 **필수** |
| 테스트 전략 | 단위/통합 테스트 예시 | 🟢 품질 보증 |

### 4.2 SDD.md 핵심 내용

#### 레거시 스키마 매핑 (DOMAIN_SCHEMA.md 준수)

```sql
-- USERS 테이블
U_ID            VARCHAR(14) PRIMARY KEY  -- 회원 ID
U_KIND          CHAR(6)                   -- 회원 유형 (DOC001, PHA001 등)
U_ALIVE         CHAR(6) DEFAULT 'Y'       -- 활성 여부 ('Y'/'N')

-- USER_DETAIL 테이블
U_MAJOR_CODE_1  CHAR(6)                   -- 전문과목 (IM, GS, PSY 등)
U_WORK_TYPE_1   CHAR(6)                   -- 근무형태 (OWN, EMP, RES 등)

-- USER_LOGIN 테이블 (⚠️ 대용량)
LOGIN_DATE      DATETIME                  -- 로그인 일시
-- 제약: LIMIT 10,000, 타임아웃 30초
```

#### API 엔드포인트 설계

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | KPI 요약 |
| GET | `/api/analytics/segments` | 세그먼트 목록 (Pagination) |
| GET | `/api/analytics/segments/:id` | 세그먼트 상세 |
| GET | `/api/analytics/distribution` | 전문과목 분포 |
| GET | `/api/analytics/login-patterns` | 로그인 패턴 (LIMIT 10000) |
| GET | `/api/analytics/login-trend` | 로그인 트렌드 (30일) |

#### 쿼리 설계 예시

```sql
-- 세그먼트 조회 (DOMAIN_SCHEMA 5.3 패턴)
SELECT
  u.U_KIND as segment_id,
  cm.CODE_NAME as segment_name,
  COUNT(*) as member_count,
  ROUND(SUM(CASE WHEN u.U_ALIVE = 'Y' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as active_rate
FROM USERS u
LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'U_KIND' AND cm.CODE_VALUE = u.U_KIND
GROUP BY u.U_KIND, cm.CODE_NAME;
```

---

## 5. 종합 품질 점수

### 5.1 항목별 점수 (10점 만점)

| 평가 항목 | retest6 | extension1 | 비고 |
|-----------|---------|------------|------|
| IA 완성도 | 9 | 8 | retest6: 권한별 뷰, 성능 전략 |
| IA 레거시 호환 | 5 | **10** | extension1: DOMAIN_SCHEMA 매핑 |
| Wireframe 화면 수 | **10** | 6 | retest6: 7개 vs 4개 |
| Wireframe 상세도 | **9** | 8 | retest6: 50+ lines/화면 |
| Wireframe 컴포넌트 | **10** | 5 | retest6: 11개 vs 3개 |
| Wireframe 에러 상태 | 3 | **10** | extension1: 3가지 상태 |
| Wireframe DB 제약 | 3 | **10** | extension1: LIMIT, 타임아웃 |
| SDD 포함 여부 | 0 | **10** | extension1만 보유 |
| 구현 가이드 | 5 | **10** | extension1: 코드 구조, 쿼리 |
| **총점** | **54/90** | **77/90** | extension1 +23점 |

### 5.2 총점 비교 그래프

```
총점 (90점 만점)
90 ┤
80 ┤                      ▲ extension1 (77점)
70 ┤                      █
60 ┤ ▲ retest6 (54점)    █
50 ┤ █                    █
40 ┤ █                    █
30 ┤ █                    █
20 ┤ █                    █
10 ┤ █                    █
 0 ┼────────────────────────
      retest6          extension1
```

### 5.3 레이더 차트 비교

```
                    IA 완성도 (10)
                         │
                    9 ── ● ── 8
                   ╱           ╲
    구현 가이드 (10)              IA 레거시 (10)
         │                            │
      5 ─┼─ 10                    5 ─┼─ 10
         │  ╲                    ╱   │
         │   ╲                  ╱    │
         │    ╲   retest6     ╱     │
         │     ╲  --------   ╱      │
         │      ● extension1 ●       │
         │     ╱             ╲      │
         │    ╱               ╲     │
         │   ╱                 ╲    │
      0 ─┼─ 10                 10 ─┼─ 0
         │                          │
  SDD 포함 (10)              WF 화면수 (10)
                   ╲           ╱
                10 ── ● ── 6
                         │
               WF 에러상태 (10)

── retest6 (화면 설계 강점)
── extension1 (구현 준비 강점)
```

---

## 6. 사용 시나리오별 권장

### 6.1 화면 기획/디자인 단계

**권장: retest6**

| 이유 | 상세 |
|------|------|
| 화면 다양성 | 7개 화면으로 전체 UX 흐름 파악 |
| 컴포넌트 정의 | 11개 컴포넌트로 디자인 시스템 기반 |
| 상호작용 | 애니메이션, 전환 효과 정의 |
| 반응형 | Desktop/Tablet/Mobile 전환 규칙 |

### 6.2 실제 구현 단계

**권장: extension1**

| 이유 | 상세 |
|------|------|
| SDD 포함 | 아키텍처, API, 쿼리 설계 완비 |
| 레거시 호환 | DOMAIN_SCHEMA.md 명시적 준수 |
| 에러 처리 | 로딩/에러/Empty 상태 UI 정의 |
| DB 제약 | LIMIT 10000, 타임아웃 30초 명시 |
| 코드 구조 | FSD 패턴, Repository 패턴 가이드 |
| 테스트 | 단위/통합 테스트 예시 포함 |

### 6.3 하이브리드 접근 (권장)

```
┌─────────────────────────────────────────────────────────┐
│ 최적 조합 전략                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Phase B-1: 화면 설계]                                 │
│  └─ retest6 Wireframe.md 참조                          │
│     • 7개 화면 구성                                     │
│     • 11개 컴포넌트 매핑                                │
│     • 상호작용/애니메이션                               │
│                                                         │
│  [Phase B-2: 기술 설계]                                 │
│  └─ extension1 SDD.md 참조                             │
│     • 레거시 스키마 매핑                                │
│     • API 설계                                          │
│     • 쿼리 설계                                         │
│                                                         │
│  [Phase B-3: 에러 처리]                                 │
│  └─ extension1 Wireframe.md 참조                       │
│     • 로딩/에러/Empty 상태                              │
│     • DB 제약사항 표시                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 결론 및 권장사항

### 7.1 핵심 발견

| 발견 | 상세 |
|------|------|
| retest6 강점 | 화면 설계 풍부함 (7화면, 11컴포넌트, +25% Wireframe) |
| extension1 강점 | 구현 준비도 (SDD, 레거시 매핑, 에러 상태, DB 제약) |
| 상호 보완 | 두 산출물은 경쟁이 아닌 **보완 관계** |

### 7.2 최종 권장

| 단계 | 참조 산출물 | 이유 |
|------|------------|------|
| 화면 기획 | retest6 | 화면 다양성, 컴포넌트 풍부 |
| 기술 설계 | extension1 | SDD, 쿼리, API 설계 |
| 에러 처리 | extension1 | 상태 UI, DB 제약 |
| 구현 가이드 | extension1 | 코드 구조, 테스트 |

### 7.3 향후 개선 제안

| 우선순위 | 항목 | 대상 |
|---------|------|------|
| P0 | retest에 SDD.md 생성 추가 | retest 파이프라인 |
| P0 | retest에 에러 상태 UI 추가 | Wireframe 템플릿 |
| P1 | extension에 화면 수 확대 | extension 파이프라인 |
| P1 | extension에 컴포넌트 매핑 확대 | Wireframe 템플릿 |
| P2 | 두 모드 통합 (Best of Both) | Orchestrator 개선 |

---

## 8. 참조 문서

| 문서 | 경로 |
|------|------|
| retest6 IA.md | `docs/cases/case6-retest6/IA.md` |
| retest6 Wireframe.md | `docs/cases/case6-retest6/Wireframe.md` |
| extension1 IA.md | `docs/cases/case6-extension1/IA.md` |
| extension1 Wireframe.md | `docs/cases/case6-extension1/Wireframe.md` |
| extension1 SDD.md | `docs/cases/case6-extension1/SDD.md` |
| v02 품질 보고서 | `docs/develo-report/case6-retest 품질 비교 보고서-v02.md` |

---

**END OF REPORT**
