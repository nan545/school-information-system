import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Sliders, KeyRound, Shield, CheckCircle2, AlertCircle, Database, RotateCcw, AlertTriangle } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database reset
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

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
      setPassMsg({ type: 'success', text: 'Administrator credentials updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPassSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await api.resetDatabase();
      setResetMsg(res.message || 'Database reset successfully. Clean state restored.');
      setResetConfirm(false);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          System Administration & Portal Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure institutional security policies, cryptographic hashes, database connection health, and administrative credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security & Password */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            Administrator Credentials & Access Control
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

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Master Password:</label>
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
              {passSaving ? 'Updating...' : 'Update Master Password'}
            </button>
          </form>
        </div>

        {/* Database & Architecture Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-3 text-xs">
            <h2 className="font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" /> Database &amp; System Telemetry
            </h2>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Database Engine:</span>
                <span className="font-mono font-bold text-slate-800">PostgreSQL / Relational</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>ORM Layer:</span>
                <span className="font-mono text-slate-800">Prisma Client v6.19.3</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Password Hashing Algorithm:</span>
                <span className="font-mono text-slate-800">bcrypt (Salt Work Factor: 10)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Session Authorization:</span>
                <span className="font-mono text-slate-800">JWT (JSON Web Token - 7 Days)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Data Isolation / Multi-Tenant RBAC:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Active &amp; Enforced
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800">Educational Record Privacy (FERPA / GDPR)</div>
            <p className="leading-relaxed">
              All academic results, Continuous Assessment (CA) scores, and student financial records are encrypted at rest and accessible strictly via role-authenticated REST endpoints.
            </p>
          </div>

          {/* Database Reset & Fresh State Management */}
          <div className="bg-white border border-rose-200 rounded-md p-5 shadow-xs space-y-3 text-xs">
            <h2 className="font-semibold text-rose-800 uppercase tracking-wider border-b border-rose-100 pb-2 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Database Maintenance &amp; Fresh State
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Permanently clear all student enrollments, faculty profiles, cohort classes, attendance logs, exam scores, and fee records to return the system to an immaculate clean state with your administrator account intact.
            </p>

            {resetMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{resetMsg}</span>
              </div>
            )}

            {!resetConfirm ? (
              <button
                type="button"
                onClick={() => setResetConfirm(true)}
                className="bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All School Records (Start Fresh)</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md space-y-2">
                <div className="font-bold text-rose-900">Are you sure you want to clear all data?</div>
                <p className="text-rose-700 text-[11px]">
                  This operation deletes all students, teachers, classes, subjects, and results. Only your active administrator profile will be preserved.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={handleResetDatabase}
                    className="bg-rose-700 hover:bg-rose-800 text-white font-medium px-3 py-1.5 rounded-md text-xs disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Yes, Wipe Data & Start Fresh'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
