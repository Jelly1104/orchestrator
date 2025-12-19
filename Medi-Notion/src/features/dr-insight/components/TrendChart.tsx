/**
 * Dr Insight - TrendChart
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import React, { useMemo, useState } from "react";
import type { InsightTrendPoint } from "../types";

type TrendChartProps = {
  data: InsightTrendPoint[];
};

type ChartMode = "monthly" | "weekly";

function ensureMonths(points: InsightTrendPoint[]): InsightTrendPoint[] {
  const byMonth = new Map(points.map((p) => [p.month, p]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return `2025-${m}`;
  });

  return months.map((month) => {
    const found = byMonth.get(month);
    return found ?? { month, posts: 0, comments: 0 };
  });
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [mode, setMode] = useState<ChartMode>("monthly");

  const points = useMemo(() => ensureMonths(data), [data]);

  return (
    <section className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">월별 활동 추이</div>

        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="chart-mode"
              checked={mode === "monthly"}
              onChange={() => setMode("monthly")}
            />
            월별
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="chart-mode"
              checked={mode === "weekly"}
              onChange={() => setMode("weekly")}
            />
            주별
          </label>
        </div>
      </div>

      {mode === "weekly" ? (
        <div className="mt-4 text-sm text-gray-600">
          주별 차트는 추후 제공됩니다. (PoC: 월별 데이터만 표시)
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4">월</th>
              <th className="py-2 pr-4">게시글</th>
              <th className="py-2 pr-4">댓글</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month} className="border-t">
                <td className="py-2 pr-4">{p.month}</td>
                <td className="py-2 pr-4">{p.posts.toLocaleString("ko-KR")}</td>
                <td className="py-2 pr-4">
                  {p.comments.toLocaleString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
