import React from 'react';
import ReactDOM from 'react-dom/client';
import ActiveUserDashboard from './pages/ActiveUserDashboard';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <<ActiveUserDashboard />
  </React.StrictMode>
);