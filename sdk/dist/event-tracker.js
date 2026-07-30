import { isMaskedElement } from './dom-serializer';
export class EventTracker {
    constructor(onEvent) {
        this.listeners = [];
        this.lastMouseMove = 0;
        this.onEvent = onEvent;
    }
    start() {
        this.addListener(window, 'click', this.handleClick.bind(this), true);
        this.addListener(window, 'input', this.handleInput.bind(this), true);
        this.addListener(window, 'scroll', this.handleScroll.bind(this), true);
        this.addListener(window, 'resize', this.handleResize.bind(this));
        this.addListener(window, 'mousemove', this.handleMouseMove.bind(this));
    }
    stop() {
        this.listeners.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        this.listeners = [];
    }
    addListener(target, type, handler, useCapture = false) {
        target.addEventListener(type, handler, useCapture);
        this.listeners.push({ target, type, handler });
    }
    handleClick(e) {
        const target = e.target;
        if (!target)
            return;
        this.emit('CLICK', {
            x: e.clientX,
            y: e.clientY,
            tagName: target.tagName,
            targetId: target.getAttribute('data-sr-id') || null,
            selector: this.getElementSelector(target),
        });
    }
    handleInput(e) {
        const target = e.target;
        if (!target)
            return;
        const value = isMaskedElement(target) ? '***' : target.value;
        this.emit('INPUT', {
            targetId: target.getAttribute('data-sr-id') || null,
            selector: this.getElementSelector(target),
            value,
        });
    }
    handleScroll() {
        this.emit('SCROLL', {
            scrollX: window.scrollX || window.pageXOffset,
            scrollY: window.scrollY || window.pageYOffset,
        });
    }
    handleResize() {
        this.emit('RESIZE', {
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }
    handleMouseMove(e) {
        const now = Date.now();
        if (now - this.lastMouseMove < 100)
            return; // Throttle to 100ms
        this.lastMouseMove = now;
        const mouseEvent = e;
        this.emit('MOUSE_MOVE', {
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
        });
    }
    getElementSelector(el) {
        if (el.id)
            return `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
            return `${el.tagName.toLowerCase()}.${el.className.split(' ').join('.')}`;
        }
        return el.tagName.toLowerCase();
    }
    emit(type, data) {
        this.onEvent({
            id: Math.random().toString(36).substr(2, 9),
            type,
            timestamp: Date.now(),
            data,
        });
    }
}
//# sourceMappingURL=event-tracker.js.map