/**
 * InsightService
 * @see docs/case-3-dr-insight/SDD.md
 */

import type {
  InsightMetrics,
  InsightSummary,
  InsightTrendPoint,
  InsightUser,
} from "../features/dr-insight/types";

export class ForbiddenError extends Error {
  public readonly name = "ForbiddenError";

  constructor(message: string) {
    super(message);
  }
}

export interface InsightRepository {
  getUserInfo(userId: string): Promise<InsightUser | null>;
  getPostCount(userId: string): Promise<number>;
  getCommentCount(userId: string): Promise<number>;
  getLikeCount(userId: string): Promise<number>;
  getPointSum(userId: string): Promise<number>;
  getMonthlyTrend(userId: string): Promise<InsightTrendPoint[]>;
}

export interface InsightServiceDeps extends InsightRepository {
  now?: () => Date;
}

const METRIC_LABELS = {
  posts: "작성 글",
  comments: "댓글",
  likes: "받은 추천",
  points: "포인트",
} as const;

function toDate(input: string): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return d;
}

function diffDays(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function makeMetrics(counts: {
  posts: number;
  comments: number;
  likes: number;
  points: number;
}): InsightMetrics {
  return {
    posts: { count: counts.posts, label: METRIC_LABELS.posts },
    comments: { count: counts.comments, label: METRIC_LABELS.comments },
    likes: { count: counts.likes, label: METRIC_LABELS.likes },
    points: { count: counts.points, label: METRIC_LABELS.points },
  };
}

export class InsightService {
  private readonly repo: InsightRepository;
  private readonly now: () => Date;

  constructor(deps: InsightServiceDeps) {
    this.repo = deps;
    this.now = deps.now ?? (() => new Date());
  }

  async getSummary(userId: string): Promise<InsightSummary> {
    const user = await this.repo.getUserInfo(userId);
    if (!user) {
      throw new ForbiddenError("의사 회원만 이용 가능합니다");
    }

    const [posts, comments, likes, points, trend] = await Promise.all([
      this.repo.getPostCount(userId),
      this.repo.getCommentCount(userId),
      this.repo.getLikeCount(userId),
      this.repo.getPointSum(userId),
      this.repo.getMonthlyTrend(userId),
    ]);

    const registeredAt = toDate(user.registeredAt);
    const dDay = Math.max(0, diffDays(registeredAt, this.now()));

    return {
      user: { ...user, dDay },
      metrics: makeMetrics({ posts, comments, likes, points }),
      trend,
    };
  }
}
