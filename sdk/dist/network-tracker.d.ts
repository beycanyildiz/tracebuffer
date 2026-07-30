import { TrackerEvent } from './types';
export type NetworkCallback = (event: TrackerEvent) => void;
export declare class NetworkTracker {
    private onNetwork;
    private originalFetch;
    private originalXHROpen;
    private originalXHRSend;
    constructor(onNetwork: NetworkCallback);
    start(): void;
    stop(): void;
    private interceptFetch;
    private interceptXHR;
    private emit;
}
//# sourceMappingURL=network-tracker.d.ts.map