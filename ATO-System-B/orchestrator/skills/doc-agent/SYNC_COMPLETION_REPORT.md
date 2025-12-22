# Doc-Agent 문서 동기화 완료 보고서

> **작성일**: 2025-12-19
> **작업자**: Claude Code Agent
> **상태**: ⚠️ MCP 도구 접근 불가로 수동 완료 필요

---

## 1. 작업 요약

### 목표
notion-mapping.json에서 syncEnabled: false인 4개 문서를 Notion에 동기화

### 대상 문서
| 문서명 | 로컬 경로 | 카테고리 | 버전 | 상태 |
|--------|----------|---------|------|------|
| ANALYSIS_GUIDE.md | .claude/global/ANALYSIS_GUIDE.md | 02. Workflows | 2.0.0 | ⏸️ 대기 |
| PRD_GUIDE.md | .claude/global/PRD_GUIDE.md | 02. Workflows | 2.0.0 | ⏸️ 대기 |
| VALIDATION_GUIDE.md | .claude/global/VALIDATION_GUIDE.md | 03. Guards | 2.0.0 | ⏸️ 대기 |
| ERROR_HANDLING_GUIDE.md | .claude/global/ERROR_HANDLING_GUIDE.md | 03. Guards | 2.0.0 | ⏸️ 대기 |

---

## 2. 현재 상황

### 문제점
- MCP Notion 도구에 직접 접근 불가
- `mcp__notion__notion-search` 및 `mcp__notion__notion-create-pages` 도구 사용 불가

### 분석 완료 사항
✅ 4개 문서의 로컬 파일 존재 확인
✅ 문서 버전 정보 확인 (모두 v2.0.0)
✅ 카테고리 분류 확인
✅ 문서 내용 구조 분석 완료

---

## 3. 문서 상세 정보

### 3.1 ANALYSIS_GUIDE.md
- **제목**: 분석 Agent 가이드 v2.0
- **설명**: AnalysisAgent 파이프라인, DB 접근 정책, SQL 생성 가이드
- **주요 섹션**:
  - Agent 개요 및 역할
  - 파이프라인 (PRD → SQL → 결과 해석)
  - DB 접근 정책 (readonly 계정)
  - SQL 생성 제약사항
  - 오류 처리 및 재시도 정책
- **통합 대상**: ANALYSIS_AGENT_SPEC.md, DB_ACCESS_POLICY.md
- **라인 수**: 340줄

### 3.2 PRD_GUIDE.md
- **제목**: PRD 통합 가이드 v2.0
- **설명**: PRD 필수 항목, 유형 판별, 파이프라인 정의
- **주요 섹션**:
  - PRD 필수 6개 항목
  - 유형 분류 (QUANTITATIVE/QUALITATIVE/MIXED)
  - 파이프라인 선택 기준
  - 레퍼런스 자동 매핑
  - 산출물 타입 정의
- **통합 대상**: PRD_TEMPLATE_V2.md, PRD_TYPE_PIPELINE.md, PRD_REFERENCE_MAP.md
- **라인 수**: 392줄

### 3.3 VALIDATION_GUIDE.md
- **제목**: 검증 통합 가이드 v2.0
- **설명**: 산출물 검증 파이프라인 (4단계)
- **주요 섹션**:
  - Phase 1: PRD Gap Check
  - Phase 2: Native/Sub Agent 개발
  - Phase 3: Output Validation (Syntax, PRD 매칭, 스키마 정합성)
  - Phase 4: Quality Gates
  - 도메인 키워드 맵
- **통합 대상**: OUTPUT_VALIDATION.md, PRD_GAP_CHECK.md, QUALITY_GATES.md
- **라인 수**: 371줄

### 3.4 ERROR_HANDLING_GUIDE.md
- **제목**: 에러 처리 가이드 v2.0
- **설명**: 장애 유형 분류 및 대응 절차
- **주요 섹션**:
  - 장애 유형 (LLM 오동작, 데이터 위반, 보안 위반)
  - 에스컬레이션 경로
  - 즉시 대응 절차
  - 롤백 절차
  - 포스트모템 템플릿
  - FeedbackLoop Agent 연동
- **라인 수**: 253줄

---

## 4. 실행 계획

### Step 1: Notion 페이지 검색
각 문서에 대해 기존 Notion 페이지 존재 여부 확인:

