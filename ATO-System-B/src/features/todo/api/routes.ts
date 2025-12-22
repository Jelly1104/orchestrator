import { Router } from 'express';
import { TodoController } from './controller';
import { validateRequest } from '../../../middleware/validation';
import { TodoCreateRequest } from '../../../shared/types/todo.dto';

const router = Router();
const controller = new TodoController();

// GET /api/todos - 투두 목록 조회
router.get('/', controller.list);

// POST /api/todos - 투두 추가
router.post('/', validateRequest(TodoCreateRequest), controller.create);

// DELETE /api/todos/:id - 투두 삭제 (Soft Delete)
router.delete('/:id', controller.delete);

export default router;