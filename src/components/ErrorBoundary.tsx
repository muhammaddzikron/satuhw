import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  resetKeys?: any[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  prevResetKeys?: any[];
}

export class ErrorBoundary extends (Component as any) {
  state: State = {
    hasError: false,
    error: null,
    prevResetKeys: this.props.resetKeys
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    const { resetKeys } = props;
    const { prevResetKeys, hasError } = state;
    if (hasError && resetKeys && prevResetKeys) {
      const hasChanged = resetKeys.some((k, idx) => k !== prevResetKeys[idx]);
      if (hasChanged) {
        return {
          hasError: false,
          error: null,
          prevResetKeys: resetKeys
        };
      }
    }
    return { prevResetKeys: resetKeys };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleSoftReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
  };

  render() {
    const state = this.state as State;
    const props = this.props as Props;

    if (state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-gray-50/80 my-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-1.5">Terjadi Kesalahan Tampilan</h2>
          <p className="text-xs text-gray-500 max-w-md mb-4 leading-relaxed">
            Komponen ini mengalami kendala teknis saat memuat data. Anda dapat mencoba memuat ulang atau kembali ke beranda.
          </p>
          {state.error && (
            <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-3 mb-5 max-w-md w-full text-left">
              <p className="text-[11px] font-mono text-red-700 break-words font-medium">
                {state.error.message || 'Unknown Error'}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={this.handleSoftReset}
              className="px-4 py-2.5 bg-hw-green text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:bg-hw-green/90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw size={14} /> Coba Lagi
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} /> Muat Ulang
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Home size={14} /> Beranda
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
}

