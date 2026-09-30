import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { Layers, BookOpen, Building2, Calendar, Plus, X, Check, Trash2 } from 'lucide-react';

export const AdminAcademic: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'departments' | 'sessions'>('classes');

  // Data states
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Class modal form
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 10');
  const [section, setSection] = useState('A');
  const [classYearId, setClassYearId] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [classProgId, setClassProgId] = useState('');

  // Subject modal form
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [creditHours, setCreditHours] = useState('3');
  const [subjectDeptId, setSubjectDeptId] = useState('');

  // Department modal form
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Program modal form
  const [showProgModal, setShowProgModal] = useState(false);
  const [progName, setProgName] = useState('');
  const [progCode, setProgCode] = useState('');
  const [progDeptId, setProgDeptId] = useState('');

  // Academic Year modal form
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearName, setYearName] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [yearIsCurrent, setYearIsCurrent] = useState(true);

  // Semester modal form
  const [showSemModal, setShowSemModal] = useState(false);
  const [semYearId, setSemYearId] = useState('');
  const [semName, setSemName] = useState('');
  const [semTermNum, setSemTermNum] = useState('1');
  const [semStart, setSemStart] = useState('');
  const [semEnd, setSemEnd] = useState('');
  const [semIsCurrent, setSemIsCurrent] = useState(true);

  // Assign faculty to subject modal form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cls, subs, depts, progs, yrs, tchs] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getDepartments(),
        api.getPrograms(),
        api.getAcademicYears(),
        api.getTeachers(),
      ]);
      setClasses(cls);
      setSubjects(subs);
      setDepartments(depts);
      setPrograms(progs);
      setYears(yrs);
      setTeachers(tchs);

      if (yrs[0]) setClassYearId(yrs[0].id);
      if (depts[0]) {
        setSubjectDeptId(depts[0].id);
        setProgDeptId(depts[0].id);
      }
      if (tchs[0]) setAssignTeacherId(tchs[0].id);
      if (subs[0]) setAssignSubjectId(subs[0].id);
      if (cls[0]) setAssignClassId(cls[0].id);
    } catch (err) {
      console.error('Failed to load academic architecture:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass({
        name: className,
        gradeLevel,
        section,
        academicYearId: classYearId,
        classTeacherId: classTeacherId || undefined,
        programId: classProgId || undefined,
      });
      setShowClassModal(false);
      setClassName('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create class');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject({
        name: subjectName,
        code: subjectCode,
        creditHours: parseInt(creditHours),
        departmentId: subjectDeptId,
      });
      setShowSubjectModal(false);
      setSubjectName('');
      setSubjectCode('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment({
        name: deptName,
        code: deptCode,
        description: deptDesc,
      });
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    }
  };

  const handleCreateProg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProgram({
        name: progName,
        code: progCode,
        departmentId: progDeptId,
      });
      setShowProgModal(false);
      setProgName('');
      setProgCode('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create program');
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignTeacherSubject({
        teacherId: assignTeacherId,
        subjectId: assignSubjectId,
        classId: assignClassId || undefined,
      });
      setShowAssignModal(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to assign teacher to subject');
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName || !yearStart || !yearEnd) return;
    try {
      await api.createAcademicYear({
        name: yearName.trim(),
        startDate: yearStart,
        endDate: yearEnd,
        isCurrent: yearIsCurrent,
      });
      setShowYearModal(false);
      setYearName('');
      setYearStart('');
      setYearEnd('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create academic year');
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semYearId || !semName || !semStart || !semEnd) return;
    try {
      await api.createSemester({
        academicYearId: semYearId,
        name: semName.trim(),
        termNumber: parseInt(semTermNum),
        startDate: semStart,
        endDate: semEnd,
        isCurrent: semIsCurrent,
      });
      setShowSemModal(false);
      setSemName('');
      setSemStart('');
      setSemEnd('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create academic term/semester');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Academic Architecture & Curriculum Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure class cohorts, subjects, academic departments, programs, and faculty teaching assignments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-md px-4 pt-2 gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'classes' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Classes &amp; Cohorts ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'subjects' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Courses &amp; Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'departments' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Departments &amp; Programs
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'sessions' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Academic Terms
        </button>
      </div>

      {/* Tab 1: Classes */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">Configured Academic Cohorts</span>
            <button
              onClick={() => setShowClassModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Class Cohort
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Class Cohort Name</th>
                  <th className="p-3">Grade Level</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Assigned Homeroom Teacher</th>
                  <th className="p-3">Program Track</th>
                  <th className="p-3 text-center">Enrolled Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No cohort classes configured yet. Click "Create Class Cohort" to establish your first grade section.
                    </td>
                  </tr>
                ) : (
                  classes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/75">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 text-slate-700">{c.gradeLevel}</td>
                      <td className="p-3 font-mono text-slate-600">{c.section}</td>
                      <td className="p-3 text-slate-800 font-medium">
                        {c.classTeacher?.user?.fullName || 'Not Assigned'}
                      </td>
                      <td className="p-3 text-slate-600">{c.program?.name || 'General Academic'}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {c._count?.students || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">Accredited Course Curriculum</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5"
              >
                Assign Faculty
              </button>
              <button
                onClick={() => setShowSubjectModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Course / Subject
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Course Title</th>
                  <th className="p-3 text-center">Credit Hours</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Assigned Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      No courses or subjects cataloged yet. Click "Add Course / Subject" to define course units.
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/75">
                      <td className="p-3 font-mono font-bold text-blue-700">{sub.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{sub.name}</td>
                      <td className="p-3 text-center font-mono font-medium text-slate-800">{sub.creditHours}</td>
                      <td className="p-3 text-slate-700">{sub.department?.name || 'General'}</td>
                      <td className="p-3 text-slate-600">
                        {sub.teacherSubjects && sub.teacherSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sub.teacherSubjects.map((ts: any) => (
                              <span key={ts.id} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm text-xs">
                                {ts.teacher?.user?.fullName} ({ts.class?.name || 'All'})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Departments & Programs */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departments */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">Academic Departments</span>
              <button
                onClick={() => setShowDeptModal(true)}
                className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-md"
              >
                + Department
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-md shadow-xs divide-y divide-slate-100 text-xs">
              {departments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No academic departments created yet.</div>
              ) : (
                departments.map((d) => (
                  <div key={d.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{d.name}</span>
                      <span className="text-slate-400 font-mono ml-1">({d.code})</span>
                      <p className="text-slate-500 mt-0.5">{d.description}</p>
                    </div>
                    <div className="text-right text-slate-400 font-mono">
                      {d._count?.teachers || 0} Faculty
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Programs */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">Programs &amp; Tracks</span>
              <button
                onClick={() => setShowProgModal(true)}
                className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-md"
              >
                + Program
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-md shadow-xs divide-y divide-slate-100 text-xs">
              {programs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No academic programs or diploma tracks created yet.</div>
              ) : (
                programs.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-slate-400 font-mono ml-1">({p.code})</span>
                      <p className="text-slate-500 mt-0.5">Duration: {p.durationYears} Years • {p.department?.name}</p>
                    </div>
                    <div className="text-right text-slate-400 font-mono">
                      {p._count?.students || 0} Students
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Academic Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs p-4 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="font-semibold text-slate-800 text-sm">Official Institutional Sessions &amp; Terms</div>
              <p className="text-slate-500 text-xs mt-0.5">Manage academic years, semesters, and active instructional cycles</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSemModal(true)}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Term / Semester
              </button>
              <button
                onClick={() => setShowYearModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Academic Year
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {years.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No academic sessions established yet. Click "New Academic Year" to initialize your institution's school calendar (e.g. 2025-2026).
              </div>
            ) : (
              years.map((y) => (
                <div key={y.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{y.name}</span>
                      {y.isCurrent && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-sm font-semibold">
                          Active Academic Session
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 font-mono mt-0.5">
                      {y.startDate} to {y.endDate}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {y.semesters && y.semesters.length > 0 ? (
                      y.semesters.map((s: any) => (
                        <span key={s.id} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-sm text-slate-700">
                          {s.name} {s.isCurrent ? '(Active)' : ''}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No semesters added yet</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Create Academic Cohort Class</span>
              <button onClick={() => setShowClassModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Class Cohort Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 11 - STEM Beta"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Grade Level:</label>
                  <input
                    type="text"
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Section:</label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Academic Year / Session: <span className="text-rose-500">*</span>
                </label>
                {years.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex items-center justify-between">
                    <span>No academic years defined yet.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowClassModal(false);
                        setShowYearModal(true);
                      }}
                      className="font-bold underline text-amber-900"
                    >
                      + Create Year First
                    </button>
                  </div>
                ) : (
                  <select
                    value={classYearId}
                    onChange={(e) => setClassYearId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  >
                    <option value="">Select Academic Session...</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.isCurrent ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Academic Track / Program (Optional):</label>
                <select
                  value={classProgId}
                  onChange={(e) => setClassProgId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="">General Academic Track</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Homeroom Teacher (Optional):</label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="">Select Faculty...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.user?.fullName} ({t.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowClassModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Create Cohort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Add Accredited Course</span>
              <button onClick={() => setShowSubjectModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Course Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Molecular Biology & Genetics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="BIO-201"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Credit Units:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="6"
                    value={creditHours}
                    onChange={(e) => setCreditHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Academic Department:</label>
                <select
                  value={subjectDeptId}
                  onChange={(e) => setSubjectDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Assign Faculty to Course</span>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignFaculty} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Faculty Instructor:</label>
                <select
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.user?.fullName} ({t.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Course Subject:</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Class Cohort (Optional):</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="">All Cohorts / General</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Assign Instructor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Create Academic Session / Year</span>
              <button onClick={() => setShowYearModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateYear} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Academic Year Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025-2026"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Start Date:</label>
                  <input
                    type="date"
                    required
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date:</label>
                  <input
                    type="date"
                    required
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="yearIsCurrent"
                  checked={yearIsCurrent}
                  onChange={(e) => setYearIsCurrent(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="yearIsCurrent" className="font-medium text-slate-700">
                  Set as Active / Current Institutional Academic Session
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowYearModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester / Term Modal */}
      {showSemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Add Academic Term / Semester</span>
              <button onClick={() => setShowSemModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSemester} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Academic Year:</label>
                <select
                  value={semYearId}
                  onChange={(e) => setSemYearId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="">Select Academic Year...</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Term Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fall Semester or Term 1"
                    value={semName}
                    onChange={(e) => setSemName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Term Sequence Number:</label>
                  <select
                    value={semTermNum}
                    onChange={(e) => setSemTermNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  >
                    <option value="1">Term 1 / Semester 1</option>
                    <option value="2">Term 2 / Semester 2</option>
                    <option value="3">Term 3 / Summer Term</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Start Date:</label>
                  <input
                    type="date"
                    required
                    value={semStart}
                    onChange={(e) => setSemStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date:</label>
                  <input
                    type="date"
                    required
                    value={semEnd}
                    onChange={(e) => setSemEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="semIsCurrent"
                  checked={semIsCurrent}
                  onChange={(e) => setSemIsCurrent(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="semIsCurrent" className="font-medium text-slate-700">
                  Set as Active Instructional Term
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowSemModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Add Term</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
