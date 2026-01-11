import React, { useState, useEffect } from 'react';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import { useTodos } from '../hooks/useTodos';

export const TodoApp: React.FC = () => {
  const { 
    todos, 
    loading, 
    error, 
    addTodo, 
    deleteTodo, 
    refreshTodos 
  } = useTodos();

  useEffect(() => {
    refreshTodos();
  }, [refreshTodos]);

  const handleAddTodo = async (content: string) => {
    const success = await addTodo(content);
    if (success) {
      // 성공 시 목록 자동 새로고침
      await refreshTodos();
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    const success = await deleteTodo(todoId);
    if (success) {
      // 성공 시 목록 자동 새로고침
      await refreshTodos();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Todo List App</h1>
        </div>
        
        <div className="p-6">
          <TodoForm onSubmit={handleAddTodo} loading={loading} />
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          <TodoList 
            todos={todos} 
            onDelete={handleDeleteTodo}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};