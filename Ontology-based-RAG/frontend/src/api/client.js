import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const weatherAPI = {
  // Get heatwave data for specific region
  getHeatwaveData: async (regionCode, days = 7) => {
    const response = await apiClient.get('/api/heatwave/data', {
      params: { region: regionCode, days }
    });
    return response.data;
  },

  // Get all regions statistics
  getAllRegions: async () => {
    const response = await apiClient.get('/api/heatwave/regions');
    return response.data;
  },

  // Get risk level for specific region
  getRiskLevel: async (regionCode) => {
    const response = await apiClient.get('/api/risk/level', {
      params: { region: regionCode }
    });
    return response.data;
  },

  // Get dashboard data
  getDashboard: async () => {
    const response = await apiClient.get('/api/risk/dashboard');
    return response.data;
  },
};

export const ragAPI = {
  // Query RAG
  query: async (question, mode = 'hybrid') => {
    const response = await apiClient.post('/api/rag/query', {
      question,
      mode
    });
    return response.data;
  },

  // Analyze region with RAG
  analyzeRegion: async (regionCode) => {
    const response = await apiClient.post('/api/rag/analyze', null, {
      params: { region_code: regionCode }
    });
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (riskLevel) => {
    const response = await apiClient.get('/api/rag/recommendations', {
      params: { risk_level: riskLevel }
    });
    return response.data;
  },
};

export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
