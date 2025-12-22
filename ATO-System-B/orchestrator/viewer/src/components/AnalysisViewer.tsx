/**
 * AnalysisViewer - 분석 결과 통합 뷰어
 *
 * Phase 4: 분석 결과 시각화
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { AnalysisChart } from './AnalysisChart';
import { DataTable } from './DataTable';
import { InsightCard } from './InsightCard';

interface AnalysisViewerProps {
  taskId: string;
}

interface AnalysisResult {
  summary: {
    title: string;
    totalRows: number;
    queryCount: number;
    duration: string;
  };
  queries: Array<{
    id: string;
    sql: string;
    rowCount: number;
    data: Record<string, any>[];
  }>;
  insights: Array<{
    type: 'info' | 'success' | 'warning' | 'error' | 'highlight';
    title: string;
    description: string;
    value?: string | number;
  }>;
  charts: Array<{
    title: string;
    type: 'bar' | 'pie' | 'line';
    data: Array<{ label: string; value: number }>;
  }>;
}

export const AnalysisViewer: React.FC<AnalysisViewerProps> = ({ taskId }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'charts'>('overview');

  useEffect(() => {
    fetchAnalysis();
  }, [taskId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/analysis/${taskId}`);
      if (!res.ok) {
        throw new Error('분석 결과를 찾을 수 없습니다');
      }
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
      // 샘플 데이터로 폴백 (개발용)
      setAnalysis(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center text-gray-500 py-8">
        분석 결과가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{analysis.summary.title}</h2>
          <div className="text-sm text-gray-400 mt-1">
            {analysis.summary.queryCount}개 쿼리 · {analysis.summary.totalRows.toLocaleString()}행 · {analysis.summary.duration}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2">
          {(['overview', 'tables', 'charts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#16213e] text-gray-300 hover:bg-[#0f3460]'
              }`}
            >
              {tab === 'overview' && '개요'}
              {tab === 'tables' && '테이블'}
              {tab === 'charts' && '차트'}
            </button>
          ))}
        </div>
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 인사이트 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.insights.map((insight, i) => (
              <InsightCard
                key={i}
                type={insight.type}
                title={insight.title}
                description={insight.description}
                value={insight.value}
              />
            ))}
          </div>

          {/* 요약 차트 */}
          {analysis.charts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analysis.charts.slice(0, 2).map((chart, i) => (
                <AnalysisChart
                  key={i}
                  title={chart.title}
                  type={chart.type}
                  data={chart.data}
                  height={250}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 테이블 탭 */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {analysis.queries.map((query, i) => (
            <div key={i}>
              <div className="mb-2">
                <span className="text-sm text-gray-400">Query {query.id}</span>
                <pre className="text-xs bg-[#0d1b2a] p-2 rounded mt-1 overflow-x-auto text-gray-400">
                  {query.sql}
                </pre>
              </div>
              <DataTable
                title={`결과 (${query.rowCount}행)`}
                columns={
                  query.data.length > 0
                    ? Object.keys(query.data[0]).map(key => ({
                        key,
                        label: key,
                        align: typeof query.data[0][key] === 'number' ? 'right' : 'left' as const
                      }))
                    : []
                }
                data={query.data}
                pageSize={5}
              />
            </div>
          ))}
        </div>
      )}

      {/* 차트 탭 */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysis.charts.map((chart, i) => (
            <AnalysisChart
              key={i}
              title={chart.title}
              type={chart.type}
              data={chart.data}
              height={300}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="text-xs text-yellow-500 mt-4">
          * 샘플 데이터를 표시하고 있습니다 ({error})
        </div>
      )}
    </div>
  );
};

// 개발용 샘플 데이터
function getSampleData(): AnalysisResult {
  return {
    summary: {
      title: '회원 활동 분석',
      totalRows: 15420,
      queryCount: 5,
      duration: '2.3초'
    },
    insights: [
      {
        type: 'highlight',
        title: '활성 사용자',
        description: '최근 30일 내 로그인한 사용자 수',
        value: 8542
      },
      {
        type: 'success',
        title: '참여율 증가',
        description: '전월 대비 게시물 작성 수 증가',
        value: '+23%'
      },
      {
        type: 'warning',
        title: '휴면 회원',
        description: '90일 이상 미접속 회원 비율',
        value: '34%'
      },
      {
        type: 'info',
        title: '신규 가입',
        description: '이번 달 신규 가입자 수',
        value: 1205
      }
    ],
    charts: [
      {
        title: '월별 활성 사용자',
        type: 'line',
        data: [
          { label: '7월', value: 6200 },
          { label: '8월', value: 6800 },
          { label: '9월', value: 7100 },
          { label: '10월', value: 7900 },
          { label: '11월', value: 8100 },
          { label: '12월', value: 8542 }
        ]
      },
      {
        title: '전문과별 분포',
        type: 'pie',
        data: [
          { label: '내과', value: 3200 },
          { label: '외과', value: 2100 },
          { label: '소아과', value: 1800 },
          { label: '정형외과', value: 1500 },
          { label: '기타', value: 3820 }
        ]
      },
      {
        title: '일별 로그인 수',
        type: 'bar',
        data: [
          { label: '월', value: 1200 },
          { label: '화', value: 1400 },
          { label: '수', value: 1350 },
          { label: '목', value: 1280 },
          { label: '금', value: 1100 },
          { label: '토', value: 650 },
          { label: '일', value: 420 }
        ]
      }
    ],
    queries: [
      {
        id: 'Q1',
        sql: 'SELECT DATE(login_date) as date, COUNT(*) as cnt FROM user_login GROUP BY DATE(login_date) ORDER BY date DESC LIMIT 7',
        rowCount: 7,
        data: [
          { date: '2024-12-19', cnt: 1205 },
          { date: '2024-12-18', cnt: 1342 },
          { date: '2024-12-17', cnt: 1189 },
          { date: '2024-12-16', cnt: 1456 },
          { date: '2024-12-15', cnt: 892 },
          { date: '2024-12-14', cnt: 645 },
          { date: '2024-12-13', cnt: 1398 }
        ]
      }
    ]
  };
}

export default AnalysisViewer;
