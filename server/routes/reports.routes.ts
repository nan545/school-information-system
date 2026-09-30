import { Router, Response } from 'express';
import { prisma } from '../db.ts';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/reports/overview - Admin & Management Executive Metrics
router.get('/overview', authenticate, requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const [
      studentCount,
      teacherCount,
      classCount,
      subjectCount,
      departmentCount,
      allResults,
      allAttendance,
      studentFees,
      payments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.department.count(),
      prisma.result.findMany({ select: { grade: true, totalScore: true } }),
      prisma.attendance.findMany({ select: { status: true } }),
      prisma.studentFee.findMany({ select: { amount: true, paidAmount: true } }),
      prisma.payment.count(),
    ]);

    // Grade distribution
    const gradeDistribution: Record<string, number> = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0,
    };
    let totalScoreSum = 0;
    allResults.forEach((r) => {
      totalScoreSum += r.totalScore;
      if (gradeDistribution[r.grade] !== undefined) {
        gradeDistribution[r.grade]++;
      }
    });

    const averageExamScore = allResults.length > 0 ? (totalScoreSum / allResults.length).toFixed(1) : '0.0';
    const passCount = allResults.filter((r) => r.grade !== 'F').length;
    const passRate = allResults.length > 0 ? ((passCount / allResults.length) * 100).toFixed(1) : '100.0';

    // Attendance stats
    const totalAttendanceDays = allAttendance.length;
    const presentCount = allAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const overallAttendanceRate = totalAttendanceDays > 0 ? ((presentCount / totalAttendanceDays) * 100).toFixed(1) : '95.0';

    // Finances
    const totalBilled = studentFees.reduce((acc, f) => acc + f.amount, 0);
    const totalCollected = studentFees.reduce((acc, f) => acc + f.paidAmount, 0);
    const feeCollectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '100.0';

    return res.json({
      kpis: {
        studentCount,
        teacherCount,
        classCount,
        subjectCount,
        departmentCount,
        averageExamScore: parseFloat(averageExamScore),
        passRate: parseFloat(passRate),
        overallAttendanceRate: parseFloat(overallAttendanceRate),
        totalBilled,
        totalCollected,
        feeCollectionRate: parseFloat(feeCollectionRate),
        paymentsRecorded: payments,
      },
      gradeDistribution,
    });
  } catch (error: any) {
    console.error('Reports overview error:', error);
    return res.status(500).json({ error: 'Failed to generate institutional reports.' });
  }
});

// GET /api/reports/class-performance - Performance compared across classes
router.get('/class-performance', authenticate, requireRoles('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        students: {
          include: {
            results: { select: { totalScore: true, grade: true } },
            attendances: { select: { status: true } },
          },
        },
      },
    });

    const report = classes.map((c) => {
      let totalMarks = 0;
      let markCount = 0;
      let totalAttendance = 0;
      let presentAttendance = 0;

      c.students.forEach((st) => {
        st.results.forEach((r) => {
          totalMarks += r.totalScore;
          markCount++;
        });
        st.attendances.forEach((a) => {
          totalAttendance++;
          if (a.status === 'PRESENT' || a.status === 'LATE') presentAttendance++;
        });
      });

      const avgScore = markCount > 0 ? (totalMarks / markCount).toFixed(1) : 'N/A';
      const attRate = totalAttendance > 0 ? ((presentAttendance / totalAttendance) * 100).toFixed(1) : 'N/A';

      return {
        classId: c.id,
        className: c.name,
        gradeLevel: c.gradeLevel,
        section: c.section,
        enrolledCount: c.students.length,
        averageScore: avgScore,
        attendanceRate: attRate,
      };
    });

    return res.json(report);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to compile class performance report.' });
  }
});

export default router;
