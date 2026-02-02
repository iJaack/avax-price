'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-xl mb-2">Something went wrong</h2>
            <p className="text-neutral-500">Please refresh the page</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
