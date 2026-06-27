import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';

// Batch mark attendance (Mentor)
export const markAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { date, subject, records } = req.body; // records: [{ studentId: string, status: PRESENT/ABSENT/LATE/EXCUSED }]
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const attendanceRecords = [];

    for (const record of records) {
      // Upsert: update if already marked on that date/subject, otherwise create
      // Date comparison requires normalized date (without time) or matching date field.
      // We will look for an existing record on same day and subject
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: record.studentId,
          subject,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            markedBy: req.user.userId,
          },
        });
        attendanceRecords.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            studentId: record.studentId,
            date: new Date(date),
            status: record.status,
            subject,
            markedBy: req.user.userId,
          },
        });
        attendanceRecords.push(created);
      }
    }

    await logActivity(
      req.user.userId,
      'ATTENDANCE_MARKED',
      `Marked attendance for batch of ${records.length} students on ${date} for ${subject}`
    );

    res.json({ message: 'Attendance marked successfully', recordsCount: attendanceRecords.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve detailed student logs & stats (Student Dashboard)
export const getStudentAttendanceStats = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Access denied: Students only' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const records = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
    });

    // Counts
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;

    // Subject wise aggregation
    const subjectsMap: Record<string, { total: number; present: number }> = {};
    records.forEach((r) => {
      if (!subjectsMap[r.subject]) {
        subjectsMap[r.subject] = { total: 0, present: 0 };
      }
      subjectsMap[r.subject].total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        subjectsMap[r.subject].present += 1;
      }
    });

    const subjectStats = Object.keys(subjectsMap).map((sub) => ({
      subject: sub,
      total: subjectsMap[sub].total,
      present: subjectsMap[sub].present,
      percentage: Math.round((subjectsMap[sub].present / subjectsMap[sub].total) * 100),
    }));

    res.json({
      summary: {
        total,
        present,
        late,
        absent,
        excused,
        overallPercentage: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
      },
      subjectStats,
      calendarLogs: records.map((r) => ({
        id: r.id,
        date: r.date,
        status: r.status,
        subject: r.subject,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve Batch Wise Attendance report
export const getBatchAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { batchId, date } = req.query;

  try {
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    const students = await prisma.student.findMany({
      where: { batchId: batchId as string },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        attendances: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    const result = students.map((s) => ({
      studentId: s.id,
      studentIdNum: s.user.studentId,
      name: s.user.profile?.name || s.user.email,
      status: s.attendances[0]?.status || 'ABSENT', // Default to absent if not marked
      subject: s.attendances[0]?.subject || 'Class',
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
