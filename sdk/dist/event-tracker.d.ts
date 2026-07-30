import { TrackerEvent } from './types';
export type EventCallback = (event: TrackerEvent) => void;
export declare class EventTracker {
    private onEvent;
    private listeners;
    private lastMouseMove;
    constructor(onEvent: EventCallback);
    start(): void;
    stop(): void;
    private addListener;
    private handleClick;
    private handleInput;
    private handleScroll;
    private handleResize;
    private handleMouseMove;
    private getElementSelector;
    private emit;
}
//# sourceMappingURL=event-tracker.d.ts.map