```bash
# MCP 도구 사용 (Claude Desktop 환경)
mcp__notion__notion-search query="분석 Agent 가이드"
mcp__notion__notion-search query="PRD 통합 가이드"
mcp__notion__notion-search query="검증 통합 가이드"
mcp__notion__notion-search query="에러 처리 가이드"
```

### Step 2: 페이지 생성
존재하지 않는 경우 새 페이지 생성:

#### ANALYSIS_GUIDE.md
```
제목: 분석 Agent 가이드 v2.0
부모: [02. Workflows 페이지 ID]
내용: /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/ANALYSIS_GUIDE.md
```

#### PRD_GUIDE.md
```
제목: PRD 통합 가이드 v2.0
부모: [02. Workflows 페이지 ID]
내용: /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/PRD_GUIDE.md
```

#### VALIDATION_GUIDE.md
```
제목: 검증 통합 가이드 v2.0
부모: [03. Guards 페이지 ID]
내용: /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/VALIDATION_GUIDE.md
```

#### ERROR_HANDLING_GUIDE.md
```
제목: 에러 처리 가이드 v2.0
부모: [03. Guards 페이지 ID]
내용: /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/ERROR_HANDLING_GUIDE.md
```

### Step 3: notion-mapping.json 업데이트

페이지 생성 후 다음 형식으로 매핑 파일 업데이트:

```json
{
  "ANALYSIS_GUIDE.md": {
    "notionPageId": "[생성된 페이지 ID]",
    "localPath": ".claude/global/ANALYSIS_GUIDE.md",
    "category": "02. Workflows",
    "syncEnabled": true,
    "note": "2025-12-19 동기화 완료"
  },
  "PRD_GUIDE.md": {
    "notionPageId": "[생성된 페이지 ID]",
    "localPath": ".claude/global/PRD_GUIDE.md",
    "category": "02. Workflows",
    "syncEnabled": true,
    "note": "2025-12-19 동기화 완료"
  },
  "VALIDATION_GUIDE.md": {
    "notionPageId": "[생성된 페이지 ID]",
    "localPath": ".claude/global/VALIDATION_GUIDE.md",
    "category": "03. Guards",
    "syncEnabled": true,
    "note": "2025-12-19 동기화 완료"
  },
  "ERROR_HANDLING_GUIDE.md": {
    "notionPageId": "[생성된 페이지 ID]",
    "localPath": ".claude/global/ERROR_HANDLING_GUIDE.md",
    "category": "03. Guards",
    "syncEnabled": true,
    "note": "2025-12-19 동기화 완료"
  }
}
```

---

## 5. 수동 완료 절차

### 옵션 A: MCP 도구 사용 (권장)

Claude Desktop 또는 MCP가 설정된 환경에서:

1. 이 보고서를 Claude에게 제공
2. "4개 문서를 Notion에 동기화하고 notion-mapping.json 업데이트" 요청
3. MCP 도구가 자동으로 페이지 생성 및 매핑 업데이트

### 옵션 B: Notion 웹 UI 사용

1. Notion 워크스페이스 접속
2. 각 문서에 대해:
   - 새 페이지 생성
   - 제목 설정 (예: "분석 Agent 가이드 v2.0")
   - 로컬 파일 내용 복사/붙여넣기
   - 페이지 ID 추출 (URL에서)
3. notion-mapping.json 수동 업데이트:
   ```bash
   cd /Users/m2-mini/Desktop/eunah/Medi-Notion
   # 텍스트 에디터로 orchestrator/config/notion-mapping.json 편집
   ```

### 옵션 C: Notion API 스크립트

준비된 스크립트 실행:

```bash
cd /Users/m2-mini/Desktop/eunah/Medi-Notion
# 페이지 ID 확보 후
node orchestrator/skills/doc-agent/update-mapping.js \
  --analysis-id "페이지ID1" \
  --prd-id "페이지ID2" \
  --validation-id "페이지ID3" \
  --error-id "페이지ID4"
```

---

## 6. 검증 절차

완료 후 다음 명령으로 상태 확인:

```bash
cd /Users/m2-mini/Desktop/eunah/Medi-Notion
node orchestrator/skills/doc-agent/sync.js --status
```

### 예상 출력 (성공 시)

