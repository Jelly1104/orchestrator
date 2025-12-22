/**
 * Dr Insight 데이터 fetching hook
 * @see docs/case-3-dr-insight/SDD.md
 */

import { useCallback, useEffect, useState } from "react";
import { fetchInsight2025Summary } from "../api";
import type { InsightSummary } from "../types";

type UseInsightDataState = {
  data: InsightSummary | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error("Unknown error");
}

export function useInsightData(): UseInsightDataState {
  const [data, setData] = useState<InsightSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchInsight2025Summary();
      if (!res.success) {
        throw new Error(res.error.message);
      }
      setData(res.data);
    } catch (e) {
      setError(toError(e));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
