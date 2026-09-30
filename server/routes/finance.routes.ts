import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/finance/fees - List fee structures
router.get('/fees', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const fees = await prisma.schoolFee.findMany({
      include: {
        academicYear: true,
        semester: true,
        _count: { select: { studentFees: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(fees);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve fee structures.' });
  }
});

// POST /api/finance/fees - Create fee structure
router.post('/fees', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, amount, academicYearId, semesterId, dueDate, autoAssignClassId } = req.body;

    if (!title || !amount || !academicYearId || !dueDate) {
      return res.status(400).json({ error: 'Title, amount, academic year, and due date are required.' });
    }

    const schoolFee = await prisma.schoolFee.create({
      data: {
        title: title.trim(),
        description: description || null,
        amount: parseFloat(amount),
        academicYearId,
        semesterId: semesterId || null,
        dueDate,
      },
    });

    // If autoAssignClassId provided, create StudentFee accounts for all students in that class
    if (autoAssignClassId) {
      const students = await prisma.student.findMany({
        where: { classId: autoAssignClassId },
      });

      for (const st of students) {
        await prisma.studentFee.create({
          data: {
            studentId: st.id,
            schoolFeeId: schoolFee.id,
            amount: parseFloat(amount),
            paidAmount: 0,
            status: 'PENDING',
          },
        });
      }
    }

    return res.status(201).json(schoolFee);
  } catch (error: any) {
    console.error('Create fee error:', error);
    return res.status(500).json({ error: 'Failed to create fee schedule.' });
  }
});

// GET /api/finance/payments - List all payments with search and filters (Admin)
router.get('/payments', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, paymentMethod, status } = req.query;
    const where: any = {};

    if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { referenceNumber: { contains: q } },
        { receiptNumber: { contains: q } },
        { student: { studentId: { contains: q } } },
        { student: { user: { fullName: { contains: q } } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            class: true,
          },
        },
        studentFee: {
          include: {
            schoolFee: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return res.json(payments);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve payments.' });
  }
});

// GET /api/finance/overview - Financial metrics
router.get('/overview', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const [allStudentFees, allPayments] = await Promise.all([
      prisma.studentFee.findMany({ select: { amount: true, paidAmount: true, status: true } }),
      prisma.payment.findMany({ select: { amount: true, paymentMethod: true } }),
    ]);

    const totalBilled = allStudentFees.reduce((acc, f) => acc + f.amount, 0);
    const totalCollected = allStudentFees.reduce((acc, f) => acc + f.paidAmount, 0);
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '100.0';

    return res.json({
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate: parseFloat(collectionRate),
      totalTransactions: allPayments.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to calculate financial overview.' });
  }
});

export default router;
