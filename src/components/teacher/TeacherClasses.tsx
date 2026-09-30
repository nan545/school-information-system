import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Users, Search, Phone, Mail, GraduationCap, X } from 'lucide-react';

export const TeacherClasses: React.FC = () => {
  const { user } = useAuth();
  const teacher = user?.teacher;

  const [classesData, setClassesData] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    if (!teacher?.id) return;
    const fetchClasses = async () => {
      try {
        const res = await api.getTeacherClasses(teacher.id);
        setClassesData(res);
        const first = res.teachingAssignments[0]?.classId || res.managedClasses[0]?.id;
        if (first) setSelectedClassId(first);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };
    fetchClasses();
  }, [teacher?.id]);

  useEffect(() => {
    if (!teacher?.id || !selectedClassId) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await api.getTeacherStudents(teacher.id, selectedClassId);
        setStudents(res);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [teacher?.id, selectedClassId]);

  const allTeacherClasses = [
    ...(classesData?.managedClasses || []),
    ...(classesData?.teachingAssignments?.map((ta: any) => ta.class) || []),
  ];
  // Deduplicate
  const uniqueClasses = Array.from(new Map(allTeacherClasses.filter(Boolean).map((c: any) => [c.id, c])).values());

  const filteredStudents = students.filter(
    (s) =>
      s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Class Cohorts & Student Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View enrolled students in your assigned academic sections and contact guardians
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Select Class Cohort:</span>
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

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-600"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Enrolled Student Roster
          </span>
          <span className="text-xs text-slate-400 font-mono">{filteredStudents.length} students enrolled</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading class roster...</div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Full Name</th>
                  <th className="px-4 py-3">Academic Program</th>
                  <th className="px-4 py-3">Guardian Name</th>
                  <th className="px-4 py-3">Guardian Contact</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-800">{st.studentId}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{st.user?.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{st.program?.name || 'General STEM'}</td>
                    <td className="px-4 py-3.5 text-slate-700">{st.guardianName || 'Parent On Record'}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{st.guardianPhone || '+1 (555) 000-0000'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold text-xs">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-sm font-medium transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No students enrolled in this section.</div>
        )}
      </div>

      {/* Student Details Preview Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Student Academic Profile</span>
              <button onClick={() => setSelectedStudent(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block">Full Name:</span>
                <span className="text-sm font-bold text-slate-900">{selectedStudent.user?.fullName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Student ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedStudent.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Class Cohort:</span>
                  <span className="text-slate-900">{selectedStudent.class?.name}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Institutional Email:</span>
                <span className="font-mono text-slate-700">{selectedStudent.user?.email}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-semibold">Guardian Information:</span>
                <div className="mt-1 space-y-1">
                  <div>Name: <span className="font-medium text-slate-800">{selectedStudent.guardianName}</span></div>
                  <div>Phone: <span className="font-mono text-slate-800">{selectedStudent.guardianPhone}</span></div>
                  <div>Email: <span className="font-mono text-slate-800">{selectedStudent.guardianEmail}</span></div>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Home Address:</span>
                <span className="text-slate-700">{selectedStudent.address || 'Address On Record'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium text-xs hover:bg-slate-800"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
