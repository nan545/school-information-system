import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

function calculateGrade(score: number): { grade: string; defaultRemarks: string } {
  if (score >= 90) return { grade: 'A+', defaultRemarks: 'Outstanding academic mastery.' };
  if (score >= 85) return { grade: 'A', defaultRemarks: 'Excellent analytical comprehension.' };
  if (score >= 80) return { grade: 'B+', defaultRemarks: 'Very good conceptual knowledge.' };
  if (score >= 75) return { grade: 'B', defaultRemarks: 'Good consistency and application.' };
  if (score >= 70) return { grade: 'C+', defaultRemarks: 'Satisfactory academic progress.' };
  if (score >= 60) return { grade: 'C', defaultRemarks: 'Acceptable performance.' };
  if (score >= 50) return { grade: 'D', defaultRemarks: 'Marginal pass; further study advised.' };
  return { grade: 'F', defaultRemarks: 'Unsatisfactory; remedial support required.' };
}

async function teacherMayGrade(req: AuthRequest, studentId: string, subjectId: string) {
  if (req.user?.role !== 'TEACHER') return true;
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } });
  if (!student?.classId) return false;
  return !!(await prisma.teacherSubject.findFirst({
    where: { teacherId: req.user.teacherId, subjectId, classId: student.classId },
  }));
}

function validScores(caScore: number, examScore: number) {
  return Number.isFinite(caScore) && caScore >= 0 && caScore <= 30
    && Number.isFinite(examScore) && examScore >= 0 && examScore <= 70;
}

// GET /api/results - Filter results
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, semesterId, studentId } = req.query;
    const where: any = {};

    if (studentId && typeof studentId === 'string') {
      where.studentId = studentId;
    }

    if (subjectId && typeof subjectId === 'string' && subjectId !== 'all') {
      where.subjectId = subjectId;
    }

    if (semesterId && typeof semesterId === 'string' && semesterId !== 'all') {
      where.semesterId = semesterId;
    }

    if (classId && typeof classId === 'string' && classId !== 'all') {
      where.student = { classId };
    }

    // Role safety
    if (req.user?.role === 'STUDENT') {
      where.studentId = req.user.studentId;
    } else if (req.user?.role === 'TEACHER') {
      const assignments = await prisma.teacherSubject.findMany({
        where: { teacherId: req.user.teacherId },
        select: { subjectId: true, classId: true },
      });
      where.OR = assignments
        .filter((assignment) => assignment.classId)
        .map((assignment) => ({
          subjectId: assignment.subjectId,
          student: { classId: assignment.classId },
        }));
      if (!where.OR.length) where.id = '__no_assigned_results__';
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
            class: true,
          },
        },
        subject: true,
        semester: true,
        academicYear: true,
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { student: { studentId: 'asc' } },
      ],
    });

    return res.json(results);
  } catch (error: any) {
    console.error('Get results error:', error);
    return res.status(500).json({ error: 'Failed to retrieve examination results.' });
  }
});

// POST /api/results - Create single result
router.post('/', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      studentId,
      subjectId,
      academicYearId,
      semesterId,
      caScore = 0,
      examScore = 0,
      remarks,
    } = req.body;

    if (!studentId || !subjectId || !academicYearId || !semesterId) {
      return res.status(400).json({ error: 'Student, subject, academic year, and semester are required.' });
    }

    const ca = Number(caScore);
    const exam = Number(examScore);
    if (!validScores(ca, exam)) {
      return res.status(400).json({ error: 'CA score must be between 0 and 30 and exam score between 0 and 70.' });
    }
    if (!(await teacherMayGrade(req, studentId, subjectId))) {
      return res.status(403).json({ error: 'You may only grade students in your assigned course classes.' });
    }
    const [student, subject, existingResult] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { id: true, userId: true } }),
      prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } }),
      prisma.result.findFirst({ where: { studentId, subjectId, academicYearId, semesterId } }),
    ]);
    if (!student) return res.status(404).json({ error: 'Student record not found.' });
    if (!subject) return res.status(404).json({ error: 'Course not found.' });
    if (existingResult) {
      return res.status(409).json({ error: 'A grade already exists for this course and term. Update the existing grade instead.' });
    }
    const semester = await prisma.semester.findUnique({ where: { id: semesterId }, select: { academicYearId: true } });
    if (!semester || semester.academicYearId !== academicYearId) {
      return res.status(400).json({ error: 'The semester must belong to the selected academic year.' });
    }

    const total = ca + exam;
    const { grade, defaultRemarks } = calculateGrade(total);

    const result = await prisma.result.create({
      data: {
        studentId,
        subjectId,
        academicYearId,
        semesterId,
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        remarks: remarks || defaultRemarks,
        recordedById: req.user?.teacherId || req.user?.id,
      },
      include: {
        student: { include: { user: { select: { fullName: true, id: true } } } },
        subject: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: result.student.userId,
        title: 'Grade published',
        message: `A grade for ${result.subject.name} is available to view.`,
        link: 'results',
      },
    });
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Create result error:', error);
    return res.status(500).json({ error: 'Failed to record examination result.' });
  }
});

