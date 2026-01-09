---
name: query
version: 3.4.0
description: |
  SQL 쿼리 생성 및 데이터 분석.
  트리거: "SQL 생성", "데이터 분석", "쿼리 작성", "세그먼트 분석".
  🔴 필수: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.
allowed-tools: Read, Grep, Glob
---

# Query Skill (Extension용)

SQL 쿼리 생성 및 데이터 분석.

> **순서**: `/profiler` (WHO) → `/query` (WHAT)
> **역할**: `/profiler`가 정의한 세그먼트 조건을 기반으로 SQL 작성

---

## 파이프라인 위치

**호출 여부 판단**:
1. HANDOFF.md의 `pipeline` 필드 확인
2. `analysis`, `analyzed_design`, `full` 중 하나인가?
3. TARGET_DEFINITION.md 존재 시 해당 조건 기반 SQL 작성

> **상세 파이프라인 흐름**: `.claude/workflows/ROLE_ARCHITECTURE.md` - 파이프라인 타입 섹션 참조

---

## DB 연결

| 항목 | 설명 |
|------|------|
| 연결 정보 | 프로젝트 루트의 `.env` 파일 사용 |
| 환경 변수 | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` |
| 실행 방법 | `mysql2` 또는 mysql CLI 사용 |
| 연결 실패 시 | HITL 요청 (사용자에게 연결 정보 확인 요청) |

> **중요**: 쿼리 생성만 하지 말고, **실제 DB에 연결하여 실행**해야 합니다.

---

## Step 라우팅 규칙 🔴

> **Step 0은 항상 필수**. 이후 Step은 순서대로 진행.
> **참고**: Pipeline Phase (A/B/C)와 Skill 내부 Step은 별개 개념입니다.

| 호출 시점 | 진입 Step | 설명 |
|-----------|-----------|------|
| Phase A (profiler 후) | Step 0 → 1 → 2 → 3 | SQL 생성, 실행, 결과 분석 |

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Step 0: 문서 참조 (필수) 🔴

> **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read

#### 참조 디렉토리 구조

```
.claude/
├── SYSTEM_MANIFEST.md              # Quick Context, Role별 필수 로딩
├── rules/
│   ├── DOMAIN_SCHEMA.md            # 핵심 레거시 스키마, 데이터 규모, 복합 쿼리 제한
│   └── DB_ACCESS_POLICY.md         # 권한 레벨, 쿼리 제한, 민감 컬럼 블랙리스트
├── workflows/
│   ├── ROLES_DEFINITION.md         # Analyzer 섹션만
│   └── DOCUMENT_PIPELINE.md        # 파이프라인 타입별 산출물
└── project/
    └── PROJECT_STACK.md            # 기술 스택
```

#### 확인 체크리스트

- [ ] `SYSTEM_MANIFEST.md` → Quick Context, Role별 필수 로딩
- [ ] `DOMAIN_SCHEMA.md` → 핵심 레거시 스키마, 데이터 규모, 복합 쿼리 제한
- [ ] `PROJECT_STACK.md` → 기술 스택
- [ ] `DOCUMENT_PIPELINE.md` → 파이프라인 타입별 산출물
- [ ] `ROLES_DEFINITION.md` → Analyzer 섹션
- [ ] `DB_ACCESS_POLICY.md` → 권한 레벨, 쿼리 제한, 민감 컬럼 블랙리스트

> **참조 가이드**: `docs/reports/Role-reference-guide.md`

---

### Step 1: 입력 분석

#### 수행 확인 체크리스트

- [ ] HANDOFF.md 읽기
- [ ] TARGET_DEFINITION.md 읽기 (있는 경우)
- [ ] 분석 목표 파악
- [ ] 세그먼트 조건 확인 (WHERE절 조건)

---

### Step 2: SQL 생성 및 실행

#### 수행 확인 체크리스트

- [ ] `/profiler`가 정의한 세그먼트 조건을 WHERE절에 반영
- [ ] SELECT 쿼리만 사용 (INSERT/UPDATE/DELETE 금지)
- [ ] DOMAIN_SCHEMA.md 테이블/컬럼 사용
- [ ] LIMIT 필수 (최대 10,000행)
- [ ] 민감 컬럼 블랙리스트 확인 (DB_ACCESS_POLICY.md)
- [ ] DB 연결 후 쿼리 실행

---

### Step 3: 결과 해석 및 보고서 출력

#### 수행 확인 체크리스트

- [ ] `analysis/results/*.sql` 생성
- [ ] `analysis/analysis_report.md` 생성
- [ ] 결과 행 수 확인 (빈 결과 시 조건 재검토)
- [ ] 인사이트 도출 (패턴/이상치)

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **What** | "무엇을 추출할 것인가?" - 데이터 분석 |
| **Input** | HANDOFF.md + TARGET_DEFINITION.md (선택) |
| **Output** | SQL 쿼리, 분석 결과, 인사이트 |

## 제약사항

| 제약 | 설명 |
|------|------|
| SELECT only | INSERT/UPDATE/DELETE/DDL 금지 |
| 스키마 준수 | DOMAIN_SCHEMA.md 테이블/컬럼만 사용 |
| 결과 제한 | 단일 쿼리 10,000행 이하, LIMIT 필수 |
| 보안 | 개인정보 직접 조회 금지 (집계만) |

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Query Skill Report]
🔧 사용된 Skill: query v3.4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Step 0):
  - 공통: {n}/4개 ✅
  - Query 전용: {n}/3개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: HANDOFF.md + TARGET_DEFINITION.md
📤 출력: {n}개 쿼리 생성, analysis_report.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SQL 쿼리: {n}개
✅ 인사이트: {n}개
✅ 스키마 검증: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
