import { VNode } from './types';
export declare function getOrCreateNodeId(node: Node | null): number | null;
export declare function getNodeById(id: number): Node | null;
export declare function serializeDOM(node?: Node): VNode | string;
export declare function isMaskedElement(element: HTMLElement | null): boolean;
//# sourceMappingURL=dom-serializer.d.ts.map