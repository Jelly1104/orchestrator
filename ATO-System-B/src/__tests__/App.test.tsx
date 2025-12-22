import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from '../components/App';

describe('App Component', () => {
  it('앱이 정상적으로 렌더링된다', () => {
    render(<App />);
    
    expect(screen.getByText('할 일 관리')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('새 할 일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '할 일 추가' })).toBeInTheDocument();
  });

  it('빈 목록일 때 안내 메시지를 표시한다', () => {
    render(<App />);
    
    expect(screen.getByText('할 일이 없습니다. 새로운 할 일을 추가해보세요!')).toBeInTheDocument();
  });

  it('새 할 일을 추가할 수 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    const addButton = screen.getByRole('button', { name: '할 일 추가' });
    
    // 할 일 추가
    await user.type(input, '테스트 할 일');
    await user.click(addButton);
    
    // 추가된 할 일 확인
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
    expect(input).toHaveValue(''); // 입력창 초기화 확인
  });

  it('Enter 키로도 할 일을 추가할 수 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    
    await user.type(input, '키보드로 추가');
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('키보드로 추가')).toBeInTheDocument();
  });

  it('빈 입력값으로는 할 일을 추가할 수 없다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    const addButton = screen.getByRole('button', { name: '할 일 추가' });
    
    // 빈 값으로 추가 시도
    await user.click(addButton);
    
    // 추가되지 않음을 확인
    expect(screen.getByText('할 일이 없습니다. 새로운 할 일을 추가해보세요!')).toBeInTheDocument();
    
    // 공백만 입력한 경우
    await user.type(input, '   ');
    await user.click(addButton);
    
    expect(screen.getByText('할 일이 없습니다. 새로운 할 일을 추가해보세요!')).toBeInTheDocument();
  });

  it('할 일을 삭제할 수 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    
    // 할 일 추가
    await user.type(input, '삭제될 할 일');
    await user.keyboard('{Enter}');
    
    // 삭제 버튼 클릭
    const deleteButton = screen.getByLabelText('삭제될 할 일 삭제');
    await user.click(deleteButton);
    
    // 삭제 확인
    expect(screen.queryByText('삭제될 할 일')).not.toBeInTheDocument();
    expect(screen.getByText('할 일이 없습니다. 새로운 할 일을 추가해보세요!')).toBeInTheDocument();
  });

  it('여러 할 일을 관리할 수 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    
    // 여러 할 일 추가
    await user.type(input, '첫 번째 할 일');
    await user.keyboard('{Enter}');
    
    await user.type(input, '두 번째 할 일');
    await user.keyboard('{Enter}');
    
    await user.type(input, '세 번째 할 일');
    await user.keyboard('{Enter}');
    
    // 모든 할 일이 표시되는지 확인
    expect(screen.getByText('첫 번째 할 일')).toBeInTheDocument();
    expect(screen.getByText('두 번째 할 일')).toBeInTheDocument();
    expect(screen.getByText('세 번째 할 일')).toBeInTheDocument();
    
    // 하나 삭제
    const deleteButton = screen.getByLabelText('두 번째 할 일 삭제');
    await user.click(deleteButton);
    
    // 삭제된 할 일은 없고 나머지는 남아있는지 확인
    expect(screen.queryByText('두 번째 할 일')).not.toBeInTheDocument();
    expect(screen.getByText('첫 번째 할 일')).toBeInTheDocument();
    expect(screen.getByText('세 번째 할 일')).toBeInTheDocument();
  });

  it('추가 버튼은 입력값이 없을 때 비활성화된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const addButton = screen.getByRole('button', { name: '할 일 추가' });
    const input = screen.getByPlaceholderText('새 할 일을 입력하세요');
    
    // 초기 상태에서 비활성화
    expect(addButton).toBeDisabled();
    
    // 텍스트 입력 시 활성화
    await user.type(input, '테스트');
    expect(addButton).toBeEnabled();
    
    // 텍스트 삭제 시 다시 비활성화
    await user.clear(input);
    expect(addButton).toBeDisabled();
  });
});