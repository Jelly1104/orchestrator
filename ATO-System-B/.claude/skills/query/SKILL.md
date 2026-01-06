---
name: query
description: |
  SQL 쿼리 생성 및 데이터 분석.
  트리거: "SQL 생성", "데이터 분석", "쿼리 작성", "세그먼트 분석".
  실행 전 필수 로딩: ROLES_DEFINITION.md(Analyzer 섹션), DB_ACCESS_POLICY.md, SQL_PATTERNS.md.
  PRD/HANDOFF의 분석 요구사항을 SELECT 쿼리로 변환하고 인사이트를 도출한다.
  ⚠️ 작업 완료 후 반드시 하단의 [Skill Report] 형식으로 결과를 출력할 것.
---

# Query Skill (Extension용)

SQL 쿼리 생성 및 데이터 분석.

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

## 필수 참조 문서

- `.claude/workflows/ROLES_DEFINITION.md` (Analyzer 섹션)
- `.claude/rules/DB_ACCESS_POLICY.md`
- `.claude/templates/query/SQL_PATTERNS.md`

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Query Skill Report]
🔧 사용된 Skill: query v2.0
📚 참조 문서: ROLES_DEFINITION.md ✅ | DB_ACCESS_POLICY.md ✅ | SQL_PATTERNS.md ✅
📥 입력: {analysis_goal}
📤 출력: {n}개 쿼리 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SQL 쿼리: {n}개
✅ 인사이트: {n}개
✅ 스키마 검증: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
