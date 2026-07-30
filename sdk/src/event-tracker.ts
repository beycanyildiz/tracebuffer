import { TrackerEvent } from './types';
import { isMaskedElement, getOrCreateNodeId } from './dom-serializer';

export type EventCallback = (event: TrackerEvent) => void;

export class EventTracker {
  private onEvent: EventCallback;
  private listeners: Array<{ target: EventTarget; type: string; handler: EventListener }> = [];
  private lastMouseMove = 0;

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent;
  }

  public start(): void {
    this.addListener(window, 'click', this.handleClick.bind(this), true);
    this.addListener(window, 'input', this.handleInput.bind(this), true);
    this.addListener(window, 'scroll', this.handleScroll.bind(this), true);
    this.addListener(window, 'resize', this.handleResize.bind(this));
    this.addListener(window, 'mousemove', this.handleMouseMove.bind(this));
  }

  public stop(): void {
    this.listeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this.listeners = [];
  }

  private addListener(target: EventTarget, type: string, handler: EventListener, useCapture = false): void {
    target.addEventListener(type, handler, useCapture);
    this.listeners.push({ target, type, handler });
  }

  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    const targetId = getOrCreateNodeId(target);

    this.emit('CLICK', {
      x: (e as MouseEvent).clientX,
      y: (e as MouseEvent).clientY,
      tagName: target.tagName,
      targetId,
      selector: this.getElementSelector(target),
    });
  }

  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    if (!target) return;

    const targetId = getOrCreateNodeId(target);
    const value = isMaskedElement(target) ? '***' : target.value;

    this.emit('INPUT', {
      targetId,
      selector: this.getElementSelector(target),
      value,
    });
  }

  private handleScroll(): void {
    this.emit('SCROLL', {
      scrollX: window.scrollX || window.pageXOffset,
      scrollY: window.scrollY || window.pageYOffset,
    });
  }

  private handleResize(): void {
    this.emit('RESIZE', {
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  private handleMouseMove(e: Event): void {
    const now = Date.now();
    if (now - this.lastMouseMove < 100) return; // Throttle to 100ms
    this.lastMouseMove = now;

    const mouseEvent = e as MouseEvent;
    this.emit('MOUSE_MOVE', {
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    });
  }

  private getElementSelector(el: HTMLElement): string {
    if (!el) return '';
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      return `${el.tagName.toLowerCase()}.${el.className.split(' ').join('.')}`;
    }
    return el.tagName.toLowerCase();
  }

  private emit(type: any, data: any): void {
    this.onEvent({
      id: Math.random().toString(36).substr(2, 9),
      type,
      timestamp: Date.now(),
      data,
    });
  }
}
