/**
 * MetricCard 컴포넌트 테스트
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricCard } from "../../../src/features/dr-insight/components/MetricCard";

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("MetricCard", () => {
  it("should render metric value and label", () => {
    const html = renderToStaticMarkup(
      <MetricCard label="작성 글" value={127} unit="건" />
    );

    const t = text(html);
    expect(t).toContain("작성 글");
    expect(t).toContain("127");
    expect(t).toContain("건");
  });

  it("should format large numbers with comma", () => {
    const html = renderToStaticMarkup(
      <MetricCard label="포인트" value={12340} unit="P" />
    );

    const t = text(html);
    expect(t).toContain("12,340");
  });

  it("should display 0 for zero value", () => {
    const html = renderToStaticMarkup(
      <MetricCard label="댓글" value={0} unit="개" />
    );

    const t = text(html);
    expect(t).toContain("0");
  });
});
