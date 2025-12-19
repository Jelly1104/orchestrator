import { Router } from 'express';
import { HelloController } from '../controllers/helloController';

const router = Router();
const helloController = new HelloController();

// GET /api/hello - Hello World 메시지 반환
router.get('/hello', helloController.getHelloWorld.bind(helloController));

export default router;