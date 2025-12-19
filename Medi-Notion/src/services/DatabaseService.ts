import mysql from 'mysql2/promise';

export class DatabaseService {
  private connection: mysql.Connection | null = null;

  constructor() {
    this.initConnection();
  }

  private async initConnection() {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'medigate',
        charset: 'utf8mb4'
      });
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connection) {
      await this.initConnection();
    }

    try {
      const [rows] = await this.connection!.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Query execution failed:', sql, params, error);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}