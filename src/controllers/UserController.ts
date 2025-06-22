import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { IUserCreate, IUserUpdate } from '../models/User';
import { ApiResponse } from '../types/ApiResponse';
import { ValidationError } from '../utils/errors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Create a new user
   */
  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: IUserCreate = req.body;
      
      // Validation
      if (!userData.email || !userData.username || !userData.password || !userData.firstName || !userData.lastName) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['email', 'username', 'password', 'firstName', 'lastName']
        } as ApiResponse);
        return;
      }

      const newUser = await this.userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      } as ApiResponse);
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'User already exists',
          errors: [error.message]
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          errors: [error.message]
        } as ApiResponse);
      }
    }
  };

  /**
   * Get user by ID
   */
  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error.message]
      } as ApiResponse);
    }
  };

  /**
   * Get all users with pagination
   */
  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const role = req.query.role as string;
      
      const result = await this.userService.getAllUsers({ page, limit, search, role });
      
      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error.message]
      } as ApiResponse);
    }
  };

  /**
   * Update user
   */
  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: IUserUpdate = req.body;
      
      const updatedUser = await this.userService.updateUser(id, updateData);
      
      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error.message]
      } as ApiResponse);
    }
  };

  /**
   * Delete user (soft delete)
   */
  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const result = await this.userService.deleteUser(id);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error.message]
      } as ApiResponse);
    }
  };

  /**
   * Get user profile (authenticated user)
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // Assuming user ID is available from auth middleware
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        } as ApiResponse);
        return;
      }

      const user = await this.userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error.message]
      } as ApiResponse);
    }
  };

  /**
   * Update user profile
   */
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const updateData: IUserUpdate = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        } as ApiResponse);
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      } as ApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [error.message]
      } as ApiResponse);
    }
  };
}