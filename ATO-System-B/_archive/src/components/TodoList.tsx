import React from 'react';
import TodoItem from './TodoItem';
import type { TodoListProps } from '../types/todo.types';

const TodoList: React.FC<TodoListProps> = ({ todos, onDeleteTodo }) => {
  if (todos.length === 0) {
    return (
      <div className="empty-list">
        <p>할 일이 없습니다. 새로운 할 일을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <div className="todo-list" role="list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDeleteTodo}
        />
      ))}
    </div>
  );
};

export default TodoList;