import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="recovery-screen">
          <h1>The workspace could not be displayed</h1>
          <p>
            Your saved tasks are still in this browser. Reload to try again.
          </p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Reload workspace
          </button>
        </main>
      );
    return this.props.children;
  }
}
