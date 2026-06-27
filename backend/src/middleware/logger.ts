import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../services/db';

export const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const email = req.user?.email || 'ANONYMOUS';
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) | User: ${email}`);
  });
  next();
};

export const logActivity = async (
  userId: string | null,
  action: string,
  description: string,
  ipAddress?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        description,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });
    console.log(`[Audit Log] ${action}: ${description} | User ID: ${userId || 'SYSTEM'}`);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
