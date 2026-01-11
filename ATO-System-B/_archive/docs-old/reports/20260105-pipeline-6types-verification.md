# 2026-01-05 파이프라인 6개 타입 확장 검증

> **작성일**: 2026-01-05
> **관련 문서**: DD-2025-003 (Pipeline Refactoring)
> **상태**: ✅ type 필드 제거 완료, 테스트 통과

---

## 1. 완료된 작업

### 1.1 코드 수정

| 파일 | 수정 내용 | 상태 |
|------|----------|------|
| orchestrator.js | mixed → analyzed_design 전환, 6개 파이프라인 함수 구현, **prdType 제거**, HITL 3-way 라우팅 연결 | ✅ |
| prd-analyzer.js | **v2.0.0** - type 필드 제거, inferPipelineFromContent() 추가, classifyPRDv2() pipeline만 반환, **classifyPRD() 파이프라인 기반 무력화** | ✅ |
| index.js | CLI 6개 파이프라인 지원, completedPhases 로직 | ✅ |
| cli.js | HITL 3-way `--decision` 플래그 추가 (Exception Approval / Rule Override / Risk Acceptance) | ✅ |

### 1.2 문서 수정

| 파일 | 버전 | 수정 내용 | 상태 |
|------|------|----------|------|
| ROLES_DEFINITION.md | v1.5.0 | 6개 router 값 확장 | ✅ |
| PRD_GUIDE.md | **v2.4.0** | **type 필드 제거**, 필수 항목 6개→5개, 섹션 번호 제거 | ✅ |
| DOCUMENT_PIPELINE.md | v1.4.1 | 6개 타입별 흐름, 스타일 통일 | ✅ |
| HANDOFF_PROTOCOL.md | v2.1.0 | Mode → Pipeline 용어 통일 | ✅ |
| README.md | - | 6개 분기 다이어그램 (섹션 3-2, 5-2, 5-3) | ✅ |
| PRD_CHECKLIST.md | - | **type(P04) 제거**, pipeline 필드 6개 타입 반영 | ✅ |

### 1.3 검증 완료

- [x] leader.js: VALID_ROUTES 별도 상수 없음 (prd-analyzer.js에서 라우팅 처리)
- [x] prd-analyzer.js: inferPipeline() 6개 타입 지원 확인
- [x] orchestrator.js: 6개 파이프라인 실행 함수 존재 확인
- [x] **type 필드 완전 제거** - PRD에서 pipeline만 사용

### 1.4 v2.0.0 변경 사항 (type 제거)

```
Before: { type: 'QUANTITATIVE', pipeline: 'analysis', gapCheck: {...} }
After:  { pipeline: 'analysis', gapCheck: {...} }
```

| 변경 항목 | Before | After |
|----------|--------|-------|
| PRD 필수 항목 | 6개 (목적, 타겟, 기능, 지표, type, pipeline) | 5개 (목적, 타겟, 기능, 지표, pipeline) |
| classifyPRDv2() 반환 | `{ type, pipeline, gapCheck }` | `{ pipeline, gapCheck }` |
| 파이프라인 추론 | type 기반 (QUANTITATIVE→analysis) | **콘텐츠 키워드 기반** |

### 1.5 P1 구현 완료 (HITL TO-BE 아키텍처)

#### 1.5.1 session-store.js 변경

```javascript
// 신규: HITLDecision enum
export const HITLDecision = {
  EXCEPTION_APPROVAL: 'EXCEPTION_APPROVAL',  // 이번 건만 예외 허용
  RULE_OVERRIDE: 'RULE_OVERRIDE',            // 규칙 수정 요청
  REJECT: 'REJECT'                           // 해당 Phase 재작업
};

// 신규: handleHITLDecision() 메서드
handleHITLDecision(taskId, decision, options)
```

#### 1.5.2 reviewer/index.js 변경

