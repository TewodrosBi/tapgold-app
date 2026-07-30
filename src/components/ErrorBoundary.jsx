import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-6 text-center select-none">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-rose-500 mb-2">Something went wrong!</h2>
          <p className="text-xs text-slate-300 max-w-sm mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono break-all text-left">
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Reset Dev Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
