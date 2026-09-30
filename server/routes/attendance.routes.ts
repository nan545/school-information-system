import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/attendance - Query attendance logs
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date, studentId, startDate, endDate } = req.query;
    const where: any = {};

    if (studentId && typeof studentId === 'string') {
      where.studentId = studentId;
    }

    if (classId && typeof classId === 'string' && classId !== 'all') {
      where.classId = classId;
    }

    if (date && typeof date === 'string') {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = {
        gte: startDate as string,
        lte: endDate as string,
      };
    }

    // Role check
    if (req.user?.role === 'STUDENT') {
      where.studentId = req.user.studentId;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        class: true,
      },
      orderBy: [{ date: 'desc' }, { student: { studentId: 'asc' } }],
    });

    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve attendance logs.' });
  }
});

// POST /api/attendance/batch - Submit daily attendance register for a class
router.post('/batch', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { classId, academicYearId, date, entries } = req.body;

    if (!classId || !academicYearId || !date || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Class ID, Academic Year, Date, and Entries array are required.' });
    }

    const teacherId = req.user?.teacherId || req.user?.id;
    const processed: any[] = [];

    for (const entry of entries) {
      const { studentId, status = 'PRESENT', remarks } = entry;
      if (!studentId) continue;

      // Upsert: check if attendance for this student on this date already exists
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId,
          date,
        },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            remarks: remarks || null,
            recordedById: teacherId,
          },
        });
        processed.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            studentId,
            classId,
            academicYearId,
            date,
            status,
            remarks: remarks || null,
            recordedById: teacherId,
          },
        });
        processed.push(created);
      }
    }

    return res.json({
      message: `Attendance recorded for ${processed.length} students on ${date}.`,
      count: processed.length,
    });
  } catch (error: any) {
    console.error('Batch attendance error:', error);
    return res.status(500).json({ error: 'Failed to submit attendance roster.' });
  }
});

export default router;
