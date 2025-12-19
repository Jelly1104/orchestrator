/**
 * 공지사항 목록 컴포넌트
 * @see docs/case1-notice-list/Wireframe.md
 */

import React, { useEffect, useState } from 'react';
import type { NoticeListItem, NoticeListResponse, PaginationInfo } from '../types/notice';

const API_BASE = 'http://localhost:3001/api/v1';

interface NoticeListProps {
  onSelectNotice: (id: number) => void;
}

export const NoticeList: React.FC<NoticeListProps> = ({ onSelectNotice }) => {
  const [notices, setNotices] = useState<NoticeListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotices(currentPage);
  }, [currentPage]);

  const fetchNotices = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/notice?page=${page}&limit=10`);
      const data: NoticeListResponse = await res.json();

      if (data.success) {
        setNotices(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError('공지사항을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatReadCount = (count: number): string => {
    return count.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>📢</span> 공지사항
      </h1>

      {/* Notice List */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            공지사항이 없습니다.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => onSelectNotice(notice.id)}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-2">
                {notice.noticeType === 'IMPORTANT' && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                    중요
                  </span>
                )}
                <h2 className="font-medium text-gray-900 flex-1">
                  {notice.title}
                </h2>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {formatDate(notice.regDate)} | 조회 {formatReadCount(notice.readCount)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ◀
          </button>

          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 border rounded ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNext}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeList;
