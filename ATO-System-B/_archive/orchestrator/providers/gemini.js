/**
 * GeminiProvider - Google Gemini API 연동
 *
 * Multi-LLM 아키텍처 (v3.2.0)
 * - Fallback Provider
 * - gemini-pro 기본 모델
 */

import { BaseProvider } from './base.js';

export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);

    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY;
    this.model = config.model || 'gemini-pro';
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Provider 이름 반환
   */
  getName() {
    return 'gemini';
  }

  /**
   * API 키 유효성 확인
   */
  hasValidApiKey() {
    return !!(this.apiKey && this.apiKey.length > 0);
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
      throw new Error('[GeminiProvider] API 키가 설정되지 않았습니다.');
    }

    try {
      // Gemini는 system prompt를 별도로 지원하지 않으므로 user message에 포함
      const combinedMessage = `${systemPrompt}\n\n---\n\n${userMessage}`;

      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: combinedMessage }]
              }
            ],
            generationConfig: {
              maxOutputTokens: this.maxTokens
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Gemini 응답 형식 파싱
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Gemini는 토큰 사용량을 다르게 반환
      const usage = data.usageMetadata || {};

      return {
        content,
        usage: {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0
        }
      };
    } catch (error) {
      throw new Error(`[GeminiProvider] API 호출 실패: ${error.message}`);
    }
  }
}

export default GeminiProvider;
