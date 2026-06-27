import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

import {
  register,
  login,
  refreshToken,
  logout,
  updateProfile,
  changePassword,
} from '../controllers/authController';

import {
  getStudentDashboard,
  createStudent,
  getStudentsList,
  assignMentorAndBatch,
  deleteStudent,
} from '../controllers/studentController';

import {
  getMentorDashboard,
  createMentor,
  getMentorsList,
} from '../controllers/mentorController';

import {
  processPayment,
  approveManualPayment,
  sendDueReminder,
  getPaymentsList,
} from '../controllers/feeController';

import {
  markAttendance,
  getStudentAttendanceStats,
  getBatchAttendance,
} from '../controllers/attendanceController';

import {
  scheduleClass,
  getTimetable,
  uploadRecordedClass,
  getCourseResources,
} from '../controllers/classController';

import {
  createAssignment,
  submitAssignment,
  evaluateSubmission,
} from '../controllers/assignmentController';

import {
  createQuiz,
  submitQuizAnswers,
  getLeaderboard,
} from '../controllers/quizController';

import {
  getChatMessages,
  startDirectChat,
  getActiveChats,
} from '../controllers/chatController';

import {
  getAdminDashboardStats,
  generateCertificate,
  verifyCertificate,
  getAuditLogs,
} from '../controllers/reportController';

const router = Router();

// Configure Multer for file uploads (In-memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max size
});

// ==========================================
// Authentication Routes
// ==========================================
router.post('/auth/register', register); // Setup / registration
router.post('/auth/login', login);
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', logout);
router.put('/auth/profile', authenticateJWT, updateProfile);
router.put('/auth/change-password', authenticateJWT, changePassword);

// ==========================================
// Student Routes
// ==========================================
router.get('/students/dashboard', authenticateJWT, requireRole([Role.STUDENT]), getStudentDashboard);
router.post('/students', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), createStudent);
router.get('/students', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN, Role.MENTOR]), getStudentsList);
router.post('/students/assign', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), assignMentorAndBatch);
router.delete('/students/:id', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), deleteStudent);

// ==========================================
// Mentor Routes
// ==========================================
router.get('/mentors/dashboard', authenticateJWT, requireRole([Role.MENTOR]), getMentorDashboard);
router.post('/mentors', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), createMentor);
router.get('/mentors', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), getMentorsList);

// ==========================================
// Fee & EMI Routes
// ==========================================
router.post('/fees/pay', authenticateJWT, requireRole([Role.STUDENT]), processPayment);
router.post('/fees/approve', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), approveManualPayment);
router.post('/fees/reminder', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), sendDueReminder);
router.get('/fees/payments', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), getPaymentsList);

// ==========================================
// Attendance Routes
// ==========================================
router.post('/attendance/mark', authenticateJWT, requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]), markAttendance);
router.get('/attendance/student', authenticateJWT, requireRole([Role.STUDENT]), getStudentAttendanceStats);
router.get('/attendance/batch', authenticateJWT, requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]), getBatchAttendance);

// ==========================================
// Live Class & Timetable Routes
// ==========================================
router.post('/classes/schedule', authenticateJWT, requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]), scheduleClass);
router.get('/classes/timetable/:batchId', authenticateJWT, getTimetable);
router.post('/classes/record', authenticateJWT, requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]), uploadRecordedClass);
router.get('/classes/resources/:courseId', authenticateJWT, getCourseResources);

// ==========================================
// Assignment Routes
// ==========================================
router.post(
  '/assignments/create',
  authenticateJWT,
  requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]),
  upload.single('file'),
  createAssignment
);
router.post(
  '/assignments/submit',
  authenticateJWT,
  requireRole([Role.STUDENT]),
  upload.single('file'),
  submitAssignment
);
router.post(
  '/assignments/grade',
  authenticateJWT,
  requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]),
  evaluateSubmission
);

// ==========================================
// Quiz Routes
// ==========================================
router.post('/quizzes/create', authenticateJWT, requireRole([Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN]), createQuiz);
router.post('/quizzes/submit', authenticateJWT, requireRole([Role.STUDENT]), submitQuizAnswers);
router.get('/quizzes/leaderboard/:quizId', authenticateJWT, getLeaderboard);

// ==========================================
// Chat Routes (Real-time history query)
// ==========================================
router.get('/chats/messages/:chatId', authenticateJWT, getChatMessages);
router.post('/chats/direct', authenticateJWT, startDirectChat);
router.get('/chats/active', authenticateJWT, getActiveChats);

// ==========================================
// Administration & Audit Reports Routes
// ==========================================
router.get('/reports/dashboard', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), getAdminDashboardStats);
router.post('/reports/certificate', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN, Role.MENTOR]), generateCertificate);
router.get('/reports/certificate/verify/:certificateId', verifyCertificate);
router.get('/reports/audit-logs', authenticateJWT, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), getAuditLogs);

export default router;
