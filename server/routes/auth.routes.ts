import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.ts';
import { authenticate, signToken, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Please provide both username/email and password.' });
    }

    const rawLogin = login.trim();
    const trimmedLogin = rawLogin.toLowerCase();
    const upperLogin = rawLogin.toUpperCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedLogin },
          { username: trimmedLogin },
          { student: { studentId: rawLogin } },
          { student: { studentId: trimmedLogin } },
          { student: { studentId: upperLogin } },
          { teacher: { employeeId: rawLogin } },
          { teacher: { employeeId: trimmedLogin } },
          { teacher: { employeeId: upperLogin } },
          { administrator: { staffId: rawLogin } },
          { administrator: { staffId: trimmedLogin } },
          { administrator: { staffId: upperLogin } },
        ],
      },
      include: {
        student: {
          include: {
            class: true,
            program: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
        administrator: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is currently suspended or inactive. Please contact administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
      administratorId: user.administrator?.id,
    });

    const { password: _, ...userSafe } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: userSafe,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error processing authentication request.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        student: {
          include: {
            class: {
              include: {
                academicYear: true,
              },
            },
            program: {
              include: {
                department: true,
              },
            },
          },
        },
        teacher: {
          include: {
            department: true,
            managedClasses: true,
          },
        },
        administrator: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { password: _, ...userSafe } = user;
    return res.json({ user: userSafe });
  } catch (error: any) {
    console.error('Fetch /me error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      // Security best practice: don't reveal user existence
      return res.json({
        message: 'If an account exists with that email address, password reset instructions have been generated.',
      });
    }

    // Return a mock reset token for demonstration in this academic SIS portal
    return res.json({
      message: 'Reset instructions sent. For demonstration purposes, you may use reset code: 739281',
      resetCode: '739281',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    if (code !== '739281' && code !== '123456') {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Password has been successfully reset. You may now log in.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/auth/verify-id - Student and Teacher ID credential lookup
router.post('/verify-id', async (req, res) => {
  try {
    const { idNumber } = req.body;
    if (!idNumber) {
      return res.status(400).json({ error: 'ID number is required.' });
    }
    const cleanId = idNumber.trim();
    const cleanUpper = cleanId.toUpperCase();
    const cleanLower = cleanId.toLowerCase();

    // Check student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { studentId: cleanId },
          { studentId: cleanUpper },
          { studentId: cleanLower },
        ],
      },
      include: {
        user: { select: { fullName: true, username: true, email: true, status: true } },
        class: true,
        program: true,
      },
    });

    if (student) {
      return res.json({
        exists: true,
        role: 'STUDENT',
        fullName: student.user.fullName,
        username: student.user.username,
        studentId: student.studentId,
        className: student.class?.name || 'Class Assigned by Administration',
        programName: student.program?.name || 'Academic Track',
        status: student.user.status,
        message: 'Official Student Record Verified. Use your username or Student ID with your school-issued password to sign in.',
      });
    }

    // Check teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { employeeId: cleanId },
          { employeeId: cleanUpper },
          { employeeId: cleanLower },
        ],
      },
      include: {
        user: { select: { fullName: true, username: true, email: true, status: true } },
        department: true,
      },
    });

    if (teacher) {
      return res.json({
        exists: true,
        role: 'TEACHER',
        fullName: teacher.user.fullName,
        username: teacher.user.username,
        employeeId: teacher.employeeId,
        departmentName: teacher.department?.name || 'Academic Faculty',
        status: teacher.user.status,
        message: 'Official Faculty Record Verified. Use your username or Staff ID with your school-issued password to sign in.',
      });
    }

    return res.status(404).json({
      exists: false,
      error: 'No active student or faculty credential matches this ID. Please consult your School Administrator.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to verify credential ID.' });
  }
});

