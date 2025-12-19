/**
 * AnalysisChart - 분석 결과 차트 시각화
 *
 * Phase 4: 분석 결과 시각화
 *
 * @version 1.0.0
 */

import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface AnalysisChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'pie' | 'line';
  height?: number;
}

// 기본 색상 팔레트
const COLORS = [
  '#e94560', '#0f3460', '#16213e', '#1a1a2e',
  '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316'
];

export const AnalysisChart: React.FC<AnalysisChartProps> = ({
  title,
  data,
  type,
  height = 300
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // 바 차트 렌더링
  const renderBarChart = () => (
    <div className="flex items-end gap-2 h-full">
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * 100;
        const color = item.color || COLORS[index % COLORS.length];

        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${barHeight}%`,
                backgroundColor: color,
                minHeight: '4px'
              }}
              title={`${item.label}: ${item.value.toLocaleString()}`}
            />
            <div className="text-xs text-gray-400 mt-2 truncate w-full text-center">
              {item.label}
            </div>
            <div className="text-sm font-bold text-white">
              {item.value.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );

  // 파이 차트 렌더링 (CSS 기반)
  const renderPieChart = () => {
    let cumulativePercent = 0;
    const gradientStops = data.map((item, index) => {
      const percent = (item.value / total) * 100;
      const color = item.color || COLORS[index % COLORS.length];
      const start = cumulativePercent;
      cumulativePercent += percent;
      return `${color} ${start}% ${cumulativePercent}%`;
    }).join(', ');

    return (
      <div className="flex items-center gap-8">
        <div
          className="w-48 h-48 rounded-full"
          style={{
            background: `conic-gradient(${gradientStops})`
          }}
        />
        <div className="flex flex-col gap-2">
          {data.map((item, index) => {
            const color = item.color || COLORS[index % COLORS.length];
            const percent = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-300">
                  {item.label}: {item.value.toLocaleString()} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 라인 차트 렌더링 (SVG 기반)
  const renderLineChart = () => {
    const width = 400;
    const chartHeight = height - 60;
    const padding = 40;
    const pointGap = (width - padding * 2) / Math.max(data.length - 1, 1);

    const points = data.map((item, index) => ({
      x: padding + index * pointGap,
      y: chartHeight - ((item.value / maxValue) * (chartHeight - padding))
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => {
          const y = chartHeight - (percent / 100) * (chartHeight - padding);
          return (
            <g key={percent}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#333"
                strokeDasharray="4"
              />
              <text x={5} y={y + 4} fill="#666" fontSize="10">
                {Math.round((percent / 100) * maxValue)}
              </text>
            </g>
          );
        })}

        {/* Line path */}
        <path
          d={pathD}
          fill="none"
          stroke="#e94560"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#e94560"
              className="hover:r-8 transition-all"
            />
            <text
              x={p.x}
              y={chartHeight - 5}
              fill="#888"
              fontSize="10"
              textAnchor="middle"
            >
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="bg-[#16213e] rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div style={{ height: `${height}px` }}>
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'line' && renderLineChart()}
      </div>
    </div>
  );
};

export default AnalysisChart;
