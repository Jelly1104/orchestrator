import React from 'react';
import { TodoItem } from './TodoItem';
import { TodoResponse } from '../../../shared/types/todo.dto';

interface TodoListProps {
  todos: TodoResponse[];
  onDelete: (todoId: number) => Promise<void>;
  loading: boolean;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>아직 할일이 없습니다.</p>
        <p className="text-sm">위에서 새로운 할일을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.todo_id}
          todo={todo}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};