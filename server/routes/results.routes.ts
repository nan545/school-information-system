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
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
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

    const total = parseFloat(caScore) + parseFloat(examScore);
    const { grade, defaultRemarks } = calculateGrade(total);

    const result = await prisma.result.create({
      data: {
        studentId,
        subjectId,
        academicYearId,
        semesterId,
        caScore: parseFloat(caScore),
        examScore: parseFloat(examScore),
        totalScore: total,
        grade,
        remarks: remarks || defaultRemarks,
        recordedById: req.user?.teacherId || req.user?.id,
      },
      include: {
        student: { include: { user: true } },
        subject: true,
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

    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Result record not found.' });
    }

    const newCa = caScore !== undefined ? parseFloat(caScore) : existing.caScore;
    const newExam = examScore !== undefined ? parseFloat(examScore) : existing.examScore;
    const total = newCa + newExam;
    const { grade, defaultRemarks } = calculateGrade(total);

    const updated = await prisma.result.update({
      where: { id },
      data: {
        caScore: newCa,
        examScore: newExam,
        totalScore: total,
        grade,
        remarks: remarks !== undefined ? remarks : (existing.remarks || defaultRemarks),
        recordedById: req.user?.teacherId || req.user?.id,
      },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    });

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

    const savedResults = [];

    for (const item of records) {
      const { studentId, caScore = 0, examScore = 0, remarks } = item;
      if (!studentId) continue;

      const total = parseFloat(caScore) + parseFloat(examScore);
      const { grade, defaultRemarks } = calculateGrade(total);

      // Check if existing result exists
      const existing = await prisma.result.findFirst({
        where: {
          studentId,
          subjectId,
          semesterId,
          academicYearId,
        },
      });

      if (existing) {
        const updated = await prisma.result.update({
          where: { id: existing.id },
          data: {
            caScore: parseFloat(caScore),
            examScore: parseFloat(examScore),
            totalScore: total,
            grade,
            remarks: remarks || defaultRemarks,
            recordedById: req.user?.teacherId || req.user?.id,
          },
        });
        savedResults.push(updated);
      } else {
        const created = await prisma.result.create({
          data: {
            studentId,
            subjectId,
            academicYearId,
            semesterId,
            caScore: parseFloat(caScore),
            examScore: parseFloat(examScore),
            totalScore: total,
            grade,
            remarks: remarks || defaultRemarks,
            recordedById: req.user?.teacherId || req.user?.id,
          },
        });
        savedResults.push(created);
      }
    }

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
