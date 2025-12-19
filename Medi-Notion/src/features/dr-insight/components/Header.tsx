/**
 * Dr Insight - Header
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import React from "react";
import type { InsightUser } from "../types";

type HeaderProps = {
  user: InsightUser;
  onShareClick?: () => void;
};

export const Header: React.FC<HeaderProps> = ({ user, onShareClick }) => {
  return (
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-gray-900">Dr. Insight 2025</div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600" aria-label="user-nickname">
            {user.name}
          </div>
          <button
            type="button"
            onClick={onShareClick}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">
            공유하기
          </button>
        </div>
      </div>
    </header>
  );
};
