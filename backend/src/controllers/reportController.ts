import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';

// Admin dashboard statistics and charts data
export const getAdminDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Core counters
    const totalStudents = await prisma.student.count();
    const activeStudents = await prisma.student.count(); // In a live app, filter by active status
    const activeMentors = await prisma.mentor.count();
    const liveClassesCount = await prisma.timetable.count({
      where: { startTime: { gte: new Date() } },
    });

    // 2. Financial metrics
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const pendingEmis = await prisma.eMI.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      select: { amount: true },
    });
    const pendingRevenue = pendingEmis.reduce((sum, e) => sum + e.amount, 0);

    // 3. Today's attendance count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAttendanceCount = await prisma.attendance.count({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 4. Generate mock/real charts series
    // Revenue over last 6 months
    const revenueChart = [
      { month: 'Jan', revenue: totalRevenue * 0.15 + 10000 },
      { month: 'Feb', revenue: totalRevenue * 0.2 + 12000 },
      { month: 'Mar', revenue: totalRevenue * 0.18 + 11000 },
      { month: 'Apr', revenue: totalRevenue * 0.22 + 15000 },
      { month: 'May', revenue: totalRevenue * 0.25 + 18000 },
      { month: 'Jun', revenue: totalRevenue }, // Current
    ];

    // Admissions trend
    const admissionsChart = [
      { month: 'Jan', students: Math.round(totalStudents * 0.5) },
      { month: 'Feb', students: Math.round(totalStudents * 0.6) },
      { month: 'Mar', students: Math.round(totalStudents * 0.7) },
      { month: 'Apr', students: Math.round(totalStudents * 0.8) },
      { month: 'May', students: Math.round(totalStudents * 0.9) },
      { month: 'Jun', students: totalStudents },
    ];

    // Attendance stats
    const attendanceChart = [
      { day: 'Mon', percentage: 92 },
      { day: 'Tue', percentage: 89 },
      { day: 'Wed', percentage: 95 },
      { day: 'Thu', percentage: 91 },
      { day: 'Fri', percentage: 88 },
    ];

    // Assignment completion rate
    const totalSubmissions = await prisma.assignmentSubmission.count();
    const totalAssignmentsCount = await prisma.assignment.count();
    
    const assignmentChart = [
      { name: 'Completed', value: totalSubmissions },
      { name: 'Pending', value: Math.max(0, (totalStudents * totalAssignmentsCount) - totalSubmissions) },
    ];

    res.json({
      counters: {
        totalStudents,
        activeStudents,
        totalRevenue,
        pendingRevenue,
        todayAttendanceCount,
        activeMentors,
        liveClassesCount,
      },
      charts: {
        revenueChart,
        admissionsChart,
        attendanceChart,
        assignmentChart,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Generate Completion Certificate
export const generateCertificate = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, courseName } = req.body;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { include: { profile: true } } },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const certificateId = `CERT-NW-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const verificationUrl = `https://nxtwave.in/verify-certificate/${certificateId}`;
    
    const cert = await prisma.certificate.create({
      data: {
        studentId,
        courseName,
        certificateId,
        verificationUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${verificationUrl}`,
      },
    });

    await logActivity(
      req.user?.userId || null,
      'CERTIFICATE_GENERATE',
      `Generated completion certificate ${certificateId} for Student ${student.user.email}`
    );

    res.status(201).json({ message: 'Certificate generated successfully', certificate: cert });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Verify Certificate
export const verifyCertificate = async (req: AuthenticatedRequest, res: Response) => {
  const { certificateId } = req.params;

  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
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

    if (!cert) return res.status(404).json({ error: 'Invalid Certificate ID' });

    res.json({
      verified: true,
      studentName: cert.student.user.profile?.name || cert.student.user.email,
      courseName: cert.courseName,
      completionDate: cert.completionDate,
      certificateId: cert.certificateId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve Audit Logs list
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 entries
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
