---
name: profiler
version: 3.4.0
description: |
  타겟 세그먼트 정의 및 SQL 조건 명세.
  트리거: "프로필 분석", "세그먼트 정의", "페르소나 생성", "회원 특성".
  🔴 필수: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.
allowed-tools: Read, Grep, Glob
---

# Profiler Skill (Extension용)

타겟 세그먼트 정의 및 SQL 조건 명세 생성.

> **순서**: `/profiler` (WHO) → `/query` (WHAT)
> **역할**: "누구를 분석할지" 먼저 정의 → `/query`가 그 조건으로 SQL 작성

---

## 파이프라인 위치

**호출 여부 판단**:
1. HANDOFF.md의 `pipeline` 필드 확인
2. `analysis`, `analyzed_design`, `full` 중 하나인가?
3. 타겟 세그먼트 정의가 필요한 분석인가?

> **상세 파이프라인 흐름**: `.claude/workflows/ROLE_ARCHITECTURE.md` - 파이프라인 타입 섹션 참조

---

## DB 연결 참조

> **Profiler는 SQL을 실행하지 않습니다.** 세그먼트 정의 및 SQL 조건 명세만 작성합니다.
> 실제 DB 연결은 `/query` Skill이 담당합니다.

| 항목 | 설명 |
|------|------|
| 연결 정보 | 프로젝트 루트의 `.env` 파일 (DB_HOST, DB_USER 등) |
| SQL 실행 | `/query` Skill에서 수행 |

---

## Step 라우팅 규칙 🔴

> **Step 0은 항상 필수**. 이후 Step은 순서대로 진행.
> **참고**: Pipeline Phase (A/B/C)와 Skill 내부 Step은 별개 개념입니다.

| 호출 시점 | 진입 Step | 설명 |
|-----------|-----------|------|
| Phase A 시작 | Step 0 → 1 → 2 → 3 | 세그먼트 정의, SQL 조건 명세 |

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Step 0: 문서 참조 (필수) 🔴

> **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read

#### 참조 디렉토리 구조

```
.claude/
├── SYSTEM_MANIFEST.md              # Quick Context, Role별 필수 로딩
├── rules/
│   └── DOMAIN_SCHEMA.md            # 핵심 레거시 스키마, 자주 사용하는 쿼리 패턴
├── workflows/
│   ├── ROLES_DEFINITION.md         # Analyzer 섹션만
│   └── DOCUMENT_PIPELINE.md        # 파이프라인 타입별 산출물
├── templates/
│   └── profiler/
│       └── SEGMENT_RULES.md        # 세그먼트 정의 기준 (전체)
└── project/
    └── PROJECT_STACK.md            # 기술 스택
```

#### 확인 체크리스트

- [ ] `SYSTEM_MANIFEST.md` → Quick Context, Role별 필수 로딩
- [ ] `DOMAIN_SCHEMA.md` → 핵심 레거시 스키마, 자주 사용하는 쿼리 패턴
- [ ] `PROJECT_STACK.md` → 기술 스택
- [ ] `DOCUMENT_PIPELINE.md` → 파이프라인 타입별 산출물
- [ ] `ROLES_DEFINITION.md` → Analyzer 섹션
- [ ] `SEGMENT_RULES.md` → 세그먼트 정의 기준 (전체)

> **참조 가이드**: `docs/reports/Role-reference-guide.md`

---

### Step 1: HANDOFF 분석

#### 수행 확인 체크리스트

- [ ] HANDOFF.md 읽기
- [ ] 분석 목표 파악
- [ ] 타겟 유저 특성 식별

---

### Step 2: 세그먼트 정의

#### 수행 확인 체크리스트

- [ ] 타겟 세그먼트 정의 (인구통계/행동 특성)
- [ ] 페르소나 생성 (최소 1개)
- [ ] SQL 조건 명세 작성 (WHERE절 조건)
- [ ] 코드 매핑 확인 (CODE_MASTER 기반)

---

### Step 3: 산출물 생성 및 보고서 출력

#### 수행 확인 체크리스트

- [ ] `analysis/segment_definition.md` 생성
- [ ] `/query`가 사용할 SQL 조건 명세 포함
- [ ] 세그먼트별 최소 표본(30명 이상) 확인

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **Who** | "누구를 분석할 것인가?" - 타겟 세그먼트 정의 |
| **Input** | HANDOFF.md |
| **Output** | 세그먼트 정의서, SQL 조건 명세, 페르소나 |

## 제약사항

| 제약 | 설명 |
|------|------|
| 코드 마스터 참조 | 코드값은 CODE_MASTER 기반 해석 |
| 세그먼트 규칙 | SEGMENT_RULES.md 기준 적용 |
| 비식별화 | 집계 통계만 출력, 개인정보 노출 금지 |
| 최소 표본 | 30명 이상 세그먼트만 분석 |

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Profiler Skill Report]
🔧 사용된 Skill: profiler v3.4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Step 0):
  - 공통: {n}/4개 ✅
  - Profiler 전용: {n}/2개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: HANDOFF.md
📤 출력: segment_definition.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 세그먼트: {n}개 정의
✅ 페르소나: {n}개 생성
✅ SQL 조건 명세: 포함
✅ 코드 매핑: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
