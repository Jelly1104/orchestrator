---
name: designer
version: 3.3.0
description: |
  IA/Wireframe/SDD 설계 문서 생성.
  트리거: "IA 작성", "Wireframe 설계", "SDD 생성", "화면 설계".
  🔴 필수: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.
allowed-tools: Read, Grep, Glob
---

# Designer Skill (Extension용)

설계 문서(IA/Wireframe/SDD) 생성.

> **역할**: "어떻게 화면을 구성할 것인가?" - UI/UX 설계

---

## 파이프라인 위치

**호출 여부 판단**:
1. HANDOFF.md의 `pipeline` 필드 확인
2. `design`, `ui_mockup`, `analyzed_design`, `full` 중 하나인가?
3. 선행 Phase 산출물 존재 여부 확인 (있는 경우)

> **상세 파이프라인 흐름**: `.claude/workflows/ROLE_ARCHITECTURE.md` - 파이프라인 타입 섹션 참조

---

## Step 라우팅 규칙 🔴

> **Step 0은 항상 필수**. 이후 Step은 순서대로 진행.
> **참고**: Pipeline Phase (A/B/C)와 Skill 내부 Step은 별개 개념입니다.

| 호출 시점 | 진입 Step | 설명 |
|-----------|-----------|------|
| Phase B 시작 | Step 0 → 1 → 2 → 3 | 설계 문서 생성 |

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Step 0: 문서 참조 (필수) 🔴

> **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read

#### 참조 디렉토리 구조

```
.claude/
├── SYSTEM_MANIFEST.md              # Quick Context, Role별 필수 로딩
├── rules/
│   └── DOMAIN_SCHEMA.md            # 핵심 레거시 스키마, 개념-물리 매핑
├── workflows/
│   ├── ROLES_DEFINITION.md         # Designer 섹션만
│   └── DOCUMENT_PIPELINE.md        # 파이프라인 타입별 산출물
├── templates/
│   └── designer/                   # 설계 템플릿 (전체)
│       ├── IA_TEMPLATE.md
│       ├── WF_TEMPLATE.md
│       └── SDD_TEMPLATE.md         # 특히 섹션 5: 엔트리포인트
└── project/
    └── PROJECT_STACK.md            # 기술 스택
```

#### 확인 체크리스트

- [ ] `SYSTEM_MANIFEST.md` → Quick Context, Role별 필수 로딩
- [ ] `DOMAIN_SCHEMA.md` → 핵심 레거시 스키마, 개념-물리 매핑
- [ ] `PROJECT_STACK.md` → 기술 스택
- [ ] `DOCUMENT_PIPELINE.md` → 파이프라인 타입별 산출물
- [ ] `ROLES_DEFINITION.md` → Designer 섹션
- [ ] `IA_TEMPLATE.md` → 전체
- [ ] `WF_TEMPLATE.md` → 전체
- [ ] `SDD_TEMPLATE.md` → 전체 (특히 섹션 5: 엔트리포인트)

> **참조 가이드**: `docs/reports/Role-reference-guide.md`

---

### Step 1: 입력 분석

#### 수행 확인 체크리스트

- [ ] HANDOFF.md 읽기
- [ ] PRD 요구사항 파악
- [ ] 화면 목록 도출
- [ ] 분석 결과 확인 (analyzed_design 시)

---

### Step 2: 산출물 작성

| 산출물 | 설명 | 템플릿 |
|--------|------|--------|
| **IA.md** | 정보 구조 (화면 계층, 네비게이션) | IA_TEMPLATE.md |
| **Wireframe.md** | 화면 설계 (ASCII 레이아웃, 컴포넌트) | WF_TEMPLATE.md |
| **SDD.md** | 기술 명세 (API, 데이터 모델) | SDD_TEMPLATE.md |

#### 수행 확인 체크리스트

- [ ] IA.md 작성 (IA_TEMPLATE.md 준수)
- [ ] Wireframe.md 작성 (WF_TEMPLATE.md 준수)
- [ ] SDD.md 작성 (SDD_TEMPLATE.md 준수)
- [ ] 컴포넌트 Props 정의 완결성 확인
- [ ] 엔트리포인트 연결 가이드 포함 (SDD 섹션 5)
- [ ] 레거시 테이블/컬럼 매핑 확인 (DOMAIN_SCHEMA.md)

---

### Step 3: 보고서 출력

#### 수행 확인 체크리스트

- [ ] IA ↔ Wireframe ↔ SDD 정합성 확인
- [ ] HANDOFF CompletionCriteria 충족 여부 확인

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **How** | "어떻게 구현할 것인가?" - UI/UX 설계 + 시스템 아키텍처 |
| **Input** | HANDOFF.md + 분석 결과 (선택) |
| **Output** | IA.md, Wireframe.md, SDD.md |

| 산출물 | 설명 |
|--------|------|
| **IA.md** | 정보 구조 (화면 계층, 네비게이션) |
| **Wireframe.md** | 화면 설계 (ASCII 레이아웃, 컴포넌트) |
| **SDD.md** | 기술 명세 (API, 데이터 모델, 시스템 구조) |

## 제약사항

| 제약 | 설명 |
|------|------|
| 스키마 준수 | 기존 테이블 활용 우선, 신규 생성 지양 |
| 템플릿 준수 | IA_TEMPLATE.md, WF_TEMPLATE.md, SDD_TEMPLATE.md 형식 |
| 레거시 매핑 | SDD에 실제 컬럼명 매핑 필수 |
| **엔트리포인트 필수** | SDD 섹션 5에 main.tsx 연결 가이드 포함 |

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Designer Skill Report]
🔧 사용된 Skill: designer v3.3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Step 0):
  - 공통: {n}/4개 ✅
  - Designer 전용: {n}/4개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: {handoff_summary}
📤 출력: IA.md, Wireframe.md, SDD.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IA: {n}개 화면 정의
✅ Wireframe: {n}개 화면 설계
✅ SDD: API {n}개, 테이블 매핑 {n}개
✅ 엔트리포인트 섹션: 포함됨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
