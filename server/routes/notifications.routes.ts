import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';
import { apiRateLimit } from '../middleware/rateLimit.ts';

const router = Router();
router.use(apiRateLimit);

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return res.json({ notifications, unreadCount });
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read.' });
  } catch {
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });
    if (!updated.count) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    return res.json({ message: 'Notification marked as read.' });
  } catch {
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

export default router;
