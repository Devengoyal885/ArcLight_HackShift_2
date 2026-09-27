import React from 'react';

// Detect stale chunk errors that happen after a new Vercel deployment
// when the browser has cached old JS chunk hashes that no longer exist.
function isChunkLoadError(error: Error): boolean {
    const msg = error?.message || '';
    const name = error?.name || '';
    return (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('Unable to preload CSS') ||
        name === 'ChunkLoadError' ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk')
    );
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        // If it's a stale chunk error, auto-reload once instead of showing crash screen
        if (isChunkLoadError(error)) {
            const reloaded = sessionStorage.getItem('chunk-reload-attempted');
            if (!reloaded) {
                sessionStorage.setItem('chunk-reload-attempted', '1');
                window.location.reload();
                return { hasError: false, error: null }; // Don't show error screen yet
            }
        }
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100vw',
                    backgroundColor: '#050505',
                    color: '#e5e5e5',
                    fontFamily: 'Inter, sans-serif',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 60, 60, 0.2)',
                        background: 'rgba(255, 0, 0, 0.05)',
                        boxShadow: '0 8px 32px 0 rgba(255, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                    }}>
                        <h2 style={{ color: '#ff4d4d', marginBottom: '1rem', fontWeight: 600 }}>System Encountered an Issue</h2>
                        <p style={{ color: '#a3a3a3', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            An unexpected error occurred while rendering this module. Our engineering team has been notified.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && (
                            <div style={{ textAlign: 'left', marginBottom: '2rem', maxHeight: '150px', overflowY: 'auto', background: '#000', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', color: '#ff8080' }}>
                                <pre id="react-error-msg">{this.state.error?.toString()}</pre>
                            </div>
                        )}

                        <button 
                            onClick={() => {
                                sessionStorage.removeItem('chunk-reload-attempted');
                                window.location.reload();
                            }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
