import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TodoInput from '../components/TodoInput';

describe('TodoInput 컴포넌트', () => {
  const mockProps = {
    onAddTodo: jest.fn(),
    inputValue: '',
    onInputChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('올바르게 렌더링되어야 한다', () => {
    render(<TodoInput {...mockProps} />);
    
    expect(screen.getByPlaceholderText('새 할 일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('추가')).toBeInTheDocument();
  });

  test('입력값 변경 시 onInputChange가 호출되어야 한다', async () => {
    const user = userEvent.setup();
    render(<TodoInput {...mockProps} />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    await user.type(input, 'test');
    
    expect(mockProps.onInputChange).toHaveBeenCalledWith('test');
  });

  test('추가 버튼 클릭 시 onAddTodo가 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const propsWithValue = { ...mockProps, inputValue: '테스트 할 일' };
    render(<TodoInput {...propsWithValue} />);
    
    const addButton = screen.getByText('추가');
    await user.click(addButton);
    
    expect(mockProps.onAddTodo).toHaveBeenCalledWith('테스트 할 일');
  });

  test('빈 입력값일 때 추가 버튼이 비활성화되어야 한다', () => {
    render(<TodoInput {...mockProps} />);
    
    const addButton = screen.getByText('추가');
    expect(addButton).toBeDisabled();
  });

  test('공백만 있을 때 추가 버튼이 비활성화되어야 한다', () => {
    const propsWithSpaces = { ...mockProps, inputValue: '   ' };
    render(<TodoInput {...propsWithSpaces} />);
    
    const addButton = screen.getByText('추가');
    expect(addButton).toBeDisabled();
  });
});