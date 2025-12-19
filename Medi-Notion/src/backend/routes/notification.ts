/**
 * 알림 API 라우터
 * @see docs/case2-notification/SDD.md
 */

import { Router, Request, Response } from "express";
import type {
  ErrorResponse,
  NotificationListItem,
  NotificationListResponse,
  NotificationReadResponse,
  NotificationRecord,
} from "../types/notification";

const router = Router();

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const mockNotifications: NotificationRecord[] = [
  {
    NOTI_IDX: 1,
    U_ID: "12345678901234",
    NOTI_TYPE: "NOTICE",
    TITLE: "서비스 점검 안내",
    MESSAGE: "12월 20일 서비스 점검이 예정되어 있습니다.",
    READ_FLAG: "N",
    DEL_FLAG: "N",
    REG_DATE: "2025-12-16T10:00:00Z",
    READ_DATE: null,
  },
  {
    NOTI_IDX: 2,
    U_ID: "12345678901234",
    NOTI_TYPE: "EVENT",
    TITLE: "12월 이벤트 당첨 안내",
    MESSAGE: "축하합니다! 회원님께서 12월 이벤트에 당첨되셨습니다.",
    READ_FLAG: "N",
    DEL_FLAG: "N",
    REG_DATE: "2025-12-16T09:00:00Z",
    READ_DATE: null,
  },
  {
    NOTI_IDX: 3,
    U_ID: "12345678901234",
    NOTI_TYPE: "SYSTEM",
    TITLE: "비밀번호 변경 완료",
    MESSAGE: "비밀번호가 성공적으로 변경되었습니다.",
    READ_FLAG: "Y",
    DEL_FLAG: "N",
    REG_DATE: "2025-12-13T10:00:00Z",
    READ_DATE: "2025-12-13T10:05:00Z",
  },
  {
    NOTI_IDX: 4,
    U_ID: "99999999999999",
    NOTI_TYPE: "NOTICE",
    TITLE: "다른 사용자 알림",
    MESSAGE: "이 알림은 다른 사용자에게만 보입니다.",
    READ_FLAG: "N",
    DEL_FLAG: "N",
    REG_DATE: "2025-12-16T08:00:00Z",
    READ_DATE: null,
  },
];

function getUserId(req: Request): string | null {
  const header = req.header("X-User-Id");
  if (!header) return null;
  return header;
}

function toListItem(record: NotificationRecord): NotificationListItem {
  return {
    id: record.NOTI_IDX,
    type: record.NOTI_TYPE,
    title: record.TITLE,
    message: record.MESSAGE,
    isRead: record.READ_FLAG === "Y",
    regDate: record.REG_DATE,
  };
}

function getPagination(page: number, limit: number, totalCount: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  return { currentPage: page, totalPages, totalCount };
}

function parsePageLimit(req: Request) {
  const page = Math.max(
    1,
    parseInt((req.query.page as string) || "", 10) || DEFAULT_PAGE
  );
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      parseInt((req.query.limit as string) || "", 10) || DEFAULT_LIMIT
    )
  );
  return { page, limit };
}

/**
 * GET /api/v1/notifications
 * 내 알림 목록 조회
 */
router.get(
  "/",
  (req: Request, res: Response<NotificationListResponse | ErrorResponse>) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "X-User-Id 헤더가 필요합니다.",
        },
      });
    }

    const { page, limit } = parsePageLimit(req);

    const userNotifications = mockNotifications
      .filter((n) => n.U_ID === userId && n.DEL_FLAG === "N")
      .sort(
        (a, b) =>
          new Date(b.REG_DATE).getTime() - new Date(a.REG_DATE).getTime()
      );

    const totalCount = userNotifications.length;
    const offset = (page - 1) * limit;
    const items = userNotifications
      .slice(offset, offset + limit)
      .map(toListItem);

    const unreadCount = userNotifications.filter(
      (n) => n.READ_FLAG === "N"
    ).length;

    return res.json({
      success: true,
      data: {
        items,
        unreadCount,
        pagination: getPagination(page, limit, totalCount),
      },
    });
  }
);

/**
 * PATCH /api/v1/notifications/:id/read
 * 알림 읽음 처리
 */
router.patch(
  "/:id/read",
  (req: Request, res: Response<NotificationReadResponse | ErrorResponse>) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "X-User-Id 헤더가 필요합니다.",
        },
      });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "유효하지 않은 ID입니다." },
      });
    }

    const record = mockNotifications.find(
      (n) => n.NOTI_IDX === id && n.DEL_FLAG === "N"
    );
    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "알림을 찾을 수 없습니다",
        },
      });
    }

    if (record.U_ID !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "권한이 없습니다" },
      });
    }

    record.READ_FLAG = "Y";
    record.READ_DATE = new Date().toISOString();

    return res.json({
      success: true,
      data: { id: record.NOTI_IDX, isRead: true },
    });
  }
);

export default router;
