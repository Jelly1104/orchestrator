import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelloWorldMessage } from '../../components/HelloWorldMessage';

describe('HelloWorldMessage', () => {
  it('Hello World 메시지를 렌더링해야 한다', () => {
    render(<HelloWorldMessage />);
    
    expect(screen.getByText('🌍 Hello, World! 🌍')).toBeInTheDocument();
    expect(screen.getByText('Welcome to our Hello World application')).toBeInTheDocument();
  });

  it('올바른 CSS 클래스가 적용되어야 한다', () => {
    const { container } = render(<HelloWorldMessage />);
    
    const titleElement = screen.getByText('🌍 Hello, World! 🌍');
    expect(titleElement).toHaveClass('text-4xl', 'font-bold', 'text-gray-800');
  });
});