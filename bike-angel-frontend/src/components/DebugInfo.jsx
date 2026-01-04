import { useState } from 'react';

/**
 * Debug component to show API configuration
 * Only visible in development mode
 */
function DebugInfo() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const mode = import.meta.env.MODE;
  const isDev = import.meta.env.DEV;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {isOpen ? '🔽 Hide Debug' : '🔼 Show Debug'}
      </button>
      
      {isOpen && (
        <div style={{ marginTop: '10px', lineHeight: '1.6' }}>
          <div><strong>🔧 Debug Info</strong></div>
          <div>━━━━━━━━━━━━━━━━━━━━</div>
          <div>📡 API URL: <span style={{ color: '#4CAF50' }}>{apiUrl}</span></div>
          <div>🌍 Mode: <span style={{ color: '#2196F3' }}>{mode}</span></div>
          <div>🛠️ Dev: <span style={{ color: isDev ? '#4CAF50' : '#f44336' }}>{isDev ? 'Yes' : 'No'}</span></div>
          <div>━━━━━━━━━━━━━━━━━━━━</div>
          <div style={{ marginTop: '5px' }}>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${apiUrl.replace('/api', '')}/health`);
                  const data = await response.json();
                  alert(`✅ Backend is reachable!\n\n${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`❌ Backend is NOT reachable!\n\nError: ${error.message}`);
                }
              }}
              style={{
                background: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                width: '100%'
              }}
            >
              Test Backend Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugInfo;
