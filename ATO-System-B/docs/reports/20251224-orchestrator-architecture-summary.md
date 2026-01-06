# Orchestrator 작동 원리 및 LLM 개입 시점

> **작성일**: 2025-12-24
> **대상 테스트**: case6-retest8
> **결과**: 성공 (4개 설계 문서 생성)

---

## 아키텍처 요약

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Orchestrator (JavaScript 모듈) - LLM 아님                                   │
│  ═══════════════════════════════════════════════════════════════════════════│
│                                                                             │
│  역할: 워크플로우 제어 / Agent 호출 / 파일 저장 / 로깅                         │
│                                                                             │
│        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│        │ LeaderAgent  │    │AnalysisAgent │    │  SubAgent    │             │
│        │  (LLM 호출)  │    │  (LLM 호출)  │    │  (LLM 호출)  │             │
│        └──────┬───────┘    └──────┬───────┘    └──────────────┘             │
│               │                   │                                         │
│               ▼                   ▼                                         │
│        ┌─────────────────────────────────────────────┐                      │
│        │           ProviderFactory.sendWithFallback  │                      │
│        │  ─────────────────────────────────────────  │                      │
│        │  anthropic (1순위) → openai → gemini        │                      │
│        └──────────────────────┬──────────────────────┘                      │
│                               │                                             │
│                               ▼                                             │
│                    ┌──────────────────────┐                                 │
│                    │  AnthropicProvider   │ ◄── 실제 LLM API 호출           │
│                    │  (Streaming 모드)    │                                 │
│                    └──────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Case6-retest8 실행 흐름 및 LLM 호출 시점

| 단계 | 컴포넌트 | LLM 호출 | 설명 |
|------|----------|----------|------|
| 1 | **Orchestrator** | ❌ | PRD 로드, 파이프라인 타입 결정 (MIXED) |
| 2 | **Phase A: AnalysisAgent** | ✅ | SQL 쿼리 생성 (`ProviderFactory.sendWithFallback`) |
| 3 | **AnalysisAgent** | ❌ | DB 연결, SQL 실행 (mysql2 라이브러리) |
| 4 | **ReviewerSkill** | ❌ | 쿼리 결과 검증 (규칙 기반, LLM 미사용) |
| 5 | **AnalysisAgent** | ✅ | 결과 해석, 인사이트 생성 (`ProviderFactory`) |
| 6 | **Phase B: LeaderAgent** | ✅ | IA/WF/SDD/HANDOFF 4개 문서 생성 |
| 7 | **Orchestrator** | ❌ | 파일 저장, 로그 기록 |

---

## LLM 호출 상세 (case6-retest8)

로그에서 확인된 LLM 호출:

```
[ProviderFactory] Trying provider: anthropic  ← Phase A: SQL 생성
[ProviderFactory] Trying provider: anthropic  ← Phase A: 인사이트 생성
[ProviderFactory] Trying provider: anthropic  ← Phase B: 설계 문서 생성
```

**모두 Anthropic(Claude)만 사용**되었습니다. OpenAI나 Gemini는 호출되지 않았습니다.

---

## 토큰 사용량 분석

```json
{
  "tokens": {
    "leader": {
      "input": 16803,
      "output": 20853,  // ← Phase B에서 4개 문서 생성
      "total": 37656
    },
    "subagent": { "input": 0, "output": 0 }  // ← Phase C 미실행
  }
}
```

**Phase A의 토큰은 별도 추적되지 않고, LeaderAgent 토큰에 합산된 것으로 보입니다.**

---

## Fallback 동작 방식

```javascript
// factory.js:70-97
static async sendWithFallback(systemPrompt, userMessage, order, configs) {
  for (const name of order) {  // ['anthropic', 'openai', 'gemini']
    const provider = this.create(name, configs[name] || {});
    if (provider.isAvailable()) {
      return await provider.sendMessage(systemPrompt, userMessage);  // 성공 시 즉시 반환
    }
  }
}
```

- **1순위 Anthropic이 성공**하면 OpenAI/Gemini는 호출되지 않음
- 이번 테스트에서는 **모두 Anthropic만 사용**됨

---

## 이전 실패 (case6-retest7)에서의 Fallback

```
[ProviderFactory] anthropic 실패: Streaming is strongly recommended...
[ProviderFactory] openai 실패: max_tokens is too large: 8192 (max 4096)
[ProviderFactory] gemini 실패: models/gemini-pro is not found
```

- Anthropic이 스트리밍 없이 실패 → OpenAI 시도 → 토큰 제한으로 실패 → Gemini 시도 → 모델 없음
- **v4.3.13에서 스트리밍 추가 후 Anthropic에서 바로 성공**

---

## 결론

| 질문 | 답변 |
|------|------|
| **Anthropic 스트리밍을 썼나?** | ✅ 예, `_sendWithStreaming()` 메서드로 스트리밍 사용 |
| **다른 LLM을 부른 건가?** | ❌ 아니오, Anthropic만 사용 (성공했기 때문에 Fallback 불필요) |
| **LLM 개입 시점은?** | Phase A: SQL 생성 + 인사이트 생성 (2회), Phase B: 설계 문서 생성 (1회) |

---

## 관련 파일

- `orchestrator/orchestrator.js` - 메인 제어 로직
- `orchestrator/agents/leader.js` - LeaderAgent (설계 문서 생성)
- `orchestrator/agents/analysis-agent.js` - AnalysisAgent (SQL 생성/실행)
- `orchestrator/providers/anthropic.js` - AnthropicProvider (스트리밍 지원)
- `orchestrator/providers/factory.js` - ProviderFactory (Fallback 체인)
