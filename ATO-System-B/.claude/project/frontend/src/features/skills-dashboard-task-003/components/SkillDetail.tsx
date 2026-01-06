import React from "react";
import { StatusBadge } from "./StatusBadge";
import type { Skill } from "../types";

interface SkillDetailProps {
  skill?: Skill;
}

export const SkillDetail: React.FC<SkillDetailProps> = ({ skill }) => {
  if (!skill) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-600">
        상세 정보를 보려면 스킬 카드를 선택하세요.
      </div>
    );
  }

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{skill.category}</p>
          <h2 className="text-2xl font-bold text-gray-900">{skill.name}</h2>
        </div>
        <StatusBadge status={skill.status} />
      </header>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-gray-500">버전</dt>
          <dd className="text-lg font-mono text-gray-900">v{skill.version}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">상태</dt>
          <dd className="text-base text-gray-900 capitalize">{skill.status}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-gray-500">설명</dt>
          <dd className="text-base text-gray-800 leading-relaxed">{skill.description}</dd>
        </div>
      </dl>
    </article>
  );
};
