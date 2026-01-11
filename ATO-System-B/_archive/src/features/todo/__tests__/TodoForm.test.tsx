import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodoForm } from '../components/TodoForm';

describe('TodoForm', () => {
  it('할일 입력 후 제출하면 onSubmit이 호출되어야 한다', async () => {
    // Arrange
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TodoForm onSubmit={mockOnSubmit} />);

    // Act
    const input = screen.getByPlaceholderText('할일을 입력하세요');
    const button = screen.getByText('추가');

    fireEvent.change(input, { target: { value: '테스트 할일' } });
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('테스트 할일');
    });
  });

  it('빈 입력으로는 제출할 수 없어야 한다', () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<TodoForm onSubmit={mockOnSubmit} />);

    // Act
    const button = screen.getByText('추가');
    fireEvent.click(button);

    // Assert
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('로딩 중일 때 입력과 버튼이 비활성화되어야 한다', () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<TodoForm onSubmit={mockOnSubmit} loading={true} />);

    // Assert
    const input = screen.getByPlaceholderText('할일을 입력하세요');
    const button = screen.getByText('추가중...');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });
});