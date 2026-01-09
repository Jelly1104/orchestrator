# DOCUMENT_PIPELINE.md

> **버전**: 2.0.0 | **수정일**: 2026-01-08
> **정의**: 입력/산출물 정의, 의존성
> **대상**: All | **로딩**: 전체

---

## 이 문서의 목적

PRD부터 코드까지 **산출물 흐름**을 정의합니다.

> **Role 흐름**: `ROLE_ARCHITECTURE.md` 참조
> **검증 기준**: `VALIDATION_GUIDE.md` 참조
> **템플릿 참조**: `SYSTEM_MANIFEST.md` 참조

---

## 산출물 파이프라인

```
PRD.md → HANDOFF.md → [Phase A] → [Phase B] → [Phase C] → Deploy
```

---

## 파이프라인 타입별 산출물

| 타입              | 최초 입력          | Executor 입력 (Phase별 누적)                                                                                                                        | 산출물                                                              |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `analysis`        | `PRD.md`           | `HANDOFF.md`, `TARGET_DEFINITION.md`                                                                                                               | `*.sql`, `analysis_result.json`, `analysis_report.md`               |
| `design`          | `PRD.md`           | `HANDOFF.md`                                                                                                                                        | `IA.md`, `Wireframe.md`, `SDD.md`                                   |
| `analyzed_design` | `PRD.md`           | `HANDOFF.md`, `TARGET_DEFINITION.md`, `*.sql`, `analysis_result.json`, `analysis_report.md`                                                        | `IA.md`, `Wireframe.md`, `SDD.md`                                   |
| `code`            | `PRD.md`, `SDD.md` | `HANDOFF.md`, `DOMAIN_SCHEMA.md`                                                                                                                    | `backend/src/*`, `frontend/src/*`, `src/mocks/*`, `tests/*.test.ts` |
| `ui_mockup`       | `PRD.md`           | `HANDOFF.md`, `IA.md`, `Wireframe.md`, `SDD.md`, `DOMAIN_SCHEMA.md`                                                                                 | `frontend/src/*`, `src/mocks/*`, `tests/*.test.ts`                  |
| `full`            | `PRD.md`           | `HANDOFF.md`, `TARGET_DEFINITION.md`, `*.sql`, `analysis_result.json`, `analysis_report.md`, `IA.md`, `Wireframe.md`, `SDD.md`, `DOMAIN_SCHEMA.md` | `backend/src/*`, `frontend/src/*`, `src/mocks/*`, `tests/*`         |

> ⚠️ **code 타입 주의**: `SDD.md` 별첨 필수 (Coder는 PRD를 직접 참조하지 않음)

---

## 데이터 흐름 및 계약 (Data Flow & Contract)

**"Phase A에서 발견하고, Phase C에서 재현한다."**

| 단계        | 역할             | 데이터 성격             | 참조 문서 (Source of Truth) | 산출물 (Artifact)              |
| :---------- | :--------------- | :---------------------- | :-------------------------- | :----------------------------- |
| **Phase A** | **Discovery**    | **Real Data** (DB 조회) | Legacy DB                   | `DOMAIN_SCHEMA.md` (계약 확정) |
| **Phase C** | **Reproduction** | **Fixture** (계약 기반) | `DOMAIN_SCHEMA.md`          | `src/mocks/*.ts`               |

**규칙:**

1. **Contract First:** Phase C의 모든 Fixture는 Phase A에서 검증된 `DOMAIN_SCHEMA`의 컬럼명과 구조를 100% 따라야 한다.
2. **No Ad-hoc:** 스키마에 없는 컬럼을 UI 편의를 위해 Fixture에 임의로 추가하는 것은 금지한다 (Schema Drift 방지).

---

## 역방향 흐름 금지 (Reverse Flow Protection)

**"코드에서 문서를 역생성하는 행위는 문서 변조로 간주합니다."**

```
허용: PRD → HANDOFF → IA → Wireframe → SDD → Code
금지: Code → SDD, Code → PRD (역방향)
```

| 상황                                | 대응                                  |
| ----------------------------------- | ------------------------------------- |
| Coder가 코드 기반으로 SDD 수정 요청 | 즉시 거부, Leader에게 보고            |
| 구현 중 설계 변경 필요 발견         | 작업 중단 → Leader에게 설계 변경 요청 |
| 코드 리뷰 중 PRD 불일치 발견        | 코드 수정 (PRD 변경 아님)             |

**END OF DOCUMENT_PIPELINE.md**
