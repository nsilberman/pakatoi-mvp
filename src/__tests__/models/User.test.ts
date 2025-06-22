import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, IUserCreate } from '../../models/User';

describe('User Model Tests', () => {
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

  describe('User Creation', () => {
    const validUserData: IUserCreate = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should create a user with valid data', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(validUserData.email);
      expect(savedUser.username).toBe(validUserData.username);
      expect(savedUser.firstName).toBe(validUserData.firstName);
      expect(savedUser.lastName).toBe(validUserData.lastName);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.isVerified).toBe(false);
      expect(savedUser.role).toBe('user');
    });

    it('should not create a user with invalid email', async () => {
      const invalidUser = new User({
        ...validUserData,
        email: 'invalid-email'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    it('should not create a user with short username', async () => {
      const invalidUser = new User({
        ...validUserData,
        username: 'ab'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    it('should not create a user with short password', async () => {
      const invalidUser = new User({
        ...validUserData,
        password: '123'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    it('should not create users with duplicate email', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        ...validUserData,
        username: 'differentuser'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should not create users with duplicate username', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        ...validUserData,
        email: 'different@example.com'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Schema Validation', () => {
    it('should require all mandatory fields', async () => {
      const user = new User({});
      const validationError = user.validateSync();

      expect(validationError?.errors.email).toBeDefined();
      expect(validationError?.errors.username).toBeDefined();
      expect(validationError?.errors.password).toBeDefined();
      expect(validationError?.errors.firstName).toBeDefined();
      expect(validationError?.errors.lastName).toBeDefined();
    });

    it('should validate email format', async () => {
      const user = new User({
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const validationError = user.validateSync();
      expect(validationError?.errors.email).toBeDefined();
    });

    it('should validate username format', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'test user!', // Invalid characters
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const validationError = user.validateSync();
      expect(validationError?.errors.username).toBeDefined();
    });
  });

  describe('User JSON Transformation', () => {
    it('should exclude password from JSON output', async () => {
      const userData: IUserCreate = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const userJson = savedUser.toJSON();

      expect(userJson.password).toBeUndefined();
      expect(userJson.email).toBe(userData.email);
      expect(userJson.username).toBe(userData.username);
    });
  });

  describe('User Preferences', () => {
    it('should set default preferences', async () => {
      const userData: IUserCreate = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.preferences.notifications.email).toBe(true);
      expect(savedUser.preferences.notifications.push).toBe(true);
      expect(savedUser.preferences.notifications.sms).toBe(false);
      expect(savedUser.preferences.privacy.profileVisible).toBe(true);
      expect(savedUser.preferences.privacy.showEmail).toBe(false);
    });
  });
});