import mongoose from 'mongoose';

// Setup for all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
});

// Cleanup after all tests
afterAll(async () => {
  // Close any remaining connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

// Global test timeout
jest.setTimeout(30000);