// Extend Jest matchers
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Set test timeout
jest.setTimeout(10000);

// Add TextEncoder and TextDecoder to the global scope
Object.assign(global, { TextEncoder, TextDecoder });

// Mock ReadableStream if not defined
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined })
      };
    }
  } as any;
}

// Mock WritableStream if not defined
if (typeof WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {
    constructor() {}
    getWriter() {
      return {
        write: () => Promise.resolve(),
        close: () => Promise.resolve()
      };
    }
  } as any;
}

// Mock Blob and Response if not defined
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(content: any[]) {
      this.content = content;
    }
    content: any[];
    stream() {
      return new ReadableStream();
    }
  } as any;
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body?: any, init?: any) {
      this.body = body;
      this.init = init;
    }
    blob() {
      return Promise.resolve(new Blob([]));
    }
    body: any;
    init: any;
  } as any;
}

// Mock canvas if needed
if (typeof window !== 'undefined') {
  window.HTMLCanvasElement.prototype.getContext = () => null;
}

// Mock localStorage with a proper implementation
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn((i: number) => Object.keys(store)[i] || null),
    _getStore: () => store // Helper for testing
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock CompressionStream and DecompressionStream
class MockCompressionStream {
  readable: any;
  writable: any;
  constructor() {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
  }
}

class MockDecompressionStream {
  readable: any;
  writable: any;
  constructor() {
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
  }
}

Object.defineProperty(window, 'CompressionStream', { value: MockCompressionStream });
Object.defineProperty(window, 'DecompressionStream', { value: MockDecompressionStream });

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global cleanup here
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
}); 