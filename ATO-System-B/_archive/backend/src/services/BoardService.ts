// BoardService.ts - 비즈니스 로직 계층

import { BoardRepository } from '../repositories/BoardRepository.js';
import { 
  BoardListQuery, 
  BoardListResponse, 
  BoardDetailResponse,
  PaginationInfo,
  BOARD_CONSTANTS 
} from '../types/board.types.js';

export class BoardService {
  private boardRepository: BoardRepository;

  constructor(boardRepository: BoardRepository) {
    this.boardRepository = boardRepository;
  }

  /**
   * 게시글 목록 조회 (비즈니스 로직 포함)
   */
  async getBoardList(query: BoardListQuery): Promise<BoardListResponse> {
    // 입력값 검증 및 정규화
    const normalizedQuery = this.normalizeQuery(query);
    
    // 검색어 길이 제한 (보안)
    if (normalizedQuery.search && normalizedQuery.search.length > BOARD_CONSTANTS.MAX_SEARCH_LENGTH) {
      throw new Error('검색어가 너무 길습니다.');
    }

    // 데이터 조회
    const { boards, totalCount } = await this.boardRepository.findBoardsWithPaging(normalizedQuery);

    // 페이징 정보 계산
    const pagination = this.calculatePagination(
      normalizedQuery.page!,
      normalizedQuery.limit!,
      totalCount
    );

    return {
      success: true,
      data: {
        boards,
        pagination
      }
    };
  }

  /**
   * 게시글 상세 조회
   */
  async getBoardDetail(boardIdx: number): Promise<BoardDetailResponse> {
    // 입력값 검증
    if (!Number.isInteger(boardIdx) || boardIdx <= 0) {
      throw new Error('유효하지 않은 게시글 ID입니다.');
    }

    // 조회수 증가 (별도 트랜잭션)
    await this.boardRepository.incrementReadCount(boardIdx);

    // 상세 정보 조회
    const boardDetail = await this.boardRepository.findBoardById(boardIdx);
    
    if (!boardDetail) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: boardDetail
    };
  }

  /**
   * 쿼리 정규화 (private 메서드)
   */
  private normalizeQuery(query: BoardListQuery): Required<BoardListQuery> {
    const page = Math.max(1, query.page || BOARD_CONSTANTS.DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(1, query.limit || BOARD_CONSTANTS.DEFAULT_LIMIT),
      BOARD_CONSTANTS.MAX_LIMIT
    );

    return {
      page,
      limit,
      category: query.category?.trim() || '',
      search: query.search?.trim() || ''
    };
  }

  /**
   * 페이징 정보 계산 (private 메서드)
   */
  private calculatePagination(page: number, limit: number, totalCount: number): PaginationInfo {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;

    return {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext
    };
  }
}