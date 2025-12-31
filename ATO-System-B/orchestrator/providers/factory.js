/**
 * ProviderFactory - LLM Provider 팩토리
 *
 * Multi-LLM 아키텍처 (v3.2.0)
 * - Provider 생성 및 Fallback 체인 관리
 * - 자동 Fallback 지원
 */

import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';

// 지원되는 Provider 목록
const PROVIDERS = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider
};

// 기본 Fallback 순서
const DEFAULT_FALLBACK_ORDER = ['anthropic', 'openai', 'gemini'];

export class ProviderFactory {
  /**
   * Provider 생성
   * @param {string} name - Provider 이름 (anthropic, openai, gemini)
   * @param {Object} config - Provider 설정
   * @returns {BaseProvider}
   */
  static create(name, config = {}) {
    const ProviderClass = PROVIDERS[name.toLowerCase()];

    if (!ProviderClass) {
      throw new Error(`지원하지 않는 Provider: ${name}. 지원 목록: ${Object.keys(PROVIDERS).join(', ')}`);
    }

    return new ProviderClass(config);
  }

  /**
   * 사용 가능한 첫 번째 Provider 반환
   * @param {string[]} order - Provider 우선순위 (기본: anthropic → openai → gemini)
   * @param {Object} configs - Provider별 설정
   * @returns {BaseProvider|null}
   */
  static getFirstAvailable(order = DEFAULT_FALLBACK_ORDER, configs = {}) {
    for (const name of order) {
      try {
        const provider = this.create(name, configs[name] || {});
        if (provider.isAvailable()) {
          return provider;
        }
      } catch (e) {
        // Provider 초기화 실패 - 다음 시도
      }
    }

    return null;
  }

  /**
   * Fallback 체인으로 메시지 전송
   * @param {string} systemPrompt - 시스템 프롬프트
   * @param {string} userMessage - 사용자 메시지
   * @param {string[]} order - Provider 우선순위
   * @param {Object} configs - Provider별 설정
   * @returns {Promise<{content: string, usage: Object, provider: string}>}
   */
  static async sendWithFallback(systemPrompt, userMessage, order = DEFAULT_FALLBACK_ORDER, configs = {}) {
    const errors = [];

    for (const name of order) {
      try {
        const provider = this.create(name, configs[name] || {});

        if (!provider.isAvailable()) {
          continue;
        }

        const result = await provider.sendMessage(systemPrompt, userMessage);

        return {
          ...result,
          provider: name
        };
      } catch (error) {
        errors.push({ provider: name, error: error.message });
      }
    }

    // 모든 Provider 실패
    throw new Error(`모든 Provider 실패:\n${errors.map(e => `- ${e.provider}: ${e.error}`).join('\n')}`);
  }

  /**
   * 지원되는 Provider 목록 반환
   */
  static getSupportedProviders() {
    return Object.keys(PROVIDERS);
  }

  /**
   * 사용 가능한 Provider 목록 반환
   */
  static getAvailableProviders(configs = {}) {
    const available = [];

    for (const name of Object.keys(PROVIDERS)) {
      try {
        const provider = this.create(name, configs[name] || {});
        if (provider.isAvailable()) {
          available.push(name);
        }
      } catch (e) {
        // Skip
      }
    }

    return available;
  }
}

export default ProviderFactory;
