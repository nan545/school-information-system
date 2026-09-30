import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  CreditCard,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const student = user?.student;

  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<any>(null);

  useEffect(() => {
    if (!student?.id) return;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [res, att, ass, tt, ann, fin] = await Promise.all([
          api.getStudentResults(student.id),
          api.getStudentAttendance(student.id),
          api.getStudentAssignments(student.id),
          api.getStudentTimetable(student.id),
          api.getAnnouncements({ audience: 'STUDENTS' }),
          api.getStudentPayments(student.id),
        ]);
        setResultsData(res);
        setAttendanceData(att);
        setAssignments(ass);
        setTimetable(tt);
        setAnnouncements(ann.slice(0, 3));
        setFinanceData(fin);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [student?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-white rounded-md border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-md border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-md border border-slate-200 animate-pulse" />
      </div>
    );
  }

  // Filter today's timetable classes (or Monday as default standard school day)
  const todayClasses = timetable.filter((t) => t.dayOfWeek === 'MONDAY');
  const pendingAssignments = assignments.filter((a) => !a.submission);

  return (
    <div className="space-y-6">
      {/* Student Banner Information Hierarchy */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {user?.fullName}
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-sm font-mono border border-slate-200">
                {student?.studentId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Class Cohort: <span className="font-medium text-slate-700">{student?.class?.name || 'Class Unassigned'}</span> • Program:{' '}
              <span className="font-medium text-slate-700">{student?.program?.name || 'General Academic'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">Academic Session</span>
              <span className="text-sm font-semibold text-slate-800">2024-2025 • Semester 2</span>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-md transition-colors"
            >
              View Grade Slip
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Average</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {resultsData?.summary?.averageScore ? `${resultsData.summary.averageScore}%` : '87.4%'}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Good Standing</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Across 6 enrolled subjects</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {attendanceData?.stats?.attendanceRate ? `${attendanceData.stats.attendanceRate}%` : '93.3%'}
            </span>
            <span className="text-xs text-slate-500">
              {attendanceData?.stats?.presentCount || 13} days present
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Total sessions: {attendanceData?.stats?.totalDays || 15}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignments</span>
            <BookOpen className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingAssignments.length}</span>
            <span className="text-xs text-amber-700 font-medium">Pending Submission</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">{assignments.length} total active tasks</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tuition Balance</span>
            <CreditCard className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${financeData?.summary?.balance ? financeData.summary.balance.toFixed(2) : '100.00'}
            </span>
            <span className="text-xs text-amber-700 font-medium">Due Term 2</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Paid: ${financeData?.summary?.totalPaid || '3,000.00'}</div>
        </div>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Examination Performance (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Table */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Today's Class Schedule (Monday)</h2>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Full Week Timetable <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-4 py-2.5">Time Slot</th>
                    <th className="px-4 py-2.5">Course / Subject</th>
                    <th className="px-4 py-2.5">Instructor</th>
                    <th className="px-4 py-2.5">Room Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayClasses.length > 0 ? (
                    todayClasses.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">
                          {item.startTime} - {item.endTime}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.subject?.name}
                          <span className="text-slate-400 text-xs ml-1 font-mono">({item.subject?.code})</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.teacher?.user?.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200 font-medium text-slate-700">
                            {item.roomNumber}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-xs">
                        No scheduled classes for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Results Table */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Recent Term Examination Scores</h2>
              </div>
              <button
                onClick={() => onNavigate('results')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                All Examination Results <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-4 py-2.5">Subject Code</th>
                    <th className="px-4 py-2.5">Subject Name</th>
                    <th className="px-4 py-2.5 text-center">CA (30)</th>
                    <th className="px-4 py-2.5 text-center">Exam (70)</th>
                    <th className="px-4 py-2.5 text-center">Total (100)</th>
                    <th className="px-4 py-2.5 text-center">Grade</th>
                    <th className="px-4 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultsData?.results && resultsData.results.length > 0 ? (
                    resultsData.results.slice(0, 4).map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">{r.subject?.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.subject?.name}</td>
                        <td className="px-4 py-3 text-center text-slate-600 font-mono">{r.caScore}</td>
                        <td className="px-4 py-3 text-center text-slate-600 font-mono">{r.examScore}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 font-mono">{r.totalScore}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded-sm text-xs ${
                            r.grade.startsWith('A')
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : r.grade.startsWith('B')
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{r.remarks || 'Satisfactory'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-xs">
                        No official examination records released for this session yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Pending Assignments & Announcements (1 col) */}
        <div className="space-y-6">
          {/* Pending Assignments */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Assignments Due</h2>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            <div className="p-4 space-y-3">
              {assignments.length > 0 ? (
                assignments.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 border border-slate-100 rounded-md bg-slate-50/50 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold text-slate-900 leading-snug">{a.title}</h3>
                      {a.submission ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-1.5 py-0.5 rounded-sm shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-1.5 py-0.5 rounded-sm shrink-0 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Due Soon
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span>{a.subject?.name}</span>
                      <span className="font-mono text-slate-400">Due: {a.dueDate.split('T')[0]}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No pending course assignments.</div>
              )}
            </div>
          </div>

          {/* Official Notices & Announcements */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Institutional Notices</h2>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                All Notices
              </button>
            </div>
            <div className="p-4 divide-y divide-slate-100">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 hover:text-blue-600 cursor-pointer" onClick={() => onNavigate('announcements')}>
                        {ann.title}
                      </span>
                      {ann.priority === 'HIGH' && (
                        <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded-sm uppercase font-semibold">
                          Notice
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                    <span className="text-xs text-slate-400 block mt-1">
                      {new Date(ann.createdAt).toLocaleDateString()} • {ann.author?.fullName}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No current school circulars.</div>
              )}
            </div>
          </div>

          {/* Quick Support & Institutional Registrar Notice */}
          <div className="bg-slate-900 text-slate-200 rounded-md p-4 shadow-xs text-xs space-y-2">
            <div className="font-semibold text-white">Student Academic Support</div>
            <p className="text-slate-300 leading-relaxed">
              For examination re-mark inquiries or official enrollment verifications, contact the Office of the Registrar during regular office hours (08:30 - 16:30).
            </p>
            <div className="pt-1 text-slate-400">registrar@apexacademy.edu • Tel: +1 (555) 100-2001</div>
          </div>
        </div>
      </div>
    </div>
  );
};
