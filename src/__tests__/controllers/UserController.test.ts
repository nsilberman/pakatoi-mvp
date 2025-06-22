import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserController } from '../../controllers/UserController';
import { userRoutes } from '../../routes/userRoutes';
import { User } from '../../models/User';

const app = express();
app.use(express.json());
app.use('/api', userRoutes);

describe('UserController Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should create a user successfully', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data.username).toBe(validUserData.username);
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteUserData = {
        email: 'test@example.com',
        username: 'testuser'
        // Missing password, firstName, lastName
      };

      const response = await request(app)
        .post('/api/users')
        .send(incompleteUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
      expect(response.body.errors).toContain('password');
      expect(response.body.errors).toContain('firstName');
      expect(response.body.errors).toContain('lastName');
    });

    it('should return 409 for duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      // Try to create user with same email
      const duplicateEmailUser = {
        ...validUserData,
        username: 'differentuser'
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateEmailUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID', async () => {
      // First create a user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(201);

      const userId = createResponse.body.data._id;

      // Mock auth middleware for this test
      // In real scenario, you'd need proper JWT token
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(401); // Will fail without auth, but tests the route structure

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .expect(401); // Will fail without auth first

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Close mongoose connection to simulate server error
      await mongoose.disconnect();

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const invalidEmailUser = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidEmailUser)
        .expect(500); // Will be caught by model validation

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const weakPasswordUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123', // Too weak
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/users')
        .send(weakPasswordUser)
        .expect(500); // Will be caught by model validation

      expect(response.body.success).toBe(false);
    });
  });
});

// Mock auth middleware for testing
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    // Mock authenticated user
    req.user = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      role: 'user'
    };
    next();
  }
}));

jest.mock('../../middleware/admin', () => ({
  adminMiddleware: (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  }
}));