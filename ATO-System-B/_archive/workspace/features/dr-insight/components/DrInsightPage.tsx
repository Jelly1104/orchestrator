/**
 * Dr Insight 메인 페이지
 * @see docs/case-3-dr-insight/IA.md
 */

import React, { useMemo } from "react";
import { useInsightData } from "../hooks/useInsightData";
import { Header } from "./Header";
import { HeroSection } from "./HeroSection";
import { MetricCard } from "./MetricCard";
import { TrendChart } from "./TrendChart";
import { ShareCard } from "./ShareCard";

export const DrInsightPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useInsightData();

  const isEmpty = useMemo(() => {
    if (!data) return false;
    const m = data.metrics;
    return (
      m.posts.count === 0 &&
      m.comments.count === 0 &&
      m.likes.count === 0 &&
      m.points.count === 0
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-600 mb-4">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded">
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-gray-700">데이터가 없습니다.</div>
      </div>
    );
  }

  if (isEmpty) {
    const welcome = data.user.dDay < 7;

    return (
      <div className="max-w-4xl mx-auto p-4">
        <Header user={data.user} />
        <div className="mt-8 text-center">
          <div className="text-xl font-semibold text-gray-900">
            아직 활동 내역이 없습니다
          </div>
          <div className="mt-2 text-gray-600">
            {welcome
              ? "가입을 환영합니다!"
              : "2025년을 메디게이트와 함께 시작해보세요!"}
          </div>
          <a
            href="#"
            className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded">
            커뮤니티 둘러보기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <Header user={data.user} />
        <HeroSection dDay={data.user.dDay} />

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={data.metrics.posts.label}
            value={data.metrics.posts.count}
            unit="건"
          />
          <MetricCard
            label={data.metrics.comments.label}
            value={data.metrics.comments.count}
            unit="개"
          />
          <MetricCard
            label={data.metrics.likes.label}
            value={data.metrics.likes.count}
            unit="회"
          />
          <MetricCard
            label={data.metrics.points.label}
            value={data.metrics.points.count}
            unit="P"
          />
        </div>

        <div className="mt-10">
          <TrendChart data={data.trend} />
        </div>

        <ShareCard data={data} />
      </div>
    </div>
  );
};
