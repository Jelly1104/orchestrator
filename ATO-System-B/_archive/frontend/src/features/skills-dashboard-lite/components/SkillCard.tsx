import React from "react";
import type { SkillCardProps, SkillStatus, StatusBadgeProps } from "../types";

/**
 * 상태별 스타일 매핑
 * @description SDD.md 섹션 6.1 스타일 규칙 기반
 */
const statusStyles: Record<SkillStatus, { dot: string; text: string }> = {
  active: { dot: "bg-green-500", text: "text-green-700" },
  inactive: { dot: "bg-gray-400", text: "text-gray-500" },
};

/**
 * StatusBadge 컴포넌트
 * @description 상태를 표시하는 뱃지 컴포넌트
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{status}</span>
    </span>
  );
};

/**
 * SkillCard 컴포넌트
 * @description 개별 Skill 정보를 카드 형태로 표시
 */
export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  const { name, version, status, description } = skill;

  return (
    <article className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* Header: name + StatusBadge */}
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <StatusBadge status={status} />
      </header>

      {/* Version */}
      <div className="mb-2">
        <span className="text-sm font-mono text-gray-600">v{version}</span>
      </div>

      {/* Description */}
      <footer>
        <p className="text-sm text-gray-500">{description}</p>
      </footer>
    </article>
  );
};
