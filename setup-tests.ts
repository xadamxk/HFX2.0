// Jest setup file for global test configuration

// Mock chrome APIs for extension testing
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    getManifest: jest.fn(() => ({
      name: "Test Extension",
      version: "1.0.0",
      update_url: undefined,
    })),
  },
  extension: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    getBackgroundPage: jest.fn(() => null),
  },
};

// Make chrome available globally
(global as any).chrome = mockChrome;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  log: jest.fn(),
  group: jest.fn(),
  groupCollapsed: jest.fn(),
  groupEnd: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
  timeLog: jest.fn(),
  profile: jest.fn(),
  profileEnd: jest.fn(),
  table: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
