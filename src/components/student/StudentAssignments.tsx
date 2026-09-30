import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { BookOpen, CheckCircle2, Clock, Upload, X, AlertCircle } from 'lucide-react';

export const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Submit modal state
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const loadAssignments = async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const data = await api.getStudentAssignments(student.id);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [student?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;
    setSaving(true);
    try {
      await api.submitAssignment(submittingAssignment.id, {
        content: submissionContent,
        fileUrl: submissionUrl || undefined,
      });
      setSubmitSuccess('Assignment submitted successfully!');
      setTimeout(() => {
        setSubmitSuccess('');
        setSubmittingAssignment(null);
        setSubmissionContent('');
        setSubmissionUrl('');
        loadAssignments();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSaving(false);
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'pending') return !a.submission;
    if (filter === 'submitted') return !!a.submission;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Course Assignments & Problem Sets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit coursework, track submission status, and review faculty evaluations
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-sm font-medium transition-colors ${
              filter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({assignments.filter((a) => !a.submission).length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1 rounded-sm font-medium transition-colors ${
              filter === 'submitted' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({assignments.filter((a) => !!a.submission).length})
          </button>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-md border border-slate-200">
          Loading course assignments...
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((item) => {
            const hasSubmitted = !!item.submission;
            const isGraded = item.submission?.status === 'GRADED';
            const isLate = new Date() > new Date(item.dueDate) && !hasSubmitted;

            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm">
                        {item.subject?.code}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Instructor: <span className="font-medium text-slate-700">{item.teacher}</span> • Maximum Points:{' '}
                      <span className="font-mono font-medium text-slate-700">{item.maxPoints} pts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGraded ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Graded: {item.submission.grade}/{item.maxPoints} pts
                      </span>
                    ) : hasSubmitted ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Awaiting Evaluation
                      </span>
                    ) : isLate ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium px-2.5 py-1 rounded-sm flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Overdue
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due: {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-sm border border-slate-100">
                  {item.description}
                </div>

                {/* Submission Details if submitted */}
                {hasSubmitted && (
                  <div className="bg-slate-50/75 border border-slate-200 rounded-md p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-700">Your Submitted Work:</span>
                      <span className="font-mono">
                        Submitted on: {new Date(item.submission.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{item.submission.content}</p>

                    {item.submission.feedback && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700">
                        <span className="font-semibold text-slate-800">Faculty Review & Feedback:</span>
                        <p className="italic text-slate-600 mt-0.5">{item.submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                <div className="flex justify-end pt-1">
                  {!hasSubmitted ? (
                    <button
                      onClick={() => {
                        setSubmittingAssignment(item);
                        setSubmissionContent('');
                        setSubmissionUrl('');
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" /> Submit Assignment
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSubmittingAssignment(item);
                        setSubmissionContent(item.submission.content);
                        setSubmissionUrl(item.submission.fileUrl || '');
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-xs transition-colors"
                    >
                      Re-submit Work
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-slate-400 text-xs">
          No assignments found in this category.
        </div>
      )}

      {/* Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-slate-300 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                  {submittingAssignment.subject?.code}
                </span>
                <h2 className="text-sm font-bold text-slate-900 mt-1">Submit: {submittingAssignment.title}</h2>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-slate-900">{submitSuccess}</div>
                <div className="text-xs text-slate-500">Updating your course assignment ledger...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Work Response & Derivations: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Enter analytical solution, code explanation, or submission writeup..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:outline-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Repository URL or Cloud Attachment (Optional):
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or https://github.com/..."
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSubmittingAssignment(null)}
                    className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
