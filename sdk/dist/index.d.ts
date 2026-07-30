import { TrackerConfig } from './types';
export declare class SessionTracker {
    private static instance;
    private buffer;
    private mutationTracker;
    private eventTracker;
    private networkTracker;
    private errorBoundary;
    private config;
    private constructor();
    static init(config: TrackerConfig): SessionTracker;
    static getInstance(): SessionTracker | null;
    start(): void;
    stop(): void;
    captureError(error: Error | string): void;
}
//# sourceMappingURL=index.d.ts.map