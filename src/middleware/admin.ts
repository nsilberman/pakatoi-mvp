import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ApiResponse } from '../types/ApiResponse';

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    } as ApiResponse);
  }
};