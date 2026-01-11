# Extension Skills vs Orchestrator (ext-test-001)
> 비교 대상: `task-001`(Claude Extension Skills) vs `task-003`(Orchestrator ui_mockup)
> 작성일: 2026-01-06

## 전체 개요
- 동일 PRD 기반 두 파이프라인 산출물 비교. 코드 경로는 별도 확인 필요(현재 문서만 비교).
- Orchestrator는 DesignAgent 복원 후 실행했지만 여전히 출력 길이가 Extension 대비 짧음.

## 산출물 볼륨 비교 (line count)
| 문서 | Extension (`task-001`) | Orchestrator (`task-003`) | 비고 |
| ---- | --------------------- | ------------------------- | ---- |
| IA.md | 189 | 75 | 계층/네비/데이터 매핑 축약 |
| Wireframe.md | 224 | 110 | 화면 설명·ASCII 간소화 |
| SDD.md | 358 | 159 | API/데이터 모델/보안 섹션 축소 |
| HANDOFF.md | 184 | 62 | 작업 지시·완료 조건 축약 |

## 질적 차이 요약
- **IA**: task-003은 페이지 계층/네비·데이터 매핑 디테일이 부족.
- **Wireframe**: 화면 목록·인터랙션·데이터 바인딩 설명이 단순화, ASCII 밀도 낮음.
- **SDD**: 엔드포인트/파라미터/에러 처리/보안 섹션이 축소, 도메인 매핑 부실.
- **HANDOFF**: 완료 기준·체크리스트·우선순위 지침이 짧고 구체성 부족.

## 원인 추정
- 설계 프롬프트 품질/컨텍스트 부족(DesignAgent 템플릿은 작동했으나 리치 컨텍스트 미반영).
- Code 단계는 출력 경로 화이트리스트 수정 이후 재시도 필요(현재 log상 생성 파일 0개였음).

## 권장 조치
1) Orchestrator 재실행 시 PRD에 참고 섹션 주입(예: task-001의 IA/SDD 핵심 섹션을 HANDOFF/PRD 주석에 포함)으로 설계 프롬프트 보강.
2) Code 단계 정상화 확인: output-sanitizer 화이트리스트 수정 상태에서 `--task-id ext-test-001-task-003-rerun` 재실행 후 코드 생성 여부 확인.
3) 재실행 산출물을 다시 이 테이블로 업데이트해 길이/섹션 회복 여부 확인.
