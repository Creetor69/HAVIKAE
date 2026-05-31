import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary class component to catch rendering errors in the component tree.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Explicitly define state property to resolve line 19 TS error.
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initialize state to indicate no error has occurred yet.
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging purposes
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // FIX: Cast 'this' to any to bypass potential property inference issues with React.Component
    if ((this as any).state.hasError) {
      // Return a user-friendly fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-hav-cream text-center p-4">
            <div className="bg-hav-orange-50 p-8 rounded-2xl shadow-xl border border-hav-gold/20 max-w-md w-full">
                <div className="mb-6 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-hav-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-serif font-bold text-hav-orange-900 mb-2">
                    Oops!
                </h1>
                <p className="text-lg font-semibold text-hav-orange-800 mb-4">
                    Sorry, we ran into an error.
                </p>
                <p className="text-hav-brown mb-8 text-sm">
                    Something unexpected happened. Please verify your connection or try reloading the page.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-hav-forest hover:bg-hav-orange-800 text-hav-gold font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 shadow-lg"
                >
                    Reload Page
                </button>
            </div>
        </div>
      );
    }

    // FIX: Normally render children via this.props. Cast to any to ensure properties are accessible.
    return (this as any).props.children;
  }
}

export default ErrorBoundary;