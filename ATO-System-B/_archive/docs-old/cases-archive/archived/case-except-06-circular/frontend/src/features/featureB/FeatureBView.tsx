import React, { useState } from 'react';

const FeatureBView = () => {
  const [cResult, setCResult] = useState('');
  const [message, setMessage] = useState('');

  const handleSendToA = () => {
    fetch('/api/b-to-a', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ c_result: cResult }),
    })
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => setMessage('Error occurred'));
  };

  return (
    <div>
      <h1>기능 B</h1>
      <input
        type="text"
        value={cResult}
        onChange={(e) => setCResult(e.target.value)}
        placeholder="Enter C result"
      />
      <button onClick={handleSendToA}>A로 전송</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default FeatureBView;