// PUT /api/results/:id - Update score
router.put('/:id', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { caScore, examScore, remarks } = req.body;

    const existing = await prisma.result.findUnique({
      where: { id },
      include: { student: { include: { user: true } }, subject: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Result record not found.' });
    }

    if (!(await teacherMayGrade(req, existing.studentId, existing.subjectId))) {
      return res.status(403).json({ error: 'You may only grade students in your assigned course classes.' });
    }
    const newCa = caScore !== undefined ? Number(caScore) : existing.caScore;
    const newExam = examScore !== undefined ? Number(examScore) : existing.examScore;
    if (!validScores(newCa, newExam)) {
      return res.status(400).json({ error: 'CA score must be between 0 and 30 and exam score between 0 and 70.' });
    }
    const total = newCa + newExam;
    const { grade, defaultRemarks } = calculateGrade(total);
    const newRemarks = remarks !== undefined ? remarks : (existing.remarks || defaultRemarks);

    const updated = await prisma.result.update({
      where: { id },
      data: {
        caScore: newCa,
        examScore: newExam,
        totalScore: total,
        grade,
        remarks: newRemarks,
        recordedById: req.user?.teacherId || req.user?.id,
      },
      include: {
        student: { include: { user: { select: { fullName: true, id: true } } } },
        subject: true,
      },
    });

    if (newCa !== existing.caScore || newExam !== existing.examScore || newRemarks !== existing.remarks) {
      await prisma.notification.create({
        data: {
          userId: existing.student.userId,
          title: 'Grade updated',
          message: `A grade for ${existing.subject.name} has been updated.`,
          link: 'results',
        },
      });
    }
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update result score.' });
  }
});

// POST /api/results/batch - Batch enter/update marks for class roster
router.post('/batch', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId, academicYearId, semesterId, records } = req.body;

    if (!subjectId || !academicYearId || !semesterId || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload for batch results update.' });
    }

    const semester = await prisma.semester.findUnique({ where: { id: semesterId }, select: { academicYearId: true } });
    if (!semester || semester.academicYearId !== academicYearId) {
      return res.status(400).json({ error: 'The semester must belong to the selected academic year.' });
    }
    const studentIds = records.map((record: any) => record.studentId);
    if (!studentIds.length || studentIds.some((id: unknown) => typeof id !== 'string') || new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({ error: 'Each grade record must include a unique student ID.' });
    }
    if (records.some((record: any) => !validScores(Number(record.caScore ?? 0), Number(record.examScore ?? 0)))) {
      return res.status(400).json({ error: 'CA score must be between 0 and 30 and exam score between 0 and 70.' });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, classId: true, userId: true },
    });
    if (students.length !== records.length) {
      return res.status(400).json({ error: 'One or more students were not found.' });
    }
    if (req.user?.role === 'TEACHER') {
      const assigned = await prisma.teacherSubject.findMany({
        where: { teacherId: req.user.teacherId, subjectId },
        select: { classId: true },
      });
      const assignedClasses = new Set(assigned.map((item) => item.classId).filter(Boolean));
      if (students.some((student) => !student.classId || !assignedClasses.has(student.classId))) {
        return res.status(403).json({ error: 'You may only grade students in your assigned course classes.' });
      }
    }

    const savedResults = await prisma.$transaction(async (tx) => {
      const saved = [];
      for (const item of records) {
        const { studentId, caScore = 0, examScore = 0, remarks } = item;
        const ca = Number(caScore);
        const exam = Number(examScore);
        const total = ca + exam;
        const { grade, defaultRemarks } = calculateGrade(total);
        const existing = await tx.result.findFirst({
          where: { studentId, subjectId, semesterId, academicYearId },
        });

        if (existing) {
          const changed = existing.caScore !== ca || existing.examScore !== exam || existing.remarks !== (remarks || defaultRemarks);
          const updated = await tx.result.update({
            where: { id: existing.id },
            data: {
              caScore: ca,
              examScore: exam,
              totalScore: total,
              grade,
              remarks: remarks || defaultRemarks,
              recordedById: req.user?.teacherId || req.user?.id,
            },
          });
          if (changed) {
            const student = students.find((entry) => entry.id === studentId)!;
            await tx.notification.create({
              data: {
                userId: student.userId,
                title: 'Grade updated',
                message: 'A course grade has been updated and is available to view.',
                link: 'results',
              },
            });
          }
          saved.push(updated);
        } else {
          const created = await tx.result.create({
            data: {
              studentId,
              subjectId,
              academicYearId,
              semesterId,
              caScore: ca,
              examScore: exam,
              totalScore: total,
              grade,
              remarks: remarks || defaultRemarks,
              recordedById: req.user?.teacherId || req.user?.id,
            },
          });
          const student = students.find((entry) => entry.id === studentId)!;
          await tx.notification.create({
            data: {
              userId: student.userId,
              title: 'Grade published',
              message: 'A new course grade is available to view.',
              link: 'results',
            },
          });
          saved.push(created);
        }
      }
      return saved;
    });

    return res.json({ message: `Successfully recorded ${savedResults.length} grades.`, count: savedResults.length });
  } catch (error: any) {
    console.error('Batch results error:', error);
    return res.status(500).json({ error: 'Failed to batch process examination scores.' });
  }
});

// ======================= CONTINUOUS ASSESSMENTS =======================
router.post('/assessments', authenticate, requireRoles('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, subjectId, semesterId, title, type, maxScore, score, date, feedback } = req.body;

    if (!studentId || !subjectId || !semesterId || !title || score === undefined) {
      return res.status(400).json({ error: 'Missing required assessment parameters.' });
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        subjectId,
        semesterId,
        title: title.trim(),
        type: type || 'QUIZ',
        maxScore: parseFloat(maxScore || '20'),
        score: parseFloat(score),
        date: date || new Date().toISOString().split('T')[0],
        feedback: feedback || null,
      },
      include: {
        subject: true,
        student: { include: { user: true } },
      },
    });

    return res.status(201).json(assessment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to record continuous assessment score.' });
  }
});

export default router;
