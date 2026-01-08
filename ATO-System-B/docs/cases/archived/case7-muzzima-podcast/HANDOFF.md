# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목       | 구현 방식 매핑 법인 |
|------------------------|------------------|
| SQL 쿼리                   | Phase A: best_posts_query.sql |
| 팟캐스트 대본 & 메타데이터   | Phase B: Podcast_Script.md, Audio_Metadata.json |
| Web UI 및 TTS            | Phase C: Express.js Backend, Web UI, TTS Player |

## Mode

Design

## Required Outputs

- SQL Query (best_posts_query.sql)
- Podcast Script (Podcast_Script.md)
- UI/UX Wireframes (Web UI / TTS Player)
- Metadata JSON (Audio_Metadata.json)

## Input Documents

- PRD (case7-muzzima-podcast-20251226)
- DOMAIN_SCHEMA.md (스키마 참조)
- DB_ACCESS_POLICY.md (보안 고려)
- PRD_GUIDE.md (참조 가이드)

## Completion Criteria

- SQL 최적화 및 제한 사항 반영 (`LIMIT`, `*` 금지)
- 구어체 스크립트 대본 (Host/Guest 포함)
- PII 미노출 보장
- 성공적 UI 렌더링 및 동작 검증

## Constraints

- 성능: DB 테이블 Full Scan 금지
- 보안: PII 철저한 마스킹 필수
- 음향: TTS 자연스러움 우선