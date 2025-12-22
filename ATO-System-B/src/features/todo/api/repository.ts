import { db } from '../../../lib/database';
import { TodoLegacyDto } from '../../../shared/types/todo.dto';

export class TodoRepository {
  async findAllByUser(uId: string): Promise<TodoLegacyDto[]> {
    const query = `
      SELECT TODO_ID, U_ID, CONTENT, REG_DATE, DEL_FLAG
      FROM TODO_LIST
      WHERE U_ID = ? AND DEL_FLAG = 'N'
      ORDER BY REG_DATE DESC
    `;
    
    const [rows] = await db.query(query, [uId]);
    return rows as TodoLegacyDto[];
  }

  async create(uId: string, content: string): Promise<number> {
    const query = `
      INSERT INTO TODO_LIST (U_ID, CONTENT, REG_DATE, DEL_FLAG)
      VALUES (?, ?, NOW(), 'N')
    `;
    
    const [result] = await db.query(query, [uId, content]);
    return (result as any).insertId;
  }

  async softDelete(uId: string, todoId: number): Promise<boolean> {
    const query = `
      UPDATE TODO_LIST
      SET DEL_FLAG = 'Y'
      WHERE TODO_ID = ? AND U_ID = ? AND DEL_FLAG = 'N'
    `;
    
    const [result] = await db.query(query, [todoId, uId]);
    return (result as any).affectedRows > 0;
  }

  async findById(todoId: number, uId: string): Promise<TodoLegacyDto | null> {
    const query = `
      SELECT TODO_ID, U_ID, CONTENT, REG_DATE, DEL_FLAG
      FROM TODO_LIST
      WHERE TODO_ID = ? AND U_ID = ? AND DEL_FLAG = 'N'
    `;
    
    const [rows] = await db.query(query, [todoId, uId]);
    const result = rows as TodoLegacyDto[];
    return result.length > 0 ? result[0] : null;
  }
}