import { CircularBuffer } from './circular-buffer';
import { MutationTracker } from './mutation-tracker';
import { EventTracker } from './event-tracker';
import { NetworkTracker } from './network-tracker';
import { ErrorBoundary } from './error-boundary';
import { serializeDOM } from './dom-serializer';
import { TrackerConfig } from './types';

export class SessionTracker {
  private static instance: SessionTracker | null = null;
  private buffer: CircularBuffer;
  private mutationTracker: MutationTracker;
  private eventTracker: EventTracker;
  private networkTracker: NetworkTracker;
  private errorBoundary: ErrorBoundary;
  private config: TrackerConfig;

  private constructor(config: TrackerConfig) {
    this.config = {
      maxBufferSize: 1000,
      maxBufferAgeMs: 10000, // 10 seconds
      collectNetwork: true,
      collectMouseMove: true,
      ...config,
    };

    this.buffer = new CircularBuffer(this.config.maxBufferSize, this.config.maxBufferAgeMs);

    const pushEvent = (event: any) => this.buffer.push(event);

    this.mutationTracker = new MutationTracker(pushEvent);
    this.eventTracker = new EventTracker(pushEvent);
    this.networkTracker = new NetworkTracker(pushEvent);
    this.errorBoundary = new ErrorBoundary(this.buffer, this.config);
  }

  public static init(config: TrackerConfig): SessionTracker {
    if (!SessionTracker.instance) {
      SessionTracker.instance = new SessionTracker(config);
      SessionTracker.instance.start();
    }
    return SessionTracker.instance;
  }

  public static getInstance(): SessionTracker | null {
    return SessionTracker.instance;
  }

  public start(): void {
    if (typeof document !== 'undefined') {
      serializeDOM(document.documentElement);
    }
    this.mutationTracker.start();
    this.eventTracker.start();
    if (this.config.collectNetwork) {
      this.networkTracker.start();
    }
    this.errorBoundary.start();
    console.log('[SessionTracker] Started monitoring (10s Circular Buffer window active)');
  }

  public stop(): void {
    this.mutationTracker.stop();
    this.eventTracker.stop();
    this.networkTracker.stop();
    this.errorBoundary.stop();
    console.log('[SessionTracker] Stopped monitoring');
  }

  public captureError(error: Error | string): void {
    this.errorBoundary.captureError(error);
  }
}

// Auto-initialize from script tag data attributes if present
if (typeof document !== 'undefined') {
  const currentScript = document.currentScript || document.querySelector('script[data-endpoint]');
  if (currentScript) {
    const endpoint = currentScript.getAttribute('data-endpoint');
    if (endpoint) {
      SessionTracker.init({ endpoint });
    }
  }
}

// Expose globally on window
if (typeof window !== 'undefined') {
  (window as any).SessionTracker = SessionTracker;
}
