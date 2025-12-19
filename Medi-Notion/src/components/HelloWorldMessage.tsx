import React from 'react';

/**
 * 정적 Hello World 메시지 컴포넌트
 */
export const HelloWorldMessage: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        🌍 Hello, World! 🌍
      </h1>
      <p className="text-lg text-gray-600">
        Welcome to our Hello World application
      </p>
    </div>
  );
};