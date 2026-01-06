import React from "react";
import { SkillCard } from "./components/SkillCard";
import { SKILLS_DATA } from "./types";

/**
 * SkillsDashboard 컴포넌트
 *
 * @description 7개 Skills의 현황을 카드 그리드로 표시
 * @returns {JSX.Element} 대시보드 UI
 */
export const SkillsDashboard: React.FC = () => {
  const activeCount = SKILLS_DATA.filter((s) => s.status === "active").length;
  const inactiveCount = SKILLS_DATA.filter((s) => s.status === "inactive").length;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <h1 className="text-2xl font-bold text-gray-900">Skill Dashboard</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </header>

      {/* Skills Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SKILLS_DATA.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-8 p-4 bg-gray-100 rounded-lg text-center text-gray-700">
        Total: {SKILLS_DATA.length} Skills | Active: {activeCount} | Inactive: {inactiveCount}
      </footer>
    </main>
  );
};
