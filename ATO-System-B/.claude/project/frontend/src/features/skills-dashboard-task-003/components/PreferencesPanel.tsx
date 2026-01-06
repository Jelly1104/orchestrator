import React from "react";
import type { Preference } from "../types";

interface PreferencesPanelProps {
  preferences: Preference[];
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ preferences }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 설정</h3>
      <div className="space-y-4">
        {preferences.map((pref) => (
          <label
            key={pref.key}
            className="flex items-start gap-3 rounded-md border border-gray-100 p-3 hover:border-gray-200 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={pref.enabled}
              readOnly
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">{pref.label}</p>
              <p className="text-sm text-gray-600">{pref.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
