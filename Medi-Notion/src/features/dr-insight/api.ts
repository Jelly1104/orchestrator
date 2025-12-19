/**
 * Dr Insight API 호출
 * @see docs/case-3-dr-insight/SDD.md
 */

import type { InsightSummaryResponse } from "./types";

const API_BASE = "http://localhost:3001/api";

export async function fetchInsight2025Summary(
  init?: RequestInit
): Promise<InsightSummaryResponse> {
  // NOTE: tests에서는 `../api` 모듈을 vi.mock으로 대체하여 네트워크 호출을 막습니다.
  // 런타임에서 mock이 필요하면, 앱 레벨에서 해당 모듈을 교체하거나 별도 분기 로직을 추가하세요.

  const res = await fetch(`${API_BASE}/insight/2025/summary`, init);
  const data = (await res.json()) as InsightSummaryResponse;
  return data;
}
