import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { DashboardStats } from '../types/api.types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">대시보드</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">대시보드</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">오류가 발생했습니다: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">총 회원수</h3>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.totalUsers)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">활성 회원수</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(stats.activeUsers)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">총 게시글수</h3>
          <p className="text-3xl font-bold text-purple-600">{formatNumber(stats.totalPosts)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">오늘 게시글</h3>
          <p className="text-3xl font-bold text-orange-600">{formatNumber(stats.todayPosts)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">총 댓글수</h3>
          <p className="text-3xl font-bold text-indigo-600">{formatNumber(stats.totalComments)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">오늘 댓글</h3>
          <p className="text-3xl font-bold text-pink-600">{formatNumber(stats.todayComments)}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;