/**
 * 알림 목록 컴포넌트
 * @see docs/case2-notification/Wireframe.md
 */

import React, { useEffect, useMemo, useState } from "react";
import NotificationItem from "./NotificationItem";
import type {
  NotificationListItem,
  NotificationListResponse,
  PaginationInfo,
} from "../types/notification";

const API_BASE = "http://localhost:3001/api/v1";

const DEFAULT_USER_ID = "12345678901234";

export const NotificationList: React.FC = () => {
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => ({ "X-User-Id": DEFAULT_USER_ID }), []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const fetchNotifications = async (currentPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/notifications?page=${currentPage}&limit=20`,
        { headers }
      );
      const data: NotificationListResponse = await res.json();

      if (!data.success) {
        setError("알림을 불러올 수 없습니다.");
        return;
      }

      setItems(data.data.items);
      setPagination(data.data.pagination);
      setUnreadCount(data.data.unreadCount);
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers,
      });
      const data = await res.json();

      if (!data.success) {
        return;
      }

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, isRead: true } : it))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // no-op
    }
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
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>🔔</span>
        <span>알림</span>
        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          ({unreadCount})
        </span>
      </h1>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">알림이 없습니다.</div>
        ) : (
          items.map((item) => (
            <NotificationItem key={item.id} item={item} onClick={handleRead} />
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.currentPage <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
            ◀
          </button>

          <div className="text-sm text-gray-600">
            {pagination.currentPage} / {pagination.totalPages}
          </div>

          <button
            type="button"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={pagination.currentPage >= pagination.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
