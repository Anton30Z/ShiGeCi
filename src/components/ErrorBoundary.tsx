import { AlertTriangle, RotateCcw } from 'lucide-react';
import React from 'react';
import type { TranslationDict } from '../i18n/translations';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  t: TranslationDict['errorBoundary'];
  onResetView: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-surface mx-auto max-w-lg rounded-3xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {this.props.t.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
              this.props.onResetView();
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <RotateCcw className="h-4 w-4" />
            {this.props.t.recover}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
