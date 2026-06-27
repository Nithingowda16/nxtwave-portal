import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';

// Create a Timetable Entry (Live Class)
export const scheduleClass = async (req: AuthenticatedRequest, res: Response) => {
  const { batchId, subject, startTime, endTime, liveUrl } = req.body;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const mentorProfile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    const newClass = await prisma.timetable.create({
      data: {
        batchId,
        subject,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        liveUrl: liveUrl || 'https://zoom.us/mock-nxtwave-class',
        mentorName: mentorProfile?.name || req.user.email,
      },
    });

    await logActivity(
      req.user.userId,
      'LIVE_CLASS_SCHEDULE',
      `Scheduled class "${subject}" for Batch ID ${batchId} at ${startTime}`
    );

    res.status(201).json({ message: 'Live class scheduled successfully', class: newClass });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Timetable for Batch
export const getTimetable = async (req: AuthenticatedRequest, res: Response) => {
  const { batchId } = req.params;

  try {
    const list = await prisma.timetable.findMany({
      where: { batchId },
      orderBy: { startTime: 'asc' },
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Upload Recorded Video & Class Resources
export const uploadRecordedClass = async (req: AuthenticatedRequest, res: Response) => {
  const { chapterId, title, videoUrl, notesUrl } = req.body;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const record = await prisma.recordedClass.create({
      data: {
        chapterId,
        title,
        videoUrl,
        notesUrl,
      },
    });

    await logActivity(
      req.user.userId,
      'RECORDED_CLASS_UPLOAD',
      `Uploaded recorded class: "${title}" to chapter ID ${chapterId}`
    );

    res.status(201).json({ message: 'Recorded class uploaded successfully', class: record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Recorded Classes & Materials by Course
export const getCourseResources = async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            chapters: {
              include: {
                recordedClasses: true,
                resources: true,
              },
            },
          },
        },
      },
    });

    if (!course) return res.status(404).json({ error: 'Course not found' });

    res.json(course.modules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
