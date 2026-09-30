import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/announcements
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category, audience } = req.query;
    const where: any = {};

    if (category && typeof category === 'string' && category !== 'all') {
      where.category = category;
    }

    if (audience && typeof audience === 'string' && audience !== 'all') {
      where.audience = audience;
    } else if (req.user?.role === 'STUDENT') {
      where.audience = { in: ['ALL', 'STUDENTS'] };
    } else if (req.user?.role === 'TEACHER') {
      where.audience = { in: ['ALL', 'TEACHERS'] };
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // URGENT first if sorted or by createdAt
        { createdAt: 'desc' },
      ],
    });

    return res.json(announcements);
  } catch (error: any) {
    console.error('List announcements error:', error);
    return res.status(500).json({ error: 'Failed to retrieve announcements.' });
  }
});

// POST /api/announcements - Post announcement
router.post('/', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, category = 'GENERAL', audience = 'ALL', priority = 'NORMAL' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        audience,
        priority,
        authorId: req.user!.id,
      },
      include: {
        author: { select: { fullName: true, role: true } },
      },
    });

    return res.status(201).json(announcement);
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return res.status(500).json({ error: 'Failed to publish announcement.' });
  }
});

// PUT /api/announcements/:id - Update announcement
router.put('/:id', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, audience, priority } = req.body;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    // Teachers can only edit their own announcements; Admin can edit any
    if (req.user?.role === 'TEACHER' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit announcements created by you.' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        content: content !== undefined ? content : existing.content,
        category: category !== undefined ? category : existing.category,
        audience: audience !== undefined ? audience : existing.audience,
        priority: priority !== undefined ? priority : existing.priority,
      },
      include: {
        author: { select: { fullName: true, role: true } },
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update announcement.' });
  }
});

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', authenticate, requireRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.announcement.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    if (req.user?.role === 'TEACHER' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete announcements authored by you.' });
    }

    await prisma.announcement.delete({ where: { id } });
    return res.json({ message: 'Announcement removed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

export default router;
