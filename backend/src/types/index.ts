import { Request } from 'express';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  studentId?: string;
  employeeId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
