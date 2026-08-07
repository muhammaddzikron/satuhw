import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any) {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  render() {
    const state = this.state as State;
    const props = this.props as Props;

    if (state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Terjadi Kesalahan Aplikasi</h2>
          <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
            Aplikasi mengalami kendala teknis saat memuat komponen. Anda dapat mencoba memuat ulang halaman.
          </p>
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 max-w-md w-full text-left">
              <p className="text-[10px] font-mono text-red-700 break-words font-semibold">
                {state.error.message || 'Unknown Error'}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-3 bg-hw-green text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-hw-green/90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} /> Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return props.children;
  }
}
