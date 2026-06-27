import { Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../middleware/logger';
import { NotificationService } from '../services/notification';
import { PaymentService } from '../services/payment';

// Process an EMI Payment (Simulation)
export const processPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { emiId, method = 'RAZORPAY', cardDetails, upiId } = req.body;

  try {
    const emi = await prisma.eMI.findUnique({
      where: { id: emiId },
      include: { student: { include: { user: { include: { profile: true } } } } },
    });

    if (!emi) return res.status(404).json({ error: 'EMI record not found' });
    if (emi.status === 'PAID') return res.status(400).json({ error: 'EMI is already paid' });

    const txId = `pay_${Math.random().toString(36).substring(2, 15)}`;

    // Prisma Transaction to ensure absolute integrity
    await prisma.$transaction(async (tx) => {
      // 1. Update EMI
      await tx.eMI.update({
        where: { id: emiId },
        data: {
          status: 'PAID',
          paymentDate: new Date(),
          paymentMethod: method,
          receiptUrl: `https://nxtwave-lms-receipts.s3.amazonaws.com/receipt-${txId}.pdf`,
        },
      });

      // 2. Create Payment log
      await tx.payment.create({
        data: {
          emiId,
          transactionId: txId,
          amount: emi.amount + emi.lateFee,
          paymentMethod: method as any,
          status: 'SUCCESS',
        },
      });

      // 3. Deduct from Student remaining balance
      await tx.student.update({
        where: { id: emi.studentId },
        data: {
          remainingBalance: {
            decrement: emi.amount,
          },
        },
      });
    });

    await logActivity(
      emi.student.userId,
      'EMI_PAYMENT_SUCCESS',
      `Paid EMI #${emi.emiNumber} of amount INR ${emi.amount} via ${method}`
    );

    // Send mock confirmation notification
    const studentMobile = emi.student.user.profile?.mobile || '9999999999';
    await NotificationService.sendSMS(
      studentMobile,
      `Dear Student, payment of INR ${emi.amount} for EMI #${emi.emiNumber} was successful. Transaction ID: ${txId}.`
    );

    res.json({
      message: 'Payment completed successfully',
      transactionId: txId,
      receiptUrl: `https://nxtwave-lms-receipts.s3.amazonaws.com/receipt-${txId}.pdf`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Admin Manual Payment Approval
export const approveManualPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { emiId, referenceNumber, paymentMethod } = req.body;

  try {
    const emi = await prisma.eMI.findUnique({
      where: { id: emiId },
      include: { student: { include: { user: { include: { profile: true } } } } },
    });

    if (!emi) return res.status(404).json({ error: 'EMI record not found' });
    if (emi.status === 'PAID') return res.status(400).json({ error: 'EMI is already marked Paid' });

    await prisma.$transaction(async (tx) => {
      await tx.eMI.update({
        where: { id: emiId },
        data: {
          status: 'PAID',
          paymentDate: new Date(),
          paymentMethod,
          receiptUrl: `https://nxtwave-lms-receipts.s3.amazonaws.com/receipt-manual-${referenceNumber}.pdf`,
        },
      });

      await tx.payment.create({
        data: {
          emiId,
          transactionId: referenceNumber,
          amount: emi.amount,
          paymentMethod: paymentMethod as any,
          status: 'SUCCESS',
        },
      });

      await tx.student.update({
        where: { id: emi.studentId },
        data: {
          remainingBalance: {
            decrement: emi.amount,
          },
        },
      });
    });

    await logActivity(
      req.user?.userId || null,
      'EMI_MANUAL_APPROVE',
      `Manually approved payment for Student ${emi.student.user.email}, EMI #${emi.emiNumber}`
    );

    res.json({ message: 'Manual payment approved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Admin Send Due Reminder
export const sendDueReminder = async (req: AuthenticatedRequest, res: Response) => {
  const { emiId } = req.body;

  try {
    const emi = await prisma.eMI.findUnique({
      where: { id: emiId },
      include: { student: { include: { user: { include: { profile: true } } } } },
    });

    if (!emi) return res.status(404).json({ error: 'EMI not found' });
    if (emi.status === 'PAID') return res.status(400).json({ error: 'EMI is already paid' });

    const studentName = emi.student.user.profile?.name || emi.student.user.email;
    const mobile = emi.student.user.profile?.mobile || '9999999999';
    const message = `Hello ${studentName}, this is a reminder that your EMI #${emi.emiNumber} of INR ${emi.amount} is due on ${new Date(emi.dueDate).toLocaleDateString()}. Please pay online.`;

    await NotificationService.sendSMS(mobile, message);
    await NotificationService.sendEmail(emi.student.user.email, 'EMI Payment Due Reminder', message);

    await logActivity(
      req.user?.userId || null,
      'EMI_REMINDER_SENT',
      `Sent payment due reminder for EMI #${emi.emiNumber} to Student ${emi.student.user.email}`
    );

    res.json({ message: 'Reminder notifications dispatched successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Payments
export const getPaymentsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        emi: {
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
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const result = payments.map((p) => ({
      id: p.id,
      transactionId: p.transactionId,
      studentName: p.emi.student.user.profile?.name || p.emi.student.user.email,
      studentId: p.emi.student.user.studentId,
      amount: p.amount,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      emiNumber: p.emi.emiNumber,
      status: p.status,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
