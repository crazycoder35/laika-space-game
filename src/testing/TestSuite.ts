export interface TestResult {
  success: boolean;
  error?: Error;
  duration?: number;
}

export class Test {
  constructor(
    public readonly name: string,
    public readonly fn: () => Promise<void>
  ) {}

  async run(): Promise<TestResult> {
    const startTime = performance.now();
    try {
      await this.fn();
      return {
        success: true,
        duration: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: performance.now() - startTime
      };
    }
  }
}

export class TestSuite {
  constructor(
    public readonly name: string,
    public readonly tests: Test[]
  ) {}

  async beforeAll(): Promise<void> {}
  async afterAll(): Promise<void> {}
  async beforeEach(): Promise<void> {}
  async afterEach(): Promise<void> {}

  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    try {
      await this.beforeAll();

      for (const test of this.tests) {
        await this.beforeEach();
        const result = await test.run();
        results.push(result);
        await this.afterEach();
      }

      await this.afterAll();
    } catch (error) {
      console.error(`Error in test suite ${this.name}:`, error);
    }

    return results;
  }

  addTest(name: string, fn: () => Promise<void>): void {
    this.tests.push(new Test(name, fn));
  }
} 