import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'apex-school-portal-jwt-secret-key-2025';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  studentId?: string;
  teacherId?: string;
  administratorId?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // Verify user still exists and is ACTIVE in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        student: true,
        teacher: true,
        administrator: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account is inactive or does not exist.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
      administratorId: user.administrator?.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};
