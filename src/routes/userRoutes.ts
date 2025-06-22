import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { validateUserInput } from '../middleware/validation';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/users', validateUserInput, userController.createUser);

// Protected routes (require authentication)
router.get('/users/profile', authMiddleware, userController.getProfile);
router.put('/users/profile', authMiddleware, userController.updateProfile);

// Admin routes (require admin privileges)
router.get('/users', authMiddleware, adminMiddleware, userController.getAllUsers);
router.get('/users/:id', authMiddleware, adminMiddleware, userController.getUserById);
router.put('/users/:id', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, userController.deleteUser);

export { router as userRoutes };