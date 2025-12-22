import React from 'react';
import { ApiTestButtonProps } from '../types/components';
import { ApiResponse } from '../types/api';

/**
 * API 테스트 버튼 컴포넌트
 */
export const ApiTestButton: React.FC<ApiTestButtonProps> = ({ 
  onApiCall, 
  loading = false 
}) => {
  const handleApiCall = async () => {
    if (loading) return;

    try {
      const response = await fetch('/api/hello', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      onApiCall(data);
    } catch (error) {
      console.error('API 호출 에러:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Test API</h3>
      <button
        onClick={handleApiCall}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? 'Loading...' : 'Call API'}
      </button>
    </div>
  );
};