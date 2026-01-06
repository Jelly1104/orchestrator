# MIXED 파이프라인 v2 설계

> **작성일**: 2025-12-18
> **기반**: Anthropic Multi-Agent Research System + Skills 아키텍처
> **참조**:
> - [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
> - [Anthropic Skills Repository](https://github.com/anthropics/skills)

---

## 1. 현재 vs 제안 아키텍처

### 1.1 현재 MIXED 파이프라인 (v1)

```
PRD (MIXED)
    ↓
[Phase A] AnalysisAgent → SQL 실행 → 결과
    ↓ (직렬)
[Phase B] LeaderAgent → IA/Wireframe/SDD
    ↓
최종 산출물
```

**문제점:**
- 직렬 실행으로 시간 소요
- Phase A 결과가 Phase B에 충분히 반영되지 않음
- 단일 Agent가 모든 작업 수행 (컨텍스트 한계)

### 1.2 제안: Orchestrator-Worker 패턴 (v2)

```
PRD (MIXED)
    ↓
┌─────────────────────────────────────────────────────────────────┐
│              Lead Agent (Orchestrator) - Claude Opus           │
│                                                                 │
│  1. PRD 분석 및 연구 계획 수립 (Extended Thinking)               │
│  2. 작업 분해 및 Subagent 위임                                   │
│  3. 결과 통합 및 품질 판단                                        │
│  4. 필요 시 추가 연구 지시                                        │
└─────────────────────────────────────────────────────────────────┘
                    │ 병렬 위임
    ┌───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Query   │   │ Profile │   │ Design  │   │ Review  │
│ Agent   │   │ Agent   │   │ Agent   │   │ Agent   │
│(Sonnet) │   │(Sonnet) │   │(Sonnet) │   │(Sonnet) │
│         │   │         │   │         │   │         │
│ SQL생성 │   │ 프로필  │   │ IA설계  │   │ 품질    │
│ 실행    │   │ 분석    │   │ WF설계  │   │ 검증    │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
    │               │               │               │
    └───────────────┴───────────────┴───────────────┘
                            ↓
                   Lead Agent 통합
                            ↓
                      최종 산출물
```

---

## 2. 구현 설계

### 2.1 Lead Agent (Orchestrator)

**역할:**
- PRD 분석 및 작업 계획 수립
- Subagent 생성 및 작업 위임
- 결과 통합 및 최종 산출물 생성

**모델:** Claude Opus 4 (고품질 추론)

**프롬프트 구조:**
```javascript
const leadAgentPrompt = `
당신은 Lead Agent입니다. 복잡한 MIXED PRD를 분석하고 여러 Subagent에게 작업을 위임합니다.

## Extended Thinking 사용
작업을 시작하기 전에 깊이 생각하세요:
1. PRD의 핵심 목표는 무엇인가?
2. 어떤 분석이 필요한가? (정량적 데이터)
3. 어떤 설계가 필요한가? (정성적 산출물)
4. 몇 개의 Subagent가 필요한가?
5. 각 Subagent의 명확한 목표와 경계는?

## Subagent 위임 형식
각 Subagent에게 다음을 명시하세요:
- 목표 (Objective): 단일 문장
- 출력 형식 (Output Format): 정확한 구조
- 사용 도구 (Tools): 허용된 도구 목록
- 작업 경계 (Boundary): 하지 말아야 할 것
- 완료 기준 (Completion Criteria): 언제 완료인지

## 결과 통합
모든 Subagent 결과를 받은 후:
1. 각 결과의 품질 평가
2. 누락된 정보 식별
3. 추가 연구 필요 여부 판단
4. 최종 산출물 통합 생성
`;
```

### 2.2 Subagent 정의

#### QueryAgent (SQL 분석)
```javascript
const queryAgentConfig = {
  name: 'QueryAgent',
  model: 'claude-sonnet-4',
  tools: ['sql_generate', 'sql_execute'],
  systemPrompt: `
    당신은 SQL 쿼리 전문가입니다.

    ## 목표
    Lead Agent가 요청한 데이터 분석을 SQL로 수행합니다.

    ## 제약
    - SELECT 문만 사용
    - DOMAIN_SCHEMA.md의 컬럼명만 사용
    - 결과는 JSON 형식으로 반환

    ## 출력 형식
    {
      "queries": [...],
      "results": [...],
      "insights": [...]
    }
  `
};
```

#### ProfileAgent (프로필 분석)
```javascript
const profileAgentConfig = {
  name: 'ProfileAgent',
  model: 'claude-sonnet-4',
  tools: ['sql_execute', 'code_master_lookup'],
  systemPrompt: `
    당신은 회원 프로필 분석 전문가입니다.

    ## 목표
    세그먼트별 프로필 특성을 분석합니다.

    ## 출력 형식
    {
      "segment_profile": {...},
      "key_characteristics": [...],
      "comparison": {...}
    }
  `
};
```

#### DesignAgent (설계)
```javascript
const designAgentConfig = {
  name: 'DesignAgent',
  model: 'claude-sonnet-4',
  tools: ['reference_lookup', 'template_apply'],
  systemPrompt: `
    당신은 서비스 설계 전문가입니다.

    ## 목표
    분석 결과를 바탕으로 서비스 설계 문서를 생성합니다.

    ## 입력
    - 분석 결과 (QueryAgent, ProfileAgent로부터)
    - PRD 요구사항

    ## 출력 형식
    - IA.md: 정보 구조
    - Wireframe.md: 화면 설계
    - SDD.md: 기술 명세
  `
};
```

#### ReviewAgent (품질 검증)
```javascript
const reviewAgentConfig = {
  name: 'ReviewAgent',
  model: 'claude-sonnet-4',
  tools: ['schema_validate', 'prd_match'],
  systemPrompt: `
    당신은 품질 검증 전문가입니다.

    ## 목표
    다른 Subagent의 산출물이 PRD 요구사항을 충족하는지 검증합니다.

    ## 검증 항목
    1. PRD 체크리스트 매칭률
    2. Schema 준수 여부
    3. 일관성 검사

    ## 출력 형식
    {
      "passed": boolean,
      "score": number,
      "issues": [...],
      "recommendations": [...]
    }
  `
};
```

---

## 3. 실행 흐름

### 3.1 Phase 0: 계획 수립

```javascript
async function planExecution(prd) {
  const plan = await leadAgent.think({
    mode: 'extended_thinking',
    prompt: `
      PRD를 분석하고 실행 계획을 수립하세요.

      PRD:
      ${prd}

      결정 사항:
      1. 필요한 Subagent 목록
      2. 각 Subagent의 작업 정의
      3. 병렬 실행 가능 여부
      4. 의존성 관계
    `
  });

  return plan;
}
```

### 3.2 Phase 1: 병렬 분석

```javascript
async function executeAnalysis(plan) {
  // 병렬 실행
  const [queryResult, profileResult] = await Promise.all([
    queryAgent.execute(plan.queryTask),
    profileAgent.execute(plan.profileTask)
  ]);

  return { queryResult, profileResult };
}
```

### 3.3 Phase 2: 설계 (분석 결과 기반)

```javascript
async function executeDesign(analysisResults, plan) {
  // 설계 Agent에게 분석 결과 전달
  const designResult = await designAgent.execute({
    ...plan.designTask,
    context: analysisResults
  });

  return designResult;
}
```

### 3.4 Phase 3: 검증 및 통합

```javascript
async function validateAndIntegrate(allResults) {
  // 품질 검증
  const reviewResult = await reviewAgent.execute({
    outputs: allResults,
    prdChecklist: plan.checklist
  });

  if (!reviewResult.passed) {
    // 추가 작업 지시
    return await leadAgent.requestRevision(reviewResult.issues);
  }

  // 최종 통합
  return await leadAgent.integrate(allResults);
}
```

---

## 4. 예상 효과

### 4.1 성능 향상

| 항목 | v1 (직렬) | v2 (병렬) |
|------|----------|----------|
| 분석 시간 | 3분 | 1분 (3x 향상) |
| 설계 품질 | 50% 매칭 | 80%+ 매칭 |
| 컨텍스트 활용 | 단일 Agent | 분산 전문화 |

### 4.2 토큰 비용

| 항목 | v1 | v2 |
|------|-----|-----|
| Lead Agent | - | ~5K tokens (Opus) |
| Subagents | 30K | 4x ~3K tokens (Sonnet) |
| 총 토큰 | 30K | ~17K |
| 비용 | 기준 | -40% (Sonnet이 저렴) |

### 4.3 품질 향상

- **전문화**: 각 Agent가 특화 영역만 담당
- **병렬 검증**: ReviewAgent가 실시간 품질 검사
- **반복 개선**: Lead Agent가 품질 미달 시 재작업 지시

---

## 5. Skills 기반 Agent 전문화

> **참조**: [Anthropic Skills Repository](https://github.com/anthropics/skills)

### 5.1 Skills 아키텍처 개요

Anthropic Skills는 Claude에게 동적으로 역할과 능력을 부여하는 폴더 기반 시스템입니다:

```
skills/
├── query-agent/
│   ├── SKILL.md              # Agent 역할 정의
│   └── resources/
│       ├── DOMAIN_SCHEMA.md  # DB 스키마 참조
│       └── SQL_PATTERNS.md   # SQL 패턴 가이드
│
├── profile-agent/
│   ├── SKILL.md
│   └── resources/
│       ├── SEGMENT_RULES.md  # 세그먼트 정의
│       └── CODE_MASTER.md    # 코드 마스터 참조
│
├── design-agent/
│   ├── SKILL.md
│   └── resources/
│       ├── IA_TEMPLATE.md    # IA 템플릿
│       ├── WF_TEMPLATE.md    # Wireframe 템플릿
│       └── SDD_TEMPLATE.md   # SDD 템플릿
│
└── review-agent/
    ├── SKILL.md
    └── resources/
        ├── PRD_CHECKLIST.md  # PRD 검증 체크리스트
        └── QUALITY_RULES.md  # 품질 기준
```

### 5.2 SKILL.md 구조

각 Subagent는 SKILL.md를 통해 역할을 정의받습니다:

```markdown
# query-agent/SKILL.md

## Identity
당신은 ATO-System-B QueryAgent입니다.
데이터베이스 분석 전문가로서 SQL 쿼리를 생성하고 실행합니다.

## Capabilities
- SELECT 쿼리 생성 및 최적화
- 복잡한 JOIN 구문 작성
- 집계 함수 활용 분석

## Constraints
- DDL/DML 문 사용 금지 (SELECT only)
- resources/DOMAIN_SCHEMA.md에 정의된 컬럼만 사용
- 단일 쿼리 결과 10,000행 제한

## Output Format
JSON 형식으로 반환:
- queries: 실행한 쿼리 목록
- results: 결과 데이터
- insights: 분석 인사이트
```

### 5.3 Skills 로딩 메커니즘

```javascript
class SkillLoader {
  constructor(skillsRoot) {
    this.skillsRoot = skillsRoot;
  }

  async loadSkill(agentName) {
    const skillPath = path.join(this.skillsRoot, agentName);

    // SKILL.md 로드
    const skillMd = await fs.readFile(
      path.join(skillPath, 'SKILL.md'), 'utf-8'
    );

    // resources 로드
    const resourcesPath = path.join(skillPath, 'resources');
    const resources = {};

    if (await fs.exists(resourcesPath)) {
      const files = await fs.readdir(resourcesPath);
      for (const file of files) {
        const content = await fs.readFile(
          path.join(resourcesPath, file), 'utf-8'
        );
        resources[file] = content;
      }
    }

    return { skillMd, resources };
  }

  buildSystemPrompt(skill) {
    let prompt = skill.skillMd + '\n\n';
    prompt += '## Available Resources\n';

    for (const [name, content] of Object.entries(skill.resources)) {
      prompt += `\n### ${name}\n${content}\n`;
    }

    return prompt;
  }
}
```

### 5.4 Skills와 Multi-Agent 통합

```javascript
async function createSubagent(agentName, skillLoader) {
  const skill = await skillLoader.loadSkill(agentName);
  const systemPrompt = skillLoader.buildSystemPrompt(skill);

  return new Anthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8096,
    system: systemPrompt,
    messages: [{ role: 'user', content: taskDescription }]
  });
}

