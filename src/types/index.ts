export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt?: string;
  student?: Student;
  teacher?: Teacher;
  administrator?: Administrator;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  enrollmentDate?: string | null;
  classId?: string | null;
  programId?: string | null;
  user?: User;
  class?: SchoolClass;
  program?: Program;
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  qualification?: string | null;
  specialization?: string | null;
  joiningDate?: string | null;
  departmentId?: string | null;
  user?: User;
  department?: Department;
  managedClasses?: SchoolClass[];
  teacherSubjects?: TeacherSubject[];
}

export interface Administrator {
  id: string;
  userId: string;
  staffId: string;
  designation?: string | null;
  user?: User;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    teachers?: number;
    programs?: number;
    subjects?: number;
  };
}

export interface Program {
  id: string;
  name: string;
  code: string;
  durationYears: number;
  departmentId: string;
  department?: Department;
  _count?: {
    students?: number;
    classes?: number;
  };
}

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: string;
  section: string;
  academicYearId: string;
  academicYear?: AcademicYear;
  programId?: string | null;
  program?: Program;
  classTeacherId?: string | null;
  classTeacher?: Teacher;
  _count?: {
    students?: number;
    assignments?: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  departmentId: string;
  department?: Department;
  teacherSubjects?: TeacherSubject[];
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  classId?: string | null;
  teacher?: Teacher;
  subject?: Subject;
  class?: SchoolClass;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  semesters?: Semester[];
}

export interface Semester {
  id: string;
  academicYearId: string;
  academicYear?: AcademicYear;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remarks?: string | null;
  student?: Student;
  subject?: Subject;
  semester?: Semester;
  academicYear?: AcademicYear;
}

export interface Assessment {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  title: string;
  type: string;
  maxScore: number;
  score: number;
  date: string;
  feedback?: string | null;
  subject?: Subject;
  student?: Student;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string | null;
  student?: Student;
  class?: SchoolClass;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  dueDate: string;
  maxPoints: number;
  attachmentUrl?: string | null;
  status: 'ACTIVE' | 'CLOSED';
  createdAt?: string;
  subject?: Subject;
  class?: SchoolClass;
  teacher?: Teacher | { user: { fullName: string } };
  submissions?: Submission[];
  _count?: {
    submissions?: number;
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  content: string;
  fileUrl?: string | null;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  grade?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
  student?: Student;
  assignment?: Assignment;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  audience: 'ALL' | 'STUDENTS' | 'TEACHERS';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  authorId: string;
  author?: {
    fullName: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface SchoolFee {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  academicYearId: string;
  semesterId?: string | null;
  dueDate: string;
  academicYear?: AcademicYear;
  semester?: Semester;
  _count?: {
    studentFees?: number;
  };
}

export interface StudentFee {
  id: string;
  studentId: string;
  schoolFeeId: string;
  amount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdAt: string;
  schoolFee?: SchoolFee;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  referenceNumber: string;
  studentId: string;
  studentFeeId?: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  receiptNumber?: string | null;
  notes?: string | null;
  student?: Student;
  studentFee?: StudentFee;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  startTime: string;
  endTime: string;
  roomNumber: string;
  class?: SchoolClass;
  subject?: Subject;
  teacher?: Teacher;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}
