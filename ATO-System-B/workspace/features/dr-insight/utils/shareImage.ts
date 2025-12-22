/**
 * 공유용 이미지 생성 유틸
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import type { InsightMetrics } from "../types";

type ShareImageInput = {
  title: string;
  userName: string;
  metrics: InsightMetrics;
};

function safeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export async function downloadShareImage(
  input: ShareImageInput
): Promise<void> {
  const content = [
    input.title,
    `${safeText(input.userName)} 선생님의 1년`,
    `${input.metrics.posts.label}: ${input.metrics.posts.count}`,
    `${input.metrics.comments.label}: ${input.metrics.comments.count}`,
    `${input.metrics.likes.label}: ${input.metrics.likes.count}`,
    `${input.metrics.points.label}: ${input.metrics.points.count}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dr-insight-2025.txt";
  a.click();

  URL.revokeObjectURL(url);
}
