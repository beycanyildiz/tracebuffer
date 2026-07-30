import { TrackerEvent } from './types';

export class CircularBuffer {
  private buffer: TrackerEvent[] = [];
  private maxCapacity: number;
  private maxAgeMs: number;

  constructor(maxCapacity = 1000, maxAgeMs = 10000) {
    this.maxCapacity = maxCapacity;
    this.maxAgeMs = maxAgeMs;
  }

  public push(event: TrackerEvent): void {
    this.buffer.push(event);
    this.prune();
  }

  public getEvents(): TrackerEvent[] {
    this.prune();
    return [...this.buffer];
  }

  public clear(): void {
    this.buffer = [];
  }

  private prune(): void {
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
