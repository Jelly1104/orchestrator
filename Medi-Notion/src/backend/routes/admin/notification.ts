/**
 * 관리자 알림 API
 * @see docs/case2-notification/SDD.md
 */

import { Router, Request, Response } from "express";
import type {
  AdminSendNotificationRequest,
  AdminSendNotificationResponse,
  ErrorResponse,
} from "../../types/notification";

const router = Router();

const MAX_TITLE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

function isValidUserId(userId: string): boolean {
  return /^\d{14}$/.test(userId);
}

function validateRequest(body: AdminSendNotificationRequest): string | null {
  if (body.target !== "ALL" && body.target !== "SPECIFIC") {
    return "target 값이 올바르지 않습니다.";
  }
  if (
    body.type !== "NOTICE" &&
    body.type !== "EVENT" &&
    body.type !== "SYSTEM"
  ) {
    return "type 값이 올바르지 않습니다.";
  }
  if (!body.title || body.title.length > MAX_TITLE_LENGTH) {
    return `title은 필수이며 ${MAX_TITLE_LENGTH}자 이하여야 합니다.`;
  }
  if (!body.message || body.message.length > MAX_MESSAGE_LENGTH) {
    return `message는 필수이며 ${MAX_MESSAGE_LENGTH}자 이하여야 합니다.`;
  }
  if (body.target === "SPECIFIC") {
    const ids = body.targetUserIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      return "SPECIFIC일 때 targetUserIds가 필요합니다.";
    }
    if (ids.some((id) => !isValidUserId(id))) {
      return "targetUserIds 형식이 올바르지 않습니다.";
    }
  }

  return null;
}

/**
 * POST /api/v1/admin/notifications
 * 알림 발송 (관리자)
 */
router.post(
  "/",
  (
    req: Request<unknown, unknown, AdminSendNotificationRequest>,
    res: Response<AdminSendNotificationResponse | ErrorResponse>
  ) => {
    const error = validateRequest(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error },
      });
    }

    // 서버 데이터 보호 규칙으로 인해 INSERT 금지 → mock 결과만 반환
    const sentCount =
      req.body.target === "ALL" ? 1500 : req.body.targetUserIds?.length || 0;

    return res.status(201).json({
      success: true,
      data: {
        sentCount,
        message: "알림이 발송되었습니다.",
      },
    });
  }
);

export default router;
