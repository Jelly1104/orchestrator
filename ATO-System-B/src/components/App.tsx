import React, { useState } from 'react';
import TodoInput from './TodoInput';
import TodoList from './TodoList';
import type { Todo } from '../types/todo.types';
import './App.css';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [nextId, setNextId] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('');

  // 할 일 추가
  const addTodo = (text: string): void => {
    if (!text.trim()) {
      return; // 빈 입력값으로는 추가 불가
    }

    const newTodo: Todo = {
      id: nextId,
      text: text.trim(),
      createdAt: new Date()
    };

    setTodos(prevTodos => [...prevTodos, newTodo]);
    setNextId(prevId => prevId + 1);
    setInputValue(''); // 입력창 초기화
  };

  // 할 일 삭제
  const deleteTodo = (id: number): void => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  // 입력값 변경
  const handleInputChange = (value: string): void => {
    setInputValue(value);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>할 일 관리</h1>
      </header>
      
      <main className="app-main">
        <TodoInput
          onAddTodo={addTodo}
          inputValue={inputValue}
          onInputChange={handleInputChange}
        />
        
        <TodoList
          todos={todos}
          onDeleteTodo={deleteTodo}
        />
      </main>
    </div>
  );
};

export default App;