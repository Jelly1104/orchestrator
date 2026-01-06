import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Users, CheckCircle, TrendingUp, Bell, User, ChevronLeft, ChevronRight, Search, Download, ArrowLeft, Filter } from 'lucide-react';

// ==================== Mock Data ====================
const kpiData = {
  totalMembers: { value: 520340, trend: 2.1, direction: 'up' },
  activeMembers: { value: 312204, trend: 5.2, direction: 'up' },
  monthlyLogins: { value: 58234, trend: -1.8, direction: 'down' }
};

const distributionData = [
  { name: '내과', value: 45, count: 234153 },
  { name: '외과', value: 35, count: 182119 },
  { name: '소아과', value: 28, count: 145695 },
  { name: '정형외과', value: 20, count: 104068 },
  { name: '기타', value: 15, count: 78051 }
];

const loginTrendData = [
  { date: '12/01', logins: 1850 },
  { date: '12/04', logins: 2100 },
  { date: '12/07', logins: 2450 },
  { date: '12/10', logins: 2200 },
  { date: '12/14', logins: 1950 },
  { date: '12/17', logins: 2300 },
  { date: '12/21', logins: 2650 },
  { date: '12/24', logins: 1800 }
];

const segmentData = [
  { type: '의사', total: 320000, active: 192000, rate: 60, trend: 3.2, direction: 'up' },
  { type: '약사', total: 150000, active: 90000, rate: 60, trend: 2.1, direction: 'up' },
  { type: '간호사', total: 50340, active: 30204, rate: 60, trend: -0.5, direction: 'down' }
];

const pieData = [
  { name: '활성', value: 60, color: '#10b981' },
  { name: '비활성', value: 40, color: '#f43f5e' }
];

const hourlyData = [
  { hour: '09시', logins: 1200 },
  { hour: '12시', logins: 2100 },
  { hour: '15시', logins: 1800 },
  { hour: '18시', logins: 1400 },
  { hour: '21시', logins: 800 }
];

const weeklyData = [
  { day: '월', logins: 2340 },
  { day: '화', logins: 2890 },
  { day: '수', logins: 2560 },
  { day: '목', logins: 2340 },
  { day: '금', logins: 2100 },
  { day: '토', logins: 890 },
  { day: '일', logins: 650 }
];

const monthlyData = [
  { month: '1월', signups: 4200 },
  { month: '3월', signups: 5100 },
  { month: '5월', signups: 4800 },
  { month: '7월', signups: 5500 },
  { month: '9월', signups: 4900 },
  { month: '11월', signups: 5200 }
];

const detailTableData = [
  { id: 1001, major: '내과', type: '의사', joinDate: '2023-01', lastLogin: '2024-12', status: 'active' },
  { id: 1002, major: '외과', type: '의사', joinDate: '2022-05', lastLogin: '2024-11', status: 'active' },
  { id: 1003, major: '소아과', type: '간호사', joinDate: '2024-03', lastLogin: '2024-06', status: 'dormant' },
  { id: 1004, major: '정형외과', type: '약사', joinDate: '2021-08', lastLogin: '2023-02', status: 'inactive' }
];

// ==================== Components ====================

