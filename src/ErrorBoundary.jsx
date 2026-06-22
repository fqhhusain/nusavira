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
      // Custom fallback UI with Aria
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: 'var(--surface-color, #1a110f)', 
          backgroundImage: 'url(/background/stone_panel.png)',
          backgroundSize: 'cover',
          color: '#fff',
          fontFamily: "'Press Start 2P', monospace",
          padding: '20px',
          textAlign: 'center'
        }}>
          
          <img src="/aria.png" alt="Aria Confused" style={{ width: '150px', height: 'auto', marginBottom: '-20px', zIndex: 10, filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))' }} />
          
          <div className="panel-impeccable" style={{ padding: '40px', maxWidth: '600px', width: '100%', borderColor: '#ef4444', position: 'relative', zIndex: 5, background: 'rgba(26, 17, 15, 0.95)' }}>
            <h1 style={{ color: '#ef4444', marginBottom: '20px', fontSize: '1.2rem', lineHeight: '1.5', textShadow: '2px 2px 0 #000' }}>
              <img src="/icons/warning_icon.png" alt="Warning" style={{ width: '1.5em', height: '1.5em', verticalAlign: 'middle', marginRight: '10px', imageRendering: 'pixelated' }} />
              SYSTEM CRITICAL FAILURE
            </h1>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '1.5rem', marginBottom: '30px', color: '#fbbf24', textShadow: '1px 1px 0 #000' }}>
              "Oh no, Curator! An ancient artifact has malfunctioned and corrupted the current reality sector. We need to reset the timeline!"
            </p>
            
            <button 
              className="btn-impeccable danger" 
              onClick={() => window.location.reload()}
              style={{ padding: '15px 30px', fontSize: '1rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <img src="/icons/power_icon.png" alt="Power" style={{ width: '1.2em', height: '1.2em', imageRendering: 'pixelated' }} />
              RESTORE TIMELINE (RELOAD)
            </button>

            {this.state.error && (
              <details style={{ marginTop: '30px', textAlign: 'left', fontFamily: "'VT323', monospace", fontSize: '1.1rem', color: '#9ca3af', background: 'rgba(0,0,0,0.8)', padding: '15px', border: '2px solid #3e2723' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#d97706', fontWeight: 'bold' }}>Archivist Logs (Click to expand)</summary>
                <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', fontSize: '0.9rem' }}>
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
