import React from 'react';

function TodoItem({ todo, onDelete }) {
  const handleDelete = () => {
    onDelete(todo.id);
  };

  return (
    <li className="todo-item" role="listitem">
      <div className="todo-item-content">
        <span className="todo-item-text" title={`생성일: ${todo.createdAt.toLocaleString()}`}>
          {todo.text}
        </span>
        <button
          onClick={handleDelete}
          className="todo-delete-button"
          aria-label={`"${todo.text}" 할 일 삭제`}
          type="button"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

export default TodoItem;