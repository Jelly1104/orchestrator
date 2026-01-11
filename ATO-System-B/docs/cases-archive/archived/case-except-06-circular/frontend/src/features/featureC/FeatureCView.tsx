import React, { useState } from 'react';

const FeatureCView = () => {
  const [aResult, setAResult] = useState('');
  const [message, setMessage] = useState('');

  const handleSendToB = () => {
    fetch('/api/c-to-b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ a_result: aResult }),
    })
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => setMessage('Error occurred'));
  };

  return (
    <div>
      <h1>기능 C</h1>
      <input
        type="text"
        value={aResult}
        onChange={(e) => setAResult(e.target.value)}
        placeholder="Enter A result"
      />
      <button onClick={handleSendToB}>B로 전송</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default FeatureCView;