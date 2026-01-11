import React, { useState } from 'react';
import { TodoResponse } from '../../../shared/types/todo.dto';

interface TodoItemProps {
  todo: TodoResponse;
  onDelete: (todoId: number) => Promise<void>;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('이 할일을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(todo.todo_id);
    } catch (error) {
      console.error('투두 삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <p className="text-gray-800 break-words">{todo.content}</p>
        <p className="text-sm text-gray-500 mt-1">
          {formatDate(todo.reg_date)}
        </p>
      </div>
      
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? '삭제중...' : '삭제'}
      </button>
    </div>
  );
};