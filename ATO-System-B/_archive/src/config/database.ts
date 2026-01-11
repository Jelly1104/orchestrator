import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
}

export class DatabaseConnection {
  private pool: mysql.Pool;
  private static instance: DatabaseConnection;

  private constructor(config: DatabaseConfig) {
    this.pool = mysql.createPool({
      ...config,
      namedPlaceholders: true,
      supportBigNumbers: true,
      bigNumberStrings: true
    });
  }

  public static getInstance(config: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  public async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      // 개인정보 마스킹을 위해 쿼리 내용은 로그에서 제외
      console.error('Database query failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new DatabaseError('Query execution failed');
    }
  }

  public async getConnection(): Promise<mysql.PoolConnection> {
    return this.pool.getConnection();
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}