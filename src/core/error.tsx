import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('RootErrorBoundary caught:', error, info);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-lg font-semibold">Something broke.</h1>
          <p className="max-w-prose text-sm text-fg-muted">
            Refresh the page. If it keeps happening, please reach out via the
            support link in the footer.
          </p>
          <button
            type="button"
            className="mt-2 rounded-xl bg-accent px-5 py-2 font-medium text-white hover:bg-accent-hover"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
