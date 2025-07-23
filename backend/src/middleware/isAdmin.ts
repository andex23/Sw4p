import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabaseClient } from '../services/database';
import { createApiError } from './errorHandler';

// JWT secret must be provided in environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to verify admin JWT token and ensure user has admin role
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw createApiError('No token provided', 401, 'UNAUTHORIZED');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (!decoded || !decoded.userId || !decoded.email) {
      throw createApiError('Invalid token', 401, 'UNAUTHORIZED');
    }

    // Get user from database
    const db = getDatabaseClient();
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createApiError('User not found', 404, 'NOT_FOUND');
    }

    if (user.role !== 'admin') {
      throw createApiError('User is not an admin', 403, 'FORBIDDEN');
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createApiError('Invalid token', 401, 'UNAUTHORIZED'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to verify user JWT token
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw createApiError('No token provided', 401, 'UNAUTHORIZED');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (!decoded || !decoded.userId || !decoded.email) {
      throw createApiError('Invalid token', 401, 'UNAUTHORIZED');
    }

    // Get user from database
    const db = getDatabaseClient();
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createApiError('User not found', 404, 'NOT_FOUND');
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createApiError('Invalid token', 401, 'UNAUTHORIZED'));
    } else {
      next(error);
    }
  }
}; 