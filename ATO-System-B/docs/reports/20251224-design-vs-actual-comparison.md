# 설계 vs 실제 동작 비교

> **작성일**: 2025-12-24
> **비교 대상**: AGENT_ARCHITECTURE.md (v2.6.3) vs case6-retest8 실제 동작
> **결론**: 70~80% 수준으로 설계대로 동작

---

## AGENT_ARCHITECTURE.md 설계

```
Mixed Pipeline: Phase A → Phase B 순차 실행

Phase A: AnalysisAgent
  └── Query Skill: SQL 실행
  └── Reviewer Skill: 쿼리 결과 검증
  └── Doc-Sync Skill: Notion 동기화

Phase B: Leader
  └── Designer Skill: IA/Wireframe/SDD/HANDOFF
  └── Reviewer Skill: 품질 검증
  └── Doc-Sync Skill: Notion 동기화
```

---

## 실제 Case6-retest8 동작

```
✅ Mixed 파이프라인 실행 (Phase A: Analysis → Phase B: Design)

Phase A: AnalysisAgent
  ├── [Step 3] SQL 쿼리 생성        ← LLM 호출 (ProviderFactory)
  ├── [Step 4] SQL 실행             ← DB 직접 연결 (mysql2)
  ├── [Step 4.5] Reviewer Skill     ✅ 구현됨 (PASS 100/100)
  ├── [Step 5] 결과 해석            ← LLM 호출
  └── [Step 6] 산출물 생성          ← 파일 저장

Phase B: Leader
  ├── Gap Check                     ← 규칙 기반 (LLM 미사용)
  ├── 설계 문서 생성                 ← LLM 호출 (단일 호출로 4개 문서)
  └── 파일 저장                      ← 디스크 저장
```

---

## 차이점 분석

| 항목 | 설계 (AGENT_ARCHITECTURE.md) | 실제 동작 | 일치 여부 |
|------|------------------------------|-----------|----------|
| **파이프라인 타입** | Mixed = Phase A → Phase B | ✅ 동일 | ✅ |
| **Phase A 담당** | AnalysisAgent | ✅ AnalysisAgent | ✅ |
| **Phase A Query Skill** | SQL 실행 | ⚠️ AnalysisAgent 내장 (Skill 분리 안됨) | ⚠️ |
| **Phase A Reviewer** | 쿼리 결과 검증 | ✅ ReviewerSkill 호출 (PASS 100/100) | ✅ |
| **Phase A Doc-Sync** | Notion 동기화 | ❌ 미호출 | ❌ |
| **Phase B 담당** | Leader | ✅ LeaderAgent | ✅ |
| **Phase B Designer Skill** | IA/WF/SDD/HANDOFF | ⚠️ Leader 내장 (Skill 분리 안됨) | ⚠️ |
| **Phase B Reviewer** | 품질 검증 | ❌ 미호출 | ❌ |
| **Phase B Doc-Sync** | Notion 동기화 | ❌ 미호출 | ❌ |
| **HITL 체크포인트** | 설계 승인 대기 | ⚠️ autoApprove=ON (자동 통과) | ⚠️ |

---

## 주요 차이점

### 1. Skill 분리가 안 됨

```
설계: AnalysisAgent → Query Skill (별도 모듈)
실제: AnalysisAgent 내부에서 직접 SQL 생성/실행

설계: Leader → Designer Skill (별도 모듈)
실제: LeaderAgent 내부에서 직접 문서 생성
```

### 2. Doc-Sync Skill 미호출
- **설계**: Phase 완료 후 Notion 동기화
- **실제**: 로컬 파일 저장만 수행, Notion 동기화 없음

### 3. Phase B Reviewer 미호출
- **설계**: 설계 문서 생성 후 품질 검증
- **실제**: Phase A에서만 Reviewer 호출, Phase B에서는 미호출

### 4. HITL 자동 통과
- **설계**: 설계 승인 체크포인트에서 대기
- **실제**: `autoApprove=ON`으로 자동 통과

---

## 결론

| 평가 | 내용 |
|------|------|
| **핵심 흐름** | ✅ 설계대로 동작 (Mixed Pipeline: Phase A → Phase B) |
| **Agent 역할** | ✅ 설계대로 동작 (AnalysisAgent → LeaderAgent) |
| **Skill 분리** | ⚠️ 설계와 다름 (Agent 내장 방식으로 구현) |
| **Reviewer** | ⚠️ Phase A만 호출, Phase B 미호출 |
| **Doc-Sync** | ❌ 미구현 (Notion 동기화 없음) |
| **HITL** | ⚠️ autoApprove로 우회 (테스트 모드) |

**전체적으로 70~80% 수준으로 설계대로 동작**하고 있으며, Skill 분리와 Doc-Sync가 주요 미구현 항목입니다.

---

## 개선 필요 항목 (우선순위)

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| **P1** | Phase B Reviewer 호출 | 설계 문서 품질 검증 추가 |
| **P2** | Skill 분리 | Query Skill, Designer Skill 모듈화 |
| **P3** | Doc-Sync 구현 | Notion 동기화 기능 추가 |
| **P4** | HITL 활성화 | 프로덕션에서 autoApprove=OFF |

---

## 관련 문서

- `.claude/workflows/AGENT_ARCHITECTURE.md` - 아키텍처 설계 문서
- `orchestrator/logs/case6-retest8.json` - 실행 로그
- `docs/cases/case6-retest8/` - 생성된 산출물
