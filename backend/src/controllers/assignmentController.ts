import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';
import { S3Service } from '../services/s3';

// Mentor Create Assignment
export const createAssignment = async (req: AuthenticatedRequest, res: Response) => {
  const { chapterId, title, description, maxMarks, deadline } = req.body;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let fileUrl = '';
    if (req.file) {
      fileUrl = await S3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'assignments'
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        chapterId,
        title,
        description,
        fileUrl: fileUrl || undefined,
        maxMarks: parseFloat(maxMarks),
        deadline: new Date(deadline),
      },
    });

    await logActivity(
      req.user.userId,
      'ASSIGNMENT_CREATE',
      `Created assignment "${title}" with deadline: ${deadline}`
    );

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Student Submit Assignment
export const submitAssignment = async (req: AuthenticatedRequest, res: Response) => {
  const { assignmentId } = req.body;
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Access denied: Students only' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Check deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ error: 'Submission deadline has passed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF or ZIP file' });
    }

    const fileUrl = await S3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      'assignments'
    );

    // Upsert submission
    const existing = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
    });

    let submission;
    if (existing) {
      submission = await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          submitTime: new Date(),
        },
      });
    } else {
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId: student.id,
          fileUrl,
        },
      });
    }

    await logActivity(
      req.user.userId,
      'ASSIGNMENT_SUBMIT',
      `Submitted assignment files for ${assignment.title}`
    );

    res.json({ message: 'Assignment submitted successfully', submission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Mentor Evaluate Assignment
export const evaluateSubmission = async (req: AuthenticatedRequest, res: Response) => {
  const { submissionId, marks, feedback } = req.body;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user.userId },
    });

    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { student: { include: { user: true } }, assignment: true },
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    if (parseFloat(marks) > submission.assignment.maxMarks) {
      return res.status(400).json({
        error: `Marks cannot exceed the maximum assignment limit of ${submission.assignment.maxMarks}`,
      });
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: parseFloat(marks),
        feedback,
        gradedBy: mentor.id,
        gradedAt: new Date(),
      },
    });

    await logActivity(
      req.user.userId,
      'ASSIGNMENT_EVALUATE',
      `Graded submission of Student ${submission.student.user.email} for "${submission.assignment.title}"`
    );

    res.json({ message: 'Submission evaluated and graded', submission: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
