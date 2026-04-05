import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="text-rose" size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 mb-4">Something went wrong</h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            We encountered an unexpected error. Don't worry, your data is safe. Please try refreshing the page.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-left overflow-auto max-w-full">
              <p className="text-xs font-mono text-red-600">{this.state.error?.toString()}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-rose text-ivory font-bold py-4 px-6 rounded-2xl shadow-lg shadow-rose/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RefreshCw size={18} />
              Reload Page
            </button>
            <button
              onClick={this.handleReset}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Home size={18} />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
