import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Award,
  FileSpreadsheet,
  Calendar,
  Clock,
  BookOpen,
  Bell,
  CreditCard,
  FileText,
  UserCheck,
  GraduationCap,
  Users,
  Layers,
  Building2,
  CheckSquare,
  BarChart3,
  Sliders,
  LogOut,
  Menu,
  X,
  School,
  ShieldCheck,
} from 'lucide-react';
import { NotificationCenter } from '../common/NotificationCenter.tsx';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, onTabChange, children }) => {
  const { user, role, logout, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define navigation based on role without any decorative numbering
  const getNavItems = () => {
    if (role === 'STUDENT') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'results', label: 'Examination Results', icon: Award },
        { id: 'courses', label: 'Courses & Enrollment', icon: BookOpen },
        { id: 'assessments', label: 'Continuous Assessment', icon: FileSpreadsheet },
        { id: 'timetable', label: 'Class Timetable', icon: Calendar },
        { id: 'attendance', label: 'Attendance Record', icon: Clock },
        { id: 'assignments', label: 'Course Assignments', icon: BookOpen },
        { id: 'announcements', label: 'School Notices', icon: Bell },
        { id: 'fees', label: 'Fees & Billing', icon: CreditCard },
        { id: 'documents', label: 'Academic Documents', icon: FileText },
        { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
      ];
    }

    if (role === 'TEACHER') {
      return [
        { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
        { id: 'classes', label: 'My Classes & Students', icon: Users },
        { id: 'attendance', label: 'Attendance Register', icon: CheckSquare },
        { id: 'results', label: 'Grade & Exam Entry', icon: Award },
        { id: 'assignments', label: 'Assignments Management', icon: BookOpen },
        { id: 'announcements', label: 'Post Announcements', icon: Bell },
        { id: 'profile', label: 'Faculty Profile', icon: UserCheck },
      ];
    }

    // ADMINISTRATOR
    return [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Student Directory', icon: GraduationCap },
      { id: 'teachers', label: 'Faculty Directory', icon: Users },
      { id: 'classes', label: 'Classes & Cohorts', icon: Layers },
      { id: 'subjects', label: 'Curriculum & Subjects', icon: BookOpen },
      { id: 'departments', label: 'Departments & Programs', icon: Building2 },
      { id: 'results', label: 'Master Results & GPA', icon: Award },
      { id: 'attendance', label: 'Attendance Records', icon: Clock },
      { id: 'timetables', label: 'Master Timetables', icon: Calendar },
      { id: 'finance', label: 'Tuition & Payment Ledger', icon: CreditCard },
      { id: 'announcements', label: 'School Notices', icon: Bell },
      { id: 'reports', label: 'Institutional Reports', icon: BarChart3 },
      { id: 'settings', label: 'System Administration', icon: Sliders },
    ];
  };

  const navItems = getNavItems();

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const roleBadge = () => {
    if (role === 'ADMIN') {
      return <span className="bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium px-2 py-0.5 rounded-sm">Administrator</span>;
    }
    if (role === 'TEACHER') {
      return <span className="bg-blue-950 text-blue-200 border border-blue-800 text-xs font-medium px-2 py-0.5 rounded-sm">Faculty / Teacher</span>;
    }
    return <span className="bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium px-2 py-0.5 rounded-sm">Student</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Professional Institutional Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-800 text-slate-300 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-sm bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <School className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-tight text-white block leading-tight">
                  Apex Academy SIS
                </span>
                <span className="text-xs text-slate-400 block leading-none">
                  Student Information System
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <NotificationCenter onNavigate={onTabChange} />
            {/* Quick Portal Switcher */}
            <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700 text-xs">
              <button
                onClick={() => switchRole('STUDENT')}
                className={`px-2 py-1 rounded-sm text-xs transition-colors ${
                  role === 'STUDENT'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => switchRole('TEACHER')}
                className={`px-2 py-1 rounded-sm text-xs transition-colors ${
                  role === 'TEACHER'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Teacher
              </button>
              <button
                onClick={() => switchRole('ADMIN')}
                className={`px-2 py-1 rounded-sm text-xs transition-colors ${
                  role === 'ADMIN'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Admin
              </button>
            </div>

            {/* User Info */}
            <div className="hidden flex-col text-right sm:flex">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.fullName || 'User'}
              </span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {roleBadge()}
              </div>
            </div>

            <button
              onClick={logout}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="bg-white border border-slate-200 rounded-md shadow-xs p-2 sticky top-22">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1.5">
              {role === 'STUDENT' ? 'Student Workspace' : role === 'TEACHER' ? 'Faculty Workspace' : 'Administration'}
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100 px-3 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Apex SIS Active</div>
              <div className="text-slate-400 text-xs">Production Ready • No Dummy Data</div>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-900 block">Apex Portal</span>
                    <span className="text-xs text-slate-500 uppercase">{role}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 bg-slate-100 rounded-md mb-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 px-1">
                  Switch Portal View:
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    onClick={() => {
                      switchRole('STUDENT');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-sm text-center font-medium ${
                      role === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => {
                      switchRole('TEACHER');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-sm text-center font-medium ${
                      role === 'TEACHER' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Teacher
                  </button>
                  <button
                    onClick={() => {
                      switchRole('ADMIN');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-sm text-center font-medium ${
                      role === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 mt-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Apex Academy Information System • Production School Management Portal
          </div>
          <div>
            Fresh System State • Relational Database Connected
          </div>
        </div>
      </footer>
    </div>
  );
};
