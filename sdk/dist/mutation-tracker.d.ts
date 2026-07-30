import { TrackerEvent } from './types';
export type MutationCallback = (event: TrackerEvent) => void;
export declare class MutationTracker {
    private observer;
    private onMutation;
    constructor(onMutation: MutationCallback);
    start(): void;
    stop(): void;
    private emit;
}
//# sourceMappingURL=mutation-tracker.d.ts.map