/**
 * 알림 아이템 컴포넌트
 * @see docs/case2-notification/Wireframe.md
 */

import React from "react";
import type {
  NotificationListItem,
  NotificationType,
} from "../types/notification";

interface NotificationItemProps {
  item: NotificationListItem;
  onClick?: (id: number) => void;
}

function getTypeIcon(type: NotificationType): string {
  if (type === "NOTICE") return "📢";
  if (type === "EVENT") return "🎉";
  return "⚙️";
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const time = new Date(isoDate).getTime();
  const diffMs = now - time;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "방금 전";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  return `${Math.floor(diffMs / day)}일 전`;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onClick,
}) => {
  const unreadDot = !item.isRead;

  return (
    <button
      type="button"
      onClick={() => onClick?.(item.id)}
      className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 pt-0.5">
          {unreadDot && <span className="text-blue-500">🔵</span>}
          <span className="text-lg">{getTypeIcon(item.type)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-medium text-gray-900 truncate">{item.title}</h2>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {formatRelativeTime(item.regDate)}
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-1 overflow-hidden text-ellipsis line-clamp-2">
            {item.message}
          </p>
        </div>
      </div>
    </button>
  );
};

export default NotificationItem;
