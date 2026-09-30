import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/students - List students (Teacher, Admin)
router.get('/', authenticate, requireRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, classId, programId, page = '1', limit = '50' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (classId && typeof classId === 'string' && classId !== 'all') {
      where.classId = classId;
    }

    if (programId && typeof programId === 'string' && programId !== 'all') {
      where.programId = programId;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { studentId: { contains: q } },
        { user: { fullName: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
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
          class: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              section: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { studentId: 'asc' },
        skip,
        take,
      }),
    ]);

    return res.json({
      data: students,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error('List students error:', error);
    return res.status(500).json({ error: 'Failed to retrieve students list.' });
  }
});

// GET /api/students/:id - Get student details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Permissions check: Student can view own profile; Teachers & Admins can view any
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own student record.' });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        class: {
          include: {
            academicYear: true,
            classTeacher: {
              include: {
                user: {
                  select: { fullName: true, email: true },
                },
              },
            },
          },
        },
        program: {
          include: {
            department: true,
          },
        },
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    return res.json(student);
  } catch (error: any) {
    console.error('Get student details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve student details.' });
  }
});

// POST /api/students - Create new student (Admin only)
router.post('/', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      email,
      username,
      password,
      gender,
      dateOfBirth,
      phone,
      address,
      guardianName,
      guardianPhone,
      guardianEmail,
      classId,
      programId,
      studentId,
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

    // Auto-generate student ID if not provided
    const generatedStudentId = studentId || `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const newStudentUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        role: 'STUDENT',
        fullName: fullName.trim(),
        phone: phone || null,
        status: 'ACTIVE',
        student: {
          create: {
            studentId: generatedStudentId,
            gender: gender || null,
            dateOfBirth: dateOfBirth || null,
            address: address || null,
            guardianName: guardianName || null,
            guardianPhone: guardianPhone || null,
            guardianEmail: guardianEmail || null,
            enrollmentDate: new Date().toISOString().split('T')[0],
            classId: classId || null,
            programId: programId || null,
          },
        },
      },
      include: {
        student: {
          include: {
            class: true,
            program: true,
          },
        },
      },
    });

    const initialPassword = password || 'student123';

    return res.status(201).json({
      message: 'Student account matriculated and credentials issued successfully.',
      student: newStudentUser.student,
      issuedCredentials: {
        fullName: newStudentUser.fullName,
        studentId: generatedStudentId,
        username: newStudentUser.username,
        email: newStudentUser.email,
        temporaryPassword: initialPassword,
        className: newStudentUser.student?.class?.name || 'Class Assigned by Administration',
        programName: newStudentUser.student?.program?.name || 'General Academic Track',
        role: 'STUDENT',
      },
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Failed to create student account.' });
  }
});

// POST /api/students/:id/reset-credentials - Reissue or reset student login credentials (Admin only)
router.post('/:id/reset-credentials', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: true,
        program: true,
      },
    });

    if (!student || !student.user) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const tempPassword = newPassword?.trim() || `stu${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: student.userId },
      data: { password: hashedPassword },
    });

    return res.json({
      message: 'Student portal credentials updated successfully.',
      issuedCredentials: {
        fullName: student.user.fullName,
        studentId: student.studentId,
        username: student.user.username,
        email: student.user.email,
        temporaryPassword: tempPassword,
        className: student.class?.name || 'Unassigned',
        programName: student.program?.name || 'General Academic Track',
        role: 'STUDENT',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset student credentials.' });
  }
});

