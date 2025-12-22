import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from '../components/TodoList';

describe('TodoList 컴포넌트', () => {
  const mockOnDelete = jest.fn();

  const mockTodos = [
    { id: 1, text: '할 일 1', createdAt: new Date('2023-01-01') },
    { id: 2, text: '할 일 2', createdAt: new Date('2023-01-02') }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('할 일이 없을 때 빈 상태 메시지를 보여줘야 한다', () => {
    render(<TodoList todos={[]} onDeleteTodo={mockOnDelete} />);
    
    expect(screen.getByText('등록된 할 일이 없습니다.')).toBeInTheDocument();
  });

  test('할 일 목록을 올바르게 렌더링해야 한다', () => {
    render(<TodoList todos={mockTodos} onDeleteTodo={mockOnDelete} />);
    
    expect(screen.getByText('할 일 1')).toBeInTheDocument();
    expect(screen.getByText('할 일 2')).toBeInTheDocument();
  });

  test('할 일 개수만큼 TodoItem이 렌더링되어야 한다', () => {
    render(<TodoList todos={mockTodos} onDeleteTodo={mockOnDelete} />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });
});