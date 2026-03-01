import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary - przechwytuje błędy renderowania w drzewie komponentów.
 * Zapobiega crashowi całej aplikacji przy błędzie w pojedynczym komponencie.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-3xl mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Coś poszło nie tak
            </h1>
            <p className="text-slate-600 mb-8">
              Wystąpił nieoczekiwany błąd. Odśwież stronę lub wróć do strony głównej.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Wróć do strony głównej
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
