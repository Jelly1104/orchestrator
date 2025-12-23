# Doc-Agent (문서 관리 에이전트)

> **버전**: 2.0.0
> **생성일**: 2025-12-19
> **최종 수정**: 2025-12-19
> **역할**: 로컬 문서 ↔ Notion 동기화 (MCP 연동)

---

## 1. 역할 정의

### 1.1 핵심 기능

| 기능 | 설명 | 트리거 |
|------|------|--------|
| **Sync to Notion** | 로컬 .md 변경 → Notion 업데이트 | 문서 수정 후 |
| **Sync from Notion** | Notion 변경 → 로컬 .md 업데이트 | 수동 요청 시 |
| **Version Tracking** | 문서 버전 변경 추적 | 동기화 시 자동 |
| **Conflict Detection** | 양방향 변경 충돌 감지 | 동기화 시 자동 |

### 1.2 대상 문서

```yaml
동기화 대상 (Constitution 체계 v4.0.0):
  - CLAUDE.md (프로젝트 루트 - 00. Constitution)
  - .claude/SYSTEM_MANIFEST.md (00. Constitution)
  - .claude/rules/*.md (01. Rules - 읽기 전용)
  - .claude/workflows/*.md (02. Workflows - 읽기 전용)
  - .claude/context/*.md (03. Context - 읽기 전용)
  - orchestrator/skills/*/SKILL.md (04. Skills)
  - .claude/project/*.md (프로젝트 설정)
  - docs/**/*.md (설계 문서)

제외 대상:
  - node_modules/
  - orchestrator/logs/
  - test-output/
  - .claude/archive/
```

---

## 2. 동기화 프로토콜

### 2.1 Local → Notion

```
1. 로컬 문서 변경 감지 (git diff 또는 파일 watch)
2. 버전 정보 추출 (문서 헤더의 버전 필드)
3. Notion 해당 페이지 검색 (문서 이름으로)
4. 버전 비교
   - 로컬 > Notion: 업데이트 진행
   - 로컬 = Notion: 스킵
   - 로컬 < Notion: 충돌 경고
5. Notion 페이지 업데이트
6. 동기화 로그 기록
```

### 2.2 Notion → Local

```
1. Notion 페이지 fetch
2. Markdown 변환 (Notion 형식 → 표준 MD)
3. 로컬 파일 버전과 비교
4. 변경사항 적용 또는 충돌 리포트
```

---

## 3. 입력/출력

### 3.1 입력

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `direction` | string | O | `to_notion` / `from_notion` / `bidirectional` |
| `target` | string | O | 파일 경로 또는 `all` |
| `force` | boolean | X | 충돌 시 강제 덮어쓰기 |

### 3.2 출력

```yaml
sync_result:
  success: true/false
  synced_count: 5
  skipped_count: 2
  conflict_count: 0
  details:
    - file: CLAUDE.md
      action: updated
      local_version: 3.4.1
      notion_version: 3.3.0
    - file: AGENT_ARCHITECTURE.md
      action: skipped
      reason: already_synced
```

---

## 4. Notion 페이지 매핑

### 4.1 문서 → Notion 페이지 ID 매핑

| 로컬 문서 | Notion 페이지 ID | 비고 |
|-----------|------------------|------|
| CLAUDE.md | `2cc87960-3bef-81de-9b98-e3daf0fce7d1` | 최신 버전 |
| AGENT_ARCHITECTURE.md | `2cc87960-3bef-8103-9376-d656b34564d6` | 최신 버전 |
| DOMAIN_SCHEMA.md | (검색 필요) | |
| QUALITY_GATES.md | (검색 필요) | |

### 4.2 매핑 저장 위치

```
orchestrator/config/notion-mapping.json
```

---

## 5. 사용 예시

### 5.1 단일 문서 동기화

```javascript
// Orchestrator에서 호출
await docAgent.sync({
  direction: 'to_notion',
  target: 'CLAUDE.md'
});
```

### 5.2 전체 동기화

```javascript
await docAgent.sync({
  direction: 'to_notion',
  target: 'all'
});
```

### 5.3 CLI 사용

```bash
node orchestrator/skills/doc-agent/sync.js --to-notion CLAUDE.md
node orchestrator/skills/doc-agent/sync.js --from-notion all
```

---

## 6. 에러 처리

| 에러 | 원인 | 대응 |
|------|------|------|
| `PAGE_NOT_FOUND` | Notion 페이지 없음 | 새 페이지 생성 제안 |
| `VERSION_CONFLICT` | 양방향 변경 | 사용자 선택 요청 |
| `RATE_LIMIT` | Notion API 제한 | 재시도 (백오프) |
| `PERMISSION_DENIED` | 권한 없음 | 에러 리포트 |

---

## 7. 구현 파일 구조

```
orchestrator/skills/doc-agent/
├── index.js           # 메인 에이전트 클래스
├── sync.js            # 동기화 핵심 로직
├── update-mapping.js  # 매핑 업데이트 헬퍼
├── SKILL.md           # 이 문서
└── tests/
    └── doc-agent.test.js
```

---

## 8. MCP 연동

### 8.1 실제 Notion MCP 호출

DocAgent는 Claude Code의 Notion MCP 도구를 통해 실제 동기화를 수행:

| MCP 도구 | 용도 |
|----------|------|
| `mcp__notion__notion-search` | 페이지 검색 |
| `mcp__notion__notion-fetch` | 페이지 내용 가져오기 |
| `mcp__notion__notion-update-page` | 페이지 업데이트 |
| `mcp__notion__notion-create-pages` | 새 페이지 생성 |

### 8.2 Orchestrator 통합

```javascript
// Orchestrator에서 DocAgent 호출
import { getDocAgent } from './skills/doc-agent/index.js';

const docAgent = getDocAgent();

// 동기화 상태 확인
const status = await docAgent.getStatus();

// Notion으로 동기화 준비
const result = await docAgent.prepareToNotion('CLAUDE.md');

// 실제 동기화는 MCP 도구 호출
// mcp__notion__notion-update-page 사용
```

---

## 9. 향후 계획

- [ ] 자동 동기화 (git hook 연동)
- [ ] 변경 diff 미리보기
- [ ] 동기화 히스토리 대시보드
- [ ] Slack 알림 연동
- [x] MCP 도구 연동 문서화

---

**END OF SKILL.md**
