import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('🌱 Database already contains data. Skipping seeding.');
    return;
  }

  console.log('🌱 Starting DB Seeding...');

  // Clean old records
  await prisma.auditLog.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.chat.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.eMI.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.quizResult.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.recordedClass.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.mentor.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned old DB entries.');

  // Hashes
  const superAdminHash = await bcrypt.hash('superadmin123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const mentorHash1 = await bcrypt.hash('mentor123', 10);
  const studentHash1 = await bcrypt.hash('student123', 10);

  // 1. Create Core Users
  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@nxtwave.in',
      passwordHash: superAdminHash,
      role: 'SUPER_ADMIN',
      employeeId: 'NW-EMP-001',
      profile: {
        create: {
          name: 'Super Admin NxtWave',
          mobile: '9876543210',
          admissionDate: new Date(),
        },
      },
    },
  });

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@nxtwave.in',
      passwordHash: adminHash,
      role: 'ADMIN',
      employeeId: 'NW-EMP-002',
      profile: {
        create: {
          name: 'Admin Desk',
          mobile: '9876543211',
          admissionDate: new Date(),
        },
      },
    },
  });

  // Mentor
  const mentorUser = await prisma.user.create({
    data: {
      email: 'mentor@nxtwave.in',
      passwordHash: mentorHash1,
      role: 'MENTOR',
      employeeId: 'NW-EMP-5001',
      profile: {
        create: {
          name: 'Rahul Kumar (MERN Mentor)',
          mobile: '9876543212',
          admissionDate: new Date(),
        },
      },
    },
  });

  const mentor = await prisma.mentor.create({
    data: {
      userId: mentorUser.id,
    },
  });

  console.log('👥 Standard Users & Roles created.');

  // 2. Create Course
  const course = await prisma.course.create({
    data: {
      title: 'CCBP Intensive Full Stack Developer (MERN)',
      description: 'NxtWave Industry Ready Certification Course in Full Stack Web Development.',
      mentors: {
        connect: { id: mentor.id },
      },
    },
  });

  // Create Module
  const moduleNode = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Module 1: Backend Engineering (Node.js & Express)',
      order: 1,
    },
  });

  // Create Chapter
  const chapter = await prisma.chapter.create({
    data: {
      moduleId: moduleNode.id,
      title: 'Chapter 1: REST API Development & SQL Databases',
      order: 1,
    },
  });

  // Create Video
  await prisma.video.create({
    data: {
      chapterId: chapter.id,
      title: 'Lecture 1.1: Building Express Handlers',
      url: 'https://nxtwave-lms.s3.amazonaws.com/videos/express-handlers.mp4',
      order: 1,
    },
  });

  // Create Resources
  await prisma.resource.create({
    data: {
      chapterId: chapter.id,
      title: 'Lecture 1.1 Class Notes PDF',
      url: 'https://nxtwave-lms-assets.s3.amazonaws.com/notes/express-notes.pdf',
      type: 'PDF',
    },
  });

  // Create Quiz
  const quiz = await prisma.quiz.create({
    data: {
      courseId: course.id,
      title: 'Node.js Express Foundations Quiz',
      durationMin: 15,
      maxMarks: 20,
      negativeMark: 0.5,
      questions: {
        create: [
          {
            content: 'Which status code represents a successful resource creation in REST?',
            options: ['200 OK', '201 Created', '204 No Content', '400 Bad Request'],
            correctIndex: 1,
          },
          {
            content: 'In Express, which middleware is used to parse JSON requests?',
            options: ['express.json()', 'express.urlencoded()', 'cors()', 'helmet()'],
            correctIndex: 0,
          },
        ],
      },
    },
  });

  // Create Assignment
  const assignment = await prisma.assignment.create({
    data: {
      chapterId: chapter.id,
      title: 'Assignment 1: Build a Task Management Express API',
      description: 'Implement complete CRUD routes and SQLite/Postgres Prisma schema integration.',
      fileUrl: 'https://nxtwave-lms-assets.s3.amazonaws.com/assignments/task-mgmt-spec.pdf',
      maxMarks: 100,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
  });

  console.log('📚 Course, Modules, Chapters, and Assignments created.');

  // 3. Create Batch
  const batch = await prisma.batch.create({
    data: {
      name: 'CCBP-Batch-2026-A',
      courseId: course.id,
      mentorId: mentor.id,
    },
  });

  // 4. Create Student
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@nxtwave.in',
      passwordHash: studentHash1,
      role: 'STUDENT',
      studentId: 'NW-STUD-1001',
      profile: {
        create: {
          name: 'Nithin Kumar',
          mobile: '9876543213',
          fatherName: 'Rajesh Kumar',
          motherName: 'Latha Kumar',
          address: 'A-201 NxtWave Tech City, Hyderabad',
          aadhaar: '1234-5678-9012',
          college: 'IIT Hyderabad',
          branch: 'Computer Science',
          semester: '6th Semester',
          bloodGroup: 'O+B',
          emergencyContact: '9876543214',
          admissionDate: new Date(),
        },
      },
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      courseId: course.id,
      batchId: batch.id,
      mentorId: mentor.id,
      totalFee: 60000,
      scholarship: 5000,
      discount: 2000,
      remainingBalance: 53000,
    },
  });

  // Generate EMIs for Student
  const emiAmount = 53000 / 5;
  for (let i = 1; i <= 5; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    dueDate.setDate(5);

    await prisma.eMI.create({
      data: {
        studentId: student.id,
        emiNumber: i,
        dueDate,
        amount: emiAmount,
        status: i === 1 ? 'PAID' : i === 2 ? 'OVERDUE' : 'PENDING',
        paymentDate: i === 1 ? new Date() : null,
        paymentMethod: i === 1 ? 'RAZORPAY' : null,
        receiptUrl: i === 1 ? 'https://nxtwave-lms-receipts.s3.amazonaws.com/receipt-mock-1.pdf' : null,
      },
    });
  }

  // Create mock attendance records
  await prisma.attendance.create({
    data: {
      studentId: student.id,
      date: new Date(),
      status: 'PRESENT',
      subject: 'REST API Concepts',
      markedBy: mentorUser.id,
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: student.id,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      status: 'PRESENT',
      subject: 'Express Middlewares',
      markedBy: mentorUser.id,
    },
  });

  // Create mock timetable entry
  await prisma.timetable.create({
    data: {
      batchId: batch.id,
      subject: 'Live Workshop: Designing Postgres Schemas with Prisma',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      liveUrl: 'https://zoom.us/mock-nxtwave-class-link',
      mentorName: 'Rahul Kumar (MERN Mentor)',
    },
  });

  // Create mock Chat Room
  const chat = await prisma.chat.create({
    data: {
      studentId: student.id,
      mentorId: mentor.id,
    },
  });

  await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: studentUser.id,
      content: 'Hello Rahul sir, can you please check my Chapter 1 Express task?',
    },
  });

  await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: mentorUser.id,
      content: 'Sure Nithin, I am looking at your assignment submission now.',
    },
  });

  // Create Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: studentUser.id,
      action: 'LOGIN',
      description: 'Logged in successfully from 192.168.1.5',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: mentorUser.id,
      action: 'LOGIN',
      description: 'Logged in successfully from 192.168.1.10',
    },
  });

  console.log('✅ DB Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
