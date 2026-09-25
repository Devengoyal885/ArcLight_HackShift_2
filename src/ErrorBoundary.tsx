import React from 'react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
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
                            onClick={() => window.location.reload()}
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
