import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/teachers - List all teachers (Admin, Teacher)
router.get('/', authenticate, requireRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, search } = req.query;
    const where: any = {};

    if (departmentId && typeof departmentId === 'string' && departmentId !== 'all') {
      where.departmentId = departmentId;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { employeeId: { contains: q } },
        { user: { fullName: { contains: q } } },
        { user: { email: { contains: q } } },
        { specialization: { contains: q } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        department: true,
        managedClasses: {
          select: { id: true, name: true, gradeLevel: true, section: true },
        },
        teacherSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: { employeeId: 'asc' },
    });

    return res.json(teachers);
  } catch (error: any) {
    console.error('List teachers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve teachers.' });
  }
});

// GET /api/teachers/:id - Teacher profile details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.role === 'TEACHER' && req.user.teacherId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        department: true,
        managedClasses: true,
        teacherSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    return res.json(teacher);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve teacher details.' });
  }
});

// POST /api/teachers - Create teacher (Admin only)
router.post('/', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      email,
      username,
      password,
      employeeId,
      departmentId,
      qualification,
      specialization,
      phone,
    } = req.body;

    if (!fullName || !email || !username) {
      return res.status(400).json({ error: 'Full name, email, and username are required.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { username: username.trim().toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email or username already exists.' });
    }

    const genEmpId = employeeId || `TCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const teacherUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        role: 'TEACHER',
        fullName: fullName.trim(),
        phone: phone || null,
        status: 'ACTIVE',
        teacher: {
          create: {
            employeeId: genEmpId,
            departmentId: departmentId || null,
            qualification: qualification || null,
            specialization: specialization || null,
            joiningDate: new Date().toISOString().split('T')[0],
          },
        },
      },
      include: {
        teacher: {
          include: {
            department: true,
          },
        },
      },
    });

    const initialPassword = password || 'teacher123';

    return res.status(201).json({
      message: 'Faculty appointment established and credentials issued successfully.',
      teacher: teacherUser.teacher,
      issuedCredentials: {
        fullName: teacherUser.fullName,
        employeeId: genEmpId,
        username: teacherUser.username,
        email: teacherUser.email,
        temporaryPassword: initialPassword,
        departmentName: teacherUser.teacher?.department?.name || 'Academic Faculty',
        role: 'TEACHER',
      },
    });
  } catch (error: any) {
    console.error('Create teacher error:', error);
    return res.status(500).json({ error: 'Failed to create teacher account.' });
  }
});

// POST /api/teachers/:id/reset-credentials - Reissue or reset faculty login credentials (Admin only)
router.post('/:id/reset-credentials', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    });

    if (!teacher || !teacher.user) {
      return res.status(404).json({ error: 'Faculty record not found.' });
    }

    const tempPassword = newPassword?.trim() || `tch${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: teacher.userId },
      data: { password: hashedPassword },
    });

    return res.json({
      message: 'Faculty portal credentials updated successfully.',
      issuedCredentials: {
        fullName: teacher.user.fullName,
        employeeId: teacher.employeeId,
        username: teacher.user.username,
        email: teacher.user.email,
        temporaryPassword: tempPassword,
        departmentName: teacher.department?.name || 'Academic Faculty',
        role: 'TEACHER',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset faculty credentials.' });
  }
});

// PUT /api/teachers/:id - Update teacher profile
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, phone, qualification, specialization, departmentId } = req.body;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const isAdmin = req.user?.role === 'ADMIN';
    const isSelf = req.user?.role === 'TEACHER' && req.user.teacherId === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: teacher.userId },
        data: {
          fullName: fullName !== undefined ? fullName : teacher.user.fullName,
          phone: phone !== undefined ? phone : teacher.user.phone,
        },
      });

      await tx.teacher.update({
        where: { id },
        data: {
          qualification: qualification !== undefined ? qualification : teacher.qualification,
          specialization: specialization !== undefined ? specialization : teacher.specialization,
          departmentId: isAdmin && departmentId !== undefined ? departmentId : teacher.departmentId,
        },
      });
    });

    const updated = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true, department: true },
    });

    return res.json({ message: 'Teacher details updated successfully.', teacher: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update teacher profile.' });
  }
});

// GET /api/teachers/:id/classes - Classes taught by teacher
router.get('/:id/classes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get both classes where teacher is the assigned Class Teacher, and classes where teacher teaches subjects
    const [managedClasses, teachingAssignments] = await Promise.all([
      prisma.class.findMany({
        where: { classTeacherId: id },
        include: {
          academicYear: true,
          students: { select: { id: true } },
        },
      }),
      prisma.teacherSubject.findMany({
        where: { teacherId: id },
        include: {
          class: {
            include: {
              academicYear: true,
              students: { select: { id: true } },
            },
          },
          subject: true,
        },
      }),
    ]);

    return res.json({
      managedClasses,
      teachingAssignments,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve teacher classes.' });
  }
});

// GET /api/teachers/:id/students - Students in teacher's classes
router.get('/:id/students', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { classId } = req.query;

    let classIds: string[] = [];

    if (classId && typeof classId === 'string' && classId !== 'all') {
      classIds = [classId];
    } else {
      // Find all class IDs linked to this teacher
      const [managed, taught] = await Promise.all([
        prisma.class.findMany({ where: { classTeacherId: id }, select: { id: true } }),
        prisma.teacherSubject.findMany({ where: { teacherId: id }, select: { classId: true } }),
      ]);

      const idSet = new Set<string>();
      managed.forEach((c) => idSet.add(c.id));
      taught.forEach((t) => { if (t.classId) idSet.add(t.classId); });
      classIds = Array.from(idSet);
    }

    const students = await prisma.student.findMany({
      where: {
        classId: { in: classIds },
      },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        class: true,
        program: true,
      },
      orderBy: { studentId: 'asc' },
    });

    return res.json(students);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve students for teacher.' });
  }
});

export default router;
