import { EventBus } from './EventBus';

export interface MemoryUsage {
  total: number;
  peak: number;
  detailed: Map<string, number>;
}

export interface MemoryEvent {
  type: 'MEMORY_WARNING' | 'MEMORY_CRITICAL' | 'MEMORY_NORMAL';
  payload: {
    usage: number;
    peak: number;
    threshold: number;
  };
}

export class MemoryManager {
  private allocated: Map<string, number> = new Map();
  private peakUsage: number = 0;
  private warningThreshold: number = 0.7; // 70% of max memory
  private criticalThreshold: number = 0.9; // 90% of max memory
  private lastEventType?: MemoryEvent['type'];

  constructor(private readonly eventBus: EventBus) {
    // Try to get memory info if available in browser
    if (performance && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        this.warningThreshold = memory.jsHeapSizeLimit * 0.7;
        this.criticalThreshold = memory.jsHeapSizeLimit * 0.9;
      }
    }
  }

  public track(id: string, size: number): void {
    this.allocated.set(id, size);
    this.updatePeakUsage();
    this.checkMemoryThresholds();
  }

  public untrack(id: string): void {
    this.allocated.delete(id);
  }

  public getMemoryUsage(): MemoryUsage {
    const total = Array.from(this.allocated.values()).reduce((sum, size) => sum + size, 0);
    return {
      total,
      peak: this.peakUsage,
      detailed: new Map(this.allocated)
    };
  }

  public setThresholds(warning: number, critical: number): void {
    this.warningThreshold = warning;
    this.criticalThreshold = critical;
  }

  private updatePeakUsage(): void {
    const current = Array.from(this.allocated.values()).reduce((sum, size) => sum + size, 0);
    this.peakUsage = Math.max(this.peakUsage, current);
  }

  private checkMemoryThresholds(): void {
    const usage = this.getMemoryUsage().total;
    let eventType: MemoryEvent['type'] | undefined;

    if (usage >= this.criticalThreshold) {
      eventType = 'MEMORY_CRITICAL';
    } else if (usage >= this.warningThreshold) {
      eventType = 'MEMORY_WARNING';
    } else if (this.lastEventType && usage < this.warningThreshold) {
      eventType = 'MEMORY_NORMAL';
    }

    if (eventType && eventType !== this.lastEventType) {
      this.lastEventType = eventType;
      this.eventBus.emit<MemoryEvent>({
        type: eventType,
        payload: {
          usage,
          peak: this.peakUsage,
          threshold: eventType === 'MEMORY_CRITICAL' ? this.criticalThreshold : this.warningThreshold
        }
      });
    }
  }

  public cleanup(): void {
    this.allocated.clear();
    this.peakUsage = 0;
    this.lastEventType = undefined;
  }
} 