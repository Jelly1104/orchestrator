import { TodoRepository } from './repository';
import { TodoCreateRequest, TodoResponse } from '../../../shared/types/todo.dto';

export class TodoService {
  private repository = new TodoRepository();

  async findAllByUser(uId: string): Promise<TodoResponse[]> {
    const todos = await this.repository.findAllByUser(uId);
    
    return todos.map(todo => ({
      todo_id: todo.TODO_ID,
      content: todo.CONTENT,
      reg_date: todo.REG_DATE.toISOString()
    }));
  }

  async create(uId: string, request: TodoCreateRequest) {
    const todoId = await this.repository.create(uId, request.content);
    
    return {
      todo_id: todoId,
      message: '투두가 추가되었습니다.'
    };
  }

  async softDelete(uId: string, todoId: number): Promise<boolean> {
    return await this.repository.softDelete(uId, todoId);
  }
}