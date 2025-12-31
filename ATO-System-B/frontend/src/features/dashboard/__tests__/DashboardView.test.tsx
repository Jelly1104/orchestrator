import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardView from '../DashboardView';

describe('DashboardView', () => {
  it('renders the dashboard with filters and charts', () => {
    render(<DashboardView />);
    
    // 필터 랜더링 체크
    const filterLabels = screen.getAllByLabelText(/Filter/i);
    expect(filterLabels.length).toBeGreaterThan(0);

    // 차트 랜더링 체크
    const chartTitles = screen.getAllByRole('heading', { level: 3 });
    expect(chartTitles.length).toBeGreaterThan(0);
  });
});