# Cline 작업 지시

> **Handoff ID**: case-3-dr-insight-20251217
> **전달 시간**: 2025-12-17T10:15:00+09:00
> **Leader**: Claude Code

---

## 즉시 수행할 작업

### 1. 문서 확인
```
docs/case-3-dr-insight/
├── IA.md           ← 정보 구조 (라우팅)
├── Wireframe.md    ← 화면 설계 (컴포넌트)
├── SDD.md          ← 시스템 설계 (API)
└── HANDOFF.md      ← 작업 지시서 (필독)
```

### 2. MCP Server 연결
```bash
# 작업 시작 알림 (이미 Leader가 전송함 - 생략 가능)
curl -s http://localhost:3002/api/state
```

### 3. 구현 시작
HANDOFF.md의 "Output 기대" 섹션에 명시된 파일들을 순서대로 구현하세요.

**우선순위 P0 (필수)**:
1. `src/features/dr-insight/types.ts`
2. `src/services/InsightService.ts`
3. `src/features/dr-insight/api.ts`
4. `src/features/dr-insight/hooks/useInsightData.ts`
5. `src/features/dr-insight/components/DrInsightPage.tsx`
6. `src/features/dr-insight/components/MetricCard.tsx`

### 4. 진행상황 보고
파일 생성할 때마다:
```bash
curl -X PATCH http://localhost:3002/api/handoff/progress \
  -H "Content-Type: application/json" \
  -d '{"completedFiles":N, "currentTask":"파일명"}'
```

### 5. 완료 후
```bash
curl -X POST http://localhost:3002/api/handoff/complete \
  -H "Content-Type: application/json" \
  -d '{"success":true, "files":[...]}'
```

---

## 필수 참조 문서

- `.clinerules` - Sub-agent 헌법
- `CLAUDE.md` - 팀 헌법
- `.claude/global/DOMAIN_SCHEMA.md` - DB 컬럼명
- `.claude/global/CODE_STYLE.md` - 코딩 스타일

---

## 제약사항 (위반 시 즉시 중단)

🔴 `.claude/global/*` 수정 금지
🔴 서버 DB INSERT/UPDATE/DELETE 금지
🔴 DOMAIN_SCHEMA에 없는 컬럼명 사용 금지
🔴 아키텍처 임의 변경 금지

---

**작업을 시작하세요. 완료 후 Leader에게 보고해주세요.**
