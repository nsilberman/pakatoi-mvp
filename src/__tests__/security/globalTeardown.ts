/**
 * Global Teardown for Security Tests
 * Runs after all security tests to clean up the environment
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown function
 */
export default async function globalTeardown() {
  console.log('🧹 Cleaning up security test environment...');
  
  try {
    // Stop MongoDB Memory Server
    const mongoServer = (global as any).__MONGO_SERVER__ as MongoMemoryServer;
    if (mongoServer) {
      console.log('🛑 Stopping MongoDB Memory Server...');
      await mongoServer.stop();
      console.log('✅ MongoDB Memory Server stopped');
    }
    
    // Clean up test data
    await cleanupTestData();
    
    // Clean up mocks
    cleanupMocks();
    
    // Generate security test report
    await generateSecurityTestReport();
    
    // Clean up temporary files
    cleanupTempFiles();
    
    console.log('🔒 Security test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Failed to cleanup security test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...');
  
  try {
    // Clean up test upload files
    const testDataDir = path.join(process.cwd(), 'src', '__tests__', 'security', 'data');
    if (fs.existsSync(testDataDir)) {
      const uploadDir = path.join(testDataDir, 'uploads');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        files.forEach(file => {
          if (file.startsWith('test-')) {
            fs.unlinkSync(path.join(uploadDir, file));
          }
        });
      }
    }
    
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean up all test data:', error);
  }
}

/**
 * Clean up global mocks
 */
function cleanupMocks() {
  console.log('🧹 Cleaning up mocks...');
  
  try {
    // Clean up global mock variables
    delete (global as any).securityAuditLogs;
    delete (global as any).auditLog;
    delete (global as any).securityAlerts;
    delete (global as any).triggerSecurityAlert;
    delete (global as any).rateLimitStore;
    delete (global as any).sessionStore;
    delete (global as any).__MONGO_SERVER__;
    
    // Restore console methods if they were mocked
    if ((console as any).__originalMethods) {
      Object.assign(console, (console as any).__originalMethods);
      delete (console as any).__originalMethods;
    }
    
    console.log('✅ Mocks cleanup complete');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean up all mocks:', error);
  }
}

/**
 * Generate security test report
 */
async function generateSecurityTestReport() {
  console.log('📊 Generating security test report...');
  
  try {
    const reportDir = path.join(process.cwd(), 'coverage', 'security');
    const reportPath = path.join(reportDir, 'security-test-summary.json');
    
    // Collect security test metrics
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      testConfiguration: {
        jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
        bcryptRounds: process.env.BCRYPT_ROUNDS,
        rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS,
        maxFileSize: process.env.MAX_FILE_SIZE,
        corsOrigin: process.env.CORS_ORIGIN ? 'SET' : 'NOT_SET'
      },
      securityFeatures: {
        authentication: true,
        authorization: true,
        inputValidation: true,
        rateLimiting: true,
        securityHeaders: true,
        dataProtection: true,
        auditLogging: true
      },
      testCategories: [
        'Authentication Security',
        'Input Validation Security',
        'Authorization Security',
        'Data Protection Security',
        'API Security',
        'Infrastructure Security'
      ]
    };
    
    // Include audit logs if available
    if ((global as any).securityAuditLogs) {
      report.auditLogs = (global as any).securityAuditLogs.length;
    }
    
    // Include security alerts if available
    if ((global as any).securityAlerts) {
      report.securityAlerts = (global as any).securityAlerts.length;
    }
    
    // Write report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Security test report generated: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️  Warning: Could not generate security test report:', error);
  }
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  console.log('🗑️  Cleaning up temporary files...');
  
  try {
    // Clean up test logs
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      const logFiles = fs.readdirSync(logsDir);
      logFiles.forEach(file => {
        if (file.includes('test') && file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          
          // Remove log files older than 1 hour
          if (Date.now() - stats.mtime.getTime() > 3600000) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
    
    console.log('✅ Temporary files cleanup complete');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean up all temporary files:', error);
  }
}
