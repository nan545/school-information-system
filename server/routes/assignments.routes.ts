import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/assignments - List assignments
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, status } = req.query;
    const where: any = {};

    if (classId && typeof classId === 'string' && classId !== 'all') {
      where.classId = classId;
    }

    if (subjectId && typeof subjectId === 'string' && subjectId !== 'all') {
      where.subjectId = subjectId;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    // If teacher, optionally filter to teacher's assignments
    if (req.user?.role === 'TEACHER' && req.query.myOnly === 'true') {
      where.teacherId = req.user.teacherId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        subject: true,
        class: true,
        teacher: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json(assignments);
  } catch (error: any) {
    console.error('List assignments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

// GET /api/assignments/:id/submissions - View submissions for an assignment
router.get('/:id/submissions', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        subject: true,
        class: {
          include: {
            students: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Map all enrolled students in the class and pair them with submission if present
    const studentsWithSubmission = assignment.class.students.map((student) => {
      const submission = assignment.submissions.find((s) => s.studentId === student.id);
      return {
        student,
        submission: submission || null,
      };
    });

    return res.json({
      assignment,
      roster: studentsWithSubmission,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});

// POST /api/assignments - Create assignment
router.post('/', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, subjectId, classId, dueDate, maxPoints = 100, attachmentUrl } = req.body;

    if (!title || !description || !subjectId || !classId || !dueDate) {
      return res.status(400).json({ error: 'Title, description, subject, class, and due date are required.' });
    }

    const teacherId = req.user?.teacherId;
    if (!teacherId && req.user?.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Active teacher account required to create assignments.' });
    }

    // If admin is creating, find the teacher for this subject & class or assign the first available teacher
    let finalTeacherId = teacherId;
    if (!finalTeacherId) {
      const ts = await prisma.teacherSubject.findFirst({
        where: { subjectId, classId },
      });
      if (ts) {
        finalTeacherId = ts.teacherId;
      } else {
        const firstTeacher = await prisma.teacher.findFirst();
        if (firstTeacher) finalTeacherId = firstTeacher.id;
      }
    }

    if (!finalTeacherId) {
      return res.status(400).json({ error: 'Could not resolve teacher for assignment.' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        subjectId,
        classId,
        teacherId: finalTeacherId,
        dueDate,
        maxPoints: parseInt(maxPoints),
        attachmentUrl: attachmentUrl || null,
        status: 'ACTIVE',
      },
      include: {
        subject: true,
        class: true,
      },
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Create assignment error:', error);
    return res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// PUT /api/assignments/:id - Update assignment
router.put('/:id', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, maxPoints, status } = req.body;

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        dueDate,
        maxPoints: maxPoints ? parseInt(maxPoints) : undefined,
        status,
      },
      include: { subject: true, class: true },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update assignment.' });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.assignment.delete({ where: { id } });
    return res.json({ message: 'Assignment deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete assignment.' });
  }
});

// POST /api/assignments/:id/submit - Submit assignment (Student)
router.post('/:id/submit', authenticate, requireRoles('STUDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, fileUrl } = req.body;
    const studentId = req.user!.studentId;

    if (!studentId) {
      return res.status(400).json({ error: 'Student profile not found.' });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ error: 'Please enter response text or attach work file.' });
    }

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Upsert submission
    const existing = await prisma.submission.findFirst({
      where: { assignmentId: id, studentId },
    });

    const isLate = new Date() > new Date(assignment.dueDate);
    const submissionStatus = isLate ? 'LATE' : 'SUBMITTED';

    let submission;
    if (existing) {
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          content: content || existing.content,
          fileUrl: fileUrl || existing.fileUrl,
          submittedAt: new Date(),
          status: submissionStatus,
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          assignmentId: id,
          studentId,
          content: content || 'Solution submitted via student portal workspace.',
          fileUrl: fileUrl || null,
          status: submissionStatus,
        },
      });
    }

    return res.json({ message: 'Assignment submitted successfully.', submission });
  } catch (error: any) {
    console.error('Submit assignment error:', error);
    return res.status(500).json({ error: 'Failed to submit assignment.' });
  }
});

// POST /api/assignments/submissions/:id/grade - Grade submission (Teacher, Admin)
router.post('/submissions/:id/grade', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined) {
      return res.status(400).json({ error: 'Grade score is required.' });
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        grade: parseFloat(grade),
        feedback: feedback || null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: {
          include: { user: true },
        },
        assignment: true,
      },
    });

    // Create a notification for the student
    await prisma.notification.create({
      data: {
        userId: updated.student.userId,
        title: `Assignment Graded: ${updated.assignment.title}`,
        message: `Your work has been graded. Score: ${grade}/${updated.assignment.maxPoints}. Feedback: ${feedback || 'None'}`,
        link: '/assignments',
      },
    });

    return res.json({ message: 'Submission graded successfully.', submission: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to grade submission.' });
  }
});

export default router;
