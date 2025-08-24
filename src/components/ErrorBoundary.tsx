import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1a1a1a',
          color: '#f5f5f5',
          fontFamily: 'Pixelify Sans, monospace',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem',
            color: '#ffbf00' // Gold accent color
          }}>
            ⚠️ There was an error
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            marginBottom: '2rem',
            maxWidth: '600px',
            lineHeight: '1.5'
          }}>
            Something went wrong while loading the game. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#663300',
              color: '#f5f5f5',
              border: '2px solid #8b4513',
              padding: '12px 24px',
              fontSize: '1rem',
              fontFamily: 'Pixelify Sans, monospace',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            🔄 Reload Game
          </button>

        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
