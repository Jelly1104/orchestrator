import React, { useState, useEffect } from 'react';

const DashboardView: React.FC = () => {
  const [charts, setCharts] = useState([]);
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/dashboard/charts');
        const data = await response.json();
        setCharts(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/dashboard/filters');
        const data = await response.json();
        setFilters(data);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchChartData();
    fetchFilterOptions();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="filter-section">
        {filters.map(filter => (
          <div key={filter.id}>
            <label>{filter.name}</label>
            <select>
              {filter.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="chart-section">
        {charts.map(chart => (
          <div key={chart.id} className="chart">
            <h3>{chart.title}</h3>
            {/* 차트 렌더링 로직 (예: Chart.js, ApexCharts 등 라이브러리 사용) */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;