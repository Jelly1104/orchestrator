# Doc-Agent 문서 동기화 완료 계획

## 현재 상태

notion-mapping.json에서 syncEnabled: false인 4개 문서:

1. **ANALYSIS_GUIDE.md**
   - localPath: `.claude/global/ANALYSIS_GUIDE.md`
   - category: `02. Workflows`
   - notionPageId: `null`
   - 문서 버전: 2.0.0

2. **PRD_GUIDE.md**
   - localPath: `.claude/global/PRD_GUIDE.md`
   - category: `02. Workflows`
   - notionPageId: `null`
   - 문서 버전: 2.0.0

3. **VALIDATION_GUIDE.md**
   - localPath: `.claude/global/VALIDATION_GUIDE.md`
   - category: `03. Guards`
   - notionPageId: `null`
   - 문서 버전: 2.0.0

4. **ERROR_HANDLING_GUIDE.md**
   - localPath: `.claude/global/ERROR_HANDLING_GUIDE.md`
   - category: `03. Guards`
   - notionPageId: `null`
   - 문서 버전: 2.0.0

## 실행 단계

### Step 1: Notion 페이지 검색

각 문서에 대해 mcp__notion__notion-search 도구로 기존 페이지 검색:

```
검색어:
- "ANALYSIS_GUIDE" 또는 "분석 Agent 가이드"
- "PRD_GUIDE" 또는 "PRD 통합 가이드"
- "VALIDATION_GUIDE" 또는 "검증 통합 가이드"
- "ERROR_HANDLING_GUIDE" 또는 "에러 처리 가이드"
```

### Step 2: 페이지 생성 (존재하지 않는 경우)

mcp__notion__notion-create-pages 도구 사용:

#### ANALYSIS_GUIDE.md
- 제목: "분석 Agent 가이드 v2.0"
- 부모 페이지: "02. Workflows" 카테고리
- 내용: 로컬 파일 내용

#### PRD_GUIDE.md
- 제목: "PRD 통합 가이드 v2.0"
- 부모 페이지: "02. Workflows" 카테고리
- 내용: 로컬 파일 내용

#### VALIDATION_GUIDE.md
- 제목: "검증 통합 가이드 v2.0"
- 부모 페이지: "03. Guards" 카테고리
- 내용: 로컬 파일 내용

#### ERROR_HANDLING_GUIDE.md
- 제목: "에러 처리 가이드 v2.0"
- 부모 페이지: "03. Guards" 카테고리
- 내용: 로컬 파일 내용

### Step 3: notion-mapping.json 업데이트

생성된 페이지 ID로 매핑 파일 업데이트:

```json
"ANALYSIS_GUIDE.md": {
  "notionPageId": "[생성된 페이지 ID]",
  "localPath": ".claude/global/ANALYSIS_GUIDE.md",
  "category": "02. Workflows",
  "syncEnabled": true,
  "note": "동기화 완료"
}
```

### Step 4: 동기화 활성화

모든 문서의 `syncEnabled`를 `true`로 변경

## 예상 결과

- 4개 문서 모두 Notion에 페이지 생성 완료
- notion-mapping.json 업데이트 완료
- syncEnabled: true 설정 완료
- 향후 `node sync.js --to-notion all` 명령으로 자동 동기화 가능

## 검증 방법

```bash
node orchestrator/skills/doc-agent/sync.js --status
```

결과:
```
| 문서 | 로컬 버전 | Notion 연결 | 동기화 | 비고 |
|------|----------|------------|--------|------|
| ANALYSIS_GUIDE.md | 2.0.0 | ✅ | ✅ | 동기화 완료 |
| PRD_GUIDE.md | 2.0.0 | ✅ | ✅ | 동기화 완료 |
| VALIDATION_GUIDE.md | 2.0.0 | ✅ | ✅ | 동기화 완료 |
| ERROR_HANDLING_GUIDE.md | 2.0.0 | ✅ | ✅ | 동기화 완료 |
```
