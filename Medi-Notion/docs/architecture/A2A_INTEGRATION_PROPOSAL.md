# A2A 프로토콜 통합 제안서

> **작성일**: 2025-12-18
> **목적**: MIXED 파이프라인에 Google A2A 프로토콜 적용 검토
> **참조**: [Google A2A Protocol](https://github.com/google/A2A)

---

## 1. 배경

### 1.1 현재 MIXED 파이프라인의 한계

현재 `orchestrator.js`의 MIXED 파이프라인:
- Phase A (Analysis) → Phase B (Design) 직렬 실행
- 단일 프로세스 내 직접 함수 호출
- Anthropic Claude 모델 단독 사용
- Agent 간 상태 전달이 내부 객체 기반

### 1.2 A2A 프로토콜의 가치

Google A2A (Agent-to-Agent) 프로토콜은:
- **표준화된 통신**: JSON-RPC 2.0 over HTTP(S)
- **Agent 발견**: Agent Card (`/.well-known/agent.json`)
- **프레임워크 무관**: LangChain, CrewAI, ADK, Custom 등 혼합 가능
- **Enterprise Grade**: 인증, 스트리밍, 비동기 지원

---

## 2. 통합 아키텍처

### 2.1 목표 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    MediNotion Orchestrator                      │
│                    (A2A Client / Coordinator)                   │
│                                                                 │
│  PRD 입력 → Agent Discovery → Task Routing → Result Assembly   │
└─────────────────────────────────────────────────────────────────┘
                    │ A2A Protocol (JSON-RPC)
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ AnalysisAgent   │   │ DesignAgent     │
│ (A2A Server)    │   │ (A2A Server)    │
│                 │   │                 │
│ Skills:         │   │ Skills:         │
│ - SQL Generation│   │ - IA Design     │
│ - Query Exec    │   │ - Wireframe     │
│ - Data Analysis │   │ - SDD/HANDOFF   │
│                 │   │                 │
│ LLM: Claude     │   │ LLM: Any        │
│ Framework: ADK  │   │ Framework: Any  │
└─────────────────┘   └─────────────────┘
```

### 2.2 Agent Card 예시

**AnalysisAgent (`/.well-known/agent.json`)**:
```json
{
  "name": "MediNotion AnalysisAgent",
  "description": "메디게이트 데이터베이스 분석 전문 Agent",
  "version": "1.0.0",
  "skills": [
    {
      "name": "generate_sql",
      "description": "PRD 기반 SQL 쿼리 생성",
      "inputSchema": {
        "type": "object",
        "properties": {
          "prdContent": { "type": "string" },
          "queryGoals": { "type": "array" }
        }
      }
    },
    {
      "name": "execute_analysis",
      "description": "SQL 실행 및 결과 분석",
      "inputSchema": {
        "type": "object",
        "properties": {
          "queries": { "type": "array" }
        }
      }
    }
  ],
  "authentication": {
    "type": "bearer"
  },
  "endpoint": "http://localhost:8001"
}
```

---

## 3. 구현 계획

### Phase 1: A2A SDK 도입 (1-2일)

```bash
# Python SDK 설치
pip install a2a-sdk

# 또는 JS/TS 구현 사용
npm install @anthropic/sdk  # 기존 유지
```

**주요 작업:**
1. AnalysisAgent를 A2A Server로 래핑
2. Agent Card 생성 (`agent.json`)
3. 기존 기능을 A2A Skills로 노출

### Phase 2: Orchestrator A2A Client 변환 (2-3일)

**기존 코드:**
```javascript
// orchestrator.js - 현재 방식
if (pipeline === 'mixed') {
  const analysisResult = await this.analysisAgent.runAnalysis(prd);
  const designResult = await this.leader.plan(prd + analysisResult);
}
```

**A2A 적용 후:**
```javascript
// orchestrator.js - A2A 방식
if (pipeline === 'mixed') {
  // 1. Agent Discovery
  const analysisAgent = await a2aClient.discover('http://localhost:8001');
  const designAgent = await a2aClient.discover('http://localhost:8002');

  // 2. Phase A: Analysis Task
  const analysisTask = await a2aClient.sendTask(analysisAgent, {
    skill: 'execute_analysis',
    input: { prdContent: prd }
  });

  // 3. Wait for completion (streaming 또는 polling)
  const analysisResult = await a2aClient.getTaskResult(analysisTask.id);

  // 4. Phase B: Design Task (분석 결과 포함)
  const designTask = await a2aClient.sendTask(designAgent, {
    skill: 'design_system',
    input: {
      prdContent: prd,
      analysisContext: analysisResult.data
    }
  });
}
```

### Phase 3: Multi-Framework 테스트 (3-5일)

**목표**: 다양한 프레임워크 Agent 혼합 운영
- AnalysisAgent: ADK + Claude (기존)
- DesignAgent: LangGraph + GPT-4
- ReviewAgent: CrewAI + Claude

---

## 4. 장단점 분석

### 4.1 장점

| 항목 | 설명 |
|------|------|
| **확장성** | Agent를 독립 서비스로 배포, 수평 확장 가능 |
| **유연성** | 각 Agent에 최적 프레임워크/모델 선택 |
| **표준화** | 50+ 기업 지원 오픈 프로토콜 (Linux Foundation) |
| **디버깅** | Agent 간 통신 로깅/모니터링 용이 |
| **재사용** | 다른 프로젝트에서 Agent 재사용 가능 |

### 4.2 단점

| 항목 | 설명 |
|------|------|
| **복잡성** | 단순 함수 호출 → HTTP 통신 오버헤드 |
| **지연** | 네트워크 레이턴시 추가 |
| **운영** | 여러 서비스 관리 필요 |
| **학습 곡선** | A2A 프로토콜 학습 필요 |

### 4.3 권장 사항

**현재 단계에서는 보류 권장**

이유:
1. 현재 PoC 단계에서는 단일 프로세스가 더 효율적
2. G0 완료 (E2E 검증) 후 확장 고려
3. A2A는 Production 규모 확장 시 도입

**도입 시점 제안:**
- G1 (Platform AI 확장) 단계에서 검토
- 여러 Agent 동시 운영 필요 시
- 외부 시스템 Agent 연동 필요 시

---

## 5. 대안: Lightweight 통합

A2A 전체 도입 전, 핵심 개념만 차용:

### 5.1 Agent Card 패턴 적용

```javascript
// agents/analysis-agent.js
export const AgentCard = {
  name: 'AnalysisAgent',
  version: '1.0.0',
  skills: ['generate_sql', 'execute_analysis', 'generate_report'],
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ }
};
```

### 5.2 표준화된 Task 인터페이스

```javascript
// 모든 Agent가 동일한 인터페이스 구현
class BaseAgent {
  async executeTask(taskInput) {
    // 표준 입출력 형식
    return {
      status: 'completed',
      data: { /* ... */ },
      artifacts: [ /* ... */ ]
    };
  }
}
```

이 방식으로 A2A 도입 준비를 하면서, 현재 개발 속도는 유지할 수 있습니다.

---

## 6. 참고 자료

- [Google A2A Protocol Announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [A2A Protocol Documentation](https://a2aprotocol.ai/blog/2025-full-guide-a2a-protocol)
- [A2A Python SDK Tutorial](https://a2aprotocol.ai/blog/google-a2a-python-sdk-tutorial)
- [A2A vs MCP 비교](https://medium.com/@shamim_ru/google-agent-to-agent-a2a-protocol-explained-with-real-working-examples-99e362b61ba8)
- [Google ADK Quickstart](https://google.github.io/adk-docs/a2a/quickstart-exposing/)

---

**END OF PROPOSAL**
