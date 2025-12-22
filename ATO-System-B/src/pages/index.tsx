import React, { useState } from 'react';
import { HelloWorldMessage } from '../components/HelloWorldMessage';
import { ApiTestButton } from '../components/ApiTestButton';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { AppState } from '../types/components';
import { ApiResponse } from '../types/api';

/**
 * 홈 페이지 컴포넌트
 */
const HomePage: React.FC = () => {
  const [state, setState] = useState<AppState>({
    apiResponse: null,
    isLoading: false,
    error: null
  });

  const handleApiCall = async (response: ApiResponse) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // ApiTestButton에서 이미 API 호출을 완료했으므로 결과만 저장
      setState({
        apiResponse: response,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Hello World App
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <HelloWorldMessage />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* API 테스트 버튼 영역 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <ApiTestButton 
              onApiCall={handleApiCall}
              loading={state.isLoading}
            />
          </div>

          {/* 응답 표시 영역 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <ResponseDisplay
              response={state.apiResponse}
              loading={state.isLoading}
              error={state.error}
            />
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-600">
            Powered by Medigate C&C
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;