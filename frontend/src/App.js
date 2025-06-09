import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const PORT = process.env.PORT || 5050;
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:${PORT}/api/test`
      : '/api/test';

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setMessage(data.message))
      .catch(error => {
        console.error('Error:', error);
        setError(error.message);
      });
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
