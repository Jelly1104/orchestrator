/**
 * Dr Insight API Mock (tests)
 * @see docs/case-3-dr-insight/SDD.md
 */

import type {
  InsightSummary,
  InsightSummaryResponse,
  InsightTrendPoint,
} from "./types";

function mockTrend(): InsightTrendPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return {
      month: `2025-${m}`,
      posts: Math.max(0, Math.round(10 + 8 * Math.sin(i))),
      comments: Math.max(0, Math.round(25 + 10 * Math.cos(i))),
    };
  });
}

export function makeMockSummary(): InsightSummary {
  return {
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
    trend: mockTrend(),
  };
}

export function makeMockSuccess(): InsightSummaryResponse {
  return { success: true, data: makeMockSummary() };
}

export function makeMockFailure(): InsightSummaryResponse {
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "데이터를 불러오는 중 오류가 발생했습니다",
    },
  };
}
