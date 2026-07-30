import { TrackerEvent } from './types';

export type NetworkCallback = (event: TrackerEvent) => void;

export class NetworkTracker {
  private onNetwork: NetworkCallback;
  private originalFetch: typeof window.fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;

  constructor(onNetwork: NetworkCallback) {
    this.onNetwork = onNetwork;
  }

  public start(): void {
    this.interceptFetch();
    this.interceptXHR();
  }

  public stop(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }
  }

  private interceptFetch(): void {
    if (!window.fetch) return;
    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
      const method = (args[1]?.method || 'GET').toUpperCase();

      // Don't intercept tracker endpoint POSTs to avoid infinite loops!
      if (url.includes('/api/reports')) {
        return self.originalFetch!.apply(this, args);
      }

      try {
        const response = await self.originalFetch!.apply(this, args);
        const duration = Date.now() - startTime;

        self.emit({
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
          type: 'fetch',
        });

        return response;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        self.emit({
          url,
          method,
          status: 0,
          statusText: error?.message || 'Network Failure',
          duration,
          type: 'fetch',
        });
        throw error;
      }
    };
  }

  private interceptXHR(): void {
    if (!window.XMLHttpRequest) return;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      (this as any)._sr_method = method;
      (this as any)._sr_url = String(url);
      return self.originalXHROpen!.apply(this, [method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      const startTime = Date.now();
      const xhr = this;

      if ((xhr as any)._sr_url?.includes('/api/reports')) {
        return self.originalXHRSend!.apply(this, args);
      }

      xhr.addEventListener('loadend', () => {
        const duration = Date.now() - startTime;
        self.emit({
          url: (xhr as any)._sr_url || '',
          method: ((xhr as any)._sr_method || 'GET').toUpperCase(),
          status: xhr.status,
          statusText: xhr.statusText,
          duration,
          type: 'xhr',
        });
      });

      return self.originalXHRSend!.apply(this, args);
    };
  }

  private emit(data: any): void {
    this.onNetwork({
      id: Math.random().toString(36).substr(2, 9),
      type: 'NETWORK',
      timestamp: Date.now(),
      data,
    });
  }
}
