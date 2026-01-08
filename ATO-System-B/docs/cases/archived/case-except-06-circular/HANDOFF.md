# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
| PRD 항목                      | 구현 방식                        |
|-------------------------------|----------------------------------|
| B의 결과를 입력으로 사용      | A 기능에서 B의 결과를 API로 수신 |
| C에 결과를 전달               | A 기능에서 결과 전송 API 호출    |
| C의 결과를 입력으로 사용      | B에서 C의 결과를 API로 수신      |
| A에 결과를 전달               | B에서 결과 전송 API 호출         |
| A의 결과를 입력으로 사용      | C에서 A의 결과를 API로 수신      |
| B에 결과를 전달               | C에서 결과 전송 API 호출         |

## Mode
Design

## Required Outputs
1. 독립적 모듈로 구현된 A, B, C 기능
2. 비동기 상태 관리 및 경고 메시지 시스템
3. API 호출을 통한 결과 전달

## Input Documents
- PRD
- 정보 구조 (IA)
- 화면 설계 (Wireframe)

## Completion Criteria
- 모든 의존성이 정상적으로 작동하여 A, B, C 기능이 순환적으로 호출

## Constraints
- 무한 루프 방지를 위한 상태 관리 시스템