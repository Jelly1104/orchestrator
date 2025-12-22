import './HeatwaveMap.css'

function HeatwaveMap({ data, selectedRegion, onRegionSelect }) {
  if (!data || !data.success) {
    return (
      <div className="heatwave-map">
        <h2>🗺️ 지역별 폭염 지도</h2>
        <p className="no-data">데이터를 불러올 수 없습니다</p>
      </div>
    )
  }

  const { dashboard } = data

  const getRiskColor = (color) => {
    const colors = {
      red: '#FF4444',
      orange: '#FF8C00',
      yellow: '#FFD700',
      green: '#4CAF50'
    }
    return colors[color] || '#999'
  }

  const getGradient = (riskLevel) => {
    const gradients = {
      '매우 높음': 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)',
      '높음': 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
      '보통': 'linear-gradient(135deg, #FFD700 0%, #FFB700 100%)',
      '낮음': 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
    }
    return gradients[riskLevel] || 'linear-gradient(135deg, #999 0%, #666 100%)'
  }

  const sortedRegions = dashboard ? [...dashboard].sort((a, b) => b.risk_score - a.risk_score) : []

  return (
    <div className="heatwave-map">
      <h2>🗺️ 지역별 폭염 지도</h2>

      {selectedRegion && (
        <div className="selected-region-info">
          <div className="info-header">
            <h3>{selectedRegion.region_name}</h3>
            <span
              className="risk-badge"
              style={{ backgroundColor: getRiskColor(selectedRegion.color) }}
            >
              {selectedRegion.risk_level}
            </span>
          </div>

          <div className="info-details">
            <div className="detail-item">
              <span className="label">최고 기온</span>
              <span className="value">{selectedRegion.max_temperature}°C</span>
            </div>
            <div className="detail-item">
              <span className="label">폭염 일수</span>
              <span className="value">{selectedRegion.heatwave_days}일</span>
            </div>
            <div className="detail-item">
              <span className="label">위험 점수</span>
              <span className="value">{selectedRegion.risk_score}/100</span>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${selectedRegion.risk_score}%`,
                background: getGradient(selectedRegion.risk_level)
              }}
            ></div>
          </div>
        </div>
      )}

      <div className="regions-grid">
        {sortedRegions.map((region) => (
          <div
            key={region.region_code}
            className={`region-tile ${selectedRegion?.region_code === region.region_code ? 'selected' : ''}`}
            style={{
              background: getGradient(region.risk_level),
              opacity: selectedRegion && selectedRegion.region_code !== region.region_code ? 0.6 : 1
            }}
            onClick={() => onRegionSelect(region)}
          >
            <div className="region-name">{region.region_name}</div>
            <div className="region-temp">{region.max_temperature}°C</div>
            <div className="region-score">{region.risk_score}점</div>
          </div>
        ))}
      </div>

      <div className="legend">
        <h4>위험도 범례</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#FF4444' }}></div>
            <span>매우 높음 (80+)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#FF8C00' }}></div>
            <span>높음 (60-79)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#FFD700' }}></div>
            <span>보통 (40-59)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#4CAF50' }}></div>
            <span>낮음 (0-39)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeatwaveMap
