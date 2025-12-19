import { Request, Response } from 'express';
import { HelloService } from '../services/helloService';
import { ApiResponse } from '../types/api';

/**
 * Hello World API 컨트롤러
 */
export class HelloController {
  private helloService: HelloService;

  constructor() {
    this.helloService = new HelloService();
  }

  /**
   * GET /api/hello 엔드포인트 핸들러
   * @param req Express Request 객체
   * @param res Express Response 객체
   */
  async getHelloWorld(req: Request, res: Response): Promise<void> {
    try {
      const response: ApiResponse = {
        message: this.helloService.generateMessage(),
        timestamp: this.helloService.getCurrentTimestamp(),
        version: this.helloService.getVersion()
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Hello API 오류:', error);
      res.status(500).json({
        message: '서버 내부 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
        version: this.helloService.getVersion()
      });
    }
  }
}