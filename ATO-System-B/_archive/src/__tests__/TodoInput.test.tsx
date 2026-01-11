import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TodoInput from '../components/TodoInput';

describe('TodoInput Component', () => {
  const mockProps = {
    onAddTodo: vi.fn(),
    inputValue: '',
    onInputChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('올바르게 렌더링된다', () => {
    render(<TodoInput {...mockProps} />);
    
    expect(screen.getByPlaceholderText('새 할 일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '할 일 추가' })).toBeInTheDocument();
  });

  it('입력값 변경 시 onInputChange가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TodoInput {...mockProps} />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    await user.type(input, '테스트');
    
    expect(mockProps.onInputChange).toHaveBeenCalledWith('테스트');
  });

  it('추가 버튼 클릭 시 onAddTodo가 호출된다', async () => {
    const user = userEvent.setup();
    const propsWithValue = { ...mockProps, inputValue: '테스트 할 일' };
    render(<TodoInput {...propsWithValue} />);
    
    const addButton = screen.getByRole('button', { name: '할 일 추가' });
    await user.click(addButton);
    
    expect(mockProps.onAddTodo).toHaveBeenCalledWith('테스트 할 일');
  });

  it('Enter 키 입력 시 onAddTodo가 호출된다', async () => {
    const user = userEvent.setup();
    const propsWithValue = { ...mockProps, inputValue: '키보드 할 일' };
    render(<TodoInput {...propsWithValue} />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    await user.keyboard('{Enter}');
    
    expect(mockProps.onAddTodo).toHaveBeenCalledWith('키보드 할 일');
  });

  it('빈 입력값일 때 추가 버튼이 비활성화된다', () => {
    render(<TodoInput {...mockProps} />);
    
    const addButton = screen.getByRole('button', { name: '할 일 추가' });
    expect(addButton).toBeDisabled();
  });

  it('입력값이 있을 때 추가 버튼이 활성화된다', () => {
    const propsWithValue = { ...mockProps, inputValue: '테스트' };
    render(<TodoInput {...propsWithValue} />);
    
    const addButton = screen.getByRole('button', { name: '할 일 추가' });
    expect(addButton).toBeEnabled();
  });
});