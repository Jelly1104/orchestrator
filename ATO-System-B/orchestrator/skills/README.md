# Orchestrator Skills

> **버전**: 2.5.0
> **최종 수정**: 2025-12-24
> **변경 이력**: 네이밍 리팩토링 - agent 접미사 제거

---

## 개요

Skills는 Orchestrator Agent들의 역할과 능력을 정의하는 모듈입니다.
각 Skill은 `SKILL.md` 파일과 선택적으로 구현 코드(`index.js`)를 포함합니다.

> **네이밍 규칙 (v2.5.0)**: Skill 이름에서 `-agent` 접미사 제거. `agent`는 LLM 기반 실행 주체에만 사용.

---

## Skill 목록

| Skill | 역할 | 버전 | 상태 | 팩토리 패턴 |
|-------|------|------|------|------------|
| **query** | SQL 쿼리 생성/실행 | v1.2.0 | ✅ 완료 | ✅ |
| **coder** | 설계 문서 기반 코드 구현 | v1.3.0 | ✅ 완료 | ✅ |
| **designer** | 시각화 고도화 (Mermaid → HTML) | v2.2.0 | ✅ 완료 | ✅ |
| **doc-sync** | 로컬 ↔ Notion 동기화 | v2.1.0 | ✅ 완료 | ✅ |
| **profiler** | 회원 프로필 분석 | v1.2.0 | ✅ 완료 | ✅ |
| **reviewer** | 산출물 품질 검증 | v1.2.0 | ✅ 완료 | ✅ |
| **viewer** | 웹 뷰어 API | v1.5.0 | ✅ 완료 | ✅ |

> ⚠️ **참고**: `agents/design-agent.js`는 "문서 생성" 담당 (PRD → IA/Wireframe/SDD)이고,
> `skills/designer/index.js`는 "시각화" 담당 (MD → HTML)입니다. 이름은 다르지만 관련 기능입니다.

### 레거시 매핑 (하위 호환성)

| 기존 이름 (Deprecated) | 새 이름 |
| :--------------------- | :------ |
| query-agent | query |
| code-agent | coder |
| design-agent | designer |
| doc-agent | doc-sync |
| profile-agent | profiler |
| review-agent | reviewer |
| viewer-agent | viewer |

---

## 디렉토리 구조

```
skills/
├── README.md            # 이 파일
├── skill-loader.js      # SkillLoader 클래스
├── skill-registry.js    # SkillRegistry (동적 로딩)
│
├── query/
│   ├── SKILL.md         # SQL 쿼리 전문가 정의
│   ├── index.js         # QuerySkill 구현
│   └── resources/
│       └── SQL_PATTERNS.md
│
├── coder/
│   ├── SKILL.md         # 코드 구현 전문가 정의
│   └── index.js         # CoderSkill (래퍼)
│
├── designer/
│   ├── SKILL.md         # 시각화 고도화 전문가 정의
│   ├── index.js         # DesignerSkill 구현 (v2.2.0)
│   └── resources/       # HTML 템플릿
│       ├── IA_TEMPLATE.md
│       └── WF_TEMPLATE.md
│
├── doc-sync/
│   ├── SKILL.md         # 문서 동기화 전문가 정의
│   ├── index.js         # DocSyncSkill 구현
│   └── sync.js          # 동기화 핵심 로직
│
├── profiler/
│   ├── SKILL.md         # 프로필 분석 전문가 정의
│   ├── index.js         # ProfilerSkill 구현
│   └── resources/
│       └── SEGMENT_RULES.md
│
├── reviewer/
│   ├── SKILL.md         # 품질 검증 전문가 정의
│   ├── index.js         # ReviewerSkill 구현
│   └── resources/
│       ├── PRD_CHECKLIST.md
│       └── QUALITY_RULES.md
│
└── viewer/
    ├── SKILL.md         # 뷰어 API 정의
    └── index.js         # ViewerSkill 구현
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

### index.js 구조 (팩토리 패턴)

모든 Skill 클래스는 **팩토리 패턴**을 따릅니다.

```javascript
import { SkillLoader } from '../skill-loader.js';

