import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/health`);
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }
        const data = await response.json();
        setHealthStatus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Chinese Food Reviews</h1>
      <h2>Backend Connection Status</h2>
      {loading && <p>Checking backend...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {healthStatus && (
        <p style={{ color: 'green' }}>
          ✅ Backend is reachable. Status: {healthStatus.status}
        </p>
      )}
    </div>
  );
}

export default App;