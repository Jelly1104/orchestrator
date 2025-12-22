/**
 * Dr Insight - ShareCard
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import React from "react";
import type { InsightSummary } from "../types";
import { downloadShareImage } from "../utils/shareImage";

type ShareCardProps = {
  data: InsightSummary;
};

export const ShareCard: React.FC<ShareCardProps> = ({ data }) => {
  const handleDownload = async () => {
    await downloadShareImage({
      title: "Dr. Insight 2025",
      userName: data.user.name,
      metrics: data.metrics,
    });
  };

  return (
    <section className="mt-10 bg-white rounded-lg border p-4">
      <div className="font-semibold text-gray-900">공유 카드</div>
      <div className="mt-3 p-4 rounded bg-gray-50 border">
        <div className="text-sm text-gray-600">Dr. Insight 2025</div>
        <div className="mt-1 text-lg font-semibold text-gray-900">
          {data.user.name} 선생님의 1년
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleDownload()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        이미지 저장하기
      </button>
    </section>
  );
};
