import mysql from 'mysql2/promise';
import { TodoItem } from '../../../shared/types/todo.types';

export class TodoService {
  private async getConnection() {
    // 실제 환경에서는 환경변수 사용
    return mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'medigate'
    });
  }

  async getTodosByUserId(uId: string): Promise<TodoItem[]> {
    const connection = await this.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT TODO_ID, U_ID, CONTENT, REG_DATE, DEL_FLAG 
         FROM TODO_LIST 
         WHERE U_ID = ? AND DEL_FLAG = 'N' 
         ORDER BY REG_DATE DESC`,
        [uId]
      );
      
      return rows as TodoItem[];
    } finally {
      await connection.end();
    }
  }

  async createTodo(uId: string, content: string): Promise<number> {
    const connection = await this.getConnection();
    
    try {
      const [result] = await connection.execute(
        `INSERT INTO TODO_LIST (U_ID, CONTENT, REG_DATE, DEL_FLAG) 
         VALUES (?, ?, NOW(), 'N')`,
        [uId, content]
      );
      
      return (result as mysql.ResultSetHeader).insertId;
    } finally {
      await connection.end();
    }
  }

  async deleteTodo(todoId: number, uId: string): Promise<void> {
    const connection = await this.getConnection();
    
    try {
      const [result] = await connection.execute(
        `UPDATE TODO_LIST 
         SET DEL_FLAG = 'Y' 
         WHERE TODO_ID = ? AND U_ID = ? AND DEL_FLAG = 'N'`,
        [todoId, uId]
      );
      
      if ((result as mysql.ResultSetHeader).affectedRows === 0) {
        throw new Error('Todo not found or already deleted');
      }
    } finally {
      await connection.end();
    }
  }
}