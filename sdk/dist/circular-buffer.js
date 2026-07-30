export class CircularBuffer {
    constructor(maxCapacity = 1000, maxAgeMs = 10000) {
        this.buffer = [];
        this.maxCapacity = maxCapacity;
        this.maxAgeMs = maxAgeMs;
    }
    push(event) {
        this.buffer.push(event);
        this.prune();
    }
    getEvents() {
        this.prune();
        return [...this.buffer];
    }
    clear() {
        this.buffer = [];
    }
    prune() {
        const now = Date.now();
        const cutoff = now - this.maxAgeMs;
        // Prune by age
        while (this.buffer.length > 0 && this.buffer[0].timestamp < cutoff) {
            this.buffer.shift();
        }
        // Prune by capacity
        while (this.buffer.length > this.maxCapacity) {
            this.buffer.shift();
        }
    }
}
//# sourceMappingURL=circular-buffer.js.map