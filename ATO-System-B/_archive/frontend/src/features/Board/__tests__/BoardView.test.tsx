// 프론트엔드 테스트 코드

import { render, screen, waitFor } from '@testing-library/react';
import BoardView from '../BoardView';

test('renders boards', async () => {
  render(<BoardView />);
  
  // Wait for the fetch call to complete
  await waitFor(() => screen.getByText('Boards'));

  const boardTitles = screen.getAllByRole('heading', { level: 2 });
  expect(boardTitles.length).toBeGreaterThan(0);
});