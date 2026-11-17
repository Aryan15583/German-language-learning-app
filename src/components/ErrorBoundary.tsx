import { Component, type ReactNode } from "react";

/** Unexpected errors show a friendly retry screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="text-6xl">💔</p>
          <h1 className="mt-3 font-script text-4xl font-bold text-plum">Hoppla! Something went wrong.</h1>
          <p className="mt-2 text-muted">Your progress is safe. Try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-plum px-6 py-3 font-semibold text-white">
            Try again
          </button>
        </div>
      </div>
    );
  }
}
