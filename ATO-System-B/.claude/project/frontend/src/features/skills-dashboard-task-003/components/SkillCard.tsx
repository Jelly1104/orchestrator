import React from "react";
import { StatusBadge } from "./StatusBadge";
import type { Skill } from "../types";

interface SkillCardProps {
  skill: Skill;
  onSelect?: (id: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onSelect }) => {
  const handleClick = () => {
    if (onSelect) onSelect(skill.id);
  };

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <header className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{skill.category}</p>
          <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
        </div>
        <StatusBadge status={skill.status} />
      </header>
      <div className="mb-3">
        <span className="text-xl font-mono text-gray-700">v{skill.version}</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>
    </article>
  );
};
