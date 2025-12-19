/**
 * InsightService 단위 테스트
 * @see docs/case-3-dr-insight/SDD.md
 */

import { describe, expect, it } from "vitest";
import {
  ForbiddenError,
  InsightService,
} from "../../../src/services/InsightService";

function makeTestService() {
  return new InsightService({
    getUserInfo: async (userId: string) => {
      if (userId === "DOC12345") {
        return {
          id: "DOC12345",
          name: "홍길동",
          registeredAt: "2021-03-15T00:00:00Z",
          dDay: 100,
        };
      }
      return null;
    },
    getPostCount: async () => 127,
    getCommentCount: async () => 456,
    getLikeCount: async () => 789,
    getPointSum: async () => 12340,
    getMonthlyTrend: async () => [],
    now: () => new Date("2025-12-17T00:00:00Z"),
  });
}

describe("InsightService", () => {
  it("should return summary for valid doctor user", async () => {
    const service = makeTestService();

    const summary = await service.getSummary("DOC12345");

    expect(summary.user.id).toBe("DOC12345");
    expect(summary.metrics.posts.count).toBe(127);
    expect(summary.metrics.comments.count).toBe(456);
    expect(summary.metrics.likes.count).toBe(789);
    expect(summary.metrics.points.count).toBe(12340);
  });

  it("should throw ForbiddenError for non-doctor user", async () => {
    const service = makeTestService();

    await expect(service.getSummary("USER99999")).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("should handle user with no activity data", async () => {
    const service = new InsightService({
      getUserInfo: async () => ({
        id: "DOC12345",
        name: "홍길동",
        registeredAt: "2025-12-15T00:00:00Z",
        dDay: 2,
      }),
      getPostCount: async () => 0,
      getCommentCount: async () => 0,
      getLikeCount: async () => 0,
      getPointSum: async () => 0,
      getMonthlyTrend: async () => [],
      now: () => new Date("2025-12-17T00:00:00Z"),
    });

    const summary = await service.getSummary("DOC12345");

    expect(summary.metrics.posts.count).toBe(0);
    expect(summary.metrics.comments.count).toBe(0);
    expect(summary.metrics.likes.count).toBe(0);
    expect(summary.metrics.points.count).toBe(0);
  });

  it("should calculate D-Day correctly", async () => {
    const service = new InsightService({
      getUserInfo: async (_userId: string) => ({
        id: "DOC12345",
        name: "홍길동",
        registeredAt: "2021-03-15T00:00:00Z",
        dDay: 0, // will be overwritten
      }),
      getPostCount: async () => 0,
      getCommentCount: async () => 0,
      getLikeCount: async () => 0,
      getPointSum: async () => 0,
      getMonthlyTrend: async () => [],
      now: () => new Date("2025-03-15T00:00:00Z"),
    });

    const summary = await service.getSummary("DOC12345");

    // 2021-03-15 -> 2025-03-15 = 1461 days (leap year 포함)
    expect(summary.user.dDay).toBe(1461);
  });
});
