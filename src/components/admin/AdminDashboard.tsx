import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  GraduationCap,
  Users,
  Layers,
  BookOpen,
  Award,
  CreditCard,
  Building2,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any>(null);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [overview, classPerf] = await Promise.all([
          api.getReportsOverview(),
          api.getClassPerformanceReport(),
        ]);
        setReports(overview);
        setClassPerformance(classPerf);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-white rounded-md border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-md border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = reports?.kpis || {
    studentCount: 0,
    teacherCount: 0,
    classCount: 0,
    subjectCount: 0,
    departmentCount: 0,
    averageExamScore: 0,
    passRate: 0,
    overallAttendanceRate: 0,
    totalBilled: 0,
    totalCollected: 0,
    feeCollectionRate: 0,
  };

  const grades = reports?.gradeDistribution || {};
  const isBrandNew = kpis.studentCount === 0 && kpis.classCount === 0;

  return (
    <div className="space-y-6">
      {/* Executive Institutional Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Executive Academic Directorate
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-sm font-mono border border-slate-200">
                Registrar Panel
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Apex School Information System • Clean System Ready for Initial Configuration
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('students')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Enroll Student
            </button>
            <button
              onClick={() => onNavigate('teachers')}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Faculty Directory
            </button>
            <button
              onClick={() => onNavigate('classes')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              Configure Classes
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist for Fresh System */}
      {isBrandNew && (
        <div className="bg-white border border-blue-200 rounded-md p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Welcome to Your New School Portal — Initial Setup Guide
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The database is fresh and clean with zero sample data. Follow this streamlined workflow to configure your institution:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              onClick={() => onNavigate('classes')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-colors"
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>1. Academic Setup</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-slate-500 mt-1">
                Create your academic terms, departments, degree/program tracks, and class cohorts.
              </p>
            </button>

            <button
              onClick={() => onNavigate('teachers')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-colors"
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>2. Appoint Faculty</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-slate-500 mt-1">
                Add faculty members and assign them to course subjects and classes.
              </p>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-colors"
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>3. Enroll Students</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-slate-500 mt-1">
                Register students, assign them to class cohorts, and create their portal logins.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* KPI Overviews (8 cards across 4 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.studentCount}</span>
            <span className="text-xs text-slate-400">Students</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {kpis.studentCount === 0 ? 'No students enrolled yet' : 'Active student body'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Body</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.teacherCount}</span>
            <span className="text-xs text-slate-400">Teachers</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {kpis.teacherCount === 0 ? 'No faculty appointed yet' : 'Instructional staff'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cohort Classes</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.classCount}</span>
            <span className="text-xs text-slate-400">Sections</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">{kpis.subjectCount} subjects created</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Rate</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {kpis.passRate > 0 ? `${kpis.passRate}%` : '—'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Avg Score: {kpis.averageExamScore > 0 ? `${kpis.averageExamScore}%` : '—'}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.overallAttendanceRate > 0 ? `${kpis.overallAttendanceRate}%` : '—'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Campus-wide roll calls</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Collection</span>
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.feeCollectionRate > 0 ? `${kpis.feeCollectionRate}%` : '—'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">${kpis.totalCollected?.toFixed(2) || '0.00'} collected</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${kpis.totalBilled?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Fee schedules assessed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System State</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">Ready</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium">PostgreSQL Database Active</div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Class Performance Comparison (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Cohort Academic Performance Overview</h2>
              </div>
              <button
                onClick={() => onNavigate('classes')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Manage Classes <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-4 py-2.5">Class Cohort</th>
                    <th className="px-4 py-2.5">Grade Level</th>
                    <th className="px-4 py-2.5">Section</th>
                    <th className="px-4 py-2.5 text-center">Enrolled</th>
                    <th className="px-4 py-2.5 text-center">Mean Score</th>
                    <th className="px-4 py-2.5 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classPerformance.length > 0 ? (
                    classPerformance.map((c) => (
                      <tr key={c.classId} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.className}</td>
                        <td className="px-4 py-3 text-slate-600">{c.gradeLevel}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">{c.section}</td>
                        <td className="px-4 py-3 text-center font-mono font-medium text-slate-800">{c.enrolledCount}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                          {c.averageScore !== 'N/A' ? `${c.averageScore}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700">
                          {c.attendanceRate !== 'N/A' ? `${c.attendanceRate}%` : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No classes configured yet. Navigate to 'Classes &amp; Cohorts' to create your first class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grade Distribution Bar */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Institution-Wide Grade Distribution</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Consolidated Examination Results</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
              {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map((g) => (
                <div key={g} className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                  <div className="font-bold text-slate-900">{g}</div>
                  <div className="text-lg font-bold text-blue-700 mt-0.5">{grades[g] || 0}</div>
                  <div className="text-xs text-slate-400">Awarded</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Administrative Shortcuts (1 col) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md shadow-xs p-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Administrative Quick Actions
            </h2>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate('students')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 font-medium text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Add / Manage Students</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('teachers')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 font-medium text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Manage Faculty Roster</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('classes')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 font-medium text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Manage Cohorts &amp; Subjects</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('finance')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 font-medium text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Tuition Fees &amp; Payments</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('announcements')}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 font-medium text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Publish Official Notice</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* System Status Box */}
          <div className="bg-slate-900 text-slate-200 rounded-md p-4 shadow-xs text-xs space-y-2">
            <div className="font-semibold text-white">System Integrity & Database</div>
            <div className="space-y-1 text-slate-300">
              <div>ORM: <span className="font-mono text-white">Prisma Client v6.19.3</span></div>
              <div>Database: <span className="font-mono text-white">PostgreSQL / Relational</span></div>
              <div>State: <span className="text-emerald-400">Clean &amp; Ready For Production</span></div>
              <div>Security: <span className="font-mono text-white">Role-Based Access Control</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
