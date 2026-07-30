import { CircularBuffer } from './circular-buffer';
import { TrackerConfig } from './types';
export declare class ErrorBoundary {
    private buffer;
    private config;
    private isProcessing;
    constructor(buffer: CircularBuffer, config: TrackerConfig);
    start(): void;
    stop(): void;
    captureError(error: Error | string): void;
    private handleGlobalError;
    private handleUnhandledRejection;
    private processAndSendError;
    private sendReport;
}
//# sourceMappingURL=error-boundary.d.ts.map