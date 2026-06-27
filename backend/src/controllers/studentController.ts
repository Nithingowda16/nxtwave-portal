import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';

// Helper to generate next student ID
const generateStudentId = async (): Promise<string> => {
  const count = await prisma.user.count({ where: { role: 'STUDENT' } });
  const index = 1001 + count;
  return `NW-STUD-${index}`;
};

export const getStudentDashboard = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Access denied: Student context required' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        batch: {
          include: {
            mentor: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        course: {
          include: {
            modules: {
              include: {
                chapters: {
                  include: {
                    assignments: true,
                  },
                },
              },
            },
          },
        },
        emis: {
          orderBy: { emiNumber: 'asc' },
        },
        attendances: {
          orderBy: { date: 'desc' },
        },
        submissions: {
          include: {
            assignment: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Calculate progress
    const totalAssignments = student.course.modules.reduce(
      (sum, mod) => sum + mod.chapters.reduce((cSum, chap) => cSum + chap.assignments.length, 0),
      0
    );
    const submittedCount = student.submissions.length;
    const courseProgress = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0;

    // Calculate attendance percentage
    const presentCount = student.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalAttendance = student.attendances.length;
    const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

    // Get upcoming live classes from batch timetable
    const upcomingClasses = await prisma.timetable.findMany({
      where: {
        batchId: student.batchId,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    });

    // Get active announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        targetRole: { in: ['ALL', 'STUDENT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      studentName: student.user.profile?.name || student.user.email,
      studentId: student.user.studentId,
      profilePicture: student.user.profile?.profilePhoto,
      batch: student.batch.name,
      course: student.course.title,
      mentorName: student.batch.mentor?.user.profile?.name || 'Assigned Mentor',
      attendancePercentage,
      courseProgress,
      pendingAssignments: totalAssignments - submittedCount,
      upcomingClasses,
      emis: student.emis,
      announcements,
      attendances: student.attendances,
      submissions: student.submissions,
      feeDetails: {
        totalFee: student.totalFee,
        scholarship: student.scholarship,
        discount: student.discount,
        remainingBalance: student.remainingBalance,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createStudent = async (req: AuthenticatedRequest, res: Response) => {
  const {
    email,
    password,
    name,
    mobile,
    batchId,
    courseId,
    totalFee,
    scholarship = 0,
    discount = 0,
    fatherName,
    motherName,
    address,
    aadhaar,
    college,
    branch,
    semester,
    bloodGroup,
    emergencyContact,
  } = req.body;

  try {
    const studentId = await generateStudentId();
    const hash = await bcrypt.hash(password || 'NxtWave@123', 10);
    const balance = totalFee - scholarship - discount;

    // Generate monthly EMIs
    const emiCount = 6;
    const emiAmount = Number((balance / emiCount).toFixed(2));
    const emisData = [];

    for (let i = 1; i <= emiCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i); // Due date is monthly
      dueDate.setDate(5); // Due on 5th of each month

      emisData.push({
        emiNumber: i,
        dueDate,
        amount: i === emiCount ? Number((balance - emiAmount * (emiCount - 1)).toFixed(2)) : emiAmount,
        status: 'PENDING' as any,
      });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: 'STUDENT',
        studentId,
        profile: {
          create: {
            name,
            mobile,
            fatherName,
            motherName,
            address,
            aadhaar,
            college,
            branch,
            semester,
            bloodGroup,
            emergencyContact,
          },
        },
        student: {
          create: {
            courseId,
            batchId,
            totalFee,
            scholarship,
            discount,
            remainingBalance: balance,
            emis: {
              create: emisData,
            },
          },
        },
      },
      include: {
        profile: true,
        student: true,
      },
    });

    await logActivity(
      req.user?.userId || null,
      'STUDENT_CREATE',
      `Created student account ${email} with ID ${studentId} & auto-generated 6 EMI records`
    );

    res.status(201).json({
      message: 'Student created successfully with EMI schedule',
      student: newUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        batch: true,
        course: true,
        mentor: {
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

    const list = students.map((s) => ({
      id: s.id,
      userId: s.userId,
      studentId: s.user.studentId,
      name: s.user.profile?.name || s.user.email,
      email: s.user.email,
      mobile: s.user.profile?.mobile,
      batch: s.batch.name,
      course: s.course.title,
      mentorName: s.mentor?.user.profile?.name || 'Unassigned',
      balance: s.remainingBalance,
      college: s.user.profile?.college,
      admissionDate: s.user.profile?.admissionDate,
    }));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const assignMentorAndBatch = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, mentorId, batchId } = req.body;

  try {
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        mentorId: mentorId || undefined,
        batchId: batchId || undefined,
      },
    });

    await logActivity(
      req.user?.userId || null,
      'STUDENT_UPDATE_ASSIGNMENT',
      `Reassigned student ${studentId} to Batch ${batchId} and Mentor ${mentorId}`
    );

    res.json({ message: 'Batch/Mentor assigned successfully', student: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStudent = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params; // Student model UUID

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Cascade delete user
    await prisma.user.delete({ where: { id: student.userId } });

    await logActivity(
      req.user?.userId || null,
      'STUDENT_DELETE',
      `Permanently deleted student user with core details`
    );

    res.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
