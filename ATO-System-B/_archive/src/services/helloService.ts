// Hello World 비즈니스 로직 서비스
export class HelloService {
  /**
   * Hello World 메시지 생성
   * @returns 기본 인사말 메시지
   */
  generateMessage(): string {
    return "Hello, World!";
  }

  /**
   * 현재 타임스탬프 반환
   * @returns ISO 8601 형식의 현재 시각
   */
  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * 애플리케이션 버전 반환
   * @returns 버전 문자열
   */
  getVersion(): string {
    return "1.0.0";
  }
}