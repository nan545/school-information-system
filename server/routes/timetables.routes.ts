import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/timetables - Query timetable slots
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, teacherId, dayOfWeek } = req.query;
    const where: any = {};

    if (classId && typeof classId === 'string' && classId !== 'all') {
      where.classId = classId;
    }

    if (teacherId && typeof teacherId === 'string' && teacherId !== 'all') {
      where.teacherId = teacherId;
    }

    if (dayOfWeek && typeof dayOfWeek === 'string') {
      where.dayOfWeek = dayOfWeek;
    }

    const slots = await prisma.timetable.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return res.json(slots);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve timetables.' });
  }
});

// POST /api/timetables - Create timetable slot
router.post('/', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber } = req.body;

    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'All timetable slot parameters are required.' });
    }

    const slot = await prisma.timetable.create({
      data: {
        classId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        roomNumber: roomNumber || 'Classroom',
      },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
      },
    });

    return res.status(201).json(slot);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add timetable slot.' });
  }
});

// DELETE /api/timetables/:id
router.delete('/:id', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({ where: { id } });
    return res.json({ message: 'Timetable slot removed.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete timetable entry.' });
  }
});

export default router;
