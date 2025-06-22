import bcrypt from 'bcryptjs';
import { User, IUser, IUserCreate, IUserUpdate } from '../models/User';
import { ValidationError, NotFoundError } from '../utils/errors';

export interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export interface GetUsersResult {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class UserService {
  /**
   * Create a new user
   */
  public async createUser(userData: IUserCreate): Promise<IUser> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new ValidationError('Email already exists');
        }
        if (existingUser.username === userData.username) {
          throw new ValidationError('Username already exists');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create new user
      const newUser = new User({
        ...userData,
        password: hashedPassword
      });

      const savedUser = await newUser.save();
      return savedUser;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(id: string): Promise<IUser | null> {
    try {
      const user = await User.findById(id).select('-password');
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  /**
   * Get user by email
   */
  public async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email, isActive: true });
      return user;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error}`);
    }
  }

  /**
   * Get user by username
   */
  public async getUserByUsername(username: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ username, isActive: true }).select('-password');
      return user;
    } catch (error) {
      throw new Error(`Failed to get user by username: ${error}`);
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  public async getAllUsers(options: GetUsersOptions): Promise<GetUsersResult> {
    try {
      const { page, limit, search, role } = options;
      const skip = (page - 1) * limit;

      // Build query
      let query: any = { isActive: true };

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) {
        query.role = role;
      }

      // Get users and total count
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        pages
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error}`);
    }
  }

  /**
   * Update user
   */
  public async updateUser(id: string, updateData: IUserUpdate): Promise<IUser | null> {
    try {
      // Remove password from update data if present
      const { ...safeUpdateData } = updateData;
      delete (safeUpdateData as any).password;

      // Check for email/username uniqueness if being updated
      if (updateData.email || updateData.username) {
        const existingUser = await User.findOne({
          _id: { $ne: id },
          $or: [
            ...(updateData.email ? [{ email: updateData.email }] : []),
            ...(updateData.username ? [{ username: updateData.username }] : [])
          ]
        });

        if (existingUser) {
          if (existingUser.email === updateData.email) {
            throw new ValidationError('Email already exists');
          }
          if (existingUser.username === updateData.username) {
            throw new ValidationError('Username already exists');
          }
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: safeUpdateData },
        { new: true, runValidators: true }
      ).select('-password');

      return updatedUser;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  /**
   * Delete user (soft delete)
   */
  public async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );

      return result !== null;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  /**
   * Verify user password
   */
  public async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return await bcrypt.compare(password, user.password);
    } catch (error) {
      throw new Error(`Failed to verify password: ${error}`);
    }
  }

  /**
   * Update user password
   */
  public async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const result = await User.findByIdAndUpdate(
        userId,
        { $set: { password: hashedPassword } }
      );

      return result !== null;
    } catch (error) {
      throw new Error(`Failed to update password: ${error}`);
    }
  }

  /**
   * Update last login time
   */
  public async updateLastLogin(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $set: { lastLoginAt: new Date() } }
      );
    } catch (error) {
      throw new Error(`Failed to update last login: ${error}`);
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(): Promise<any> {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            verifiedUsers: {
              $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
            },
            adminUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        adminUsers: 0
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error}`);
    }
  }
}