// KPI 카드 컴포넌트
function StatCard({ title, value, trend, direction, icon: Icon }) {
  const isUp = direction === 'up';
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <span className="text-sm text-slate-500">{title}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-2">
        {value.toLocaleString()}
      </div>
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
        isUp ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
      }`}>
        {isUp ? '▲' : '▼'} {Math.abs(trend)}%
        <span className="text-slate-400 ml-1">(전월 대비)</span>
      </div>
    </div>
  );
}

// 가로 막대 차트 (전문과목 분포)
function HorizontalBarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-16 text-sm text-slate-600 truncate">{item.name}</span>
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="w-12 text-sm font-medium text-slate-700 text-right">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}

// 세그먼트 테이블
function SegmentTable({ data, currentPage, onPageChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-600">회원유형</th>
            <th className="text-right py-3 px-4 font-medium text-slate-600">전체</th>
            <th className="text-right py-3 px-4 font-medium text-slate-600">활성</th>
            <th className="text-right py-3 px-4 font-medium text-slate-600">활성비율</th>
            <th className="text-right py-3 px-4 font-medium text-slate-600">전월대비</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4 font-medium text-slate-800">{row.type}</td>
              <td className="py-3 px-4 text-right text-slate-600">{row.total.toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-slate-600">{row.active.toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-slate-600">{row.rate}%</td>
              <td className="py-3 px-4 text-right">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  row.direction === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                }`}>
                  {row.direction === 'up' ? '🟢 ▲' : '🟡 ▼'} {Math.abs(row.trend)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {[1, 2, 3].map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded text-sm font-medium ${
              currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === 3}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// 상세 테이블
function DetailTable({ data, searchTerm }) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      row.major.includes(searchTerm) ||
      row.type.includes(searchTerm) ||
      row.id.toString().includes(searchTerm)
    );
  }, [data, searchTerm]);

  const statusConfig = {
    active: { label: '활성', color: 'text-emerald-700 bg-emerald-50', icon: '🟢' },
    dormant: { label: '휴면', color: 'text-amber-700 bg-amber-50', icon: '🟡' },
    inactive: { label: '비활성', color: 'text-rose-700 bg-rose-50', icon: '🔴' }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-600">ID</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">전문과목</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">회원유형</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">가입일</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">최근로그인</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">상태</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, idx) => {
            const status = statusConfig[row.status];
            return (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="py-3 px-4 font-mono text-slate-700">{row.id}</td>
                <td className="py-3 px-4 text-slate-700">{row.major}</td>
                <td className="py-3 px-4 text-slate-700">{row.type}</td>
                <td className="py-3 px-4 text-slate-500">{row.joinDate}</td>
                <td className="py-3 px-4 text-slate-500">{row.lastLogin}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 헤더 컴포넌트
function Header({ title, showBack, onBack }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-slate-100 relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100">
            <User className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
}

// 필터 패널
function FilterPanel({ filters, onFilterChange, onApply, onReset }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-slate-500" />
        <span className="font-medium text-slate-700">필터</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filters.major}
          onChange={(e) => onFilterChange('major', e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전문과목 전체</option>
          <option value="내과">내과</option>
          <option value="외과">외과</option>
          <option value="소아과">소아과</option>
          <option value="정형외과">정형외과</option>
        </select>
        <select
          value={filters.memberType}
          onChange={(e) => onFilterChange('memberType', e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">회원유형 전체</option>
          <option value="의사">의사</option>
          <option value="약사">약사</option>
          <option value="간호사">간호사</option>
        </select>
        <select
          value={filters.period}
          onChange={(e) => onFilterChange('period', e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="30">최근 30일</option>
          <option value="60">최근 60일</option>
          <option value="90">최근 90일</option>
        </select>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            적용
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 메인 대시보드 (SCR-001) ====================
function DashboardPage({ onNavigate }) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="분석 대시보드" />

      <main className="p-6 max-w-7xl mx-auto">
        {/* KPI 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="전체 회원"
            value={kpiData.totalMembers.value}
            trend={kpiData.totalMembers.trend}
            direction={kpiData.totalMembers.direction}
            icon={Users}
          />
          <StatCard
            title="활성 회원"
            value={kpiData.activeMembers.value}
            trend={kpiData.activeMembers.trend}
            direction={kpiData.activeMembers.direction}
            icon={CheckCircle}
          />
          <StatCard
            title="월간 로그인"
            value={kpiData.monthlyLogins.value}
            trend={kpiData.monthlyLogins.trend}
            direction={kpiData.monthlyLogins.direction}
            icon={TrendingUp}
          />
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 전문과목별 분포 */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">전문과목별 회원 분포</h3>
            <HorizontalBarChart data={distributionData} />
            <button
              onClick={() => onNavigate('detail')}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              상세보기 →
            </button>
          </div>

          {/* 로그인 트렌드 */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">로그인 트렌드 (최근 30일)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loginTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => onNavigate('detail')}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              상세보기 →
            </button>
          </div>
        </div>

        {/* 세그먼트 테이블 */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">회원 세그먼트 현황</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <SegmentTable
            data={segmentData}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>
    </div>
  );
}

// ==================== 상세 분석 (SCR-002) ====================
function DetailPage({ onNavigate }) {
  const [filters, setFilters] = useState({ major: '', memberType: '', period: '30' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({ major: '', memberType: '', period: '30' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="상세 분석" showBack onBack={() => onNavigate('dashboard')} />

      <main className="p-6 max-w-7xl mx-auto">
        {/* 필터 패널 */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={() => console.log('Apply filters:', filters)}
          onReset={handleReset}
        />

        {/* 상단 차트 2개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 파이 차트 */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">활성/비활성 비율</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 시간대별 분포 */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">시간대별 로그인 분포</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="logins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 하단 차트 2개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 요일별 패턴 */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">요일별 로그인 패턴</h3>
            <div className="space-y-2">
              {weeklyData.map((item, idx) => {
                const maxLogins = Math.max(...weeklyData.map(d => d.logins));
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-6 text-sm text-slate-600">{item.day}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                        style={{ width: `${(item.logins / maxLogins) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm text-slate-600 text-right">{item.logins.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 월별 추이 */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">월별 가입자 추이</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 상세 테이블 */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">상세 데이터 목록</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          <DetailTable data={detailTableData} searchTerm={searchTerm} />
        </div>
      </main>
    </div>
  );
}

// ==================== 메인 앱 ====================
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentPage === 'detail' && <DetailPage onNavigate={handleNavigate} />}
    </div>
  );
}
