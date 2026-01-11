import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      console.error('Production error:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack
      });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 p-8">
          <div className="max-w-2xl w-full">
            <div className="glass-panel rounded-3xl border border-rose-500/20 p-8 md:p-12 bg-gradient-to-br from-rose-500/5 to-transparent">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <AlertTriangle size={48} className="text-rose-500" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                System Error Detected
              </h1>

              {/* Error Description */}
              <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">
                The ArbiNexus system encountered an unexpected error. Our engineering team has been notified and is working to resolve the issue.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <div className="mb-8 p-6 bg-slate-900/50 rounded-xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Error Details (Development Mode)
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-rose-400 font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-4">
                        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                          Component Stack
                        </summary>
                        <pre className="mt-2 text-[10px] text-slate-600 overflow-x-auto p-4 bg-black/20 rounded-lg">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <RefreshCw size={18} />
                  Reload Application
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all border border-white/10"
                >
                  <Home size={18} />
                  Go to Home
                </button>
              </div>

              {/* Support Information */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
                  If this issue persists, please contact support
                </p>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Error ID: {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
