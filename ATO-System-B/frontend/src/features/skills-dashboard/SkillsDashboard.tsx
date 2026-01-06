import React from "react";
import { SkillCard } from "./components/SkillCard";
import type { Skill } from "./types";

/**
 * Static Skills Data
 * @description SDD.md 섹션 3.1 Static Data 기반
 */
const SKILLS_DATA: Skill[] = [
  {
    id: "query",
    name: "Query",
    version: "1.3.0",
    status: "active",
    description: "SQL 쿼리 생성 및 데이터 분석",
  },
  {
    id: "profiler",
    name: "Profiler",
    version: "1.3.0",
    status: "active",
    description: "회원 프로필 분석",
  },
  {
    id: "designer",
    name: "Designer",
    version: "2.3.0",
    status: "active",
    description: "IA/Wireframe/SDD 설계 문서 생성",
  },
  {
    id: "coder",
    name: "Coder",
    version: "1.4.0",
    status: "active",
    description: "SDD 기반 코드 구현",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    version: "1.3.0",
    status: "active",
    description: "산출물 품질 검증",
  },
];

/**
 * SkillsDashboard 컴포넌트
 *
 * @description 5개 Skills의 현황을 카드 그리드로 표시
 * @returns {JSX.Element} 대시보드 UI
 */
export const SkillsDashboard: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Skills Dashboard</h1>
      </header>

      {/* Skills Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SKILLS_DATA.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </section>
    </main>
  );
};
