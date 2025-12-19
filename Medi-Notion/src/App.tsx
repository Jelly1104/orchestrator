import React from 'react';
import { WelcomeNotification } from './components/WelcomeNotification';
import './App.css';

function App() {
  return (
    <div className="App">
      <WelcomeNotification />
      <header className="App-header">
        <h1>Medi-Notion</h1>
        <p>
          의료인을 위한 플랫폼입니다.
        </p>
      </header>
    </div>
  );
}

export default App;