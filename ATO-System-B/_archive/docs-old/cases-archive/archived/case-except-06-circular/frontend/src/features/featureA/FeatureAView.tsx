import React, { useState } from 'react';

const FeatureAView = () => {
  const [bResult, setBResult] = useState('');
  const [message, setMessage] = useState('');

  const handleSendToC = () => {
    fetch('/api/a-to-c', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ b_result: bResult }),
    })
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => setMessage('Error occurred'));
  };

  return (
    <div>
      <h1>기능 A</h1>
      <input
        type="text"
        value={bResult}
        onChange={(e) => setBResult(e.target.value)}
        placeholder="Enter B result"
      />
      <button onClick={handleSendToC}>C로 전송</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default FeatureAView;