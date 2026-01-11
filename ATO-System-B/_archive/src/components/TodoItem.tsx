import React from 'react';
import type { TodoItemProps } from '../types/todo.types';

const TodoItem: React.FC<TodoItemProps> = ({ todo, onDelete }) => {
  // 삭제 버튼 클릭 처리
  const handleDeleteClick = (): void => {
    onDelete(todo.id);
  };

  // 생성 시간 포맷팅
  const formatCreatedAt = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="todo-item" role="listitem">
      <div className="todo-content">
        <span className="todo-text">{todo.text}</span>
        <span className="todo-created-at">
          {formatCreatedAt(todo.createdAt)}
        </span>
      </div>
      
      <button
        className="delete-button"
        onClick={handleDeleteClick}
        aria-label={`${todo.text} 삭제`}
      >
        삭제
      </button>
    </div>
  );
};

export default TodoItem;