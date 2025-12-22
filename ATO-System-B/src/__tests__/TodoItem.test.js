import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TodoItem from '../components/TodoItem';

describe('TodoItem 컴포넌트', () => {
  const mockTodo = {
    id: 1,
    text: '테스트 할 일',
    createdAt: new Date('2023-01-01T12:00:00')
  };

  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('할 일 내용을 올바르게 표시해야 한다', () => {
    render(<TodoItem todo={mockTodo} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
  });

  test('삭제 버튼을 올바르게 렌더링해야 한다', () => {
    render(<TodoItem todo={mockTodo} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByLabelText('"테스트 할 일" 할 일 삭제');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('삭제');
  });

  test('삭제 버튼 클릭 시 onDelete가 호출되어야 한다', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={mockTodo} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByLabelText('"테스트 할 일" 할 일 삭제');
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  test('생성 시간이 툴팁으로 표시되어야 한다', () => {
    render(<TodoItem todo={mockTodo} onDelete={mockOnDelete} />);
    
    const todoText = screen.getByText('테스트 할 일');
    expect(todoText).toHaveAttribute('title', expect.stringContaining('생성일:'));
  });
});