// PUT /api/students/:id - Update student (Admin or Student for allowed contact fields)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phone,
      address,
      guardianName,
      guardianPhone,
      guardianEmail,
      gender,
      dateOfBirth,
      classId,
      programId,
      status,
    } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const isAdmin = req.user?.role === 'ADMIN';
    const isSelf = req.user?.role === 'STUDENT' && req.user.studentId === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Students can update their phone, address, guardian contact details
    // Admins can also update classId, programId, fullName, gender, status
    await prisma.$transaction(async (tx) => {
      if (isAdmin && (fullName || status)) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            fullName: fullName !== undefined ? fullName : existingStudent.user.fullName,
            phone: phone !== undefined ? phone : existingStudent.user.phone,
            status: status !== undefined ? status : existingStudent.user.status,
          },
        });
      } else if (isSelf && phone !== undefined) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: { phone },
        });
      }

      await tx.student.update({
        where: { id },
        data: {
          address: address !== undefined ? address : existingStudent.address,
          guardianName: guardianName !== undefined ? guardianName : existingStudent.guardianName,
          guardianPhone: guardianPhone !== undefined ? guardianPhone : existingStudent.guardianPhone,
          guardianEmail: guardianEmail !== undefined ? guardianEmail : existingStudent.guardianEmail,
          gender: isAdmin && gender !== undefined ? gender : existingStudent.gender,
          dateOfBirth: isAdmin && dateOfBirth !== undefined ? dateOfBirth : existingStudent.dateOfBirth,
          classId: isAdmin && classId !== undefined ? classId : existingStudent.classId,
          programId: isAdmin && programId !== undefined ? programId : existingStudent.programId,
        },
      });
    });

    const updated = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true, phone: true, status: true } },
        class: true,
        program: true,
      },
    });

    return res.json({ message: 'Profile updated successfully.', student: updated });
  } catch (error: any) {
    console.error('Update student error:', error);
    return res.status(500).json({ error: 'Failed to update student profile.' });
  }
});

// PATCH /api/students/:id/status - Toggle active/inactive (Admin only)
router.patch('/:id/status', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "ACTIVE" | "INACTIVE" | "SUSPENDED"

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { status },
    });

    return res.json({ message: `Student status set to ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update student status.' });
  }
});

// GET /api/students/:id/results - Academic results
router.get('/:id/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { academicYearId, semesterId } = req.query;

    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const where: any = { studentId: id };
    if (academicYearId && typeof academicYearId === 'string') where.academicYearId = academicYearId;
    if (semesterId && typeof semesterId === 'string') where.semesterId = semesterId;

    const results = await prisma.result.findMany({
      where,
      include: {
        subject: true,
        semester: true,
        academicYear: true,
      },
      orderBy: [
        { academicYear: { name: 'desc' } },
        { semester: { termNumber: 'desc' } },
        { subject: { name: 'asc' } },
      ],
    });

    // Compute GPA or average statistics
    const totalCourses = results.length;
    const totalCredits = results.reduce((acc, result) => acc + (result.subject.creditHours || 3), 0);
    const averageScore = totalCredits > 0
      ? (results.reduce((acc, result) => acc + result.totalScore * (result.subject.creditHours || 3), 0) / totalCredits).toFixed(2)
      : '0.00';

    return res.json({
      results,
      summary: {
        totalCourses,
        averageScore: parseFloat(averageScore),
        passedCourses: results.filter((r) => r.grade !== 'F').length,
      },
    });
  } catch (error: any) {
    console.error('Fetch student results error:', error);
    return res.status(500).json({ error: 'Failed to retrieve academic results.' });
  }
});

// GET /api/students/:id/assessments - Continuous Assessment scores
router.get('/:id/assessments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const assessments = await prisma.assessment.findMany({
      where: { studentId: id },
      include: {
        subject: true,
        semester: true,
      },
      orderBy: { date: 'desc' },
    });

    return res.json(assessments);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve continuous assessments.' });
  }
});

// GET /api/students/:id/attendance - Attendance log & percentage
router.get('/:id/attendance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const attendances = await prisma.attendance.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' },
      include: {
        class: true,
      },
    });

    const totalDays = attendances.length;
    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const lateCount = attendances.filter((a) => a.status === 'LATE').length;
    const excusedCount = attendances.filter((a) => a.status === 'EXCUSED').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;

    const rate = totalDays > 0 ? (((presentCount + lateCount * 0.5) / totalDays) * 100).toFixed(1) : '100.0';

    return res.json({
      records: attendances,
      stats: {
        totalDays,
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        attendanceRate: parseFloat(rate),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve attendance logs.' });
  }
});

// GET /api/students/:id/timetable - Student class timetable
router.get('/:id/timetable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      select: { classId: true },
    });

    if (!student || !student.classId) {
      return res.json([]);
    }

    const schedule = await prisma.timetable.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return res.json(schedule);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve timetable.' });
  }
});

// GET /api/students/:id/assignments - Class assignments + student submission status
router.get('/:id/assignments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      select: { classId: true },
    });

    if (!student || !student.classId) {
      return res.json([]);
    }

    const assignments = await prisma.assignment.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        submissions: {
          where: { studentId: id },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const formatted = assignments.map((a) => {
      const submission = a.submissions[0] || null;
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        maxPoints: a.maxPoints,
        status: a.status,
        subject: a.subject,
        teacher: a.teacher.user.fullName,
        submission: submission
          ? {
              id: submission.id,
              submittedAt: submission.submittedAt,
              content: submission.content,
              status: submission.status,
              grade: submission.grade,
              feedback: submission.feedback,
            }
          : null,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

// GET /api/students/:id/payments - Invoices and payments
router.get('/:id/payments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const [studentFees, payments] = await Promise.all([
      prisma.studentFee.findMany({
        where: { studentId: id },
        include: {
          schoolFee: {
            include: {
              academicYear: true,
              semester: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { studentId: id },
        include: {
          studentFee: {
            include: {
              schoolFee: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    const totalBilled = studentFees.reduce((acc, f) => acc + f.amount, 0);
    const totalPaid = studentFees.reduce((acc, f) => acc + f.paidAmount, 0);
    const balance = totalBilled - totalPaid;

    return res.json({
      studentFees,
      payments,
      summary: {
        totalBilled,
        totalPaid,
        balance,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve financial records.' });
  }
});

// POST /api/students/:id/payments - Make payment (Student or Admin)
router.post('/:id/payments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { studentFeeId, amount, paymentMethod = 'CARD', notes } = req.body;

    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const ref = `TXN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const rec = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          referenceNumber: ref,
          studentId: id,
          studentFeeId: studentFeeId || null,
          amount: parseFloat(amount),
          paymentMethod,
          paymentDate: new Date().toISOString().split('T')[0],
          status: 'VERIFIED',
          receiptNumber: rec,
          notes: notes || 'Portal electronic fee settlement',
        },
      });

      if (studentFeeId) {
        const fee = await tx.studentFee.findUnique({ where: { id: studentFeeId } });
        if (fee) {
          const newPaid = fee.paidAmount + parseFloat(amount);
          const newStatus = newPaid >= fee.amount ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING';
          await tx.studentFee.update({
            where: { id: studentFeeId },
            data: {
              paidAmount: newPaid,
              status: newStatus,
            },
          });
        }
      }

      return createdPayment;
    });

    return res.status(201).json({
      message: 'Payment processed successfully.',
      payment,
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return res.status(500).json({ error: 'Failed to process fee payment.' });
  }
});

