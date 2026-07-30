import { CircularBuffer } from './circular-buffer';
import { MutationTracker } from './mutation-tracker';
import { EventTracker } from './event-tracker';
import { NetworkTracker } from './network-tracker';
import { ErrorBoundary } from './error-boundary';
export class SessionTracker {
    constructor(config) {
        this.config = {
            maxBufferSize: 1000,
            maxBufferAgeMs: 10000, // 10 seconds
            collectNetwork: true,
            collectMouseMove: true,
            ...config,
        };
        this.buffer = new CircularBuffer(this.config.maxBufferSize, this.config.maxBufferAgeMs);
        const pushEvent = (event) => this.buffer.push(event);
        this.mutationTracker = new MutationTracker(pushEvent);
        this.eventTracker = new EventTracker(pushEvent);
        this.networkTracker = new NetworkTracker(pushEvent);
        this.errorBoundary = new ErrorBoundary(this.buffer, this.config);
    }
    static init(config) {
        if (!SessionTracker.instance) {
            SessionTracker.instance = new SessionTracker(config);
            SessionTracker.instance.start();
        }
        return SessionTracker.instance;
    }
    static getInstance() {
        return SessionTracker.instance;
    }
    start() {
        this.mutationTracker.start();
        this.eventTracker.start();
        if (this.config.collectNetwork) {
            this.networkTracker.start();
        }
        this.errorBoundary.start();
        console.log('[SessionTracker] Started monitoring (10s Circular Buffer window active)');
    }
    stop() {
        this.mutationTracker.stop();
        this.eventTracker.stop();
        this.networkTracker.stop();
        this.errorBoundary.stop();
        console.log('[SessionTracker] Stopped monitoring');
    }
    captureError(error) {
        this.errorBoundary.captureError(error);
    }
}
SessionTracker.instance = null;
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
    window.SessionTracker = SessionTracker;
}
//# sourceMappingURL=index.js.map