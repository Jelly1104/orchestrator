---
name: designer
version: 3.0.0
description: |
  IA/Wireframe/SDD 설계 문서 생성.
  트리거: "IA 작성", "Wireframe 설계", "SDD 생성", "화면 설계".
  ⚠️ v3.0.0: 필수 문서 로딩 검증 단계 추가 - Phase 0 완료 후에만 Phase 1 진행 가능.
---

# Designer Skill (Extension용)

설계 문서(IA/Wireframe/SDD) 생성.

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Phase 0: 문서 로딩 (필수) 🔴

> **이 단계를 건너뛰면 Phase 1로 진행할 수 없습니다.**

아래 문서를 **반드시 Read 도구로 읽고**, 각 문서의 핵심 내용을 요약 출력하세요.

#### 공통 로딩 (모든 Skill 필수)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| 시스템 헌법 | `CLAUDE.md` | 절대 금지 사항 1가지 |
| DB 스키마 | `.claude/rules/DOMAIN_SCHEMA.md` | 사용할 테이블 목록 |
| 기술 스택 | `.claude/project/PROJECT_STACK.md` | Frontend 스택 |
| 산출물 정의 | `.claude/workflows/DOCUMENT_PIPELINE.md` | Designer 산출물 목록 |

#### Role별 추가 로딩 (Designer 전용)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| Role 정의 | `.claude/workflows/ROLES_DEFINITION.md` | Designer 섹션 - 역할/제약 |
| IA 템플릿 | `.claude/templates/designer/IA_TEMPLATE.md` | 필수 섹션 목록 |
| WF 템플릿 | `.claude/templates/designer/WF_TEMPLATE.md` | 필수 섹션 목록 |
| SDD 템플릿 | `.claude/templates/designer/SDD_TEMPLATE.md` | 섹션 5 (엔트리포인트) 구조 |

### Phase 0 출력 (검증용) 🔴

**아래 형식으로 요약을 출력해야 Phase 1 진행 가능:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [문서 로딩 확인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[공통]
- CLAUDE.md: {절대 금지 사항 1가지}
- DOMAIN_SCHEMA.md: {사용할 테이블 n개}
- PROJECT_STACK.md: {Frontend 스택}
- DOCUMENT_PIPELINE.md: {Designer 산출물 목록}

[Designer 전용]
- ROLES_DEFINITION.md#Designer: {역할 1줄 요약}
- IA_TEMPLATE.md: 필수 섹션 {n}개
- WF_TEMPLATE.md: 필수 섹션 {n}개
- SDD_TEMPLATE.md: 엔트리포인트 섹션 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **위 출력이 없으면 Phase 1 Write가 무효 처리됩니다.**

---

### Phase 1: 입력 분석

- HANDOFF.md 읽기
- 요구사항 파악, 화면 목록 도출

### Phase 2: 산출물 작성

| 산출물 | 설명 | 템플릿 |
|--------|------|--------|
| **IA.md** | 정보 구조 (화면 계층, 네비게이션) | IA_TEMPLATE.md |
| **Wireframe.md** | 화면 설계 (ASCII 레이아웃, 컴포넌트) | WF_TEMPLATE.md |
| **SDD.md** | 기술 명세 (API, 데이터 모델) | SDD_TEMPLATE.md |

### Phase 3: 보고서 출력

---

## 핵심 역할

| 산출물 | 설명 |
|--------|------|
| **IA.md** | 정보 구조 (화면 계층, 네비게이션) |
| **Wireframe.md** | 화면 설계 (ASCII 레이아웃, 컴포넌트) |
| **SDD.md** | 기술 명세 (API, 데이터 모델) |

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
🔧 사용된 Skill: designer v3.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Phase 0):
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
