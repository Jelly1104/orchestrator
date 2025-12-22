import React from 'react';
import { ResponseDisplayProps } from '../types/components';

/**
 * API 응답 표시 컴포넌트
 */
export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  response,
  loading,
  error
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">API 호출 중...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">에러 발생</h4>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      );
    }

    if (response) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <h4 className="text-green-800 font-medium">API 응답</h4>
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium text-gray-700">Message: </span>
              <span className="text-gray-600">{response.message}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Timestamp: </span>
              <span className="text-gray-600">{response.timestamp}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Version: </span>
              <span className="text-gray-600">{response.version}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-gray-500">
        API response will appear here
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 text-center">
        Response Area
      </h3>
      <div className="min-h-[200px] border border-gray-200 rounded-lg p-4">
        {renderContent()}
      </div>
    </div>
  );
};