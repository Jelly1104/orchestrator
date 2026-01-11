import React, { useState } from 'react';
import TodoInput from './TodoInput';
import TodoList from './TodoList';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [inputValue, setInputValue] = useState('');

  // 할 일 추가
  const addTodo = (text) => {
    if (!text.trim()) {
      return; // 빈 입력값 방지
    }

    const newTodo = {
      id: nextId,
      text: text.trim(),
      createdAt: new Date()
    };

    setTodos(prevTodos => [...prevTodos, newTodo]);
    setNextId(prevId => prevId + 1);
    setInputValue('');
  };

  // 할 일 삭제
  const deleteTodo = (id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  // 입력값 변경
  const handleInputChange = (value) => {
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
}

export default App;