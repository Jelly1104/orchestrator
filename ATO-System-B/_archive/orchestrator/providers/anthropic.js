/**
 * AnthropicProvider - Claude API 연동
 *
 * Multi-LLM 아키텍처 (v3.2.0)
 * - Primary Provider
 * - claude-sonnet-4-20250514 기본 모델
 *
 * [Fix v4.3.13] 스트리밍 지원 추가
 * - 32768+ 토큰 요청 시 10분 이상 소요 가능
 * - Anthropic API는 장시간 작업에 스트리밍 권장
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.js';

export class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);

    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-sonnet-4-20250514';
    // [Fix v4.3.13] 스트리밍 모드 활성화 (대용량 토큰 요청 시 필수)
    this.useStreaming = config.useStreaming !== false; // 기본값: true

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

    // [Fix v4.3.13] 스트리밍 모드 사용 (대용량 토큰 요청 시 필수)
    if (this.useStreaming) {
      return await this._sendWithStreaming(systemPrompt, userMessage);
    }

    // 비스트리밍 모드 (작은 요청용, 기본 비활성)
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

  /**
   * [Fix v4.3.13] 스트리밍 모드로 메시지 전송
   * - 32768+ 토큰 요청 시 10분 이상 소요 가능
   * - Anthropic API는 장시간 작업에 스트리밍 권장/필수
   * @private
   */
  async _sendWithStreaming(systemPrompt, userMessage) {
    try {
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      // Anthropic SDK의 스트리밍 API 사용
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      });

      // 스트림 이벤트 처리
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta?.text) {
            fullContent += event.delta.text;
          }
        } else if (event.type === 'message_delta') {
          // usage 정보 업데이트
          if (event.usage) {
            outputTokens = event.usage.output_tokens || outputTokens;
          }
        } else if (event.type === 'message_start') {
          // 입력 토큰 정보
          if (event.message?.usage) {
            inputTokens = event.message.usage.input_tokens || 0;
          }
        }
      }

      // 최종 메시지 정보 가져오기
      const finalMessage = await stream.finalMessage();
      if (finalMessage?.usage) {
        inputTokens = finalMessage.usage.input_tokens || inputTokens;
        outputTokens = finalMessage.usage.output_tokens || outputTokens;
      }

      return {
        content: fullContent,
        usage: {
          inputTokens,
          outputTokens
        }
      };
    } catch (error) {
      throw new Error(`[AnthropicProvider] 스트리밍 API 호출 실패: ${error.message}`);
    }
  }
}

export default AnthropicProvider;