// Lead Agent가 Subagent 생성 시 Skills 적용
async function executeWithSkills(prd) {
  const skillLoader = new SkillLoader('./skills');

  // 병렬로 Skills 기반 Subagent 실행
  const [queryResult, profileResult] = await Promise.all([
    createSubagent('query-agent', skillLoader),
    createSubagent('profile-agent', skillLoader)
  ]);

  // 분석 결과를 Design Agent에 전달
  const designResult = await createSubagent('design-agent', skillLoader, {
    context: { queryResult, profileResult }
  });

  return designResult;
}
```

### 5.5 Skills 장점

| 항목 | 기존 방식 | Skills 방식 |
|------|----------|------------|
| 역할 정의 | 하드코딩 | 외부 파일 (SKILL.md) |
| 참조 문서 | 코드에 포함 | resources/ 폴더 |
| 유지보수 | 코드 수정 필요 | 파일 수정만 |
| 재사용성 | Agent별 분리 | Skills 공유 가능 |
| 버전 관리 | 코드와 함께 | 독립적 버전 관리 |

---

## 6. 구현 단계

### Step 1: Skills 폴더 구조 생성
- `/skills/query-agent/SKILL.md` + resources
- `/skills/profile-agent/SKILL.md` + resources
- `/skills/design-agent/SKILL.md` + resources
- `/skills/review-agent/SKILL.md` + resources

### Step 2: Lead Agent 구현
- Extended Thinking 프롬프트 설계
- 작업 분해 로직 구현
- 결과 통합 로직 구현
- SkillLoader 연동

### Step 3: Subagent 구현
- Skills 기반 QueryAgent, ProfileAgent 구현
- Skills 기반 DesignAgent 구현 (기존 LeaderAgent 리팩토링)
- Skills 기반 ReviewAgent 구현

### Step 4: 병렬 실행
- Promise.all 기반 병렬 실행
- 에러 핸들링 및 타임아웃
- 결과 수집 및 통합

### Step 5: 테스트
- MIXED PRD 테스트
- 성능 벤치마크
- 토큰 비용 분석

---

## 7. 전체 아키텍처 요약

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MIXED Pipeline v2 Architecture                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PRD (MIXED)  →  Lead Agent (Opus 4)  →  결과 통합  →  최종 산출물       │
│                      │                                                    │
│           ┌─────────┴─────────┐                                          │
│           │  Extended Thinking │                                          │
│           │  - 목표 분석       │                                          │
│           │  - 작업 분해       │                                          │
│           │  - 의존성 판단     │                                          │
│           └─────────┬─────────┘                                          │
│                     │                                                    │
│    ┌────────────────┼────────────────┬────────────────┐                  │
│    ▼                ▼                ▼                ▼                  │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │  Query   │  │ Profile  │  │  Design  │  │  Review  │                  │
│ │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │                  │
│ │ (Sonnet) │  │ (Sonnet) │  │ (Sonnet) │  │ (Sonnet) │                  │
│ ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤                  │
│ │ SKILL.md │  │ SKILL.md │  │ SKILL.md │  │ SKILL.md │                  │
│ │ ────────│  │ ────────│  │ ────────│  │ ────────│                  │
│ │resources/│  │resources/│  │resources/│  │resources/│                  │
│ │ -SCHEMA │  │ -SEGMENT │  │ -IA_TMPL │  │ -CHECKLIST│                  │
│ │ -PATTERN│  │ -CODE_M  │  │ -WF_TMPL │  │ -QUALITY │                  │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘                  │
│      │              │              │              │                      │
│      └──────────────┴──────────────┴──────────────┘                      │
│                           │                                              │
│                    Lead Agent 통합                                        │
│                           │                                              │
│              ┌────────────┴────────────┐                                 │
│              ▼                         ▼                                 │
│         품질 검증 PASS            품질 검증 FAIL                          │
│              │                         │                                 │
│              ▼                         ▼                                 │
│         최종 산출물               재작업 지시                             │
│        (IA, WF, SDD)           (피드백 루프)                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 참고 자료

### Anthropic 공식 자료
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Extended Thinking Documentation](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
- [Claude Agent Capabilities](https://claude.com/blog/agent-capabilities-api)

### 관련 기술
- [MCP and A2A with Claude](https://www.anthropic.com/webinars/deploying-multi-agent-systems-using-mcp-and-a2a-with-claude-on-vertex-ai)
- [Google A2A Protocol](https://github.com/google/A2A) (향후 검토)

---

**END OF DESIGN**
