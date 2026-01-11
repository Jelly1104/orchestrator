import React, { useState } from 'react';

interface TodoFormProps {
  onSubmit: (content: string) => Promise<void>;
  loading: boolean;
}

export const TodoForm: React.FC<TodoFormProps> = ({ onSubmit, loading }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('할일 내용을 입력해주세요.');
      return;
    }

    if (content.length > 500) {
      alert('할일 내용은 500자를 초과할 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent(''); // 성공 시 입력창 초기화
    } catch (error) {
      console.error('투두 추가 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <div className="flex-1">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="할일을 입력하세요..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={500}
          disabled={loading || isSubmitting}
        />
        {content.length > 400 && (
          <p className="text-sm text-gray-500 mt-1">
            {content.length}/500자
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || isSubmitting || !content.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '추가중...' : '추가'}
      </button>
    </form>
  );
};