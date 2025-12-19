/**
 * AnthropicProvider - Claude API 연동
 *
 * Multi-LLM 아키텍처 (v3.2.0)
 * - Primary Provider
 * - claude-sonnet-4-20250514 기본 모델
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.js';

export class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);

    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-sonnet-4-20250514';

    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  /**
   * Provider 이름 반환
   */
  getName() {
    return 'anthropic';
  }

  /**
   * API 키 유효성 확인
   */
  hasValidApiKey() {
    return !!(this.apiKey && this.apiKey.startsWith('sk-ant-'));
  }

  /**
   * 사용 가능 여부 확인
   */
  isAvailable() {
    return this.hasValidApiKey() && !!this.client;
  }

  /**
   * 메시지 전송
   * @param {string} systemPrompt - 시스템 프롬프트
   * @param {string} userMessage - 사용자 메시지
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}}>}
   */
  async sendMessage(systemPrompt, userMessage) {
    if (!this.isAvailable()) {
      throw new Error('[AnthropicProvider] API 키가 설정되지 않았습니다.');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      });

      return {
        content: response.content[0].text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      // 에러 래핑 (Provider 정보 포함)
      throw new Error(`[AnthropicProvider] API 호출 실패: ${error.message}`);
    }
  }
}

export default AnthropicProvider;
