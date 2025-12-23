# Orchestrator Skills

> **버전**: 1.1.0
> **최종 수정**: 2025-12-23

---

## 개요

Skills는 Orchestrator Agent들의 역할과 능력을 정의하는 모듈입니다.
각 Skill은 `SKILL.md` 파일과 선택적으로 구현 코드(`index.js`)를 포함합니다.

---

## Skill 목록

| Skill | 역할 | 상태 | 구현 위치 |
|-------|------|------|----------|
| **code-agent** | 설계 문서 기반 코드 구현 | ✅ 완료 | `skills/code-agent/index.js` → `agents/code-agent.js` |
| **design-agent** | 시각화 고도화 (Mermaid → HTML) | ✅ 완료 | `skills/design-agent/index.js` |
| **query-agent** | SQL 쿼리 생성/실행 | ✅ 완료 | `skills/query-agent/index.js` |
| **profile-agent** | 회원 프로필 분석 | ✅ 완료 | `skills/profile-agent/index.js` |
| **review-agent** | 산출물 품질 검증 | ✅ 완료 | `skills/review-agent/index.js` |
| **doc-agent** | 로컬 ↔ Notion 동기화 | ✅ 완료 | `skills/doc-agent/index.js` |
| **viewer-agent** | 웹 뷰어 API | ✅ 완료 | `skills/viewer-agent/index.js` → `viewer/server.js` |

> ⚠️ **참고**: `agents/design-agent.js`는 "문서 생성" 담당 (PRD → IA/Wireframe/SDD)이고,
> `skills/design-agent/index.js`는 "시각화" 담당 (MD → HTML)입니다. 이름은 같지만 역할이 다릅니다.

---

## 디렉토리 구조

```
skills/
├── README.md            # 이 파일
├── skill-loader.js      # SkillLoader 클래스
├── skill-registry.js    # SkillRegistry (동적 로딩)
│
├── code-agent/
│   ├── SKILL.md         # 코드 구현 전문가 정의
│   └── index.js         # CodeAgentSkill (래퍼)
│
├── design-agent/
│   ├── SKILL.md         # 시각화 고도화 전문가 정의
│   ├── index.js         # DesignAgent 구현 (v2.0.0)
│   └── resources/       # HTML 템플릿
│       ├── IA_TEMPLATE.md
│       └── WF_TEMPLATE.md
│
├── query-agent/
│   ├── SKILL.md         # SQL 쿼리 전문가 정의
│   ├── index.js         # QueryAgent 구현
│   └── resources/
│       └── SQL_PATTERNS.md
│
├── profile-agent/
│   ├── SKILL.md         # 프로필 분석 전문가 정의
│   ├── index.js         # ProfileAgent 구현
│   └── resources/
│       └── SEGMENT_RULES.md
│
├── review-agent/
│   ├── SKILL.md         # 품질 검증 전문가 정의
│   ├── index.js         # ReviewAgent 구현
│   └── resources/
│       ├── PRD_CHECKLIST.md
│       └── QUALITY_RULES.md
│
├── doc-agent/
│   ├── SKILL.md         # 문서 동기화 전문가 정의
│   ├── index.js         # DocAgent 구현
│   └── sync.js          # 동기화 핵심 로직
│
└── viewer-agent/
    ├── SKILL.md         # 뷰어 API 정의
    └── index.js         # ViewerAgent 구현
```

---

## Skill 구조

### SKILL.md 필수 섹션

```markdown
# {SkillName} Skill

> **버전**: x.x.x
> **역할**: 한 줄 설명
> **상태**: ✅ 완료 / 🔄 진행중 / 📋 계획됨

## Identity
역할 정의

## Capabilities
능력 목록

## Constraints
제약 조건

## Input Format
입력 스키마

## Output Format
출력 스키마

## Workflow
처리 흐름
```

### index.js 구조

```javascript
export class {SkillName}Agent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot;
    this.skillLoader = new SkillLoader(...);
  }

  async initialize() {
    this.skill = await this.skillLoader.loadSkill('{skill-name}');
    return this;
  }

  async execute(input) {
    // 핵심 로직
    return output;
  }
}
```

---

## SkillLoader 사용법

```javascript
import { SkillLoader } from './skill-loader.js';

const loader = new SkillLoader(path.join(__dirname, 'skills'));

// SKILL.md 로드
const skill = await loader.loadSkill('query-agent');

// skill 구조
{
  name: 'query-agent',
  version: '1.0.0',
  role: 'SQL 쿼리 생성 및 데이터 분석',
  content: '전체 SKILL.md 내용'
}
```

---

## Agent ↔ Skill 매핑

| Agent Class | Skill | 호출 방법 |
|-------------|-------|----------|
| `LeaderAgent` | design-agent (plan) | `leader.plan(prd)` |
| `LeaderAgent` | review-agent (review) | `leader.review(outputs)` |
| `CodeAgent` | code-agent | `codeAgent.implement(design)` |
| `AnalysisAgent` | query-agent | `analysisAgent.analyze(prd)` |
| `QueryAgent` | query-agent | `queryAgent.analyze(input)` |
| `ProfileAgent` | profile-agent | `profileAgent.analyzeProfiles(input)` |
| `ReviewAgent` | review-agent | `reviewAgent.validate(input)` |

---

## 새 Skill 추가 방법

1. **디렉토리 생성**
   ```bash
   mkdir -p orchestrator/skills/{skill-name}
   ```

2. **SKILL.md 작성**
   - 위 템플릿 참고
   - 버전, 역할, 상태 명시

3. **index.js 구현** (선택)
   - 독립 실행이 필요한 경우
   - 기존 Agent 확장인 경우 생략 가능

4. **SkillLoader 연동**
   ```javascript
   this.skill = await this.skillLoader.loadSkill('{skill-name}');
   ```

5. **테스트 작성**
   ```bash
   touch orchestrator/skills/{skill-name}/{skill-name}.test.js
   ```

---

## 주의사항

- SKILL.md는 **읽기 전용**으로 취급 (버전 관리)
- Agent 구현 변경 시 SKILL.md 버전 업데이트
- resources/ 폴더는 템플릿, 예제 코드 용도

---

**END OF README**
