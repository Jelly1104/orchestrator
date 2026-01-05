import React from 'react';
import ReactDOM from 'react-dom/client';
import OrchestratorValidationDashboard from './pages/OrchestratorValidationDashboard';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OrchestratorValidationDashboard />
  </React.StrictMode>
);
