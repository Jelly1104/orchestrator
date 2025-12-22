import { useState } from 'react'
import './RiskDashboard.css'

function RiskDashboard({ data, onRegionSelect, selectedRegion }) {
  if (!data || !data.success) {
    return (
      <div className="risk-dashboard">
        <h2>🌡️ 전국 폭염 위험도</h2>
        <p className="no-data">데이터를 불러올 수 없습니다</p>
      </div>
    )
  }

  const { dashboard, total_regions, high_risk_count } = data

  const getRiskColor = (color) => {
    const colors = {
      red: '#FF4444',
      orange: '#FF8C00',
      yellow: '#FFD700',
      green: '#4CAF50'
    }
    return colors[color] || '#999'
  }

  const handleRegionClick = (region) => {
    onRegionSelect(region)
  }

  return (
    <div className="risk-dashboard">
      <h2>🌡️ 전국 폭염 위험도</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-label">전체 지역</span>
          <span className="stat-value">{total_regions}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">고위험 지역</span>
          <span className="stat-value">{high_risk_count}</span>
        </div>
      </div>

      <div className="regions-list">
        {dashboard && dashboard.map((region) => (
          <div
            key={region.region_code}
            className={`region-card ${selectedRegion?.region_code === region.region_code ? 'selected' : ''}`}
            onClick={() => handleRegionClick(region)}
          >
            <div className="region-header">
              <h3>{region.region_name}</h3>
              <span
                className="risk-badge"
                style={{ backgroundColor: getRiskColor(region.color) }}
              >
                {region.risk_level}
              </span>
            </div>

            <div className="region-stats">
              <div className="stat">
                <span className="stat-icon">🌡️</span>
                <span className="stat-text">{region.max_temperature}°C</span>
              </div>
              <div className="stat">
                <span className="stat-icon">🔥</span>
                <span className="stat-text">{region.heatwave_days}일</span>
              </div>
              <div className="stat">
                <span className="stat-icon">📊</span>
                <span className="stat-text">{region.risk_score}점</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RiskDashboard
