/**
 * InsightCard - 분석 인사이트 카드
 *
 * Phase 4: 분석 결과 시각화
 *
 * @version 1.0.0
 */

import React from 'react';

type InsightType = 'info' | 'success' | 'warning' | 'error' | 'highlight';

interface InsightCardProps {
  title: string;
  description: string;
  type?: InsightType;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
}

const typeStyles: Record<InsightType, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500',
    icon: 'i'
  },
  success: {
    bg: 'bg-green-900/30',
    border: 'border-green-500',
    icon: '✓'
  },
  warning: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500',
    icon: '!'
  },
  error: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    icon: '✕'
  },
  highlight: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500',
    icon: '★'
  }
};

const trendStyles = {
  up: { color: 'text-green-400', icon: '↑' },
  down: { color: 'text-red-400', icon: '↓' },
  neutral: { color: 'text-gray-400', icon: '→' }
};

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  type = 'info',
  value,
  trend,
  trendValue,
  icon
}) => {
  const style = typeStyles[type];
  const trendStyle = trend ? trendStyles[trend] : null;

  return (
    <div className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className={`w-8 h-8 rounded-full ${style.border} border flex items-center justify-center text-sm font-bold`}>
          {icon || style.icon}
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">{title}</h4>

            {/* 값 + 트렌드 */}
            {value !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {trend && trendStyle && (
                  <span className={`text-sm ${trendStyle.color}`}>
                    {trendStyle.icon} {trendValue}
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
