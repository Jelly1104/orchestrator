/**
 * Dr Insight API 라우터 (PoC: Mock)
 * @see docs/case-3-dr-insight/SDD.md
 */

import { Router, Request, Response } from "express";

type InsightSummaryResponse =
  | {
      success: true;
      data: {
        user: {
          id: string;
          name: string;
          registeredAt: string;
          dDay: number;
        };
        metrics: {
          posts: { count: number; label: string };
          comments: { count: number; label: string };
          likes: { count: number; label: string };
          points: { count: number; label: string };
        };
        trend: Array<{ month: string; posts: number; comments: number }>;
      };
    }
  | {
      success: false;
      error: { code: string; message: string };
    };

const router = Router();

function buildTrend() {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return {
      month: `2025-${m}`,
      posts: Math.max(0, Math.round(10 + 8 * Math.sin(i))),
      comments: Math.max(0, Math.round(25 + 10 * Math.cos(i))),
    };
  });
}

/**
 * GET /api/insight/2025/summary
 */
router.get(
  "/insight/2025/summary",
  (_req: Request, res: Response<InsightSummaryResponse>) => {
    return res.json({
      success: true,
      data: {
        user: {
          id: "DOC12345",
          name: "홍길동",
          registeredAt: "2021-03-15T00:00:00Z",
          dDay: 1373,
        },
        metrics: {
          posts: { count: 127, label: "작성 글" },
          comments: { count: 456, label: "댓글" },
          likes: { count: 789, label: "받은 추천" },
          points: { count: 12340, label: "포인트" },
        },
        trend: buildTrend(),
      },
    });
  }
);

export default router;
