import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';

export const getMentorDashboard = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: { include: { profile: true } },
        courses: true,
      },
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    // 1. Total students assigned to this mentor
    const studentsCount = await prisma.student.count({
      where: { mentorId: mentor.id },
    });

    // 2. Today's live classes scheduled under this mentor
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayClasses = await prisma.timetable.findMany({
      where: {
        mentorName: mentor.user.profile?.name || mentor.user.email,
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        batch: true,
      },
    });

    // 3. Pending assignments to evaluate
    const pendingAssignments = await prisma.assignmentSubmission.findMany({
      where: {
        student: { mentorId: mentor.id },
        gradedBy: null,
      },
      include: {
        assignment: true,
        student: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    // 4. Students with pending or overdue fees (EMIs)
    const feePendingStudents = await prisma.student.findMany({
      where: {
        mentorId: mentor.id,
        emis: {
          some: {
            status: { in: ['PENDING', 'OVERDUE'] },
          },
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        emis: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
        },
      },
    });

    // 5. Active student-mentor chat count
    const activeChatsCount = await prisma.chat.count({
      where: {
        mentorId: mentor.id,
      },
    });

    res.json({
      mentorName: mentor.user.profile?.name || mentor.user.email,
      studentsAssigned: studentsCount,
      todayClasses,
      pendingAssignmentsCount: pendingAssignments.length,
      pendingAssignmentsList: pendingAssignments.map((pa) => ({
        submissionId: pa.id,
        studentName: pa.student.user.profile?.name || pa.student.user.email,
        assignmentTitle: pa.assignment.title,
        submitTime: pa.submitTime,
        fileUrl: pa.fileUrl,
      })),
      feePendingStudentsList: feePendingStudents.map((fps) => ({
        studentName: fps.user.profile?.name || fps.user.email,
        remainingBalance: fps.remainingBalance,
        pendingEmisCount: fps.emis.length,
      })),
      activeChats: activeChatsCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createMentor = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, mobile, courseIds = [] } = req.body;

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId: `NW-EMP-${email.split('@')[0]}` }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Mentor or Employee profile already exists' });
    }

    const hash = await bcrypt.hash(password || 'NxtWave@123', 10);
    const count = await prisma.user.count({ where: { role: 'MENTOR' } });
    const employeeId = `NW-EMP-${5000 + count}`;

    const newMentor = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: 'MENTOR',
        employeeId,
        profile: {
          create: {
            name,
            mobile,
          },
        },
        mentor: {
          create: {
            courses: {
              connect: courseIds.map((id: string) => ({ id })),
            },
          },
        },
      },
      include: {
        profile: true,
        mentor: true,
      },
    });

    await logActivity(
      req.user?.userId || null,
      'MENTOR_CREATE',
      `Created mentor user account ${email} with ID ${employeeId}`
    );

    res.status(201).json({
      message: 'Mentor account created successfully',
      mentor: newMentor,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMentorsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mentors = await prisma.mentor.findMany({
      include: {
        user: { include: { profile: true } },
        courses: true,
        students: true,
      },
    });

    const list = mentors.map((m) => ({
      id: m.id,
      employeeId: m.user.employeeId,
      name: m.user.profile?.name || m.user.email,
      email: m.user.email,
      mobile: m.user.profile?.mobile,
      courses: m.courses.map((c) => c.title),
      studentsCount: m.students.length,
    }));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
