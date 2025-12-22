import React from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, onDeleteTodo }) {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>등록된 할 일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      <ul className="todo-list-items" role="list">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDelete={onDeleteTodo}
          />
        ))}
      </ul>
    </div>
  );
}

export default TodoList;