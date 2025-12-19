/**
 * useInsightData Hook 테스트
 * @see docs/case-3-dr-insight/SDD.md
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";

import type { InsightSummaryResponse } from "../../../src/features/dr-insight/types";
import {
  makeMockFailure,
  makeMockSuccess,
} from "../../../src/features/dr-insight/api.mock";
import { useInsightData } from "../../../src/features/dr-insight/hooks/useInsightData";

vi.mock("../../../src/features/dr-insight/api", () => {
  return {
    fetchInsight2025Summary: vi.fn(),
  };
});

const apiModule = (await import("../../../src/features/dr-insight/api")) as {
  fetchInsight2025Summary: (
    init?: RequestInit
  ) => Promise<InsightSummaryResponse>;
};

function TestHarness(props: {
  onState: (s: {
    isLoading: boolean;
    hasData: boolean;
    hasError: boolean;
  }) => void;
}) {
  const { data, isLoading, error } = useInsightData();

  // useEffect 대신 render마다 기록(초기 로딩 상태를 즉시 검증하기 위함)
  props.onState({
    isLoading,
    hasData: Boolean(data),
    hasError: Boolean(error),
  });

  return null;
}

async function flush(): Promise<void> {
  // React 18+/createRoot는 render가 즉시 동기 반영되지 않을 수 있어
  // macrotask + microtask를 모두 flush합니다.
  await new Promise((r) => setTimeout(r, 0));
  await Promise.resolve();
  await Promise.resolve();
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 300
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return;
    await flush();
  }
  throw new Error("waitFor timeout");
}

describe("useInsightData", () => {
  it("should return loading state initially", async () => {
    apiModule.fetchInsight2025Summary = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return makeMockSuccess();
    });

    const rootEl = document.createElement("div");
    const root = createRoot(rootEl);

    const states: Array<{
      isLoading: boolean;
      hasData: boolean;
      hasError: boolean;
    }> = [];

    root.render(
      React.createElement(TestHarness, { onState: (s) => states.push(s) })
    );

    await flush();

    // 첫 렌더는 로딩 상태
    expect(states[0]?.isLoading).toBe(true);

    root.unmount();
  });

  it("should return data on successful fetch", async () => {
    apiModule.fetchInsight2025Summary = vi.fn(async () => makeMockSuccess());

    const rootEl = document.createElement("div");
    const root = createRoot(rootEl);

    const states: Array<{
      isLoading: boolean;
      hasData: boolean;
      hasError: boolean;
    }> = [];
    root.render(
      React.createElement(TestHarness, { onState: (s) => states.push(s) })
    );

    await waitFor(() => {
      const last = states.at(-1);
      return Boolean(last && !last.isLoading && last.hasData && !last.hasError);
    });

    const last = states.at(-1);
    expect(last?.isLoading).toBe(false);
    expect(last?.hasData).toBe(true);
    expect(last?.hasError).toBe(false);

    root.unmount();
  });

  it("should return error on failed fetch", async () => {
    apiModule.fetchInsight2025Summary = vi.fn(async () => makeMockFailure());

    const rootEl = document.createElement("div");
    const root = createRoot(rootEl);

    const states: Array<{
      isLoading: boolean;
      hasData: boolean;
      hasError: boolean;
    }> = [];
    root.render(
      React.createElement(TestHarness, { onState: (s) => states.push(s) })
    );

    await flush();

    const last = states.at(-1);
    expect(last?.isLoading).toBe(false);
    expect(last?.hasData).toBe(false);
    expect(last?.hasError).toBe(true);

    root.unmount();
  });
});
