'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ============================================
// ERROR BOUNDARY
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg
                           hover:bg-gray-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// ERROR PAGE COMPONENT
// ============================================

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: string | number;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
}

export function ErrorPage({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  code,
  showRetry = true,
  showHome = true,
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {code && (
          <p className="text-6xl font-bold text-gray-700 mb-4">{code}</p>
        )}
        
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-gray-400 mb-8">{message}</p>

        <div className="flex items-center justify-center gap-4">
          {showRetry && (
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          )}
          {showHome && (
            <a
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg
                         hover:bg-gray-600 transition-colors font-medium"
            >
              <Home className="w-5 h-5" />
              Go Home
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 404 NOT FOUND PAGE
// ============================================

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r 
                      from-blue-400 to-purple-500 mb-4">
          404
        </p>
        
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg
                       hover:bg-gray-600 transition-colors font-medium"
          >
            Go Back
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAINTENANCE PAGE
// ============================================

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Bug className="w-12 h-12 text-yellow-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">Under Maintenance</h1>
        <p className="text-gray-400 mb-8">
          We're currently performing scheduled maintenance. We'll be back shortly!
        </p>

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-400 mb-2">Estimated time remaining</p>
          <p className="text-3xl font-bold text-white">~30 minutes</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 transition-colors font-medium mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          Check Again
        </button>
      </div>
    </div>
  );
}

// ============================================
// OFFLINE PAGE
// ============================================

export function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">You're Offline</h1>
        <p className="text-gray-400 mb-8">
          Please check your internet connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 transition-colors font-medium mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          Retry
        </button>
      </div>
    </div>
  );
}
