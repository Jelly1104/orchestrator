import React from 'react';

function TodoInput({ onAddTodo, inputValue, onInputChange }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTodo(inputValue);
  };

  const handleInputChange = (e) => {
    onInputChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="todo-input">
      <form onSubmit={handleSubmit} className="todo-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="새 할 일을 입력하세요"
          className="todo-input-field"
          aria-label="새 할 일 입력"
        />
        <button
          type="submit"
          className="todo-add-button"
          disabled={!inputValue.trim()}
          aria-label="할 일 추가"
        >
          추가
        </button>
      </form>
    </div>
  );
}

export default TodoInput;