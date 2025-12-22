# Doc-Agent 문서 동기화 완료 가이드

## 상황 분석

현재 4개 문서가 Notion에 동기화되지 않은 상태:
- ANALYSIS_GUIDE.md (분석 Agent 가이드 v2.0)
- PRD_GUIDE.md (PRD 통합 가이드 v2.0)
- VALIDATION_GUIDE.md (검증 통합 가이드 v2.0)
- ERROR_HANDLING_GUIDE.md (에러 처리 가이드 v2.0)

## 문제점

현재 환경에서는 MCP Notion 도구에 직접 접근할 수 없습니다.
다음 두 가지 방법 중 하나를 선택해야 합니다:

### 옵션 1: MCP 도구가 설정된 환경에서 실행

Claude Desktop 또는 MCP가 설정된 환경에서 다음 프롬프트 실행:

```
doc-agent 문서 동기화 완료:

1. mcp__notion__notion-search로 다음 페이지 검색:
   - "ANALYSIS_GUIDE" 또는 "분석 Agent 가이드"
   - "PRD_GUIDE" 또는 "PRD 통합 가이드"
   - "VALIDATION_GUIDE" 또는 "검증 통합 가이드"
   - "ERROR_HANDLING_GUIDE" 또는 "에러 처리 가이드"

2. 존재하지 않으면 mcp__notion__notion-create-pages로 생성:
   - 제목과 내용은 로컬 파일 참조
   - 카테고리별로 적절한 부모 페이지 지정

3. 생성된 페이지 ID를 notion-mapping.json에 업데이트

4. syncEnabled: true로 변경
```

### 옵션 2: 수동 Notion 페이지 생성

1. Notion 워크스페이스에서 수동으로 4개 페이지 생성
2. 각 페이지에 로컬 파일 내용 복사
3. 생성된 페이지 ID를 확인 (URL에서 추출)
4. notion-mapping.json 수동 업데이트

## 자동화된 업데이트 스크립트

페이지 ID를 확보한 후 다음 스크립트로 notion-mapping.json 업데이트:

```javascript
// update-mapping.js
import fs from 'fs';
import path from 'path';

const MAPPING_PATH = './orchestrator/config/notion-mapping.json';

// 생성된 Notion 페이지 ID들 (실제 값으로 교체 필요)
const PAGE_IDS = {
  'ANALYSIS_GUIDE.md': 'YOUR_NOTION_PAGE_ID_1',
  'PRD_GUIDE.md': 'YOUR_NOTION_PAGE_ID_2',
  'VALIDATION_GUIDE.md': 'YOUR_NOTION_PAGE_ID_3',
  'ERROR_HANDLING_GUIDE.md': 'YOUR_NOTION_PAGE_ID_4'
};

function updateMapping() {
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));

  for (const [docName, pageId] of Object.entries(PAGE_IDS)) {
    if (mapping.mappings[docName]) {
      mapping.mappings[docName].notionPageId = pageId;
      mapping.mappings[docName].syncEnabled = true;
      mapping.mappings[docName].note = '동기화 완료';
    }
  }

  mapping.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2));

  console.log('✅ notion-mapping.json 업데이트 완료');
}

updateMapping();
```

## 검증

업데이트 후 상태 확인:

```bash
cd /Users/m2-mini/Desktop/eunah/Medi-Notion
node orchestrator/skills/doc-agent/sync.js --status
```

## 다음 단계

동기화 완료 후:

```bash
# 전체 문서 Notion 동기화
node orchestrator/skills/doc-agent/sync.js --to-notion all

# 특정 문서만 동기화
node orchestrator/skills/doc-agent/sync.js --to-notion ANALYSIS_GUIDE.md
```

## 권장 사항

현재 MCP 도구 접근 불가 상황이므로:

1. **옵션 1 권장**: MCP가 설정된 Claude Desktop 환경에서 작업
2. 또는 Notion API를 직접 사용하는 스크립트 개발
3. 수동 작업의 경우 변경 사항을 Git으로 추적

## 참고 문서

- sync.js: 동기화 로직 구현
- notion-mapping.json: 문서-페이지 매핑 설정
- 로컬 문서 위치:
  - /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/ANALYSIS_GUIDE.md
  - /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/PRD_GUIDE.md
  - /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/VALIDATION_GUIDE.md
  - /Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/ERROR_HANDLING_GUIDE.md
