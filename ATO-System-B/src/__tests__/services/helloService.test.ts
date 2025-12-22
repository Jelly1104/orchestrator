import { HelloService } from '../../services/helloService';

describe('HelloService', () => {
  let helloService: HelloService;

  beforeEach(() => {
    helloService = new HelloService();
  });

  describe('generateMessage', () => {
    it('Hello World 메시지를 반환해야 한다', () => {
      const message = helloService.generateMessage();
      expect(message).toBe('Hello, World!');
    });
  });

  describe('getCurrentTimestamp', () => {
    it('ISO 8601 형식의 타임스탬프를 반환해야 한다', () => {
      const timestamp = helloService.getCurrentTimestamp();
      
      // ISO 8601 형식 검증
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // 유효한 날짜인지 검증
      const date = new Date(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('현재 시간과 비슷한 시간을 반환해야 한다', () => {
      const before = Date.now();
      const timestamp = helloService.getCurrentTimestamp();
      const after = Date.now();
      
      const timestampMs = new Date(timestamp).getTime();
      expect(timestampMs).toBeGreaterThanOrEqual(before - 1000); // 1초 여유
      expect(timestampMs).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('getVersion', () => {
    it('버전 1.0.0을 반환해야 한다', () => {
      const version = helloService.getVersion();
      expect(version).toBe('1.0.0');
    });
  });
});