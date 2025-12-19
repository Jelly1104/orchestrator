import React from 'react';
import { RecommendedJob } from '../types';

interface RecommendationCardProps {
  job: RecommendedJob;
  onViewDetail: (recruitIdx: number) => void;
  onApply: (recruitIdx: number) => void;
  onBookmark: (recruitIdx: number) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  job,
  onViewDetail,
  onApply,
  onBookmark
}) => {
  const renderStars = (score: number) => {
    const stars = Math.floor(score / 20); // 0-100점을 0-5점으로 변환
    return '⭐'.repeat(stars);
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return '';
    if (salary >= 100000000) {
      return `연봉 ${Math.floor(salary / 100000000)}억${salary % 100000000 > 0 ? Math.floor((salary % 100000000) / 10000000) + '천' : ''}만원`;
    }
    return `연봉 ${Math.floor(salary / 10000)}만원`;
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* 병원명 및 제목 */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            🏥 {job.title}
          </h3>
          {job.hospital_name && (
            <p className="text-sm text-gray-600">{job.hospital_name}</p>
          )}
        </div>
      </div>

      {/* 급여 및 지역 */}
      <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
        {job.salary_min && (
          <span className="flex items-center">
            💰 {formatSalary(job.salary_min)}
          </span>
        )}
        {job.area_name && (
          <span className="flex items-center">
            📍 {job.area_name}
          </span>
        )}
      </div>

      {/* 매칭 점수 및 별점 */}
      <div className="flex items-center mb-3">
        <span className="text-sm font-medium text-blue-600 mr-2">
          📊 매칭점수: {job.match_score}점
        </span>
        <span className="text-yellow-500">
          {renderStars(job.match_score)}
        </span>
      </div>

      {/* 매칭 이유 */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {job.match_reasons.map((reason, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
            >
              ✅ {reason.description}
            </span>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetail(job.recruit_idx)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          상세보기
        </button>
        <button
          onClick={() => onApply(job.recruit_idx)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          지원하기
        </button>
        <button
          onClick={() => onBookmark(job.recruit_idx)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          ❤️ 스크랩
        </button>
      </div>
    </div>
  );
};