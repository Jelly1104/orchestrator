import React from "react";
import type { NavItem, PageView } from "../types";

interface NavBarProps {
  items: NavItem[];
  active: PageView;
  onChange: (view: PageView) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ items, active, onChange }) => {
  return (
    <nav className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm mb-6">
      <div className="font-semibold text-gray-900">Skills</div>
      <div className="flex items-center gap-2">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
