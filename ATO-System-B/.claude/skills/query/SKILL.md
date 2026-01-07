---
name: query
version: 3.0.0
description: |
  SQL 쿼리 생성 및 데이터 분석.
  트리거: "SQL 생성", "데이터 분석", "쿼리 작성", "세그먼트 분석".
  ⚠️ v3.0.0: 필수 문서 로딩 검증 단계 추가 - Phase 0 완료 후에만 Phase 1 진행 가능.
---

# Query Skill (Extension용)

SQL 쿼리 생성 및 데이터 분석.

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
| 기술 스택 | `.claude/project/PROJECT_STACK.md` | DB 스택 |
| 산출물 정의 | `.claude/workflows/DOCUMENT_PIPELINE.md` | Analyzer 산출물 목록 |

#### Role별 추가 로딩 (Query/Analyzer 전용)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| Role 정의 | `.claude/workflows/ROLES_DEFINITION.md` | Analyzer 섹션 - 역할/제약 |
| DB 접근 정책 | `.claude/rules/DB_ACCESS_POLICY.md` | 허용/금지 패턴 |
| SQL 패턴 | `.claude/templates/query/SQL_PATTERNS.md` | 쿼리 템플릿 |

### Phase 0 출력 (검증용) 🔴

**아래 형식으로 요약을 출력해야 Phase 1 진행 가능:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [문서 로딩 확인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[공통]
- CLAUDE.md: {절대 금지 사항 1가지}
- DOMAIN_SCHEMA.md: {사용할 테이블 n개}
- PROJECT_STACK.md: {DB 스택}
- DOCUMENT_PIPELINE.md: {Analyzer 산출물 목록}

[Query 전용]
- ROLES_DEFINITION.md#Analyzer: {역할 1줄 요약}
- DB_ACCESS_POLICY.md: {허용 패턴, 금지 패턴 요약}
- SQL_PATTERNS.md: {쿼리 템플릿 n개}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **위 출력이 없으면 Phase 1 쿼리 생성이 무효 처리됩니다.**

---

### Phase 1: 요구사항 분석

- HANDOFF.md 읽기
- 분석 목표 파악

### Phase 2: SQL 생성

- SELECT 쿼리만 허용
- DOMAIN_SCHEMA.md 테이블/컬럼 사용
- LIMIT 필수

### Phase 3: 결과 해석 및 보고서 출력

---

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **What** | "무엇이 일어났는가?" - 데이터 분석 |
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
🔧 사용된 Skill: query v3.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Phase 0):
  - 공통: {n}/4개 ✅
  - Query 전용: {n}/3개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: {analysis_goal}
📤 출력: {n}개 쿼리 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SQL 쿼리: {n}개
✅ 인사이트: {n}개
✅ 스키마 검증: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
