import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth.ts';
import { apiRateLimit } from '../middleware/rateLimit.ts';

const router = Router();
router.use(apiRateLimit);

router.get('/courses', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!year) return res.json({ academicYear: null, courses: [] });

    const subjects = await prisma.subject.findMany({
      include: {
        department: true,
        teacherSubjects: {
          include: { teacher: { include: { user: { select: { fullName: true } } } }, class: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    const courseEnrollments = await prisma.enrollment.groupBy({
      by: ['subjectId'],
      where: { academicYearId: year.id, status: 'ACTIVE', subjectId: { not: null } },
      _count: { _all: true },
    });
    const enrollmentCounts = new Map(courseEnrollments.map((item) => [item.subjectId!, item._count._all]));

    return res.json({
      academicYear: year,
      courses: subjects.map((subject) => ({
        ...subject,
        enrolledCount: enrollmentCounts.get(subject.id) || 0,
        availableSeats: Math.max(subject.capacity - (enrollmentCounts.get(subject.id) || 0), 0),
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve available courses.' });
  }
});

router.get('/', authenticate, requireRoles('STUDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user!.studentId },
      include: {
        subject: { include: { department: true } },
        class: { include: { academicYear: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(enrollments);
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve your enrollments.' });
  }
});

router.post('/', authenticate, requireRoles('STUDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId } = req.body;
    if (typeof subjectId !== 'string' || !subjectId) {
      return res.status(400).json({ error: 'A course is required.' });
    }

    const student = await prisma.student.findUnique({
      where: { id: req.user!.studentId },
      select: { id: true, classId: true },
    });
    const year = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!student || !student.classId || !year) {
      return res.status(400).json({ error: 'A current class and academic year are required to enroll.' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Course not found.' });
    if (!subject.enrollmentOpen) return res.status(409).json({ error: 'Enrollment for this course is closed.' });

    const classRecord = await prisma.class.findUnique({ where: { id: student.classId } });
    if (!classRecord || classRecord.academicYearId !== year.id) {
      return res.status(409).json({ error: 'Your assigned class is not in the current academic year.' });
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      const existing = await tx.enrollment.findFirst({
        where: { studentId: student.id, subjectId, academicYearId: year.id },
      });
      if (existing?.status === 'ACTIVE') throw new Error('ALREADY_ENROLLED');
      if (existing?.status === 'COMPLETED') throw new Error('COURSE_COMPLETED');

      const count = await tx.enrollment.count({
        where: { subjectId, academicYearId: year.id, status: 'ACTIVE' },
      });
      if (count >= subject.capacity) throw new Error('COURSE_FULL');

      const saved = existing
        ? await tx.enrollment.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', classId: student.classId! },
            include: { subject: true, class: true },
          })
        : await tx.enrollment.create({
            data: {
              studentId: student.id,
              subjectId,
              classId: student.classId!,
              academicYearId: year.id,
            },
            include: { subject: true, class: true },
          });

      await tx.notification.create({
        data: {
          userId: req.user!.id,
          title: 'Course enrollment confirmed',
          message: `You are enrolled in ${subject.name} (${subject.code}).`,
          link: 'courses',
        },
      });
      return saved;
    });

    return res.status(201).json(enrollment);
  } catch (error: any) {
    if (error.message === 'ALREADY_ENROLLED') {
      return res.status(409).json({ error: 'You are already enrolled in this course.' });
    }
    if (error.message === 'COURSE_FULL') {
      return res.status(409).json({ error: 'This course has reached its enrollment capacity.' });
    }
    if (error.message === 'COURSE_COMPLETED') {
      return res.status(409).json({ error: 'This course is already completed for the current academic year.' });
    }
    return res.status(500).json({ error: 'Failed to enroll in course.' });
  }
});

router.delete('/:id', authenticate, requireRoles('STUDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: req.params.id, studentId: req.user!.studentId },
      include: { subject: true },
    });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });
    if (enrollment.status !== 'ACTIVE') {
      return res.status(409).json({ error: 'Only active enrollments can be withdrawn.' });
    }

    await prisma.$transaction([
      prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'WITHDRAWN' } }),
      prisma.notification.create({
        data: {
          userId: req.user!.id,
          title: 'Course withdrawal confirmed',
          message: `Your enrollment in ${enrollment.subject?.name || 'the course'} was withdrawn.`,
          link: 'courses',
        },
      }),
    ]);
    return res.json({ message: 'Course enrollment withdrawn.' });
  } catch {
    return res.status(500).json({ error: 'Failed to withdraw from course.' });
  }
});

export default router;
