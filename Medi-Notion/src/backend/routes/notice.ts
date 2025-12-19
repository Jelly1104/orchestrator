/**
 * 공지사항 API 라우터
 * @see docs/case1-notice-list/SDD.md
 */

import { Router, Request, Response } from 'express';
import type {
  NoticeListItem,
  NoticeDetail,
  NoticeListResponse,
  NoticeDetailResponse,
  ErrorResponse,
  NoticeType
} from '../types/notice';

const router = Router();

// Mock 데이터 (실제 구현 시 DB 연동)
const mockNotices: NoticeDetail[] = [
  {
    id: 1,
    title: '서비스 점검 안내 (12/20)',
    content: '<p>안녕하세요. 메디게이트입니다.</p><p>12월 20일 서비스 점검이 예정되어 있습니다.</p><p>점검 시간: 02:00 ~ 06:00 (4시간)</p>',
    noticeType: 'IMPORTANT',
    readCount: 1234,
    regDate: '2025-12-15T10:00:00Z'
  },
  {
    id: 2,
    title: '개인정보처리방침 변경 안내',
    content: '<p>개인정보처리방침이 일부 변경되었습니다.</p>',
    noticeType: 'IMPORTANT',
    readCount: 892,
    regDate: '2025-12-10T09:00:00Z'
  },
  {
    id: 3,
    title: '신규 기능 업데이트 안내',
    content: '<p>새로운 기능이 추가되었습니다.</p>',
    noticeType: 'NORMAL',
    readCount: 567,
    regDate: '2025-12-08T14:00:00Z'
  },
  {
    id: 4,
    title: '12월 이벤트 당첨자 발표',
    content: '<p>12월 이벤트 당첨자를 발표합니다.</p>',
    noticeType: 'NORMAL',
    readCount: 2341,
    regDate: '2025-12-05T11:00:00Z'
  },
  {
    id: 5,
    title: '연말 휴무 안내',
    content: '<p>연말 휴무 일정을 안내드립니다.</p>',
    noticeType: 'NORMAL',
    readCount: 456,
    regDate: '2025-12-01T10:00:00Z'
  }
];

/**
 * GET /api/v1/notice
 * 공지사항 목록 조회
 */
router.get('/', (req: Request, res: Response<NoticeListResponse>) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

  // 중요 공지 상단 고정 정렬
  const sortedNotices = [...mockNotices].sort((a, b) => {
    if (a.noticeType === 'IMPORTANT' && b.noticeType !== 'IMPORTANT') return -1;
    if (a.noticeType !== 'IMPORTANT' && b.noticeType === 'IMPORTANT') return 1;
    return new Date(b.regDate).getTime() - new Date(a.regDate).getTime();
  });

  const totalCount = sortedNotices.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  const items: NoticeListItem[] = sortedNotices
    .slice(offset, offset + limit)
    .map(({ id, title, noticeType, readCount, regDate }) => ({
      id,
      title,
      noticeType,
      readCount,
      regDate
    }));

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

/**
 * GET /api/v1/notice/:id
 * 공지사항 상세 조회
 */
router.get('/:id', (req: Request, res: Response<NoticeDetailResponse | ErrorResponse>) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '유효하지 않은 ID입니다.'
      }
    });
  }

  const notice = mockNotices.find(n => n.id === id);

  if (!notice) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOTICE_NOT_FOUND',
        message: '공지사항을 찾을 수 없습니다.'
      }
    });
  }

  // 조회수 증가 (Mock)
  notice.readCount += 1;

  res.json({
    success: true,
    data: notice
  });
});

export default router;
