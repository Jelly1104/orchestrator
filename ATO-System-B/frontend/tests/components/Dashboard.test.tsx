import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../../src/components/Dashboard';
import { apiService } from '../../src/services/api.service';

// Mock API service
vi.mock('../../src/services/api.service');

describe('Dashboard Component', () => {
  const mockStats = {
    totalUsers: 20000,
    activeUsers: 15000,
    totalPosts: 337000,
    todayPosts: 150,
    totalComments: 1826000,
    todayComments: 89
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('통계 데이터를 올바르게 표시해야 한다', async () => {
    // Arrange
    vi.mocked(apiService.getDashboardStats).mockResolvedValueOnce(mockStats);

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('20,000')).toBeInTheDocument(); // 총 회원수
      expect(screen.getByText('15,000')).toBeInTheDocument(); // 활성 회원수
      expect(screen.getByText('337,000')).toBeInTheDocument(); // 총 게시글수
      expect(screen.getByText('150')).toBeInTheDocument(); // 오늘 게시글수
    });
  });

  it('API 오류 시 에러 메시지를 표시해야 한다', async () => {
    // Arrange
    vi.mocked(apiService.getDashboardStats).mockRejectedValueOnce(new Error('API Error'));

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
    });
  });

  it('로딩 중에는 스켈레톤을 표시해야 한다', () => {
    // Arrange
    vi.mocked(apiService.getDashboardStats).mockImplementation(() => new Promise(() => {})); // 무한 대기

    // Act
    render(<Dashboard />);

    // Assert
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });
});