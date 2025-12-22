import { DashboardStats, MemberListItem, ApiResponse } from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>('/dashboard/stats');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return response.data;
  }

  async getMembers(page: number = 1, limit: number = 10, search?: string): Promise<ApiResponse<MemberListItem[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    
    return this.request<MemberListItem[]>(`/members?${params}`);
  }
}

export const apiService = new ApiService();