/**
 * Dr Insight - 타입 정의
 * @see docs/case-3-dr-insight/SDD.md
 */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type InsightUser = {
  id: string;
  name: string;
  registeredAt: string;
  dDay: number;
};

export type InsightMetricItem = {
  count: number;
  label: string;
};

export type InsightMetrics = {
  posts: InsightMetricItem;
  comments: InsightMetricItem;
  likes: InsightMetricItem;
  points: InsightMetricItem;
};

export type InsightTrendPoint = {
  month: string; // YYYY-MM
  posts: number;
  comments: number;
};

export type InsightSummary = {
  user: InsightUser;
  metrics: InsightMetrics;
  trend: InsightTrendPoint[];
};

export type InsightSummaryApiData = InsightSummary;

export type InsightSummaryResponse = ApiResponse<InsightSummaryApiData>;
