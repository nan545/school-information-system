import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { CheckSquare, Save, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const teacher = user?.teacher;

  const [classesData, setClassesData] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [rosterStatus, setRosterStatus] = useState<Record<string, { status: string; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (!teacher?.id) return;
    const fetchClasses = async () => {
      try {
        const res = await api.getTeacherClasses(teacher.id);
        setClassesData(res);
        const first = res.teachingAssignments[0]?.classId || res.managedClasses[0]?.id;
        if (first) setSelectedClassId(first);
      } catch (err) {
        console.error('Failed to load teacher classes:', err);
      }
    };
    fetchClasses();
  }, [teacher?.id]);

  useEffect(() => {
    if (!teacher?.id || !selectedClassId) return;
    const loadClassAndAttendance = async () => {
      setLoading(true);
      try {
        const [studentList, existingAttendance] = await Promise.all([
          api.getTeacherStudents(teacher.id, selectedClassId),
          api.getAttendance({ classId: selectedClassId, date }),
        ]);

        setStudents(studentList);

        // Prepopulate attendance status map
        const statusMap: Record<string, { status: string; remarks: string }> = {};
        studentList.forEach((st: any) => {
          const match = existingAttendance.find((ea: any) => ea.studentId === st.id);
          statusMap[st.id] = {
            status: match ? match.status : 'PRESENT',
            remarks: match ? match.remarks || '' : '',
          };
        });
        setRosterStatus(statusMap);
      } catch (err) {
        console.error('Failed to load attendance roster:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClassAndAttendance();
  }, [teacher?.id, selectedClassId, date]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRosterStatus((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRosterStatus((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: string) => {
    setRosterStatus((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const entries = students.map((st) => ({
        studentId: st.id,
        status: rosterStatus[st.id]?.status || 'PRESENT',
        remarks: rosterStatus[st.id]?.remarks || null,
      }));

      // Find academic year ID from class
      const currentClass = uniqueClasses.find((c: any) => c.id === selectedClassId);
      const academicYearId = currentClass?.academicYearId || 'cm10000000000000000000000';

      await api.batchRecordAttendance({
        classId: selectedClassId,
        academicYearId,
        date,
        entries,
      });

      setSaveSuccess(`Daily attendance register successfully saved for ${entries.length} students.`);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const allTeacherClasses = [
    ...(classesData?.managedClasses || []),
    ...(classesData?.teachingAssignments?.map((ta: any) => ta.class) || []),
  ];
  const uniqueClasses = Array.from(new Map(allTeacherClasses.filter(Boolean).map((c: any) => [c.id, c])).values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Class Attendance Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record and submit certified daily roll call logs for assigned cohorts
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving Register...' : 'Save Daily Register'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium p-3 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Class Cohort:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-blue-600"
            >
              {uniqueClasses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Register Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Quick Mark:</span>
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-sm text-xs font-medium"
          >
            All Present
          </button>
          <button
            onClick={() => handleMarkAll('ABSENT')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-sm text-xs font-medium"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Daily Roll Call Roster
          </span>
          <span className="text-xs text-slate-400 font-mono">{students.length} students on register</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading attendance register...</div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Attendance Status</th>
                  <th className="px-4 py-3">Remarks / Verification Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const currentStatus = rosterStatus[st.id]?.status || 'PRESENT';
                  const currentRemarks = rosterStatus[st.id]?.remarks || '';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{st.studentId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{st.user?.fullName}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-sm border border-slate-200">
                          <button
                            onClick={() => handleStatusChange(st.id, 'PRESENT')}
                            className={`px-2 py-1 rounded-xs font-medium transition-colors ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(st.id, 'LATE')}
                            className={`px-2 py-1 rounded-xs font-medium transition-colors ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleStatusChange(st.id, 'EXCUSED')}
                            className={`px-2 py-1 rounded-xs font-medium transition-colors ${
                              currentStatus === 'EXCUSED'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Excused
                          </button>
                          <button
                            onClick={() => handleStatusChange(st.id, 'ABSENT')}
                            className={`px-2 py-1 rounded-xs font-medium transition-colors ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Optional reason (e.g. clinic visit, traffic delay)"
                          value={currentRemarks}
                          onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 text-xs text-slate-800 focus:outline-blue-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No students enrolled in this section.</div>
        )}
      </div>
    </div>
  );
};
