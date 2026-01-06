import React from "react";
import type { SkillStatus } from "../types";

const STATUS_STYLES: Record<SkillStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-500",
};

interface StatusBadgeProps {
  status: SkillStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
      aria-label={`status-${status}`}
    >
      <span className="mr-1">●</span>
      <span className="capitalize">{status}</span>
    </span>
  );
};
