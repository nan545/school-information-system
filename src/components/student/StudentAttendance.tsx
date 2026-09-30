import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Clock, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!student?.id) return;
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentAttendance(student.id);
        setData(res);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [student?.id]);

  const records = data?.records || [];
  const stats = data?.stats || {
    totalDays: 0,
    presentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    absentCount: 0,
    attendanceRate: 100,
  };

  const filtered = records.filter((r: any) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-medium text-xs flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3 h-3" /> Present
          </span>
        );
      case 'LATE':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-sm font-medium text-xs flex items-center gap-1 w-max">
            <AlertTriangle className="w-3 h-3" /> Tardy / Late
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-sm font-medium text-xs flex items-center gap-1 w-max">
            <HelpCircle className="w-3 h-3" /> Excused Leave
          </span>
        );
      case 'ABSENT':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-sm font-medium text-xs flex items-center gap-1 w-max">
            <XCircle className="w-3 h-3" /> Unexcused Absent
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Official Attendance & Discipline Register
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Daily class register logs recorded by homeroom and course faculty
        </p>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Attendance Rate</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.attendanceRate}%</span>
          <span className="text-xs text-emerald-600">Meets 85% requirement</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Days Present</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats.presentCount}</span>
          <span className="text-xs text-slate-400">Regular attendance</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Late Arrival</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{stats.lateCount}</span>
          <span className="text-xs text-slate-400">Recorded by gate/teacher</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Excused Leaves</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{stats.excusedCount}</span>
          <span className="text-xs text-slate-400">Official medical note</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Recorded</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.totalDays}</span>
          <span className="text-xs text-slate-400">Academic sessions</span>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-700">Daily Log History</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600"
            >
              <option value="all">All Days</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="EXCUSED">Excused</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading attendance register...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Day of Week</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Class Roster</th>
                  <th className="px-4 py-3">Remarks / Verified Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r: any) => {
                  const dateObj = new Date(r.date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-800">{r.date}</td>
                      <td className="px-4 py-3.5 text-slate-600">{dayName}</td>
                      <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                      <td className="px-4 py-3.5 text-slate-600">{r.class?.name || 'Class Cohort'}</td>
                      <td className="px-4 py-3.5 text-slate-500 italic">
                        {r.remarks || 'Standard on-time check-in'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No attendance entries found matching the filter.
          </div>
        )}
      </div>
    </div>
  );
};
