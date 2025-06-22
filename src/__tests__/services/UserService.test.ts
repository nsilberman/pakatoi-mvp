import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserService } from '../../services/UserService';
import { User, IUserCreate } from '../../models/User';
import { ValidationError } from '../../utils/errors';
import bcrypt from 'bcryptjs';

describe('UserService Tests', () => {
  let mongoServer: MongoMemoryServer;
  let userService: UserService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    userService = new UserService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('createUser', () => {
    const validUserData: IUserCreate = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should create a user successfully', async () => {
      const user = await userService.createUser(validUserData);

      expect(user).toBeDefined();
      expect(user.email).toBe(validUserData.email);
      expect(user.username).toBe(validUserData.username);
      expect(user.firstName).toBe(validUserData.firstName);
      expect(user.lastName).toBe(validUserData.lastName);
      expect(user.isActive).toBe(true);
      expect(user.isVerified).toBe(false);
      expect(user.role).toBe('user');

      // Password should be hashed
      expect(user.password).not.toBe(validUserData.password);
      const isPasswordValid = await bcrypt.compare(validUserData.password, user.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should throw ValidationError for duplicate email', async () => {
      await userService.createUser(validUserData);

      const duplicateEmailUser: IUserCreate = {
        ...validUserData,
        username: 'differentuser'
      };

      await expect(userService.createUser(duplicateEmailUser))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for duplicate username', async () => {
      await userService.createUser(validUserData);

      const duplicateUsernameUser: IUserCreate = {
        ...validUserData,
        email: 'different@example.com'
      };

      await expect(userService.createUser(duplicateUsernameUser))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const createdUser = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const foundUser = await userService.getUserById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(createdUser.email);
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const user = await userService.getUserById(nonExistentId);
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const createdUser = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const foundUser = await userService.getUserByEmail('test@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(createdUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      // Create test users
      await userService.createUser({
        email: 'user1@example.com',
        username: 'user1',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      await userService.createUser({
        email: 'user2@example.com',
        username: 'user2',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith'
      });
    });

    it('should return paginated users', async () => {
      const result = await userService.getAllUsers({
        page: 1,
        limit: 10
      });

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
    });

    it('should search users by name', async () => {
      const result = await userService.getAllUsers({
        page: 1,
        limit: 10,
        search: 'Jane'
      });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].firstName).toBe('Jane');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const createdUser = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const updatedUser = await userService.updateUser(createdUser.id, {
        firstName: 'Johnny',
        lastName: 'Doe-Updated'
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe('Johnny');
      expect(updatedUser?.lastName).toBe('Doe-Updated');
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updatedUser = await userService.updateUser(nonExistentId, {
        firstName: 'Updated'
      });
      expect(updatedUser).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const createdUser = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const result = await userService.deleteUser(createdUser.id);
      expect(result).toBe(true);

      // User should still exist but be inactive
      const deletedUser = await User.findById(createdUser.id);
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.isActive).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Password123!';
      const createdUser = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password,
        firstName: 'John',
        lastName: 'Doe'
      });

      const isValid = await userService.verifyPassword(createdUser.id, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const createdUser = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      const isValid = await userService.verifyPassword(createdUser.id, 'WrongPassword!');
      expect(isValid).toBe(false);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      await userService.createUser({
        email: 'user1@example.com',
        username: 'user1',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      await userService.createUser({
        email: 'user2@example.com',
        username: 'user2',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith'
      });

      const stats = await userService.getUserStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(2);
      expect(stats.verifiedUsers).toBe(0);
      expect(stats.adminUsers).toBe(0);
    });
  });
});