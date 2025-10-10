/**
 * Error Boundary - Phase 3: Runtime Error Monitoring
 *
 * Catches React errors in app previews and reports them to the backend.
 * Provides fallback UI and sends detailed error reports for Claude feedback.
 */
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from './retroui/Card';
import { Button } from './retroui/Button';

interface Props {
  children: ReactNode;
  appId?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report error to backend
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        app_id: this.props.appId,
        error_type: 'runtime',
        severity: 'error',
        category: 'react_error',
        message: error.message,
        file: 'frontend.tsx',
        stack_trace: error.stack,
        context: {
          component_stack: errorInfo.componentStack,
          error_name: error.name,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href,
        },
      };

      const response = await fetch('/api/v1/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(errorReport),
      });

      if (response.ok) {
        const result = await response.json();
        this.setState({ errorId: result.error_id });
        console.log('[ErrorBoundary] Error reported:', result.error_id);
      }
    } catch (reportError) {
      console.error('[ErrorBoundary] Failed to report error:', reportError);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with retro styling
      return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <Card.Header className="bg-[var(--destructive)] border-b-4 border-[var(--border)]">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-[var(--destructive-foreground)]" />
                <Card.Title className="text-[var(--destructive-foreground)]">
                  Something went wrong
                </Card.Title>
              </div>
            </Card.Header>
            <Card.Content className="space-y-4 pt-6">
              <p className="text-[var(--muted-foreground)]">
                The app encountered an error and couldn't continue.
                {this.state.errorId && (
                  <span className="block mt-2 font-mono text-sm">
                    Error ID: {this.state.errorId}
                  </span>
                )}
              </p>

              {this.props.showDetails && this.state.error && (
                <div className="space-y-2">
                  <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 rounded font-mono text-sm">
                    <div className="font-bold text-[var(--destructive)] mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-[var(--muted-foreground)]">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>

                  {this.state.errorInfo?.componentStack && (
                    <details className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 rounded">
                      <summary className="cursor-pointer font-bold text-sm uppercase">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap text-[var(--muted-foreground)]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  size="lg"
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components.
 * Note: This doesn't catch errors in the same component, only children.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
