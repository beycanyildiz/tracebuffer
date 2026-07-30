import { TrackerEvent } from './types';
export declare class CircularBuffer {
    private buffer;
    private maxCapacity;
    private maxAgeMs;
    constructor(maxCapacity?: number, maxAgeMs?: number);
    push(event: TrackerEvent): void;
    getEvents(): TrackerEvent[];
    clear(): void;
    private prune;
}
//# sourceMappingURL=circular-buffer.d.ts.map