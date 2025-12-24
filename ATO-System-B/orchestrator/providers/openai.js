/**
 * OpenAIProvider - GPT-4 API 연동
 *
 * Multi-LLM 아키텍처 (v3.2.0)
 * - Fallback Provider
 * - gpt-4o 기본 모델 (gpt-4-turbo에서 변경)
 *
 * [Fix v4.3.13] 모델 및 토큰 제한 업데이트
 * - gpt-4-turbo: max 4096 tokens (부족)
 * - gpt-4o: max 16384 tokens (충분)
 */

import { BaseProvider } from './base.js';

// OpenAI 모델별 최대 출력 토큰 제한
const MODEL_MAX_TOKENS = {
  'gpt-4-turbo': 4096,
  'gpt-4o': 16384,
  'gpt-4o-mini': 16384,
  'gpt-4': 8192
};

export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);

    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    // [Fix v4.3.13] gpt-4o로 변경 (16384 토큰 지원)
    this.model = config.model || 'gpt-4o';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';

    // [Fix v4.3.13] 모델별 최대 토큰 제한 적용
    const modelMaxTokens = MODEL_MAX_TOKENS[this.model] || 4096;
    if (this.maxTokens > modelMaxTokens) {
      console.warn(`[OpenAIProvider] maxTokens ${this.maxTokens} → ${modelMaxTokens} (모델 제한)`);
      this.maxTokens = modelMaxTokens;
    }
  }

  /**
   * Provider 이름 반환
   */
  getName() {
    return 'openai';
  }

  /**
   * API 키 유효성 확인
   */
  hasValidApiKey() {
    return !!(this.apiKey && this.apiKey.startsWith('sk-'));
  }

  /**
   * 사용 가능 여부 확인
   */
  isAvailable() {
    return this.hasValidApiKey();
  }

  /**
   * 메시지 전송
   * @param {string} systemPrompt - 시스템 프롬프트
   * @param {string} userMessage - 사용자 메시지
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}}>}
   */
  async sendMessage(systemPrompt, userMessage) {
    if (!this.isAvailable()) {
      throw new Error('[OpenAIProvider] API 키가 설정되지 않았습니다.');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens
        }
      };
    } catch (error) {
      throw new Error(`[OpenAIProvider] API 호출 실패: ${error.message}`);
    }
  }
}

export default OpenAIProvider;
