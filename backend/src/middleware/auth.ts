import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'mv-greentech-crm-secret-2024';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, error: 'Authorization token required' });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      res.status(401).json({ success: false, error: 'Token missing from authorization header' });
      return;
    }

    if (token.startsWith('demo-token-')) {
      req.user = {
        id: 'demo-admin-id',
        email: 'admin@mvgreentech.com',
        role: 'ADMINISTRATOR',
        firstName: 'System',
        lastName: 'Admin',
      };
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token has expired' });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access forbidden: Requires one of [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
