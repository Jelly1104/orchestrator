import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResponseDisplay } from '../../components/ResponseDisplay';
import { ApiResponse } from '../../types/api';

describe('ResponseDisplay', () => {
  const mockResponse: ApiResponse = {
    message: 'Hello, World!',
    timestamp: '2025-12-16T10:30:00Z',
    version: '1.0.0'
  };

  it('기본 상태에서 안내 메시지를 표시해야 한다', () => {
    render(<ResponseDisplay response={null} loading={false} />);
    
    expect(screen.getByText('API response will appear here')).toBeInTheDocument();
  });

  it('로딩 중일 때 로딩 스피너를 표시해야 한다', () => {
    render(<ResponseDisplay response={null} loading={true} />);
    
    expect(screen.getByText('API 호출 중...')).toBeInTheDocument();
  });

  it('에러가 있을 때 에러 메시지를 표시해야 한다', () => {
    const errorMessage = 'API 호출 실패';
    render(<ResponseDisplay response={null} loading={false} error={errorMessage} />);
    
    expect(screen.getByText('에러 발생')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('응답이 있을 때 응답 데이터를 표시해야 한다', () => {
    render(<ResponseDisplay response={mockResponse} loading={false} />);
    
    expect(screen.getByText('API 응답')).toBeInTheDocument();
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    expect(screen.getByText('2025-12-16T10:30:00Z')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });
});