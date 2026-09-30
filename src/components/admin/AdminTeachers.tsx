import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import {
  Users,
  Search,
  Plus,
  Edit2,
  X,
  Filter,
  KeyRound,
  Copy,
  Check,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export const AdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  // Credential issuance states
  const [issuedCredentials, setIssuedCredentials] = useState<any | null>(null);
  const [credModalTeacher, setCredModalTeacher] = useState<any | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resettingCreds, setResettingCreds] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.getTeachers({
        search: search || undefined,
        departmentId: deptFilter !== 'all' ? deptFilter : undefined,
      });
      setTeachers(res);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const depts = await api.getDepartments();
        setDepartments(depts);
        if (depts[0]) setDepartmentId(depts[0].id);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [deptFilter]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createTeacher({
        fullName,
        email,
        username,
        password,
        employeeId: employeeId || undefined,
        departmentId: departmentId || undefined,
        qualification,
        specialization,
        phone,
      });
      setShowCreateModal(false);
      resetForm();
      loadTeachers();

      if (res.issuedCredentials) {
        setIssuedCredentials(res.issuedCredentials);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add faculty member');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTeacherCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credModalTeacher) return;
    setResettingCreds(true);
    try {
      const res = await api.resetTeacherCredentials(credModalTeacher.id, resetPasswordInput || undefined);
      setCredModalTeacher(null);
      setResetPasswordInput('');
      loadTeachers();
      if (res.issuedCredentials) {
        setIssuedCredentials(res.issuedCredentials);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset faculty credentials');
    } finally {
      setResettingCreds(false);
    }
  };

  const copyCredentials = (creds: any) => {
    const text = `APEX ACADEMY - OFFICIAL FACULTY PORTAL CREDENTIALS
Faculty Name: ${creds.fullName}
Staff / Employee ID: ${creds.employeeId}
Username: ${creds.username}
Institutional Email: ${creds.email}
Temporary Password: ${creds.temporaryPassword}
Academic Department: ${creds.departmentName || 'General Faculty'}
Portal URL: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSaving(true);
    try {
      await api.updateTeacher(editingTeacher.id, {
        fullName,
        departmentId: departmentId || undefined,
        qualification,
        specialization,
        phone,
      });
      setEditingTeacher(null);
      resetForm();
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to update faculty member');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (t: any) => {
    setEditingTeacher(t);
    setFullName(t.user?.fullName || '');
    setEmail(t.user?.email || '');
    setUsername(t.user?.username || '');
    setEmployeeId(t.employeeId || '');
    setDepartmentId(t.departmentId || '');
    setQualification(t.qualification || '');
    setSpecialization(t.specialization || '');
    setPhone(t.user?.phone || '');
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('password123');
    setEmployeeId('');
    setQualification('');
    setSpecialization('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Academic Faculty & Instructional Staff Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage teacher appointments, department affiliations, instructional specializations, and access
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
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty by name, employee ID, or field..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-600"
            />
          </div>
          <button onClick={loadTeachers} className="bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700">
            Search
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Faculty Directory & Credentials
          </span>
          <span className="text-xs text-slate-400 font-mono">{teachers.length} faculty registered</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading faculty directory...</div>
        ) : teachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Faculty Full Name</th>
                  <th className="px-4 py-3">Academic Department</th>
                  <th className="px-4 py-3">Specialization & Focus</th>
                  <th className="px-4 py-3">Qualifications</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{t.employeeId}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{t.user?.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-700">{t.department?.name || 'Department Unassigned'}</td>
                    <td className="px-4 py-3.5 text-slate-600">{t.specialization || 'General Field'}</td>
                    <td className="px-4 py-3.5 text-slate-500 italic max-w-xs truncate">{t.qualification}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{t.user?.email}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setCredModalTeacher(t)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-sm"
                          title="Manage Login Credentials & Access Slip"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-sm"
                          title="Edit faculty member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No faculty records found.</div>
        )}
      </div>

      {/* Modal */}
      {(showCreateModal || editingTeacher) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">
                {editingTeacher ? `Edit Faculty: ${editingTeacher.user?.fullName}` : 'Appoint New Faculty Member'}
              </span>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTeacher(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name & Academic Title: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Marcus Clark"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              {!editingTeacher && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institutional Email:</label>
                    <input
                      type="email"
                      required
                      placeholder="teacher@apexacademy.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. m.clark"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department:</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID:</label>
                  <input
                    type="text"
                    placeholder="TCH-2024-XXXX"
                    disabled={!!editingTeacher}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono text-slate-800 focus:outline-blue-600 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructional Specialization:</label>
                <input
                  type="text"
                  placeholder="e.g. Pure & Applied Mathematics, Topology"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Qualifications:</label>
                <input
                  type="text"
                  placeholder="e.g. M.Sc. Mathematics, Oxford University"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone:</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTeacher(null);
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
                  {saving ? 'Saving...' : editingTeacher ? 'Update Faculty Record' : 'Appoint Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Faculty Appointment & Credential Slip Modal */}
      {issuedCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">Official Faculty Credential Slip</span>
              </div>
              <button onClick={() => setIssuedCredentials(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-900 leading-relaxed">
              Faculty appointment registered. Provide this official credential slip to the teacher. The instructor will sign in to the Teacher Portal using these real institutional credentials.
            </div>

            <div className="border border-slate-200 rounded-md p-4 bg-slate-50 space-y-2.5 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Faculty Member:</span>
                <span className="font-bold text-slate-900">{issuedCredentials.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Staff / Employee ID:</span>
                <span className="font-bold text-blue-700">{issuedCredentials.employeeId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Portal Username:</span>
                <span className="font-bold text-slate-900">{issuedCredentials.username}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-sans">Official Email:</span>
                <span className="text-slate-800">{issuedCredentials.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 bg-amber-50/75 p-1 rounded-sm">
                <span className="text-slate-700 font-sans font-semibold">Temporary Password:</span>
                <span className="font-bold text-rose-700">{issuedCredentials.temporaryPassword}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Department:</span>
                <span className="text-slate-800">{issuedCredentials.departmentName || 'Academic Faculty'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="text-[11px] text-slate-500">
                Academic Administration Clearance • Human Resources
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

      {/* Reissue / Reset Faculty Credentials Modal */}
      {credModalTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">
                Manage Faculty Credentials: {credModalTeacher.user?.fullName}
              </span>
              <button onClick={() => setCredModalTeacher(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 text-slate-600 font-mono bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Staff ID:</span>
                <span className="font-bold text-slate-900">{credModalTeacher.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Portal Username:</span>
                <span className="font-bold text-slate-900">{credModalTeacher.user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-500">Official Email:</span>
                <span className="text-slate-800">{credModalTeacher.user?.email}</span>
              </div>
            </div>

            <form onSubmit={handleResetTeacherCredentials} className="space-y-3 pt-2">
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
                  Assign a new temporary password to update the faculty member's portal credentials immediately.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCredModalTeacher(null)}
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