```javascript
// review() 반환값에 HITL 필드 추가
return {
  passed,
  score,
  hitlRequired: boolean,      // 신규: HITL 필요 여부
  hitlTrigger: string[],      // 신규: 트리거 사유
  hitl3WayOptions: {...}      // 신규: 3-way 옵션
};

// 신규 메서드
_determineHITLRequired(passed, score, issues, details, phase)
_identifyHITLTrigger(phase, score, issues, details)
_generate3WayOptions(phase, triggers, issues)
```

#### 1.5.3 orchestrator.js 변경

```javascript
// import 추가
const { HITLDecision } = require('./state/session-store.js');

// 신규 메서드
handleHITLDecision(taskId, decision, options)     // 3-way 결정 처리
routeByValidationResult(taskId, result, phase)    // 검증 결과 기반 라우팅
_mapPhaseToCheckpoint(phase)                      // Phase→Checkpoint 매핑

// _gracefulExitForHITL() 확장
// - 3-way 옵션 표시
// - 결정 명령어 안내
```

---

## 2. 테스트 체크리스트

### 2.1 파이프라인 실행 테스트 ✅

- [x] `analysis` 파이프라인: classifyPRDv2() 정상 판별
- [x] `design` 파이프라인: classifyPRDv2() 정상 판별
- [x] `code` 파이프라인: classifyPRDv2() 정상 판별
- [x] `analyzed_design` 파이프라인: classifyPRDv2() 정상 판별
- [x] `ui_mockup` 파이프라인: classifyPRDv2() 정상 판별
- [x] `full` 파이프라인: classifyPRDv2() 정상 판별

### 2.2 HITL 테스트

- [ ] ImpLeader 자동 검증 PASS → HITL 없이 진행
- [ ] ImpLeader 자동 검증 FAIL → HITL Review 진입
- [ ] Exception Approval → 해당 실행만 예외 통과
- [ ] Rule Override → 규칙 수정 후 진행
- [ ] Reject → 해당 Phase 재작업

### 2.3 예외 케이스 테스트

- [ ] Case 01: 빈 PRD → Gap Check FAIL
- [ ] Case 02: 필수 섹션 누락 → Gap Check 경고
- [x] Case 03: 잘못된 파이프라인 타입 (mixed 등) → design 폴백
- [ ] Case 05: 초대형 PRD → 토큰 제한 경고

---

## 3. 미완료 작업 (우선순위순)

### P0: 필수 ✅ 완료

- [x] 6개 파이프라인 실행 테스트 (섹션 2.1)
- [x] type 필드 제거 및 pipeline 단순화

### P1: 중요 (HITL TO-BE 아키텍처) ✅ 완료

- [x] HITL 3-way 핸들링 로직 (session-store.js, orchestrator.js)
- [x] hitlRequired 플래그 반환 (reviewer/index.js)
- [x] 검증 결과 기반 라우팅 (orchestrator.js)

### P2: 권장 (품질 향상)

- [x] PRD 자동 판별 테스트 (prd-analyzer.test.js) - pipeline 불일치 시 실패하도록 강화
- [x] Phase 전환 테스트 (A→B, B→C 데이터 전달) - 분석 컨텍스트 주입/핸드오프 매핑 보조 테스트 추가
- [x] 예외 케이스 테스트 (섹션 2.3) - 빈 PRD/잘못된 pipeline 폴백 검증

### P3: 나중에 (개선 사항)

- [x] reviewer/index.js scores 오류 확인 (score 계산 시 undefined 방어 추가)
- [x] doc-sync/index.js 경로 불일치 확인 (taskId 경로 우선 → case 경로 폴백)
- [x] ROLE_ARCHITECTURE.md 스위칭 예시 검증 (router → pipeline 용어 정합성 확인)

---

## 4. 다음 단계

```
1. ✅ type 필드 제거 완료
2. ✅ HITL 3-way 로직 구현 (P1) 완료
3. HITL 테스트 (섹션 2.2)
4. 예외 케이스 테스트 (섹션 2.3)
```

---

## 5. 참고 문서

| 문서 | 경로 |
|------|------|
| 계획 문서 | docs/reports/20251230-파이프라인재정의계획.md |
| 작업내역 | docs/reports/20251231-파이프라인-6개타입-확장-작업내역.md |

---

**END OF DOCUMENT**
