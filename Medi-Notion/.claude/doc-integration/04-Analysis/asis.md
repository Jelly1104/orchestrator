# 04-Analysis AS-IS

> **분석 대상**: 분석 관련 2종
> - `.claude/global/ANALYSIS_AGENT_SPEC.md`
> - `.claude/global/DB_ACCESS_POLICY.md`
> **분석일**: 2025-12-18

---

## 📊 현황 요약

| 문서 | 크기 | 예상 토큰 | 현재 로딩 Agent |
|------|------|----------|----------------|
| ANALYSIS_AGENT_SPEC.md | ~18,000자 | ~4,500 토큰 | ❌ 없음 |
| DB_ACCESS_POLICY.md | ~5,500자 | ~1,400 토큰 | ❌ 없음 |
| **합계** | **~23,500자** | **~5,900 토큰** | - |

---

## 📄 각 문서 핵심 내용

### 1. ANALYSIS_AGENT_SPEC.md (v1.0.0)

**목적**: AnalysisAgent 설계 명세 - 정량적 PRD 처리용 신규 Agent

**핵심 구조**:
```
AnalysisAgent 6단계:
├── Step 1: PRD 파싱 (분석 요구사항 추출)
├── Step 2: 스키마 검증 (DOMAIN_SCHEMA.md 대조)
├── Step 3: SQL 쿼리 생성 (SELECT only)
├── Step 4: SQL 실행 (Bash + mysql)
├── Step 5: 결과 해석 (MIXED PRD용 인사이트)
└── Step 6: 산출물 생성 (SQL, JSON, 리포트)
```

**왜 필요한가**:
- Case #4/#5 문제: PRD에 "분석"을 요청했으나 "설계 산출물" 생성
- 기존 Orchestrator는 design 파이프라인만 지원
- 정량적 분석(SQL 실행 → 데이터 수집 → 해석) 처리 Agent 부재

---

### 2. DB_ACCESS_POLICY.md (v1.0.0)

**목적**: 데이터베이스 접근 정책 - AI 에이전트용 권한 관리

**핵심 구조**:
```
접근 정책:
├── 1. 스토리지 선택 기준
│   ├── 허용: 메모리, 파일, SQLite, 로컬 Redis
│   └── 제한: Production MySQL (SELECT only)
├── 2. MySQL 계정 분리
│   ├── medigate_readonly: AI 에이전트 기본 계정
│   └── medigate_write: Leader 승인 후에만 사용
├── 3. 환경별 설정 (.env)
├── 4. 에이전트 접근 규칙
└── 5. 위반 시 대응 (자동 차단, 로깅)
```

---

## 🔍 현재 Agent 로딩 현황

### analysis-agent.js
```javascript
// ❌ 파일 자체가 존재하지 않음 (미구현 상태)
// ANALYSIS_AGENT_SPEC.md는 설계 문서만 존재
```

### leader.js
```javascript
// 현재 로딩하는 문서 중
// ❌ ANALYSIS_AGENT_SPEC.md 미로딩
// ❌ DB_ACCESS_POLICY.md 미로딩
```

### subagent.js
```javascript
// ❌ DB_ACCESS_POLICY.md 미로딩
// DB 접근 정책을 모르는 상태로 쿼리 생성
```

---

## ⚠️ 문제점

1. **AnalysisAgent 미구현**: SPEC 문서만 있고 실제 Agent 코드가 없음
2. **DB 정책 미적용**: DB_ACCESS_POLICY.md가 있지만 Agent들이 로딩하지 않음
3. **계정 분리 미적용**: medigate_readonly/write 계정 분리가 코드에 미반영
4. **쿼리 검증 부재**: INSERT/UPDATE/DELETE 쿼리 사전 차단 로직 없음

---

## 📊 구현 상태 분석

| 항목 | 문서 상태 | 구현 상태 |
|------|----------|----------|
| AnalysisAgent 클래스 | ✅ SPEC 정의됨 | ❌ 미구현 |
| 6단계 파이프라인 | ✅ SPEC 정의됨 | ❌ 미구현 |
| SQL 생성 프롬프트 | ✅ SPEC 정의됨 | ❌ 미구현 |
| 결과 해석 프롬프트 | ✅ SPEC 정의됨 | ❌ 미구현 |
| DB 계정 분리 | ✅ 정책 정의됨 | ❌ 미적용 |
| 쿼리 차단 미들웨어 | ✅ 정책 정의됨 | ❌ 미구현 |

---

## 📁 원본 파일 위치

```
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/ANALYSIS_AGENT_SPEC.md
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/DB_ACCESS_POLICY.md
```
