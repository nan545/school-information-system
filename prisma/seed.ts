import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all existing data from database...');

  // Delete all records in correct foreign key order
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
  await prisma.administrator.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared completely. No dummy or sample data remains.');

  // 1. Create Baseline Academic Structure
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      isCurrent: true,
      semesters: {
        create: [
          {
            name: 'Fall Semester',
            termNumber: 1,
            startDate: '2024-09-01',
            endDate: '2025-01-20',
            isCurrent: false,
          },
          {
            name: 'Spring Semester',
            termNumber: 2,
            startDate: '2025-01-25',
            endDate: '2025-06-30',
            isCurrent: true,
          },
        ],
      },
    },
  });

  const dept = await prisma.department.create({
    data: {
      name: 'Science & Mathematics',
      code: 'SCI-MATH',
      description: 'Faculty of Natural Sciences, Computing, and Advanced Mathematics',
    },
  });

  const prog = await prisma.program.create({
    data: {
      name: 'Secondary Academic Diploma Track',
      code: 'SEC-DIP',
      departmentId: dept.id,
      durationYears: 4,
    },
  });

  // 2. Create Administrator Account
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@school.edu',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      fullName: 'System Administrator',
      phone: '+1 555-0190',
      status: 'ACTIVE',
      administrator: {
        create: {
          staffId: 'ADM-001',
          designation: 'School Administrator & Registrar',
        },
      },
    },
  });

  // 3. Create Teacher Account
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@school.edu',
      username: 'teacher',
      password: teacherPassword,
      role: 'TEACHER',
      fullName: 'Mr. Marcus Vance',
      phone: '+1 555-0191',
      status: 'ACTIVE',
      teacher: {
        create: {
          employeeId: 'TCH-101',
          qualification: 'M.Ed. Curriculum & Instruction, B.S. Mathematics',
          specialization: 'Pure Mathematics & Applied Sciences',
          joiningDate: '2023-08-15',
          departmentId: dept.id,
        },
      },
    },
    include: { teacher: true },
  });

  // 4. Create Class Cohort
  const classCohort = await prisma.class.create({
    data: {
      name: 'Grade 10 - Section A',
      gradeLevel: 'Grade 10',
      section: 'A',
      academicYearId: academicYear.id,
      programId: prog.id,
      classTeacherId: teacherUser.teacher?.id,
    },
  });

  // 5. Create Subject and Assign to Teacher
  const subject = await prisma.subject.create({
    data: {
      name: 'Integrated Mathematics & Sciences',
      code: 'MTH-101',
      creditHours: 4,
      departmentId: dept.id,
    },
  });

  if (teacherUser.teacher) {
    await prisma.teacherSubject.create({
      data: {
        teacherId: teacherUser.teacher.id,
        subjectId: subject.id,
        classId: classCohort.id,
      },
    });
  }

  // 6. Create Student Account
  const studentPassword = await bcrypt.hash('student123', 10);
  await prisma.user.create({
    data: {
      email: 'student@school.edu',
      username: 'student',
      password: studentPassword,
      role: 'STUDENT',
      fullName: 'Alex Morgan',
      phone: '+1 555-0192',
      status: 'ACTIVE',
      student: {
        create: {
          studentId: 'STU-2025-001',
          gender: 'Female',
          dateOfBirth: '2009-04-18',
          enrollmentDate: '2024-09-01',
          classId: classCohort.id,
          programId: prog.id,
          guardianName: 'Dr. Evelyn Morgan',
          guardianPhone: '+1 555-0193',
          guardianEmail: 'evelyn.morgan@example.com',
        },
      },
    },
  });

  console.log('Baseline portal accounts established:');
  console.log(' - Student:       username "student" (or STU-2025-001), password "student123"');
  console.log(' - Teacher:       username "teacher" (or TCH-101),      password "teacher123"');
  console.log(' - Administrator: username "admin",                     password "admin123"');
  console.log('School portal is completely fresh and ready for production use.');
}

main()
  .catch((e) => {
    console.error('Clean initialization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
