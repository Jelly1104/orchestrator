import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../components/App';

describe('App 컴포넌트', () => {
  test('초기 렌더링이 정상적으로 되어야 한다', () => {
    render(<App />);
    
    // 헤더 확인
    expect(screen.getByText('할 일 관리')).toBeInTheDocument();
    
    // 입력창과 버튼 확인
    expect(screen.getByPlaceholderText('새 할 일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('추가')).toBeInTheDocument();
    
    // 초기 상태에서 할 일이 없음을 확인
    expect(screen.getByText('등록된 할 일이 없습니다.')).toBeInTheDocument();
  });

  test('할 일을 추가할 수 있어야 한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    const addButton = screen.getByText('추가');
    
    // 할 일 입력
    await user.type(input, '테스트 할 일');
    await user.click(addButton);
    
    // 추가된 할 일 확인
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
    
    // 입력창이 비워졌는지 확인
    expect(input).toHaveValue('');
  });

  test('Enter키로 할 일을 추가할 수 있어야 한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    
    // 할 일 입력 후 Enter 키 누르기
    await user.type(input, '엔터키 테스트{enter}');
    
    // 추가된 할 일 확인
    expect(screen.getByText('엔터키 테스트')).toBeInTheDocument();
  });

  test('빈 입력값으로는 할 일을 추가할 수 없어야 한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const addButton = screen.getByText('추가');
    
    // 빈 상태에서 추가 버튼이 비활성화되어 있는지 확인
    expect(addButton).toBeDisabled();
    
    // 공백만 입력했을 때도 추가되지 않아야 함
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    await user.type(input, '   ');
    await user.click(addButton);
    
    expect(screen.getByText('등록된 할 일이 없습니다.')).toBeInTheDocument();
  });

  test('할 일을 삭제할 수 있어야 한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    const addButton = screen.getByText('추가');
    
    // 할 일 추가
    await user.type(input, '삭제할 할 일');
    await user.click(addButton);
    
    // 할 일이 추가되었는지 확인
    expect(screen.getByText('삭제할 할 일')).toBeInTheDocument();
    
    // 삭제 버튼 클릭
    const deleteButton = screen.getByLabelText('"삭제할 할 일" 할 일 삭제');
    await user.click(deleteButton);
    
    // 할 일이 삭제되었는지 확인
    expect(screen.queryByText('삭제할 할 일')).not.toBeInTheDocument();
    expect(screen.getByText('등록된 할 일이 없습니다.')).toBeInTheDocument();
  });

  test('여러 할 일을 관리할 수 있어야 한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    const addButton = screen.getByText('추가');
    
    // 여러 할 일 추가
    const todos = ['할 일 1', '할 일 2', '할 일 3'];
    
    for (const todo of todos) {
      await user.type(input, todo);
      await user.click(addButton);
    }
    
    // 모든 할 일이 추가되었는지 확인
    todos.forEach(todo => {
      expect(screen.getByText(todo)).toBeInTheDocument();
    });
    
    // 가운데 할 일 삭제
    const deleteButton = screen.getByLabelText('"할 일 2" 할 일 삭제');
    await user.click(deleteButton);
    
    // 삭제된 할 일은 없고, 나머지는 남아있는지 확인
    expect(screen.queryByText('할 일 2')).not.toBeInTheDocument();
    expect(screen.getByText('할 일 1')).toBeInTheDocument();
    expect(screen.getByText('할 일 3')).toBeInTheDocument();
  });
});