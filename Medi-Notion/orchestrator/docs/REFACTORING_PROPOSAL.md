# Medi-Notion 리팩토링 제안서

**작성일**: 2025-12-22
**작성자**: AI Engineering Team
**대상**: Product Owner
**버전**: v1.0.0

---

## Executive Summary

현재 Medi-Notion 프로젝트는 **폴더 구조 중복**과 **AI 스킬 활용 미흡** 문제가 있습니다.
이 문서는 코드베이스 정리와 AI Orchestrator 고도화를 위한 개편안을 제시합니다.

### 핵심 개선 포인트

| 영역 | 현재 | 개선 후 | 효과 |
|------|------|---------|------|
| 폴더 구조 | 중복 3곳 (218 파일) | 통합 (~150 파일) | 유지보수성 ↑ 30% |
| AI 스킬 활용 | 50% (7개 중 4개) | 100% | AI 성능 ↑, 토큰 효율 ↑ |
| 코드 일관성 | 분산된 패턴 | 통일된 아키텍처 | 개발 속도 ↑ |

---

## 1. 현황 분석

### 1.1 폴더 구조 문제

```
현재 구조 (문제점 표시)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Medi-Notion/
├── backend/                    ✅ 유지
├── frontend/                   ✅ 유지
├── src/
│   ├── backend/               ❌ backend/와 중복
│   ├── frontend/              ❌ frontend/와 중복
│   ├── features/              ⚠️ 분산됨 (이동 필요)
│   └── analysis/              ❌ 레거시 (정리 필요)
├── tests/                      ⚠️ 분산됨 (각 모듈로 이동)
├── orchestrator/               ✅ 핵심 - 고도화 대상
└── docs/                       ✅ 유지
```

**정량적 분석:**

| 폴더 | 파일 수 | 상태 |
|------|---------|------|
| `src/backend/` | 12 | ❌ 중복 (삭제 대상) |
| `src/frontend/` | 15 | ❌ 중복 (삭제 대상) |
| `src/analysis/` | 48 | ❌ 레거시 (정리 대상) |
| `src/features/` | 18 | ⚠️ 이동 대상 |
| 루트 `tests/` | 12 | ⚠️ 분산 대상 |
| **총 정리 대상** | **~105 파일** | - |

### 1.2 AI 스킬 활용 현황

```
스킬 활용 현황 (7개 스킬)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    정의됨   사용됨   통합됨
code-agent          ✅        ✅       ⚠️
design-agent        ✅        ✅       ⚠️
doc-agent           ✅        ⚠️       ❌
profile-agent       ✅        ⚠️       ❌
query-agent         ✅        ⚠️       ❌
review-agent        ✅        ⚠️       ❌
viewer-agent        ✅        ❌       ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
활용률:              100%      57%      29%
```

**문제점:**

1. **LeaderAgent가 스킬 미사용** → 하드코딩된 프롬프트 사용
2. **Orchestrator 중앙 관리 부재** → 각 에이전트가 개별 로드
3. **viewer-agent 미활용** → React Viewer에 AI 기능 미연결

---

## 2. 개편 제안

### 2.1 폴더 구조 개편

#### Phase 1: 중복 제거 (1일)

```bash
# 삭제 대상
rm -rf src/backend/          # → backend/ 사용
rm -rf src/frontend/         # → frontend/ 사용
rm -rf src/analysis/         # → 레거시 정리
rm 2025-12-20-chat.md        # → 불필요
rm 2025-12-22-chat.md        # → 불필요
```

#### Phase 2: 이동 및 통합 (1일)

```bash
# 이동 대상
mv src/features/dr-insight → frontend/src/features/dr-insight
mv tests/* → 각 모듈의 tests/ 폴더로 분산
mv sessions/ → orchestrator/state/sessions/
```

#### Phase 3: 최종 구조

```
개선된 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Medi-Notion/
├── .claude/                    # Claude 설정 (유지)
│   ├── global/                 # 전역 규칙
│   ├── project/                # 프로젝트 설정
│   └── state/                  # 상태
│
├── backend/                    # ✅ 백엔드 통합
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── tests/
│
├── frontend/                   # ✅ 프론트엔드 통합
│   ├── src/
│   │   ├── components/
│   │   └── features/           # dr-insight 등 이동
│   └── tests/
│
├── orchestrator/               # ✅ AI Orchestrator (고도화)
│   ├── agents/
│   ├── skills/                 # 스킬 활용 강화
│   ├── providers/
│   ├── security/
│   ├── state/
│   ├── viewer/
│   └── tests/
│
├── docs/                       # ✅ 설계 문서
│   └── cases/
│
├── mcp-server/                 # ✅ MCP 서버
└── scripts/                    # ✅ 유틸리티
```

**효과:**
- 파일 수: 218 → ~150 (30% 감소)
- 중복 제거: 100%
- 구조 명확성: 대폭 향상

---

### 2.2 AI 스킬 고도화

#### 개선 목표

```
AS-IS                           TO-BE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
각 Agent가 개별 스킬 로드      →  Orchestrator 중앙 관리
LeaderAgent 스킬 미사용        →  review-agent 스킬 연동
viewer-agent 미활용            →  React Viewer AI 기능 연동
하드코딩된 프롬프트            →  동적 스킬 기반 프롬프트
```

#### Phase 1: LeaderAgent 스킬 연동 (2일)

