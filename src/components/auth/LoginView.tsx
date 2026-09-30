import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  School,
  ShieldCheck,
  AlertCircle,
  X,
  GraduationCap,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

type PortalRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<PortalRole>('STUDENT');
  const [loginInput, setLoginInput] = useState('student');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial setup state
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupFullName, setSetupFullName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupUsername, setSetupUsername] = useState('admin');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const handleRoleChange = (role: PortalRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'STUDENT') {
      setLoginInput('student');
      setPassword('student123');
    } else if (role === 'TEACHER') {
      setLoginInput('teacher');
      setPassword('teacher123');
    } else {
      setLoginInput('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !password) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await login(loginInput, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (usr: string, pwd: string) => {
    setLoginInput(usr);
    setPassword(pwd);
    setErrorMsg('');
    setLoading(true);
    try {
      await login(usr, pwd);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupFullName || !setupEmail || !setupUsername || !setupPassword) return;
    setErrorMsg('');
    setSetupLoading(true);
    try {
      const res = await api.setupSystem({
        fullName: setupFullName,
        email: setupEmail,
        username: setupUsername,
        password: setupPassword,
      });
      localStorage.setItem('apex_token', res.token);
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || 'System setup failed. Administrator might already exist.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotStep('reset');
      if (res.resetCode) setResetCode(res.resetCode);
      setResetMsg('A verification code has been dispatched. Enter the code and your new password.');
    } catch (err: any) {
      alert(err.message || 'Failed to request reset');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.resetPassword({
        email: forgotEmail,
        code: resetCode,
        newPassword,
      });
      alert('Password reset successful! You may now sign in with your new password.');
      setShowForgotModal(false);
      setForgotStep('request');
      setResetCode('');
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-800 antialiased">
      {/* Institutional Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-blue-600 text-white shadow-xs mx-auto">
          <School className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Apex Academy of Science &amp; Arts
        </h1>
        <p className="text-xs text-slate-500">
          Integrated Student Information System &amp; Institutional Academic Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Portal Role Tabs */}
        <div className="grid grid-cols-3 bg-slate-200 p-1 rounded-t-md border-t border-x border-slate-300 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className={`py-2 px-3 rounded-sm flex items-center justify-center gap-1.5 transition-colors ${
              selectedRole === 'STUDENT'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${selectedRole === 'STUDENT' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('TEACHER')}
            className={`py-2 px-3 rounded-sm flex items-center justify-center gap-1.5 transition-colors ${
              selectedRole === 'TEACHER'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Users className={`w-4 h-4 ${selectedRole === 'TEACHER' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Teacher Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-2 px-3 rounded-sm flex items-center justify-center gap-1.5 transition-colors ${
              selectedRole === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${selectedRole === 'ADMIN' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Portal Sign-in Box */}
        <div className="bg-white py-6 px-6 sm:px-8 border border-slate-300 rounded-b-md shadow-xs space-y-5">
          {/* Header Context for Selected Role */}
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {selectedRole === 'STUDENT' && 'Student Academic Login'}
              {selectedRole === 'TEACHER' && 'Faculty & Teacher Login'}
              {selectedRole === 'ADMIN' && 'School Administrator Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedRole === 'STUDENT' &&
                'Sign in with your Student ID, registered username, or institutional email.'}
              {selectedRole === 'TEACHER' &&
                'Sign in with your Staff ID, faculty username, or academic email.'}
              {selectedRole === 'ADMIN' &&
                'Sign in with your primary administrative username or master email.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isSetupMode ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {selectedRole === 'STUDENT' && 'Student ID, Username, or Email:'}
                    {selectedRole === 'TEACHER' && 'Staff ID, Username, or Email:'}
                    {selectedRole === 'ADMIN' && 'Administrator Username or Email:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      selectedRole === 'STUDENT'
                        ? 'e.g. STU-2025-001 or student'
                        : selectedRole === 'TEACHER'
                        ? 'e.g. TCH-101 or teacher'
                        : 'e.g. admin or admin@school.edu'
                    }
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-900 focus:outline-blue-600 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Account Password:</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-900 focus:outline-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-md shadow-xs text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-1"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : selectedRole === 'STUDENT'
                      ? 'Sign In to Student Portal'
                      : selectedRole === 'TEACHER'
                      ? 'Sign In to Teacher Portal'
                      : 'Sign In to Administrator Portal'}
                  </span>
                </button>
              </form>

              {/* Dedicated Role Credentials Card */}
              <div className="pt-3 border-t border-slate-200">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {selectedRole === 'STUDENT' && <GraduationCap className="w-4 h-4 text-blue-600" />}
                      {selectedRole === 'TEACHER' && <Users className="w-4 h-4 text-blue-600" />}
                      {selectedRole === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                      {selectedRole === 'STUDENT' && 'Student Portal Account:'}
                      {selectedRole === 'TEACHER' && 'Teacher Portal Account:'}
                      {selectedRole === 'ADMIN' && 'Administrator Account:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRole === 'STUDENT') handleDirectLogin('student', 'student123');
                        if (selectedRole === 'TEACHER') handleDirectLogin('teacher', 'teacher123');
                        if (selectedRole === 'ADMIN') handleDirectLogin('admin', 'admin123');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-sm text-[11px] font-medium flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Instant Sign In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-xs bg-white p-2.5 border border-slate-200 rounded-sm space-y-1">
                    {selectedRole === 'STUDENT' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Student ID / User:</span>
                          <span className="font-bold text-slate-900">student (STU-2025-001)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Password:</span>
                          <span className="font-bold text-slate-900">student123</span>
                        </div>
                      </>
                    )}

                    {selectedRole === 'TEACHER' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Staff ID / User:</span>
                          <span className="font-bold text-slate-900">teacher (TCH-101)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Password:</span>
                          <span className="font-bold text-slate-900">teacher123</span>
                        </div>
                      </>
                    )}

                    {selectedRole === 'ADMIN' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Admin Username:</span>
                          <span className="font-bold text-slate-900">admin</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Password:</span>
                          <span className="font-bold text-slate-900">admin123</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                    <span>Switch between Student, Teacher, or Admin at any time.</span>
                    <button
                      type="button"
                      onClick={() => setIsSetupMode(true)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      New Admin Setup
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* First Time Custom Administrator Setup */
            <form onSubmit={handleSetupSubmit} className="space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-sm font-bold text-slate-900">Initialize Custom Administrator</h2>
                <p className="text-slate-500 mt-0.5">Register a new master administrative credential.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Vance"
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Email:</label>
                <input
                  type="email"
                  required
                  placeholder="admin@school.edu"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username:</label>
                <input
                  type="text"
                  required
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password:</label>
                <input
                  type="password"
                  required
                  placeholder="min. 6 characters"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSetupMode(false)}
                  className="w-1/2 border border-slate-300 rounded-md py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-1/2 bg-slate-900 text-white rounded-md py-2 text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {setupLoading ? 'Initializing...' : 'Initialize System'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-sm w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Reset Portal Password</span>
              <button onClick={() => setShowForgotModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-3">
                <p className="text-slate-600 leading-relaxed">
                  Enter your registered institutional email address. Instructions and a security verification code will be generated.
                </p>
                <div>
                  <label className="block font-semibold mb-1">Account Email:</label>
                  <input
                    type="email"
                    required
                    placeholder="student@school.edu or admin@school.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Send Code</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3">
                {resetMsg && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-sm text-blue-900 font-medium">
                    {resetMsg}
                  </div>
                )}
                <div>
                  <label className="block font-semibold mb-1">6-Digit Verification Code:</label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">New Secure Password:</label>
                  <input
                    type="password"
                    required
                    placeholder="min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium">Reset &amp; Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
