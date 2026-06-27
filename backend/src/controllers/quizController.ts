import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';

// Create a Quiz
export const createQuiz = async (req: AuthenticatedRequest, res: Response) => {
  const { courseId, title, durationMin, maxMarks, negativeMark, questions } = req.body;
  // questions: [{ content: string, options: string[], correctIndex: number }]

  try {
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title,
        durationMin: parseInt(durationMin),
        maxMarks: parseFloat(maxMarks),
        negativeMark: parseFloat(negativeMark || 0),
        questions: {
          create: questions,
        },
      },
      include: {
        questions: true,
      },
    });

    await logActivity(
      req.user?.userId || null,
      'QUIZ_CREATE',
      `Created quiz "${title}" with ${questions.length} questions`
    );

    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Student submit Quiz answers & evaluate score
export const submitQuizAnswers = async (req: AuthenticatedRequest, res: Response) => {
  const { quizId, answers, timeTaken } = req.body; // answers: { [questionId: string]: number }
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Access denied: Students only' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Calculate score
    let score = 0;
    const pointsPerQuestion = quiz.maxMarks / quiz.questions.length;
    const negativePenalty = quiz.negativeMark;

    quiz.questions.forEach((q) => {
      const selectedIndex = answers[q.id];
      if (selectedIndex !== undefined) {
        if (selectedIndex === q.correctIndex) {
          score += pointsPerQuestion;
        } else {
          score -= negativePenalty; // Negative marking
        }
      }
    });

    // Ensure score is not negative
    score = Math.max(0, score);

    const result = await prisma.quizResult.create({
      data: {
        quizId,
        studentId: student.id,
        score,
        timeTaken,
      },
    });

    await logActivity(
      req.user.userId,
      'QUIZ_SUBMIT',
      `Completed quiz "${quiz.title}" with score ${score}/${quiz.maxMarks}`
    );

    res.json({
      message: 'Quiz submitted and graded successfully',
      score,
      maxMarks: quiz.maxMarks,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get Leaderboard for a Quiz
export const getLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  const { quizId } = req.params;

  try {
    const results = await prisma.quizResult.findMany({
      where: { quizId },
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
      orderBy: [
        { score: 'desc' },
        { timeTaken: 'asc' }, // tie breaker: faster completion wins
      ],
      take: 20,
    });

    const leaderboard = results.map((r, index) => ({
      rank: index + 1,
      name: r.student.user.profile?.name || r.student.user.email,
      studentId: r.student.user.studentId,
      score: r.score,
      timeTaken: r.timeTaken,
      completedAt: r.completed,
    }));

    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
