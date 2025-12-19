/**
 * Dr Insight - HeroSection
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import React from "react";

type HeroSectionProps = {
  dDay: number;
};

export const HeroSection: React.FC<HeroSectionProps> = ({ dDay }) => {
  return (
    <section className="mt-6 bg-white rounded-lg border p-6">
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-semibold text-gray-900">
          2025년, 선생님의 목소리가 닿은 곳
        </div>
        <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
          가입 D+{dDay.toLocaleString("ko-KR")}일
        </div>
      </div>
    </section>
  );
};
