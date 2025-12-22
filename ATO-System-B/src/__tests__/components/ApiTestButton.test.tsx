import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiTestButton } from '../../components/ApiTestButton';

// fetch 모킹
global.fetch = jest.fn();

describe('ApiTestButton', () => {
  const mockOnApiCall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('버튼을 렌더링해야 한다', () => {
    render(<ApiTestButton onApiCall={mockOnApiCall} />);
    
    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('Call API')).toBeInTheDocument();
  });

  it('로딩 중일 때 버튼이 비활성화되어야 한다', () => {
    render(<ApiTestButton onApiCall={mockOnApiCall} loading={true} />);
    
    const button = screen.getByText('Loading...');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-gray-400', 'cursor-not-allowed');
  });

  it('API 호출이 성공하면 onApiCall을 호출해야 한다', async () => {
    const mockResponse = {
      message: 'Hello, World!',
      timestamp: '2025-12-16T10:30:00Z',
      version: '1.0.0'
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<ApiTestButton onApiCall={mockOnApiCall} />);
    
    const button = screen.getByText('Call API');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnApiCall).toHaveBeenCalledWith(mockResponse);
    });

    expect(fetch).toHaveBeenCalledWith('/api/hello', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('API 호출이 실패하면 에러를 던져야 한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    render(<ApiTestButton onApiCall={mockOnApiCall} />);
    
    const button = screen.getByText('Call API');
    
    // 에러 처리 테스트를 위해 try-catch로 감싸기
    await expect(async () => {
      fireEvent.click(button);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    }).rejects.toThrow();
  });
});