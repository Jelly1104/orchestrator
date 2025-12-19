import mysql from 'mysql2/promise';

export class DatabaseService {
  private connection: mysql.Connection | null = null;

  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'medigate',
        charset: 'utf8mb4'
      });
      console.log('✅ Database connected');
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connection) {
      await this.connect();
    }
    
    const [rows] = await this.connection!.execute(sql, params);
    return rows as T[];
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}