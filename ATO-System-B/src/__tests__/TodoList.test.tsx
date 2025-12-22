import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TodoList from '../components/TodoList';
import type { Todo } from '../types/todo.types';

describe('TodoList Component', () => {
  const mockTodos: Todo[] = [
    { id: 1, text: '첫 번째 할 일', createdAt: new Date('2025-01-01T10:00:00') },
    { id: 2, text: '두 번째 할 일', createdAt: new Date('2025-01-01T11:00:00') }
  ];

  const mockOnDeleteTodo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('할 일 목록이 없을 때 안내 메시지를 표시한다', () => {
    render(<TodoList todos={[]} onDeleteTodo={mockOnDeleteTodo} />);
    
    expect(screen.getByText('할 일이 없습니다. 새로운 할 일을 추가해보세요!')).toBeInTheDocument();
  });

  it('할 일 목록을 올바르게 렌더링한다', () => {
    render(<TodoList todos={mockTodos} onDeleteTodo={mockOnDeleteTodo} />);
    
    expect(screen.getByText('첫 번째 할 일')).toBeInTheDocument();
    expect(screen.getByText('두 번째 할 일')).toBeInTheDocument();
  });

  it('할 일 목록이 리스트 역할을 가진다', () => {
    render(<TodoList todos={mockTodos} onDeleteTodo={mockOnDeleteTodo} />);
    
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});