// GET /api/students/:id/documents - Academic documents list (Transcript, Report Card, etc.)
router.get('/:id/documents', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: true,
        program: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // List of official certified documents ready for print/download
    const documents = [
      {
        id: 'doc-transcript-official',
        title: 'Official Academic Transcript (Consolidated)',
        type: 'TRANSCRIPT',
        academicYear: '2024-2025',
        issuedDate: '2025-01-25',
        fileSize: '248 KB',
        format: 'PDF',
        description: 'Complete verified record of all enrolled terms, course units, letter grades, and cumulative GPA.',
      },
      {
        id: 'doc-report-sem1',
        title: 'Term 1 Official Grade Report & Evaluation Card',
        type: 'REPORT_CARD',
        academicYear: '2024-2025',
        issuedDate: '2025-01-22',
        fileSize: '180 KB',
        format: 'PDF',
        description: 'Semester 1 comprehensive subject breakdown, teacher remarks, and attendance summary.',
      },
      {
        id: 'doc-enrollment-cert',
        title: 'Bona Fide Certificate of Enrollment & Good Standing',
        type: 'ENROLLMENT_LETTER',
        academicYear: '2024-2025',
        issuedDate: '2024-09-15',
        fileSize: '142 KB',
        format: 'PDF',
        description: 'Registrar signed verification certificate for scholarship, health insurance, and embassy requirements.',
      },
      {
        id: 'doc-conduct-cert',
        title: 'Certificate of Conduct & Character Standing',
        type: 'CONDUCT_CERTIFICATE',
        academicYear: '2024-2025',
        issuedDate: '2024-09-15',
        fileSize: '135 KB',
        format: 'PDF',
        description: 'Affirmation of good discipline and adherence to Academy honor code standards.',
      },
    ];

    return res.json({ documents, student });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve academic documents.' });
  }
});

export default router;
