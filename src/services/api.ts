const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('apex_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An unexpected server error occurred';
    try {
      const data = await response.json();
      if (data && data.error) errorMsg = data.error;
    } catch {
      // response wasn't json
    }
    throw new ApiError(errorMsg, response.status);
  }

  return response.json();
}

export const api = {
  // Auth
  getSystemStatus: () => request<{ initialized: boolean; adminCount: number; userCount: number }>('/auth/system-status'),
  setupSystem: (data: { fullName: string; email: string; username: string; password: string }) =>
    request<{ token: string; user: any; message: string }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetDatabase: () => request<{ message: string }>('/auth/reset-database', { method: 'POST' }),
  login: (credentials: { login: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string; resetCode?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  activateAccount: (data: {
    role: 'STUDENT' | 'TEACHER';
    idNumber: string;
    initialPassword: string;
    newPassword: string;
    phone?: string;
  }) =>
    request<{ token: string; user: any; message: string }>('/auth/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRegisteredAccounts: () =>
    request<{
      students: Array<{ fullName: string; username: string; email: string; studentId: string; className: string; status: string }>;
      teachers: Array<{ fullName: string; username: string; email: string; employeeId: string; departmentName: string; status: string }>;
      admins: Array<{ fullName: string; username: string; email: string; status: string }>;
    }>('/auth/registered-accounts'),
  verifyCredentialId: (idNumber: string) =>
    request<{ exists: boolean; role: string; fullName: string; username: string; studentId?: string; employeeId?: string; className?: string; programName?: string; departmentName?: string; message: string }>('/auth/verify-id', {
      method: 'POST',
      body: JSON.stringify({ idNumber }),
    }),
  demoSwitch: (role: 'STUDENT' | 'TEACHER' | 'ADMIN') =>
    request<{ token: string; user: any }>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Students
  getStudents: (params: { search?: string; classId?: string; programId?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.classId) query.set('classId', params.classId);
    if (params.programId) query.set('programId', params.programId);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return request<{ data: any[]; pagination: any }>(`/students?${query.toString()}`);
  },
  getStudentById: (id: string) => request<any>(`/students/${id}`),
  createStudent: (data: any) => request<any>('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: any) => request<any>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetStudentCredentials: (id: string, newPassword?: string) =>
    request<any>(`/students/${id}/reset-credentials`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  setStudentStatus: (id: string, status: string) =>
    request<any>(`/students/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getStudentResults: (id: string, params: { academicYearId?: string; semesterId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.academicYearId) query.set('academicYearId', params.academicYearId);
    if (params.semesterId) query.set('semesterId', params.semesterId);
    return request<{ results: any[]; summary: any }>(`/students/${id}/results?${query.toString()}`);
  },
  getStudentAssessments: (id: string) => request<any[]>(`/students/${id}/assessments`),
  getStudentAttendance: (id: string) => request<{ records: any[]; stats: any }>(`/students/${id}/attendance`),
  getStudentTimetable: (id: string) => request<any[]>(`/students/${id}/timetable`),
  getStudentAssignments: (id: string) => request<any[]>(`/students/${id}/assignments`),
  getStudentPayments: (id: string) => request<{ studentFees: any[]; payments: any[]; summary: any }>(`/students/${id}/payments`),
  makeStudentPayment: (id: string, data: { studentFeeId?: string; amount: number; paymentMethod: string; notes?: string }) =>
    request<any>(`/students/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  getStudentDocuments: (id: string) => request<{ documents: any[]; student: any }>(`/students/${id}/documents`),

  // Teachers
  getTeachers: (params: { departmentId?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.departmentId) query.set('departmentId', params.departmentId);
    if (params.search) query.set('search', params.search);
    return request<any[]>(`/teachers?${query.toString()}`);
  },
  getTeacherById: (id: string) => request<any>(`/teachers/${id}`),
  createTeacher: (data: any) => request<any>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id: string, data: any) => request<any>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetTeacherCredentials: (id: string, newPassword?: string) =>
    request<any>(`/teachers/${id}/reset-credentials`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  getTeacherClasses: (id: string) => request<{ managedClasses: any[]; teachingAssignments: any[] }>(`/teachers/${id}/classes`),
  getTeacherStudents: (id: string, classId?: string) => {
    const query = classId ? `?classId=${classId}` : '';
    return request<any[]>(`/teachers/${id}/students${query}`);
  },

  // Academic Structure
  getDepartments: () => request<any[]>('/academic/departments'),
  createDepartment: (data: any) => request<any>('/academic/departments', { method: 'POST', body: JSON.stringify(data) }),
  getPrograms: () => request<any[]>('/academic/programs'),
  createProgram: (data: any) => request<any>('/academic/programs', { method: 'POST', body: JSON.stringify(data) }),
  getClasses: () => request<any[]>('/academic/classes'),
  createClass: (data: any) => request<any>('/academic/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id: string, data: any) => request<any>(`/academic/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSubjects: () => request<any[]>('/academic/subjects'),
  createSubject: (data: any) => request<any>('/academic/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id: string, data: any) => request<any>(`/academic/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignTeacherSubject: (data: { teacherId: string; subjectId: string; classId?: string }) =>
    request<any>('/academic/teacher-subjects', { method: 'POST', body: JSON.stringify(data) }),
  deleteTeacherSubject: (id: string) => request<any>(`/academic/teacher-subjects/${id}`, { method: 'DELETE' }),
  getAcademicYears: () => request<any[]>('/academic/academic-years'),
  createAcademicYear: (data: any) => request<any>('/academic/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  getSemesters: () => request<any[]>('/academic/semesters'),
  createSemester: (data: any) => request<any>('/academic/semesters', { method: 'POST', body: JSON.stringify(data) }),

  // Results & Examination
  getResults: (params: { classId?: string; subjectId?: string; semesterId?: string; studentId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.classId) query.set('classId', params.classId);
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.semesterId) query.set('semesterId', params.semesterId);
    if (params.studentId) query.set('studentId', params.studentId);
    return request<any[]>(`/results?${query.toString()}`);
  },
  createResult: (data: any) => request<any>('/results', { method: 'POST', body: JSON.stringify(data) }),
  updateResult: (id: string, data: any) => request<any>(`/results/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  batchRecordResults: (data: { subjectId: string; academicYearId: string; semesterId: string; records: any[] }) =>
    request<any>('/results/batch', { method: 'POST', body: JSON.stringify(data) }),
  recordAssessment: (data: any) => request<any>('/results/assessments', { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  getAttendance: (params: { classId?: string; date?: string; studentId?: string; startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.classId) query.set('classId', params.classId);
    if (params.date) query.set('date', params.date);
    if (params.studentId) query.set('studentId', params.studentId);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/attendance?${query.toString()}`);
  },
  batchRecordAttendance: (data: { classId: string; academicYearId: string; date: string; entries: any[] }) =>
    request<any>('/attendance/batch', { method: 'POST', body: JSON.stringify(data) }),

  // Assignments
  getAssignments: (params: { classId?: string; subjectId?: string; status?: string; myOnly?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.classId) query.set('classId', params.classId);
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.status) query.set('status', params.status);
    if (params.myOnly) query.set('myOnly', 'true');
    return request<any[]>(`/assignments?${query.toString()}`);
  },
  getAssignmentSubmissions: (id: string) => request<{ assignment: any; roster: any[] }>(`/assignments/${id}/submissions`),
  createAssignment: (data: any) => request<any>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id: string, data: any) => request<any>(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id: string) => request<any>(`/assignments/${id}`, { method: 'DELETE' }),
  submitAssignment: (id: string, data: { content: string; fileUrl?: string }) =>
    request<any>(`/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (id: string, data: { grade: number; feedback?: string }) =>
    request<any>(`/assignments/submissions/${id}/grade`, { method: 'POST', body: JSON.stringify(data) }),

  // Announcements
  getAnnouncements: (params: { category?: string; audience?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.audience) query.set('audience', params.audience);
    return request<any[]>(`/announcements?${query.toString()}`);
  },
  createAnnouncement: (data: any) => request<any>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: string, data: any) => request<any>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) => request<any>(`/announcements/${id}`, { method: 'DELETE' }),

  // Finance
  getFeeStructures: () => request<any[]>('/finance/fees'),
  createFeeStructure: (data: any) => request<any>('/finance/fees', { method: 'POST', body: JSON.stringify(data) }),
  getAllPayments: (params: { search?: string; paymentMethod?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params.status) query.set('status', params.status);
    return request<any[]>(`/finance/payments?${query.toString()}`);
  },
  getFinanceOverview: () => request<any>('/finance/overview'),

  // Timetables
  getTimetables: (params: { classId?: string; teacherId?: string; dayOfWeek?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.classId) query.set('classId', params.classId);
    if (params.teacherId) query.set('teacherId', params.teacherId);
    if (params.dayOfWeek) query.set('dayOfWeek', params.dayOfWeek);
    return request<any[]>(`/timetables?${query.toString()}`);
  },
  createTimetableSlot: (data: any) => request<any>('/timetables', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimetableSlot: (id: string) => request<any>(`/timetables/${id}`, { method: 'DELETE' }),

  // Reports
  getReportsOverview: () => request<any>('/reports/overview'),
  getClassPerformanceReport: () => request<any[]>('/reports/class-performance'),
};
