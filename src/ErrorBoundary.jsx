import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: 'var(--surface-color, #1a110f)', 
          color: '#fff',
          fontFamily: "'Press Start 2P', monospace",
          padding: '20px',
          textAlign: 'center'
        }}>
          <div className="panel-impeccable" style={{ padding: '40px', maxWidth: '600px', width: '100%' }}>
            <h1 style={{ color: '#ef4444', marginBottom: '20px', fontSize: '1.5rem', lineHeight: '1.5' }}>
              ⚠️ SYSTEM CRITICAL FAILURE ⚠️
            </h1>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '1.5rem', marginBottom: '30px', color: '#fbbf24' }}>
              An ancient artifact has malfunctioned and corrupted the current reality sector.
            </p>
            
            <button 
              className="btn-impeccable primary" 
              onClick={() => window.location.reload()}
              style={{ padding: '15px 30px', fontSize: '1.2rem', margin: '0 auto' }}
            >
              RESTORE TIMELINE (RELOAD)
            </button>

            {this.state.error && (
              <details style={{ marginTop: '30px', textAlign: 'left', fontFamily: "'VT323', monospace", fontSize: '1.1rem', color: '#9ca3af', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Developer Logs (Click to expand)</summary>
                <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