```
📊 문서 동기화 상태
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| 문서 | 로컬 버전 | Notion 연결 | 동기화 | 비고 |
|------|----------|------------|--------|------|
| CLAUDE.md | 3.4.1 | ✅ | ✅ |  |
| AGENT_ARCHITECTURE.md | N/A | ✅ | ✅ |  |
| AI_CONTEXT.md | N/A | ✅ | ✅ |  |
| DOMAIN_SCHEMA.md | N/A | ✅ | ✅ |  |
| QUALITY_GATES.md | N/A | ✅ | ❌ | archived |
| ANALYSIS_GUIDE.md | 2.0.0 | ✅ | ✅ | 2025-12-19 동기화 완료 |
| PRD_GUIDE.md | 2.0.0 | ✅ | ✅ | 2025-12-19 동기화 완료 |
| VALIDATION_GUIDE.md | 2.0.0 | ✅ | ✅ | 2025-12-19 동기화 완료 |
| ERROR_HANDLING_GUIDE.md | 2.0.0 | ✅ | ✅ | 2025-12-19 동기화 완료 |
| TDD_WORKFLOW.md | N/A | ✅ | ✅ |  |
| CODE_STYLE.md | N/A | ✅ | ✅ |  |
```

---

## 7. 다음 단계

동기화 완료 후:

### 자동 동기화 활성화
```bash
# 모든 문서 동기화
node orchestrator/skills/doc-agent/sync.js --to-notion all

# 특정 문서만 동기화
node orchestrator/skills/doc-agent/sync.js --to-notion ANALYSIS_GUIDE.md
```

### 주기적 동기화 설정 (선택)
```bash
# cron job 또는 GitHub Actions로 자동화
0 */6 * * * cd /path/to/Medi-Notion && node orchestrator/skills/doc-agent/sync.js --to-notion all
```

---

## 8. 문제 해결

### Q1: MCP 도구가 작동하지 않음
**A**: Claude Desktop 환경에서 실행하거나, MCP 서버 설정 확인

### Q2: 페이지 ID를 어떻게 찾나요?
**A**: Notion 페이지 URL에서 추출
```
https://notion.so/workspace/[페이지-제목]-[페이지ID]
예: https://notion.so/myworkspace/Analysis-Guide-2cc879603bef81de9b98e3daf0fce7d1
→ 페이지 ID: 2cc879603bef81de9b98e3daf0fce7d1
```

### Q3: 부모 페이지 ID는?
**A**: 기존 동기화된 문서의 카테고리 참조
- "02. Workflows": AGENT_ARCHITECTURE.md의 부모 페이지
- "03. Guards": QUALITY_GATES.md의 부모 페이지

---

## 9. 체크리스트

### 완료 전
- [ ] 4개 로컬 문서 내용 확인
- [ ] Notion 워크스페이스 접근 권한 확인
- [ ] MCP 도구 설정 확인 (또는 수동 방법 선택)

### 실행 중
- [ ] ANALYSIS_GUIDE.md Notion 페이지 생성
- [ ] PRD_GUIDE.md Notion 페이지 생성
- [ ] VALIDATION_GUIDE.md Notion 페이지 생성
- [ ] ERROR_HANDLING_GUIDE.md Notion 페이지 생성
- [ ] notion-mapping.json 업데이트

### 완료 후
- [ ] `sync.js --status` 검증
- [ ] 4개 문서 모두 ✅ ✅ 상태 확인
- [ ] Notion에서 페이지 렌더링 확인
- [ ] 자동 동기화 테스트

---

## 10. 참조 자료

### 관련 파일
- 로컬 문서 위치: `/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/`
- 매핑 설정: `/Users/m2-mini/Desktop/eunah/Medi-Notion/orchestrator/config/notion-mapping.json`
- 동기화 스크립트: `/Users/m2-mini/Desktop/eunah/Medi-Notion/orchestrator/skills/doc-agent/sync.js`

### 문서
- sync.js 코드 분석 완료
- notion-mapping.json 구조 분석 완료
- 4개 대상 문서 내용 분석 완료

---

**작성자 노트**:

현재 환경에서 MCP Notion 도구에 직접 접근할 수 없어 실제 페이지 생성 및 매핑 업데이트는 수동으로 진행해야 합니다.

**권장 방법**:
1. 이 보고서를 Claude Desktop에 제공
2. MCP 도구가 자동으로 작업 완료
3. 또는 Notion 웹 UI에서 수동 작업

모든 준비 작업(문서 분석, 실행 계획, 검증 절차)은 완료되었습니다.

---

**END OF REPORT**
