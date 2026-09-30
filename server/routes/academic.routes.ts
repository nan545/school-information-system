import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// ======================= DEPARTMENTS =======================
router.get('/departments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { teachers: true, programs: true, subjects: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(departments);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
});

router.post('/departments', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }

    const dept = await prisma.department.create({
      data: { name: name.trim(), code: code.trim().toUpperCase(), description },
    });
    return res.status(201).json(dept);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create department.' });
  }
});

// ======================= PROGRAMS =======================
router.get('/programs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        department: true,
        _count: { select: { students: true, classes: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(programs);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve programs.' });
  }
});

router.post('/programs', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, durationYears = 4, departmentId } = req.body;
    if (!name || !code || !departmentId) {
      return res.status(400).json({ error: 'Name, code, and departmentId are required.' });
    }

    const prog = await prisma.program.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        durationYears: parseInt(durationYears),
        departmentId,
      },
      include: { department: true },
    });
    return res.status(201).json(prog);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create academic program.' });
  }
});

// ======================= CLASSES =======================
router.get('/classes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        academicYear: true,
        program: true,
        classTeacher: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        _count: {
          select: { students: true, assignments: true },
        },
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });
    return res.json(classes);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve classes.' });
  }
});

router.post('/classes', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, gradeLevel, section, academicYearId, programId, classTeacherId } = req.body;
    if (!name || !gradeLevel || !section || !academicYearId) {
      return res.status(400).json({ error: 'Name, grade level, section, and academic year are required.' });
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        section: section.trim(),
        academicYearId,
        programId: programId || null,
        classTeacherId: classTeacherId || null,
      },
      include: {
        academicYear: true,
        program: true,
        classTeacher: { include: { user: true } },
      },
    });
    return res.status(201).json(newClass);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create class cohort.' });
  }
});

router.put('/classes/:id', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, gradeLevel, section, academicYearId, programId, classTeacherId } = req.body;

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name,
        gradeLevel,
        section,
        academicYearId,
        programId: programId || null,
        classTeacherId: classTeacherId || null,
      },
      include: {
        academicYear: true,
        program: true,
        classTeacher: { include: { user: true } },
      },
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update class.' });
  }
});

// ======================= SUBJECTS =======================
router.get('/subjects', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        department: true,
        teacherSubjects: {
          include: {
            teacher: {
              include: { user: { select: { fullName: true } } },
            },
            class: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.json(subjects);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve subjects.' });
  }
});

router.post('/subjects', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, creditHours = 3, departmentId } = req.body;
    if (!name || !code || !departmentId) {
      return res.status(400).json({ error: 'Subject name, code, and departmentId are required.' });
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        creditHours: parseInt(creditHours),
        departmentId,
      },
      include: { department: true },
    });
    return res.status(201).json(subject);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create subject.' });
  }
});

router.put('/subjects/:id', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, creditHours, departmentId } = req.body;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        creditHours: creditHours ? parseInt(creditHours) : undefined,
        departmentId,
      },
      include: { department: true },
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
});

// ======================= TEACHER SUBJECT ASSIGNMENTS =======================
router.post('/teacher-subjects', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, subjectId, classId } = req.body;
    if (!teacherId || !subjectId) {
      return res.status(400).json({ error: 'Teacher ID and Subject ID are required.' });
    }

    const assignment = await prisma.teacherSubject.create({
      data: {
        teacherId,
        subjectId,
        classId: classId || null,
      },
      include: {
        teacher: { include: { user: true } },
        subject: true,
        class: true,
      },
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to assign teacher to subject.' });
  }
});

router.delete('/teacher-subjects/:id', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.teacherSubject.delete({ where: { id } });
    return res.json({ message: 'Teacher-subject assignment removed.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove assignment.' });
  }
});

// ======================= ACADEMIC YEARS & SEMESTERS =======================
router.get('/academic-years', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      include: {
        semesters: {
          orderBy: { termNumber: 'asc' },
        },
      },
      orderBy: { name: 'desc' },
    });
    return res.json(years);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve academic years.' });
  }
});

router.post('/academic-years', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Academic year name, start date, and end date are required.' });
    }

    if (isCurrent) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    }

    const year = await prisma.academicYear.create({
      data: { name: name.trim(), startDate, endDate, isCurrent: !!isCurrent },
    });
    return res.status(201).json(year);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create academic year.' });
  }
});

router.get('/semesters', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const semesters = await prisma.semester.findMany({
      include: { academicYear: true },
      orderBy: [{ academicYear: { name: 'desc' } }, { termNumber: 'asc' }],
    });
    return res.json(semesters);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve semesters.' });
  }
});

router.post('/semesters', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { academicYearId, name, termNumber, startDate, endDate, isCurrent } = req.body;
    if (!academicYearId || !name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required semester fields.' });
    }

    if (isCurrent) {
      await prisma.semester.updateMany({ data: { isCurrent: false } });
    }

    const semester = await prisma.semester.create({
      data: {
        academicYearId,
        name: name.trim(),
        termNumber: parseInt(termNumber || '1'),
        startDate,
        endDate,
        isCurrent: !!isCurrent,
      },
      include: { academicYear: true },
    });
    return res.status(201).json(semester);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create semester.' });
  }
});

export default router;
