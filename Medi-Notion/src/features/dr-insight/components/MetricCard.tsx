/**
 * Dr Insight - MetricCard
 * @see docs/case-3-dr-insight/Wireframe.md
 */

import React from "react";

type MetricCardProps = {
  label: string;
  value: number;
  unit?: string;
  description?: string;
};

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  description,
}) => {
  const display = value === 0 ? "0" : formatNumber(value);
  const aria = `${label} ${display}${unit ?? ""}`;

  return (
    <div
      className="bg-white rounded-lg border p-4 shadow-sm"
      aria-label={aria}
      role="group"
      title={description}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{display}</span>
        {unit ? <span className="text-sm text-gray-500">{unit}</span> : null}
      </div>
    </div>
  );
};
