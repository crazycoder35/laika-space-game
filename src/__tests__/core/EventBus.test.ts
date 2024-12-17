import { EventBus } from '../../core/EventBus';
import { Test } from '../../testing/TestSuite';
import { GameEvent } from '../../types/SystemTypes';

interface TestEvent extends GameEvent {
  type: 'TEST_EVENT';
  payload: {
    value: number;
  };
}

interface ComplexEvent extends GameEvent {
  type: 'COMPLEX_EVENT';
  payload: {
    nested: {
      value: number;
      array: string[];
    };
  };
}

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should emit and receive events', async () => {
    const test = new Test('emit and receive', async () => {
      let receivedValue = 0;
      const testEvent: TestEvent = {
        type: 'TEST_EVENT',
        payload: { value: 42 }
      };

      eventBus.on<TestEvent>('TEST_EVENT', (event) => {
        receivedValue = event.payload.value;
      });

      eventBus.emit(testEvent);
      expect(receivedValue).toBe(42);
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle multiple subscribers', async () => {
    const test = new Test('multiple subscribers', async () => {
      let count = 0;
      const testEvent: TestEvent = {
        type: 'TEST_EVENT',
        payload: { value: 1 }
      };

      // Add multiple subscribers
      eventBus.on<TestEvent>('TEST_EVENT', () => count++);
      eventBus.on<TestEvent>('TEST_EVENT', () => count++);
      eventBus.on<TestEvent>('TEST_EVENT', () => count++);

      eventBus.emit(testEvent);
      expect(count).toBe(3);
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should remove subscribers correctly', async () => {
    const test = new Test('remove subscribers', async () => {
      let count = 0;
      const handler = () => count++;
      const testEvent: TestEvent = {
        type: 'TEST_EVENT',
        payload: { value: 1 }
      };

      // Add and then remove a subscriber
      eventBus.on<TestEvent>('TEST_EVENT', handler);
      eventBus.emit(testEvent);
      expect(count).toBe(1);

      eventBus.off<TestEvent>('TEST_EVENT', handler);
      eventBus.emit(testEvent);
      expect(count).toBe(1); // Count should not increase
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should clear all subscribers', async () => {
    const test = new Test('clear subscribers', async () => {
      let count = 0;
      const testEvent: TestEvent = {
        type: 'TEST_EVENT',
        payload: { value: 1 }
      };

      // Add multiple subscribers
      eventBus.on<TestEvent>('TEST_EVENT', () => count++);
      eventBus.on<TestEvent>('TEST_EVENT', () => count++);

      eventBus.clear();
      eventBus.emit(testEvent);
      expect(count).toBe(0); // No handlers should be called
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle events with different payloads', async () => {
    const test = new Test('different payloads', async () => {
      const values: number[] = [];
      
      eventBus.on<TestEvent>('TEST_EVENT', (event) => {
        values.push(event.payload.value);
      });

      eventBus.emit<TestEvent>({ type: 'TEST_EVENT', payload: { value: 1 } });
      eventBus.emit<TestEvent>({ type: 'TEST_EVENT', payload: { value: 2 } });
      eventBus.emit<TestEvent>({ type: 'TEST_EVENT', payload: { value: 3 } });

      expect(values).toEqual([1, 2, 3]);
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle type safety with generics', async () => {
    const test = new Test('type safety', async () => {
      let receivedValue: number | undefined;
      
      // This should compile and work with correct type inference
      eventBus.on<TestEvent>('TEST_EVENT', (event) => {
        receivedValue = event.payload.value;
      });

      eventBus.emit<TestEvent>({
        type: 'TEST_EVENT',
        payload: { value: 42 }
      });

      expect(receivedValue).toBe(42);
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle complex nested event data', async () => {
    const test = new Test('complex data', async () => {
      let receivedData: any;
      
      eventBus.on<ComplexEvent>('COMPLEX_EVENT', (event) => {
        receivedData = event.payload.nested;
      });

      const complexData = {
        value: 42,
        array: ['a', 'b', 'c']
      };

      eventBus.emit<ComplexEvent>({
        type: 'COMPLEX_EVENT',
        payload: { nested: complexData }
      });

      expect(receivedData).toEqual(complexData);
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle high volume of events', async () => {
    const test = new Test('high volume', async () => {
      let count = 0;
      const NUM_EVENTS = 10000;
      
      eventBus.on<TestEvent>('TEST_EVENT', () => {
        count++;
      });

      const startTime = performance.now();
      
      // Emit many events
      for (let i = 0; i < NUM_EVENTS; i++) {
        eventBus.emit<TestEvent>({
          type: 'TEST_EVENT',
          payload: { value: i }
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(count).toBe(NUM_EVENTS);
      expect(duration).toBeLessThan(1000); // Should process 10k events in under 1 second
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle subscriber cleanup properly', async () => {
    const test = new Test('memory cleanup', async () => {
      let count = 0;
      const NUM_SUBSCRIBERS = 1000;
      const handlers: Array<() => void> = [];
      
      // Add many subscribers
      for (let i = 0; i < NUM_SUBSCRIBERS; i++) {
        const handler = () => count++;
        handlers.push(handler);
        eventBus.on<TestEvent>('TEST_EVENT', handler);
      }

      // Remove all subscribers
      handlers.forEach(handler => {
        eventBus.off<TestEvent>('TEST_EVENT', handler);
      });

      // Emit event
      eventBus.emit<TestEvent>({
        type: 'TEST_EVENT',
        payload: { value: 1 }
      });

      expect(count).toBe(0); // No handlers should be called
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });

  it('should handle concurrent event emissions', async () => {
    const test = new Test('concurrent events', async () => {
      const receivedValues = new Set<number>();
      const NUM_CONCURRENT = 100;
      
      eventBus.on<TestEvent>('TEST_EVENT', (event) => {
        receivedValues.add(event.payload.value);
      });

      // Emit events concurrently
      await Promise.all(
        Array.from({ length: NUM_CONCURRENT }, (_, i) => 
          Promise.resolve().then(() => 
            eventBus.emit<TestEvent>({
              type: 'TEST_EVENT',
              payload: { value: i }
            })
          )
        )
      );

      expect(receivedValues.size).toBe(NUM_CONCURRENT);
    });

    const result = await test.run();
    expect(result.success).toBe(true);
  });
}); 