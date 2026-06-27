import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';

// Fetch Messages in a Chat Room
export const getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: {
                  select: { name: true, profilePhoto: true },
                },
              },
            },
          },
        },
      },
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    res.json(chat.messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Start or Get Existing Direct Chat
export const startDirectChat = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, mentorId, isAdmin = false } = req.body;

  try {
    // Look for existing chat
    let chat = await prisma.chat.findFirst({
      where: {
        studentId: studentId || null,
        mentorId: mentorId || null,
        isAdmin,
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          studentId: studentId || undefined,
          mentorId: mentorId || undefined,
          isAdmin,
        },
      });
    }

    res.json(chat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch User's Active Rooms
export const getActiveChats = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { userId, role } = req.user;

    let chats: any[] = [];
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) {
        chats = await prisma.chat.findMany({
          where: { studentId: student.id },
          include: {
            mentor: { include: { user: { include: { profile: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });
      }
    } else if (role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({ where: { userId } });
      if (mentor) {
        chats = await prisma.chat.findMany({
          where: { mentorId: mentor.id },
          include: {
            student: { include: { user: { include: { profile: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });
      }
    } else {
      // Admins get active chats
      chats = await prisma.chat.findMany({
        where: { isAdmin: true },
        include: {
          student: { include: { user: { include: { profile: true } } } },
          mentor: { include: { user: { include: { profile: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }

    res.json(chats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
