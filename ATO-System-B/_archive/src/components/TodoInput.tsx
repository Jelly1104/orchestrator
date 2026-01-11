import React, { KeyboardEvent } from 'react';
import type { TodoInputProps } from '../types/todo.types';

const TodoInput: React.FC<TodoInputProps> = ({
  onAddTodo,
  inputValue,
  onInputChange
}) => {
  // 추가 버튼 클릭 처리
  const handleAddClick = (): void => {
    onAddTodo(inputValue);
  };

  // Enter 키 입력 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      onAddTodo(inputValue);
    }
  };

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onInputChange(e.target.value);
  };

  return (
    <div className="todo-input-container">
      <input
        type="text"
        className="todo-input"
        placeholder="새 할 일을 입력하세요"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        aria-label="새 할 일 입력"
      />
      <button
        className="add-button"
        onClick={handleAddClick}
        disabled={!inputValue.trim()}
        aria-label="할 일 추가"
      >
        추가
      </button>
    </div>
  );
};

export default TodoInput;