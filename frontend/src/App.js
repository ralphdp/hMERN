// frontend/src/App.js

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? `http://localhost:${process.env.PORT_BACKEND || 5050}/api/test`
          : '/api/test';

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MERN Stack App</h1>
        {error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <p>Backend message: {message}</p>
        )}
      </header>
    </div>
  );
}

export default App;
