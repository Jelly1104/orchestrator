/**
 * Dr Insight 페이지(Frontend 엔트리)
 * @see docs/case-3-dr-insight/IA.md
 */

import React from "react";

const DrInsightPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900">Dr. Insight 2025</h1>
      <p className="mt-2 text-gray-600">
        Dr Insight 기능 코드는 <code>src/features/dr-insight</code>에 구현되어
        있습니다.
      </p>
      <p className="mt-2 text-gray-600">
        현재 PoC 앱(App.tsx)에는 라우팅이 없어 이 페이지는 연결만 제공하며, 실제
        화면은 추후 탭/라우터에 붙일 수 있습니다.
      </p>
    </div>
  );
};

export default DrInsightPage;
