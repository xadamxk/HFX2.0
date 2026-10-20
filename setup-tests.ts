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
      update_url: undefined as string | undefined,
    })),
  },
  extension: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    getBackgroundPage: jest.fn((): Window | null => null),
  },
};

// Make chrome available globally
(global as any).chrome = mockChrome;

// Silence routine logging in tests, but let warnings and errors through
// (React key/act() warnings, unexpected failures) so they show up in the output.
// They are still mocks, so tests can assert on them.
const { warn, error } = console;
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
  warn: jest.fn((...args: any[]) => warn(...args)),
  error: jest.fn((...args: any[]) => error(...args)),
};
