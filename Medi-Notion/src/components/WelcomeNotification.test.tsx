import { render, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { WelcomeNotification } from './WelcomeNotification';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('WelcomeNotification', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('3초 후 자동 표시되어야 한다', async () => {
    render(<WelcomeNotification />);
    
    // 초기에는 보이지 않음
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    
    // 3초 후 나타남
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Medi-Notion!')).toBeInTheDocument();
    });
  });

  it('X 버튼 클릭 시 즉시 숨겨져야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<WelcomeNotification />);
    
    // 3초 후 표시
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // X 버튼 클릭
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('5초 후 자동으로 숨겨져야 한다', async () => {
    render(<WelcomeNotification />);
    
    // 3초 후 표시
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // 5초 더 진행 (총 8초)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('세션 중 중복 표시를 방지해야 한다', async () => {
    // 첫 번째 렌더링
    const { unmount } = render(<WelcomeNotification />);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // 컴포넌트 언마운트
    unmount();
    
    // 두 번째 렌더링 (같은 세션)
    render(<WelcomeNotification />);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    // 두 번째에는 표시되지 않아야 함
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('접근성 ARIA 속성이 올바르게 설정되어야 한다', async () => {
    render(<WelcomeNotification />);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      const notification = screen.getByRole('alert');
      expect(notification).toHaveAttribute('aria-live', 'polite');
      expect(notification).toHaveAttribute('aria-atomic', 'true');
    });
  });

  it('커스텀 메시지가 표시되어야 한다', async () => {
    const customMessage = "환영합니다, 의료진님!";
    render(<WelcomeNotification message={customMessage} />);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  it('커스텀 딜레이 시간이 적용되어야 한다', async () => {
    render(<WelcomeNotification autoShowDelay={1000} autoHideDelay={2000} />);
    
    // 1초 후 표시
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // 2초 더 진행 (총 3초)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});