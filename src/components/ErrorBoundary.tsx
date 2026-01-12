import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Keep this minimal to avoid recursive failures.
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto max-w-xl px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          {this.state.message ? (
            <pre className="mt-6 whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs text-muted-foreground">
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </main>
      </div>
    );
  }
}
