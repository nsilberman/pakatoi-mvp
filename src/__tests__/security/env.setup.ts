/**
 * Environment Setup for Security Tests
 * Sets up all necessary environment variables for security testing
 */

// Security test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'super-secret-jwt-key-for-testing-only-minimum-32-characters-required';
process.env.BCRYPT_ROUNDS = '12';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pakatoi-security-test';

// Rate limiting configuration
process.env.RATE_LIMIT_WINDOW_MS = '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.LOGIN_RATE_LIMIT_MAX = '5';
process.env.LOGIN_RATE_LIMIT_WINDOW = '900000'; // 15 minutes

// Session configuration
process.env.SESSION_SECRET = 'session-secret-for-testing-only-minimum-32-chars';
process.env.SESSION_TIMEOUT = '1800000'; // 30 minutes
process.env.SESSION_SECURE = 'false'; // Set to false for testing

// CORS configuration
process.env.CORS_ORIGIN = 'https://localhost:3000,https://trusted-domain.com';
process.env.CORS_CREDENTIALS = 'true';

// File upload configuration
process.env.MAX_FILE_SIZE = '5242880'; // 5MB
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/gif';

// API configuration
process.env.API_MAX_REQUEST_SIZE = '10485760'; // 10MB
process.env.API_TIMEOUT = '30000'; // 30 seconds
process.env.MAX_QUERY_PARAMS = '100';

// Security headers configuration
process.env.HSTS_MAX_AGE = '31536000'; // 1 year
process.env.CSP_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";

// Encryption configuration
process.env.ENCRYPTION_KEY = 'encryption-key-for-testing-32-chars';
process.env.ENCRYPTION_ALGORITHM = 'aes-256-gcm';

// Audit logging configuration
process.env.AUDIT_LOG_LEVEL = 'info';
process.env.AUDIT_LOG_FILE = './logs/security-audit-test.log';

// Database security
process.env.DB_SSL = 'false'; // Disabled for testing
process.env.DB_AUTH_SOURCE = 'admin';

// Testing specific
process.env.SILENT_TESTS = 'false'; // Set to true to suppress console output
process.env.SECURITY_TEST_MODE = 'true';

// Mock external services
process.env.MOCK_EXTERNAL_SERVICES = 'true';
process.env.EXTERNAL_API_TIMEOUT = '5000';

// Performance testing
process.env.MAX_CONCURRENT_REQUESTS = '100';
process.env.REQUEST_TIMEOUT = '30000';

// Monitoring and alerting (mock values for testing)
process.env.SECURITY_MONITOR_ENABLED = 'true';
process.env.ALERT_THRESHOLD_FAILED_LOGINS = '10';
process.env.ALERT_THRESHOLD_RATE_LIMIT = '50';

// Development/Debug settings (only for testing)
process.env.DEBUG_SECURITY = 'false';
process.env.VERBOSE_LOGGING = 'false';

// Backup and recovery
process.env.BACKUP_ENABLED = 'false'; // Disabled for testing
process.env.BACKUP_RETENTION_DAYS = '30';

console.log('Security test environment configured');
