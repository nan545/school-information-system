import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { LoginView } from './components/auth/LoginView.tsx';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { StudentResults } from './components/student/StudentResults.tsx';
import { StudentAssessments } from './components/student/StudentAssessments.tsx';
import { StudentAttendance } from './components/student/StudentAttendance.tsx';
import { StudentTimetable } from './components/student/StudentTimetable.tsx';
import { StudentAssignments } from './components/student/StudentAssignments.tsx';
import { StudentFees } from './components/student/StudentFees.tsx';
import { StudentDocuments } from './components/student/StudentDocuments.tsx';
import { StudentProfile } from './components/student/StudentProfile.tsx';
import { StudentCourses } from './components/student/StudentCourses.tsx';

// Teacher Components
import { TeacherDashboard } from './components/teacher/TeacherDashboard.tsx';
import { TeacherClasses } from './components/teacher/TeacherClasses.tsx';
import { TeacherAttendance } from './components/teacher/TeacherAttendance.tsx';
import { TeacherGrades } from './components/teacher/TeacherGrades.tsx';
import { TeacherAssignments } from './components/teacher/TeacherAssignments.tsx';
import { TeacherProfile } from './components/teacher/TeacherProfile.tsx';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminStudents } from './components/admin/AdminStudents.tsx';
import { AdminTeachers } from './components/admin/AdminTeachers.tsx';
import { AdminAcademic } from './components/admin/AdminAcademic.tsx';
import { AdminFinance } from './components/admin/AdminFinance.tsx';
import { AdminReports } from './components/admin/AdminReports.tsx';
import { AdminSettings } from './components/admin/AdminSettings.tsx';

// Common
import { AnnouncementsView } from './components/common/AnnouncementsView.tsx';

function MainApp() {
  const { user, role, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-mono">
        Authenticating institutional credentials...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderContent = () => {
    // 1. STUDENT PORTAL
    if (role === 'STUDENT') {
      switch (currentTab) {
        case 'dashboard':
          return <StudentDashboard onNavigate={setCurrentTab} />;
        case 'results':
          return <StudentResults />;
        case 'courses':
          return <StudentCourses />;
        case 'assessments':
          return <StudentAssessments />;
        case 'attendance':
          return <StudentAttendance />;
        case 'timetable':
          return <StudentTimetable />;
        case 'assignments':
          return <StudentAssignments />;
        case 'announcements':
          return <AnnouncementsView />;
        case 'fees':
          return <StudentFees />;
        case 'documents':
          return <StudentDocuments />;
        case 'profile':
          return <StudentProfile />;
        default:
          return <StudentDashboard onNavigate={setCurrentTab} />;
      }
    }

    // 2. TEACHER PORTAL
    if (role === 'TEACHER') {
      switch (currentTab) {
        case 'dashboard':
          return <TeacherDashboard onNavigate={setCurrentTab} />;
        case 'classes':
          return <TeacherClasses />;
        case 'attendance':
          return <TeacherAttendance />;
        case 'results':
          return <TeacherGrades />;
        case 'assignments':
          return <TeacherAssignments />;
        case 'announcements':
          return <AnnouncementsView />;
        case 'profile':
          return <TeacherProfile />;
        default:
          return <TeacherDashboard onNavigate={setCurrentTab} />;
      }
    }

    // 3. ADMINISTRATOR PORTAL
    if (role === 'ADMIN') {
      switch (currentTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setCurrentTab} />;
        case 'students':
          return <AdminStudents />;
        case 'teachers':
          return <AdminTeachers />;
        case 'classes':
        case 'subjects':
        case 'departments':
          return <AdminAcademic />;
        case 'results':
          return <TeacherGrades />;
        case 'attendance':
          return <TeacherAttendance />;
        case 'timetables':
          return <StudentTimetable />;
        case 'finance':
          return <AdminFinance />;
        case 'announcements':
          return <AnnouncementsView />;
        case 'reports':
          return <AdminReports />;
        case 'settings':
          return <AdminSettings />;
        default:
          return <AdminDashboard onNavigate={setCurrentTab} />;
      }
    }

    return <StudentDashboard onNavigate={setCurrentTab} />;
  };

  return (
    <AppLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
