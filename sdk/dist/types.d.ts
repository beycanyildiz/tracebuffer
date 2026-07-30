export type EventType = 'DOM_SNAPSHOT' | 'DOM_MUTATION' | 'CLICK' | 'INPUT' | 'SCROLL' | 'RESIZE' | 'MOUSE_MOVE' | 'NETWORK' | 'CONSOLE' | 'ERROR';
export interface TrackerEvent {
    id: string;
    type: EventType;
    timestamp: number;
    data: any;
}
export interface TrackerConfig {
    endpoint: string;
    maxBufferSize?: number;
    maxBufferAgeMs?: number;
    maskAllInputs?: boolean;
    collectNetwork?: boolean;
    collectConsole?: boolean;
    collectMouseMove?: boolean;
}
export interface VNode {
    id: number;
    tagName: string;
    attributes: Record<string, string>;
    children: (VNode | string)[];
}
export interface ErrorReportPayload {
    id: string;
    timestamp: number;
    url: string;
    userAgent: string;
    viewport: {
        width: number;
        height: number;
    };
    error: {
        message: string;
        stack?: string;
        filename?: string;
        lineno?: number;
        colno?: number;
        type: string;
    };
    initialSnapshot: VNode | null;
    events: TrackerEvent[];
}
//# sourceMappingURL=types.d.ts.map