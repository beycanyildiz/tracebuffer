import { CircularBuffer } from './circular-buffer';
import { serializeDOM } from './dom-serializer';
import { ErrorReportPayload, TrackerConfig } from './types';

export class ErrorBoundary {
  private buffer: CircularBuffer;
  private config: TrackerConfig;
  private isProcessing = false;

  constructor(buffer: CircularBuffer, config: TrackerConfig) {
    this.buffer = buffer;
    this.config = config;
  }

  public start(): void {
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  public stop(): void {
    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  public captureError(error: Error | string): void {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    this.processAndSendError({
      message,
      stack,
      type: 'manual',
    });
  }

  private handleGlobalError(event: ErrorEvent): void {
    this.processAndSendError({
      message: event.message || 'Uncaught Exception',
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'uncaught_exception',
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');
    const stack = reason instanceof Error ? reason.stack : undefined;

    this.processAndSendError({
      message,
      stack,
      type: 'unhandled_rejection',
    });
  }

  private async processAndSendError(errorData: ErrorReportPayload['error']): Promise<void> {
    // Prevent duplicate recursive crash reporting
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const initialSnapshot = serializeDOM(document.documentElement);
      const events = this.buffer.getEvents();

      const payload: ErrorReportPayload = {
        id: 'err_' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        error: errorData,
        initialSnapshot: typeof initialSnapshot === 'string' ? null : initialSnapshot,
        events,
      };

      console.warn('[SessionTracker] Error captured! Transmitting replay payload...', payload);

      await this.sendReport(payload);
    } catch (err) {
      console.error('[SessionTracker] Failed to record error payload:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendReport(payload: ErrorReportPayload): Promise<void> {
    const body = JSON.stringify(payload);

    // Try navigator.sendBeacon first for non-blocking reliability
    if (navigator.sendBeacon && this.config.endpoint) {
      const sent = navigator.sendBeacon(this.config.endpoint, body);
      if (sent) return;
    }

    // Fallback to fetch
    if (this.config.endpoint) {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  }
}
