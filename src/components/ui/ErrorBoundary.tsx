import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-slate-900)',
                    padding: '24px'
                }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(12px)',
                            padding: '40px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            maxWidth: '480px',
                            textAlign: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px auto'
                        }}>
                            <AlertTriangle size={32} color="#ef4444" />
                        </div>
                        
                        <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', marginBottom: '12px' }}>Something went wrong</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                            An unexpected error occurred in this module. We've logged the issue and are looking into it.
                        </p>
                        
                        {this.state.error && (
                            <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: '#ef4444',
                                fontFamily: 'monospace',
                                textAlign: 'left',
                                overflowX: 'auto',
                                marginBottom: '24px'
                            }}>
                                {this.state.error.message}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                onClick={this.handleReset}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '99px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <RefreshCw size={16} /> Try Again
                            </button>
                            <Link 
                                to="/"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '10px 20px',
                                    borderRadius: '99px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Home size={16} /> Go Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
