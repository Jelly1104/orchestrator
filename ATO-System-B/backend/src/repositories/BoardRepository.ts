// BoardRepository.ts - DB 접근 계층
// DOMAIN_SCHEMA.md 제약사항 준수: 인덱스 활용, 레거시 컬럼명 사용

import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import { BoardLegacyDto, BoardListQuery, BoardItem, BoardDetail } from '../types/board.types.js';

export class BoardRepository {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * 게시글 목록 조회 (페이징 + 인덱스 최적화)
   * DOMAIN_SCHEMA.md: BOARD_MUZZIMA 337만건 → 인덱스 필수
   */
  async findBoardsWithPaging(query: BoardListQuery): Promise<{
    boards: BoardItem[];
    totalCount: number;
  }> {
    const { page = 1, limit = 20, category, search } = query;
    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    const conditions: string[] = ["b.DEL_FLAG = 'N'"];
    const params: any[] = [];

    if (category) {
      conditions.push("b.CTG_CODE = ?");
      params.push(category);
    }

    if (search) {
      conditions.push("(b.TITLE LIKE ? OR b.CONTENT LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // 메인 쿼리 - 인덱스 힌트 사용
    const boardsQuery = `
      SELECT 
        b.BOARD_IDX,
        b.TITLE,
        b.read_CNT,
        b.REG_DATE,
        b.CTG_CODE,
        u.U_NAME
      FROM BOARD_MUZZIMA b
      USE INDEX (IDX_BOARD_MUZZIMA_LIST)
      LEFT JOIN USERS u ON b.U_ID = u.U_ID
      WHERE ${whereClause}
      ORDER BY b.REG_DATE DESC
      LIMIT ? OFFSET ?
    `;

    // 카운트 쿼리
    const countQuery = `
      SELECT COUNT(*) as total
      FROM BOARD_MUZZIMA b
      WHERE ${whereClause}
    `;

    // 병렬 실행
    const [boardsResult, countResult] = await Promise.all([
      this.db.execute<RowDataPacket[]>(boardsQuery, [...params, limit, offset]),
      this.db.execute<RowDataPacket[]>(countQuery, params)
    ]);

    const boards = boardsResult[0].map((row): BoardItem => ({
      BOARD_IDX: row.BOARD_IDX,
      TITLE: row.TITLE,
      U_NAME: row.U_NAME || 'Unknown',
      read_CNT: row.read_CNT,
      REG_DATE: row.REG_DATE.toISOString(),
      CTG_CODE: row.CTG_CODE
    }));

    const totalCount = countResult[0][0].total;

    return { boards, totalCount };
  }

  /**
   * 게시글 상세 조회
   */
  async findBoardById(boardIdx: number): Promise<BoardDetail | null> {
    const query = `
      SELECT 
        b.BOARD_IDX,
        b.TITLE,
        b.CONTENT,
        b.read_CNT,
        b.AGREE_CNT,
        b.REG_DATE,
        b.UPT_DATE,
        b.CTG_CODE,
        u.U_NAME
      FROM BOARD_MUZZIMA b
      LEFT JOIN USERS u ON b.U_ID = u.U_ID
      WHERE b.BOARD_IDX = ? AND b.DEL_FLAG = 'N'
    `;

    const [rows] = await this.db.execute<RowDataPacket[]>(query, [boardIdx]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      BOARD_IDX: row.BOARD_IDX,
      TITLE: row.TITLE,
      CONTENT: row.CONTENT,
      U_NAME: row.U_NAME || 'Unknown',
      read_CNT: row.read_CNT,
      AGREE_CNT: row.AGREE_CNT,
      REG_DATE: row.REG_DATE.toISOString(),
      UPT_DATE: row.UPT_DATE?.toISOString(),
      CTG_CODE: row.CTG_CODE
    };
  }

  /**
   * 조회수 증가
   */
  async incrementReadCount(boardIdx: number): Promise<void> {
    const query = `
      UPDATE BOARD_MUZZIMA 
      SET read_CNT = read_CNT + 1 
      WHERE BOARD_IDX = ?
    `;
    
    await this.db.execute(query, [boardIdx]);
  }
}