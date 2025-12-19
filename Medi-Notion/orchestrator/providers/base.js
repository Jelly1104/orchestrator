/**
 * BaseProvider - LLM Provider 추상 인터페이스
 *
 * Multi-LLM 아키텍처 (v3.2.0)
 * - Claude, GPT-4, Gemini 등 교체 가능한 구조
 * - 공통 인터페이스 정의
 */

export class BaseProvider {
  constructor(config = {}) {
    this.model = config.model;
    this.maxTokens = config.maxTokens || 8192;

    if (new.target === BaseProvider) {
      throw new Error('BaseProvider는 직접 인스턴스화할 수 없습니다. 상속받아 사용하세요.');
    }
  }

  /**
   * 메시지 전송 (추상 메서드)
   * @param {string} systemPrompt - 시스템 프롬프트
   * @param {string} userMessage - 사용자 메시지
   * @returns {Promise<{content: string, usage: {inputTokens: number, outputTokens: number}}>}
   */
  async sendMessage(systemPrompt, userMessage) {
    throw new Error('sendMessage() must be implemented by subclass');
  }

  /**
   * Provider 이름 반환
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * 사용 가능 여부 확인
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error('isAvailable() must be implemented by subclass');
  }

  /**
   * API 키 검증
   * @returns {boolean}
   */
  hasValidApiKey() {
    throw new Error('hasValidApiKey() must be implemented by subclass');
  }
}

export default BaseProvider;
