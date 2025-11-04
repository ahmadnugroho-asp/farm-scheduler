// Test setup file - runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SHEET_ID = 'test-sheet-id-123';
process.env.PORT = '0'; // Random port for testing

// Suppress console output during tests (optional)
// Comment out if you want to see console logs during tests
global.console = {
  ...console,
  // Keep native behaviour for other methods
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(() => {
  // Close any open connections, cleanup resources, etc.
});
