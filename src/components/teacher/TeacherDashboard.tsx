import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  Users,
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
  Bell,
  ArrowRight,
  Clock,
  Plus,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const teacher = user?.teacher;

  const [loading, setLoading] = useState(true);
  const [classesData, setClassesData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!teacher?.id) return;
    const fetchTeacherData = async () => {
      setLoading(true);
      try {
        const [cls, ass, tt, ann] = await Promise.all([
          api.getTeacherClasses(teacher.id),
          api.getAssignments({ myOnly: true }),
          api.getTimetables({ teacherId: teacher.id }),
          api.getAnnouncements({ audience: 'TEACHERS' }),
        ]);
        setClassesData(cls);
        setAssignments(ass);
        setTimetable(tt);
        setAnnouncements(ann.slice(0, 3));
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, [teacher?.id]);

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

  const managedClasses = classesData?.managedClasses || [];
  const teachingAssignments = classesData?.teachingAssignments || [];
  const totalClasses = managedClasses.length + teachingAssignments.length;

  return (
    <div className="space-y-6">
      {/* Faculty Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {user?.fullName}
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-sm font-mono border border-slate-200">
                {teacher?.employeeId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Department: <span className="font-medium text-slate-700">{teacher?.department?.name || 'Academic Faculty'}</span> • Specialization:{' '}
              <span className="font-medium text-slate-700">{teacher?.specialization || 'General Studies'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Take Attendance
            </button>
            <button
              onClick={() => onNavigate('results')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Award className="w-3.5 h-3.5" /> Record Grades
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Classes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalClasses || 1}</span>
            <span className="text-xs text-slate-500">Active cohorts</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Grade 10 &amp; 11 STEM</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Coursework</span>
            <BookOpen className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{assignments.length}</span>
            <span className="text-xs text-emerald-600 font-medium">Published</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Problem sets &amp; tasks</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Periods</span>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{timetable.length || 8}</span>
            <span className="text-xs text-slate-500">Scheduled slots</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Across Monday - Friday</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submissions</span>
            <Award className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {assignments.reduce((acc, a) => acc + (a._count?.submissions || 0), 0)}
            </span>
            <span className="text-xs text-blue-700 font-medium">Received</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending review &amp; marks</div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Class Rosters & Quick Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Classes */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Assigned Cohorts & Subjects</h2>
              </div>
              <button
                onClick={() => onNavigate('classes')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View Full Student Rosters <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {teachingAssignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No courses or class cohorts assigned to your faculty profile yet. Course assignments are configured by the Registrar / School Administrator.
                </div>
              ) : (
                teachingAssignments.map((ta: any) => (
                  <div key={ta.id} className="p-4 flex items-center justify-between hover:bg-slate-50/75 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{ta.class?.name || 'Class Cohort'}</span>
                        <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-sm border border-slate-200 font-mono">
                          {ta.subject?.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Subject: <span className="font-medium text-slate-700">{ta.subject?.name}</span> • Credits: {ta.subject?.creditHours}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('attendance')}
                        className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs px-2.5 py-1 rounded-sm font-medium"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => onNavigate('results')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-2.5 py-1 rounded-sm font-medium"
                      >
                        Enter Marks
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Teaching Schedule */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Teaching Schedule (Today's Lectures)</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Course Subject</th>
                    <th className="px-4 py-2.5">Class Cohort</th>
                    <th className="px-4 py-2.5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timetable.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                        No scheduled class lectures for today.
                      </td>
                    </tr>
                  ) : (
                    timetable.slice(0, 4).map((slot: any) => (
                      <tr key={slot.id} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3 font-mono font-medium text-blue-700">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{slot.subject?.name}</td>
                        <td className="px-4 py-3 text-slate-700">{slot.class?.name}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-sm">
                            {slot.roomNumber}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Active Assignments & Notices (1 col) */}
        <div className="space-y-6">
          {/* Active Assignments */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Coursework Tasks</h2>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage
              </button>
            </div>

            <div className="p-4 space-y-3">
              {assignments.length > 0 ? (
                assignments.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 border border-slate-100 rounded-md bg-slate-50/50">
                    <div className="font-semibold text-xs text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                      <span>{a.subject?.name}</span>
                      <span className="font-mono text-slate-400">Due: {a.dueDate.split('T')[0]}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No active assignments created.</div>
              )}

              <button
                onClick={() => onNavigate('assignments')}
                className="w-full mt-2 py-2 border border-dashed border-slate-300 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Assignment</span>
              </button>
            </div>
          </div>

          {/* Institutional Circulars */}
          <div className="bg-white border border-slate-200 rounded-md shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Faculty Notices</h2>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                All Notices
              </button>
            </div>
            <div className="p-4 divide-y divide-slate-100">
              {announcements.map((ann) => (
                <div key={ann.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="font-semibold text-xs text-slate-900">{ann.title}</div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                  <span className="text-xs text-slate-400 block mt-1 font-mono">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
