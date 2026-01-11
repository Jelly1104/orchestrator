import React from "react";
import type { SkillCardProps, SkillStatus, StatusBadgeProps } from "../types";

/**
 * 상태별 스타일 매핑
 * @description SDD.md 섹션 3.3 스타일 매핑 기반
 */
const statusStyles: Record<SkillStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-500",
};

/**
 * StatusBadge 컴포넌트
 *
 * @description 상태를 표시하는 뱃지 컴포넌트
 * @param {StatusBadgeProps} props - 상태 값
 * @returns {JSX.Element} 뱃지 UI
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      <span className="mr-1">●</span>
      <span>{status}</span>
    </span>
  );
};

/**
 * SkillCard 컴포넌트
 *
 * @description 개별 Skill 정보를 카드 형태로 표시
 * @param {SkillCardProps} props - Skill 데이터
 * @returns {JSX.Element} 카드 UI
 */
export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  const { name, version, status, description } = skill;

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: name + StatusBadge */}
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <StatusBadge status={status} />
      </header>

      {/* Body: version */}
      <div className="mb-3">
        <span className="text-xl font-mono text-gray-700">v{version}</span>
      </div>

      {/* Footer: description */}
      <footer>
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
      </footer>
    </article>
  );
};
