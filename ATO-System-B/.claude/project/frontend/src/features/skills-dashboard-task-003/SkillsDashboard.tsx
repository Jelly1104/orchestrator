import React, { useMemo, useState } from "react";
import { CATEGORIES, PREFERENCES, SKILLS } from "./data";
import { NavBar } from "./components/NavBar";
import { SkillCard } from "./components/SkillCard";
import { SkillDetail } from "./components/SkillDetail";
import { CategoryList } from "./components/CategoryList";
import { PreferencesPanel } from "./components/PreferencesPanel";
import type { PageView, Skill } from "./types";

const NAV_ITEMS: { id: PageView; label: string }[] = [
  { id: "overview", label: "목록" },
  { id: "details", label: "세부정보" },
  { id: "categories", label: "카테고리" },
  { id: "settings", label: "설정" },
];

export const SkillsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<PageView>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(SKILLS[0]?.id ?? null);

  const selectedSkill = useMemo<Skill | undefined>(
    () => SKILLS.find((skill) => skill.id === selectedId),
    [selectedId]
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">/skills</p>
          <h1 className="text-2xl font-bold text-gray-900">Skills Dashboard</h1>
        </div>
      </header>

      {/* Navigation */}
      <NavBar items={NAV_ITEMS} active={activeView} onChange={setActiveView} />

      {/* Content Views */}
      {activeView === "overview" && (
        <section aria-label="Skills overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILLS.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onSelect={(id) => setSelectedId(id)} />
          ))}
        </section>
      )}

      {activeView === "details" && (
        <section aria-label="Skill details" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkillDetail skill={selectedSkill} />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Skills</h3>
              <div className="space-y-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedId(skill.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm font-medium ${
                      selectedId === skill.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeView === "categories" && (
        <section aria-label="Categories" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryList categories={CATEGORIES} />
          <SkillDetail skill={selectedSkill} />
        </section>
      )}

      {activeView === "settings" && (
        <section aria-label="Preferences" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PreferencesPanel preferences={PREFERENCES} />
          <SkillDetail skill={selectedSkill} />
        </section>
      )}
    </main>
  );
};
