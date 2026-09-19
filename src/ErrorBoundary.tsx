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
                <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
                    <h2>React Render Crash</h2>
                    <pre id="react-error-msg">{this.state.error?.toString()}</pre>
                    <pre id="react-error-stack">{this.state.error?.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
