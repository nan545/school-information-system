import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  UserX,
  UserCheck,
  Filter,
  KeyRound,
  Copy,
  Check,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  // Credential issuance states
  const [issuedCredentials, setIssuedCredentials] = useState<any | null>(null);
  const [credModalStudent, setCredModalStudent] = useState<any | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resettingCreds, setResettingCreds] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [classId, setClassId] = useState('');
  const [programId, setProgramId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        classId: classFilter !== 'all' ? classFilter : undefined,
        programId: programFilter !== 'all' ? programFilter : undefined,
      });
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cls, progs] = await Promise.all([api.getClasses(), api.getPrograms()]);
        setClasses(cls);
        setPrograms(progs);
        if (cls[0]) setClassId(cls[0].id);
        if (progs[0]) setProgramId(progs[0].id);
      } catch (err) {
        console.error('Failed to load classes and programs:', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [classFilter, programFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createStudent({
        fullName,
        email,
        username,
        password,
        studentId: studentId || undefined,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        phone,
        address,
        guardianName,
        guardianPhone,
        guardianEmail,
        classId: classId || undefined,
        programId: programId || undefined,
      });
      setShowCreateModal(false);
      resetForm();
      loadStudents();

      if (res.issuedCredentials) {
        setIssuedCredentials(res.issuedCredentials);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const handleResetStudentCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credModalStudent) return;
    setResettingCreds(true);
    try {
      const res = await api.resetStudentCredentials(credModalStudent.id, resetPasswordInput || undefined);
      setCredModalStudent(null);
      setResetPasswordInput('');
      loadStudents();
      if (res.issuedCredentials) {
        setIssuedCredentials(res.issuedCredentials);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset student credentials');
    } finally {
      setResettingCreds(false);
    }
  };

  const copyCredentials = (creds: any) => {
    const text = `APEX ACADEMY - OFFICIAL STUDENT PORTAL CREDENTIALS
Student Name: ${creds.fullName}
Student ID: ${creds.studentId}
Username: ${creds.username}
Institutional Email: ${creds.email}
Temporary Password: ${creds.temporaryPassword}
Cohort Class: ${creds.className || 'General'}
Program Track: ${creds.programName || 'General Academic'}
Portal URL: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSaving(true);
    try {
      await api.updateStudent(editingStudent.id, {
        fullName,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        phone,
        address,
        guardianName,
        guardianPhone,
        guardianEmail,
        classId: classId || undefined,
        programId: programId || undefined,
      });
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (student: any) => {
    const newStatus = student.user?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to mark ${student.user?.fullName} as ${newStatus}?`)) return;
    try {
      await api.setStudentStatus(student.id, newStatus);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to change student status');
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setFullName(student.user?.fullName || '');
    setEmail(student.user?.email || '');
    setUsername(student.user?.username || '');
    setStudentId(student.studentId || '');
    setGender(student.gender || 'Male');
    setDateOfBirth(student.dateOfBirth || '');
    setPhone(student.user?.phone || '');
    setAddress(student.address || '');
    setGuardianName(student.guardianName || '');
    setGuardianPhone(student.guardianPhone || '');
    setGuardianEmail(student.guardianEmail || '');
    setClassId(student.classId || '');
    setProgramId(student.programId || '');
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('password123');
    setStudentId('');
    setGender('Male');
    setDateOfBirth('');
    setPhone('');
    setAddress('');
    setGuardianName('');
    setGuardianPhone('');
    setGuardianEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Student Body Administration & Registration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, cohort enrollments, guardians, and account active states
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-600"
            />
          </div>
          <button type="submit" className="bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-semibold">Cohort:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600"
            >
              <option value="all">All Cohorts</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">Program:</span>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600"
            >
              <option value="all">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Matriculated Student Registry
          </span>
          <span className="text-xs text-slate-400 font-mono">{students.length} students found</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading student registry...</div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Full Legal Name</th>
                  <th className="px-4 py-3">Class Cohort</th>
                  <th className="px-4 py-3">Academic Program</th>
                  <th className="px-4 py-3">Institutional Email</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{st.studentId}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{st.user?.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-700">{st.class?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3.5 text-slate-600">{st.program?.name || 'General'}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{st.user?.email}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded-sm text-xs ${
                          st.user?.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {st.user?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setCredModalStudent(st)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-sm"
                          title="Manage Login Credentials & Access Slip"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(st)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-sm"
                          title="Edit student profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`p-1 rounded-sm ${
                            st.user?.status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={st.user?.status === 'ACTIVE' ? 'Deactivate student' : 'Activate student'}
                        >
                          {st.user?.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No students found matching your criteria.</div>
        )}
      </div>

      {/* Create / Edit Student Modal */}
      {(showCreateModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">
                {editingStudent ? `Edit Student: ${editingStudent.studentId}` : 'Enroll New Matriculated Student'}
              </span>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingStudent(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Legal Name: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Student ID Number (Optional / Auto-Gen):
                  </label>
                  <input
                    type="text"
                    placeholder="STD-2024-XXXX"
                    disabled={!!editingStudent}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono text-slate-800 focus:outline-blue-600 disabled:opacity-60"
                  />
                </div>

                {!editingStudent && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Institutional Email: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="student@apexacademy.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Portal Username: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. maya.lin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cohort Class:</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    <option value="">Select Cohort...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Program:</label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    <option value="">Select Program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth:</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-800 block mb-2">Guardian / Parent Contact Details:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Guardian Name:</label>
                    <input
                      type="text"
                      placeholder="Parent Name"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Guardian Phone:</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Guardian Email:</label>
                    <input
                      type="email"
                      placeholder="parent@domain.org"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address:</label>
                <input
                  type="text"
                  placeholder="Street Address, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingStudent ? 'Update Student Record' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Admission & Credential Slip Modal (Shown upon enrollment or reissue) */}
      {issuedCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">Official Student Credential Slip</span>
              </div>
              <button onClick={() => setIssuedCredentials(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-900 leading-relaxed">
              Official matriculation record established. Provide this access slip to the student or legal guardian. The student will sign in using these exact credentials on the Student Portal.
            </div>

            <div className="border border-slate-200 rounded-md p-4 bg-slate-50 space-y-2.5 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Student Full Name:</span>
                <span className="font-bold text-slate-900">{issuedCredentials.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Official Student ID:</span>
                <span className="font-bold text-blue-700">{issuedCredentials.studentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Portal Username:</span>
                <span className="font-bold text-slate-900">{issuedCredentials.username}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Registered Email:</span>
                <span className="text-slate-800">{issuedCredentials.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 bg-amber-50/75 p-1 rounded-sm">
                <span className="text-slate-700 font-sans font-semibold">Temporary Password:</span>
                <span className="font-bold text-rose-700">{issuedCredentials.temporaryPassword}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Class Cohort:</span>
                <span className="text-slate-800">{issuedCredentials.className || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Academic Track:</span>
                <span className="text-slate-800">{issuedCredentials.programName || 'Standard Diploma'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="text-[11px] text-slate-500">
                School Administrator Clearance • Official Record
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyCredentials(issuedCredentials)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 font-medium"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Slip'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reissue / Reset Credentials Modal */}
      {credModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">
                Manage Credentials: {credModalStudent.user?.fullName}
              </span>
              <button onClick={() => setCredModalStudent(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 text-slate-600 font-mono bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Student ID:</span>
                <span className="font-bold text-slate-900">{credModalStudent.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Portal Username:</span>
                <span className="font-bold text-slate-900">{credModalStudent.user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Registered Email:</span>
                <span className="text-slate-800">{credModalStudent.user?.email}</span>
              </div>
            </div>

            <form onSubmit={handleResetStudentCredentials} className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issue New Temporary Password:
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Assign a new password to reset the student's portal access immediately.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCredModalStudent(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingCreds}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
                >
                  {resettingCreds ? 'Reissuing...' : 'Reissue Credential Slip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