export class {SkillName}Skill {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;
  }

  async initialize() {
    this.skill = await this.skillLoader.loadSkill('{skill-name}');
    console.log('[{SkillName}Skill] Initialized with SKILL.md');
    return this;
  }

  async execute(input) {
    // 핵심 로직
    return output;
  }
}

// 팩토리 패턴 기본 내보내기 (SkillRegistry 호환)
export default {
  create: (config = {}) => new {SkillName}Skill(config),
  meta: {
    name: '{skill-name}',
    version: 'x.x.x',
    description: '역할 설명',
    category: 'analyst | builder | guardian | utility | implementation',
    dependencies: ['SkillLoader'],
    status: 'active'
  }
};

// Named export (직접 import 호환)
export { {SkillName}Skill };
```

### SkillRegistry 로딩 규칙

SkillRegistry는 다음 규칙으로 Skill 클래스를 찾습니다:

```javascript
// skill-registry.js
// 클래스명 = PascalCase(skillType) + 'Skill'
const baseClassName = skillType.split('-').map(part =>
  part.charAt(0).toUpperCase() + part.slice(1)
).join('');
const className = baseClassName + 'Skill';
// 예: 'reviewer' → 'ReviewerSkill'
// 예: 'doc-sync' → 'DocSyncSkill'

SkillClass = module[className] || module.default;
```

**주의**: Named export 이름은 반드시 위 규칙을 따라야 합니다.

---

## SkillLoader 사용법

```javascript
import { SkillLoader } from './skill-loader.js';

const loader = new SkillLoader(path.join(__dirname, 'skills'));

// SKILL.md 로드
const skill = await loader.loadSkill('query');

// skill 구조
{
  name: 'query',
  version: '1.2.0',
  role: 'SQL 쿼리 생성 및 데이터 분석',
  content: '전체 SKILL.md 내용'
}
```

---

## Agent ↔ Skill 매핑

| Agent Class | Skill | 호출 방법 |
|-------------|-------|----------|
| `LeaderAgent` | designer (visualize) | `leader.visualize(docs)` |
| `LeaderAgent` | doc-sync | `leader.sync(docs)` |
| `SubAgent` | coder | `subAgent.implement(handoff)` |
| `AnalysisAgent` | query | `analysisAgent.analyze(prd)` |
| `AnalysisAgent` | profiler | `analysisAgent.analyzeProfiles(input)` |
| `OutputValidator` | reviewer | `validator.validate(outputs)` |

---

## 새 Skill 추가 방법

1. **디렉토리 생성**
   ```bash
   mkdir -p orchestrator/skills/{skill-name}
   ```

2. **SKILL.md 작성**
   - 위 템플릿 참고
   - 버전, 역할, 상태 명시

3. **index.js 구현 (팩토리 패턴 필수)**
   ```javascript
   // 필수 구조
   export class {SkillName}Skill { ... }

   export default {
     create: (config) => new {SkillName}Skill(config),
     meta: { name, version, description, category, dependencies, status }
   };

   export { {SkillName}Skill };  // Named export 필수
   ```

4. **SkillLoader 연동**
   ```javascript
   constructor(config = {}) {
     this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
     this.skill = null;
   }

   async initialize() {
     this.skill = await this.skillLoader.loadSkill('{skill-name}');
     return this;
   }
   ```

5. **SkillRegistry 등록 확인**
   ```javascript
   // skill-registry.js의 SkillType enum에 추가
   export const SkillType = {
     // ...existing skills...
     '{SKILL_NAME}': '{skill-name}'
   };
   ```

6. **테스트 작성**
   ```bash
   touch orchestrator/skills/{skill-name}/{skill-name}.test.js
   ```

---

## 주의사항

- SKILL.md는 **읽기 전용**으로 취급 (버전 관리)
- Skill 구현 변경 시 SKILL.md 버전 업데이트
- resources/ 폴더는 템플릿, 예제 코드 용도

---

**END OF README**