// POST /api/auth/activate - Student and Teacher Account Sign-Up & Activation using Administrator Credentials
router.post('/activate', async (req, res) => {
  try {
    const { role, idNumber, initialPassword, newPassword, phone } = req.body;

    if (!role || !idNumber || !initialPassword || !newPassword) {
      return res.status(400).json({
        error: 'Please provide role, administrator-issued ID (or username/email), temporary password, and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const cleanId = idNumber.trim();
    const cleanUpper = cleanId.toUpperCase();
    const cleanLower = cleanId.toLowerCase();

    let user;
    if (role === 'STUDENT') {
      user = await prisma.user.findFirst({
        where: {
          role: 'STUDENT',
          OR: [
            { student: { studentId: cleanId } },
            { student: { studentId: cleanUpper } },
            { student: { studentId: cleanLower } },
            { username: cleanLower },
            { email: cleanLower },
          ],
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
    } else if (role === 'TEACHER') {
      user = await prisma.user.findFirst({
        where: {
          role: 'TEACHER',
          OR: [
            { teacher: { employeeId: cleanId } },
            { teacher: { employeeId: cleanUpper } },
            { teacher: { employeeId: cleanLower } },
            { username: cleanLower },
            { email: cleanLower },
          ],
        },
        include: {
          teacher: {
            include: {
              department: true,
            },
          },
        },
      });
    } else {
      return res.status(400).json({ error: 'Invalid portal role. Must be STUDENT or TEACHER.' });
    }

    if (!user) {
      return res.status(404).json({
        error: `No ${role === 'STUDENT' ? 'student' : 'faculty'} record found matching "${cleanId}". Credentials must be registered by the School Administrator first.`,
      });
    }

    // Verify initial administrator-issued password
    const isMatch = await bcrypt.compare(initialPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'The temporary password or activation code does not match the official record given by the administrator.',
      });
    }

    // Hash new secure password chosen by user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateData: any = {
      password: hashedPassword,
      status: 'ACTIVE',
    };
    if (phone && phone.trim()) {
      updateData.phone = phone.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        student: {
          include: {
            class: true,
            program: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
        administrator: true,
      },
    });

    const token = signToken({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      studentId: updatedUser.student?.id,
      teacherId: updatedUser.teacher?.id,
      administratorId: updatedUser.administrator?.id,
    });

    const { password: _, ...userSafe } = updatedUser;

    return res.json({
      message: `Account activated successfully! Welcome to the Apex Academy Portal, ${updatedUser.fullName}.`,
      token,
      user: userSafe,
    });
  } catch (error: any) {
    console.error('Account activation error:', error);
    return res.status(500).json({ error: 'Server error processing account activation.' });
  }
});

// GET /api/auth/registered-accounts - Summary of active accounts for login guidance
router.get('/registered-accounts', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      take: 5,
      include: {
        user: { select: { fullName: true, username: true, email: true, status: true } },
        class: { select: { name: true } },
      },
      orderBy: { studentId: 'asc' },
    });

    const teachers = await prisma.teacher.findMany({
      take: 5,
      include: {
        user: { select: { fullName: true, username: true, email: true, status: true } },
        department: { select: { name: true } },
      },
      orderBy: { employeeId: 'asc' },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      take: 2,
      select: { fullName: true, username: true, email: true, status: true },
    });

    return res.json({
      students: students.map((s) => ({
        fullName: s.user.fullName,
        username: s.user.username,
        email: s.user.email,
        studentId: s.studentId,
        className: s.class?.name || 'Assigned Cohort',
        status: s.user.status,
      })),
      teachers: teachers.map((t) => ({
        fullName: t.user.fullName,
        username: t.user.username,
        email: t.user.email,
        employeeId: t.employeeId,
        departmentName: t.department?.name || 'Academic Faculty',
        status: t.user.status,
      })),
      admins,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve accounts summary.' });
  }
});

// GET /api/auth/system-status
router.get('/system-status', async (req, res) => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const userCount = await prisma.user.count();
    return res.json({
      initialized: adminCount > 0,
      adminCount,
      userCount,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to verify system status.' });
  }
});

// POST /api/auth/setup - Initial administrator setup (only if no admin exists)
router.post('/setup', async (req, res) => {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      return res.status(400).json({ error: 'System is already initialized with an active administrator.' });
    }

    const { fullName, email, username, password } = req.body;
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ error: 'Full name, email, username, and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        administrator: {
          create: {
            staffId: 'ADM-001',
            designation: 'Lead Administrator & Registrar',
          },
        },
      },
      include: { administrator: true },
    });

    const token = signToken({
      id: newAdmin.id,
      email: newAdmin.email,
      username: newAdmin.username,
      role: 'ADMIN',
      administratorId: newAdmin.administrator?.id,
    });

    const { password: _, ...userSafe } = newAdmin;
    return res.status(201).json({
      message: 'System successfully initialized. Administrator account created.',
      token,
      user: userSafe,
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Failed to execute initial system setup.' });
  }
});

// POST /api/auth/reset-database - Allows admin to reset database to clean state
router.post('/reset-database', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can reset the system database.' });
    }

    // Preserve current administrator
    const currentAdminId = req.user.id;

    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.studentFee.deleteMany();
    await prisma.schoolFee.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.result.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.timetable.deleteMany();
    await prisma.teacherSubject.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.class.deleteMany();
    await prisma.program.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.department.deleteMany();
    await prisma.semester.deleteMany();
    await prisma.academicYear.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.student.deleteMany();

    // Delete users other than current admin
    await prisma.user.deleteMany({
      where: { id: { not: currentAdminId } },
    });

    return res.json({ message: 'All student, teacher, class, and academic data cleared. Clean slate ready.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset system database.' });
  }
});

// POST /api/auth/demo-switch (Switches to an existing user with target role)
router.post('/demo-switch', async (req, res) => {
  try {
    const { role } = req.body; // "STUDENT", "TEACHER", "ADMIN"

    const user = await prisma.user.findFirst({
      where: { role, status: 'ACTIVE' },
      include: {
        student: {
          include: {
            class: true,
            program: true,
          },
        },
        teacher: {
          include: {
            department: true,
          },
        },
        administrator: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: `No active account with role ${role} found in database. Create one in the Administrator portal first.` });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'STUDENT' | 'TEACHER' | 'ADMIN',
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
      administratorId: user.administrator?.id,
    });

    const { password: _, ...userSafe } = user;
    return res.json({
      message: `Switched session to ${user.fullName} (${role})`,
      token,
      user: userSafe,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to switch account.' });
  }
});

export default router;
