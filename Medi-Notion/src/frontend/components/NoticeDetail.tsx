/**
 * 공지사항 상세 컴포넌트
 * @see docs/case1-notice-list/Wireframe.md
 */

import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import type { NoticeDetail as NoticeDetailType } from "../types/notice";

const API_BASE = "http://localhost:3001/api/v1";

interface NoticeDetailProps {
  noticeId: number;
  onBack: () => void;
}

export const NoticeDetail: React.FC<NoticeDetailProps> = ({
  noticeId,
  onBack,
}) => {
  const [notice, setNotice] = useState<NoticeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNoticeDetail();
  }, [noticeId]);

  const fetchNoticeDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/notice/${noticeId}`);
      const data = await res.json();

      if (data.success) {
        setNotice(data.data);
      } else {
        setError(data.error?.message || "공지사항을 불러올 수 없습니다.");
      }
    } catch (err) {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatReadCount = (count: number): string => {
    return count.toLocaleString("ko-KR");
  };

  // XSS 방지를 위한 HTML Sanitize
  const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a"],
      ALLOWED_ATTR: ["href", "target"],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 mb-4">
          ← 뒤로가기
        </button>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">
            {error || "공지사항을 찾을 수 없습니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <button
        onClick={onBack}
        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
        ← 뒤로가기
      </button>

      {/* Content */}
      <div className="border-b pb-4 mb-4">
        <div className="flex items-start gap-2 mb-2">
          {notice.noticeType === "IMPORTANT" && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
              중요
            </span>
          )}
          <h1 className="text-xl font-bold text-gray-900">{notice.title}</h1>
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(notice.regDate)} | 조회{" "}
          {formatReadCount(notice.readCount)}
        </div>
      </div>

      {/* Body */}
      <div
        className="prose prose-gray max-w-none py-4"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(notice.content) }}
      />

      {/* Footer */}
      <div className="border-t pt-4 mt-8">
        <button
          onClick={onBack}
          className="w-full py-2 border rounded hover:bg-gray-50 transition-colors">
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default NoticeDetail;
