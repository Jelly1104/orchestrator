import React from "react";
import "./ActiveUserDashboard.css";

type KpiCard = {
  title: string;
  value: string;
  helper?: string;
  status?: "positive" | "neutral";
};

type UserTypeRow = {
  code: string;
  name: string;
  count: string;
  ratio: string;
  period: string;
};

const kpiCards: KpiCard[] = [
  { title: "전체 사용자", value: "203,914명", helper: "+2.1% (전월 대비)", status: "positive" },
  { title: "활성 사용자", value: "?", helper: "데이터 연동 필요", status: "neutral" },
  { title: "신규 가입자", value: "408명/월" },
  { title: "전월 대비", value: "+2.1%" },
];

const userTypeTable: UserTypeRow[] = [
  { code: "UKD001", name: "의사", count: "128,356", ratio: "63.0%", period: "2020-01 ~ 2025-12" },
  { code: "...", name: "...", count: "...", ratio: "...", period: "..." },
];

const CardShell: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <div className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}>
    {children}
  </div>
);

const KpiCard: React.FC<KpiCard> = ({ title, value, helper, status = "neutral" }) => (
  <CardShell className="flex flex-col gap-1">
    <span className="text-sm text-slate-500">{title}</span>
    <span className="text-3xl font-semibold leading-tight text-slate-900">{value}</span>
    {helper ? (
      <span
        className={`text-xs ${
          status === "positive" ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {helper}
      </span>
    ) : null}
  </CardShell>
);

const ChartPlaceholder: React.FC<{ title: string; label: string }> = ({ title, label }) => (
  <CardShell className="h-72 space-y-3">
    <div className="text-sm font-semibold text-slate-900">{title}</div>
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
      {label}
    </div>
  </CardShell>
);

const DataTable: React.FC = () => (
  <CardShell className="space-y-3">
    <div className="text-sm font-semibold text-slate-900">사용자 유형 테이블</div>
    <div className="overflow-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-100 text-left text-slate-700">
          <tr>
            <th className="px-3 py-2 font-medium">유형</th>
            <th className="px-3 py-2 font-medium">유형명</th>
            <th className="px-3 py-2 font-medium">사용자수</th>
            <th className="px-3 py-2 font-medium">비율</th>
            <th className="px-3 py-2 font-medium">등록일 범위</th>
          </tr>
        </thead>
        <tbody>
          {userTypeTable.map((row) => (
            <tr key={row.code} className="border-t border-slate-200">
              <td className="px-3 py-2 text-slate-800">{row.code}</td>
              <td className="px-3 py-2 text-slate-800">{row.name}</td>
              <td className="px-3 py-2 text-slate-800">{row.count}</td>
              <td className="px-3 py-2 text-slate-800">{row.ratio}</td>
              <td className="px-3 py-2 text-slate-800">{row.period}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </CardShell>
);

const ActiveUserDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <CardShell className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">관리자 &gt; 사용자 관리 &gt; 활성 사용자 현황 대시보드</div>
        <div className="text-xs font-semibold text-emerald-600">업데이트: 실시간</div>
      </CardShell>

      <section aria-label="KPI Cards" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </section>

      <section aria-label="Charts" className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartPlaceholder title="월별 신규 가입자 추이" label="Line Chart Placeholder" />
        <ChartPlaceholder title="유형별 사용자 분포" label="Pie Chart Placeholder" />
      </section>

      <section aria-label="Data Table" className="mt-4">
        <DataTable />
      </section>
    </div>
  );
};

export default ActiveUserDashboard;