**현재:**
```javascript
// leader.js - 하드코딩
const systemPrompt = `당신은 Leader Agent입니다...`;
```

**개선:**
```javascript
// leader.js - 스킬 기반
import { SkillLoader } from '../skills/skill-loader.js';

constructor() {
  this.skillLoader = new SkillLoader();
}

async plan() {
  const skill = await this.skillLoader.loadSkill('review-agent');
  const systemPrompt = this.skillLoader.buildSystemPrompt(skill);
  // ...
}
```

#### Phase 2: Orchestrator 중앙 스킬 관리 (2일)

**현재:**
```javascript
// orchestrator.js
const leader = new LeaderAgent();   // 개별 관리
const sub = new SubAgent();         // 개별 관리
```

**개선:**
```javascript
// orchestrator.js
class Orchestrator {
  constructor() {
    this.skillRegistry = new SkillRegistry();  // 중앙 관리
  }

  async initialize() {
    await this.skillRegistry.loadAll([
      'code-agent',
      'design-agent',
      'review-agent',
      'query-agent',
      'profile-agent'
    ]);
  }

  getAgent(type) {
    return this.skillRegistry.createAgent(type);
  }
}
```

#### Phase 3: viewer-agent 활용 (1일)

**목표:** React Viewer에 AI 기반 분석/추천 기능 추가

```
viewer-agent 활용 시나리오
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 태스크 실패 시 AI 원인 분석 제공
2. 로그 패턴 기반 최적화 제안
3. HITL 승인 시 AI 권고사항 표시
```

---

## 3. 작업 계획

### 3.1 일정

| Phase | 작업 | 예상 기간 | 우선순위 |
|-------|------|-----------|----------|
| 1-1 | 중복 폴더 삭제 | 0.5일 | **High** |
| 1-2 | 폴더 이동/통합 | 0.5일 | **High** |
| 2-1 | LeaderAgent 스킬 연동 | 2일 | **High** |
| 2-2 | Orchestrator 스킬 레지스트리 | 2일 | **Medium** |
| 2-3 | viewer-agent 활용 | 1일 | **Low** |
| 3 | 테스트 및 문서화 | 1일 | **High** |
| **총계** | | **7일** | |

### 3.2 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 중복 제거 시 의존성 누락 | Medium | Git 브랜치 분리, 단계별 테스트 |
| 스킬 연동 시 프롬프트 변경 | Low | 기존 프롬프트 백업, A/B 테스트 |
| 운영 중단 | Low | feature flag로 점진적 적용 |

---

## 4. 기대 효과

### 4.1 정량적 효과

| 지표 | 현재 | 개선 후 | 변화 |
|------|------|---------|------|
| 파일 수 | 218 | ~150 | -30% |
| 중복 코드 | 75 파일 | 0 | -100% |
| 스킬 활용률 | 29% | 100% | +245% |
| 빌드 시간 | - | - | 예상 -20% |

### 4.2 정성적 효과

1. **유지보수성 향상**
   - 단일 진실 소스 (Single Source of Truth)
   - 명확한 책임 분리

2. **AI 성능 향상**
   - 스킬 기반 전문화된 프롬프트
   - 토큰 효율성 증가 (resources 재사용)

3. **개발 생산성**
   - 새 기능 추가 시 명확한 위치
   - 온보딩 시간 단축

---

## 5. 승인 요청

### 5.1 승인 항목

| # | 항목 | 내용 |
|---|------|------|
| 1 | 폴더 정리 | `src/` 하위 중복 폴더 삭제 |
| 2 | 스킬 고도화 | LeaderAgent, Orchestrator 개선 |
| 3 | 일정 | 총 7일 (개발 6일 + 테스트 1일) |

### 5.2 결정 필요 사항

1. **`src/features/dr-insight` 이동 여부**
   - Option A: `frontend/src/features/`로 이동 ✅ (권장)
   - Option B: 현재 위치 유지

2. **레거시 `src/analysis/` 처리**
   - Option A: 완전 삭제 ✅ (권장 - 이미 orchestrator에 구현됨)
   - Option B: 아카이브 후 보관

3. **작업 시작일**
   - [ ] 즉시 시작
   - [ ] 다음 스프린트
   - [ ] 보류

---

## 6. 첨부

### 6.1 관련 문서

- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - 현재 폴더 구조 상세
- [GEMINI_REPORT_PHASE10.md](./GEMINI_REPORT_PHASE10.md) - HITL UI 구현 보고서
- [GEMINI_REPORT_E2E_TEST.md](./GEMINI_REPORT_E2E_TEST.md) - E2E 테스트 보고서

### 6.2 스킬 상세

| 스킬 | 역할 | 리소스 |
|------|------|--------|
| code-agent | 코드 생성, TDD | - |
| design-agent | IA, Wireframe, SDD 생성 | IA_TEMPLATE.md, WF_TEMPLATE.md |
| doc-agent | Notion 동기화 | - |
| profile-agent | 회원 프로필 분석 | SEGMENT_RULES.md |
| query-agent | SQL 쿼리 생성 | SQL_PATTERNS.md |
| review-agent | PRD/코드 리뷰 | PRD_CHECKLIST.md, QUALITY_RULES.md |
| viewer-agent | 뷰어 UI 분석 | - |

---

**문서 끝**

---

### 승인란

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
