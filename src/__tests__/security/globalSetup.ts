/**
 * Global Setup for Security Tests
 * Runs before all security tests to prepare the environment
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Global variables
let mongoServer: MongoMemoryServer;

/**
 * Global setup function
 */
export default async function globalSetup() {
  console.log('🔒 Setting up security test environment...');
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Create coverage directory
    const coverageDir = path.join(process.cwd(), 'coverage', 'security');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    // Start MongoDB Memory Server
    console.log('📦 Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'pakatoi-security-test'
      },
      binary: {
        version: '5.0.0'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    
    console.log(`📊 MongoDB Memory Server started: ${mongoUri}`);
    
    // Test database connection
    await mongoose.connect(mongoUri);
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database connection verified');
    await mongoose.disconnect();
    
    // Setup security test data
    await setupSecurityTestData();
    
    // Initialize security monitoring mocks
    setupSecurityMonitoringMocks();
    
    // Setup test timeouts and limits
    setupTestLimits();
    
    console.log('🔒 Security test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup security test environment:', error);
    throw error;
  }
}

/**
 * Setup security test data
 */
async function setupSecurityTestData() {
  console.log('📝 Setting up security test data...');
  
  // Create test data directory
  const testDataDir = path.join(process.cwd(), 'src', '__tests__', 'security', 'data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  // Create test certificates for SSL testing (mock)
  const certDir = path.join(testDataDir, 'certs');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
    
    // Create mock certificate files
    fs.writeFileSync(path.join(certDir, 'test-cert.pem'), 'MOCK CERTIFICATE');
    fs.writeFileSync(path.join(certDir, 'test-key.pem'), 'MOCK PRIVATE KEY');
  }
  
  // Create test upload directory
  const uploadDir = path.join(testDataDir, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  console.log('✅ Security test data setup complete');
}

/**
 * Setup security monitoring mocks
 */
function setupSecurityMonitoringMocks() {
  console.log('🔍 Setting up security monitoring mocks...');
  
  // Mock audit logger
  (global as any).securityAuditLogs = [];
  (global as any).auditLog = (action: string, details: any) => {
    (global as any).securityAuditLogs.push({
      action,
      details,
      timestamp: new Date(),
      testRun: true
    });
  };
  
  // Mock security alerts
  (global as any).securityAlerts = [];
  (global as any).triggerSecurityAlert = (type: string, details: any) => {
    (global as any).securityAlerts.push({
      type,
      details,
      timestamp: new Date(),
      testRun: true
    });
  };
  
  // Mock rate limiting storage
  (global as any).rateLimitStore = new Map();
  
  // Mock session storage
  (global as any).sessionStore = new Map();
  
  console.log('✅ Security monitoring mocks setup complete');
}

/**
 * Setup test limits and timeouts
 */
function setupTestLimits() {
  console.log('⏱️  Setting up test limits...');
  
  // Set global test timeout
  jest.setTimeout(60000); // 60 seconds for security tests
  
  // Setup memory limits for DoS tests
  if (process.env.NODE_OPTIONS && !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS} --max-old-space-size=2048`;
  }
  
  // Setup file descriptor limits
  try {
    process.setMaxListeners(100);
  } catch (error) {
    console.warn('Could not set max listeners:', error);
  }
  
  console.log('✅ Test limits setup complete');
}

/**
 * Export MongoDB server instance for cleanup
 */
(global as any).__MONGO_SERVER__ = mongoServer;
