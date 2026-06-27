import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, TokenPayload } from '../types';
import prisma from '../services/db';
import { logActivity } from '../middleware/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'nxtwave-super-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'nxtwave-refresh-secret-key-2026';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, role, name, studentId, employeeId, mobile } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          studentId ? { studentId } : {},
          employeeId ? { employeeId } : {},
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this Email, Student ID, or Employee ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        studentId,
        employeeId,
        profile: {
          create: {
            name,
            mobile,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    await logActivity(user.id, 'USER_REGISTERED', `Created new user ${email} with role ${role}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { identity, password } = req.body; // identity can be email, studentId, or employeeId

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identity },
          { studentId: identity },
          { employeeId: identity },
        ],
      },
      include: {
        profile: true,
        student: true,
        mentor: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      studentId: user.studentId || undefined,
      employeeId: user.employeeId || undefined,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    await logActivity(user.id, 'LOGIN', `User logged in from IP ${req.ip}`);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        name: user.profile?.name || user.email,
        profilePhoto: user.profile?.profilePhoto,
        studentDetails: user.student,
        mentorDetails: user.mentor,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const refreshToken = async (req: AuthenticatedRequest, res: Response) => {
  const cookieToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!cookieToken) {
    return res.status(401).json({ error: 'Refresh token missing' });
  }

  try {
    jwt.verify(cookieToken, REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid refresh token' });
      }

      const payload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        studentId: decoded.studentId,
        employeeId: decoded.employeeId,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      res.json({ accessToken });
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await logActivity(req.user.userId, 'LOGOUT', 'User logged out');
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { fatherName, motherName, address, mobile, emergencyContact, profilePhoto } = req.body;

  try {
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.userId },
      data: {
        fatherName,
        motherName,
        address,
        mobile,
        emergencyContact,
        profilePhoto,
      },
    });

    await logActivity(req.user.userId, 'PROFILE_UPDATE', 'Updated personal profile fields');

    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { oldPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await logActivity(user.id, 'PASSWORD_CHANGE', 'User updated password hash');

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
