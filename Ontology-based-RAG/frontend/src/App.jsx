import { useState, useEffect } from 'react'
import RiskDashboard from './components/RiskDashboard'
import HeatwaveMap from './components/HeatwaveMap'
import RAGChat from './components/RAGChat'
import { weatherAPI, healthCheck } from './api/client'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [apiStatus, setApiStatus] = useState(null)

  useEffect(() => {
    checkAPIStatus()
    loadDashboard()
  }, [])

  const checkAPIStatus = async () => {
    try {
      const status = await healthCheck()
      setApiStatus(status)
    } catch (error) {
      console.error('API health check failed:', error)
      setApiStatus({ status: 'error', message: error.message })
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await weatherAPI.getDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegionSelect = (region) => {
    setSelectedRegion(region)
  }

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌡️ 폭염 위험 동네 대시보드</h1>
        <p>LightRAG 기반 실시간 폭염 위험 분석</p>
        {apiStatus && (
          <div className={`api-status ${apiStatus.status}`}>
            Weather API: {apiStatus.weather_api ? '✓' : '✗'} |
            RAG Service: {apiStatus.rag_service ? '✓' : '✗'}
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="dashboard-container">
          <RiskDashboard
            data={dashboardData}
            onRegionSelect={handleRegionSelect}
            selectedRegion={selectedRegion}
          />
        </div>

        <div className="map-container">
          <HeatwaveMap
            data={dashboardData}
            selectedRegion={selectedRegion}
            onRegionSelect={handleRegionSelect}
          />
        </div>

        {selectedRegion && (
          <div className="rag-chat-container">
            <RAGChat regionData={selectedRegion} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>데이터 출처: 기상청 기후정보포털 | Powered by LightRAG</p>
        <button onClick={loadDashboard} className="refresh-button">
          🔄 새로고침
        </button>
      </footer>
    </div>
  )
}

export default App
