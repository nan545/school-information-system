import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { UserCheck, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const TeacherProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const teacher = user?.teacher;

  const [phone, setPhone] = useState(user?.phone || '');
  const [specialization, setSpecialization] = useState(teacher?.specialization || '');
  const [qualification, setQualification] = useState(teacher?.qualification || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher?.id) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.updateTeacher(teacher.id, {
        phone,
        specialization,
        qualification,
      });
      setProfileMsg({ type: 'success', text: 'Faculty details updated successfully!' });
      await refreshUser();
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }
    setPassSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPassMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          Faculty Academic Profile & Account Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage academic designations, research specializations, contact details, and system security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Read-Only Dossier */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            Institutional Faculty Profile
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Full Name:</span>
              <span className="font-semibold text-slate-900">{user?.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Employee ID:</span>
              <span className="font-mono font-semibold text-slate-900">{teacher?.employeeId}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Institutional Email:</span>
              <span className="font-mono text-slate-700">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Academic Department:</span>
              <span className="text-slate-800 font-medium">{teacher?.department?.name || 'Department of Sciences'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Appointment Date:</span>
              <span className="font-mono text-slate-700">{teacher?.joiningDate || '2019-08-15'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Faculty Status:</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold inline-block mt-0.5">
                Active Tenured Faculty
              </span>
            </div>
          </div>
        </div>

        {/* Editable Profile & Password (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Update Faculty Details
            </h2>

            {profileMsg && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Telephone:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Specialization:</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Qualifications & Degrees:</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs transition-colors disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save Faculty Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              Change Faculty Portal Password
            </h2>

            {passMsg && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  passMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{passMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password:</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (min. 6 characters):</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password:</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={passSaving}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                {passSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
