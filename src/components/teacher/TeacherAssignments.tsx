import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { BookOpen, Plus, CheckCircle2, Clock, Eye, X, Award, Trash2 } from 'lucide-react';

export const TeacherAssignments: React.FC = () => {
  const { user } = useAuth();
  const teacher = user?.teacher;

  const [assignments, setAssignments] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState('100');
  const [creating, setCreating] = useState(false);

  // Submissions Modal
  const [viewingAssignment, setViewingAssignment] = useState<any | null>(null);
  const [submissionsRoster, setSubmissionsRoster] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  const loadAssignments = async () => {
    if (!teacher?.id) return;
    setLoading(true);
    try {
      const [ass, cls] = await Promise.all([
        api.getAssignments({ myOnly: true }),
        api.getTeacherClasses(teacher.id),
      ]);
      setAssignments(ass);
      setClassesData(cls);
      const firstAssign = cls.teachingAssignments[0];
      if (firstAssign) {
        setSubjectId(firstAssign.subjectId);
        if (firstAssign.classId) setClassId(firstAssign.classId);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [teacher?.id]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !subjectId || !classId || !dueDate) return;
    setCreating(true);
    try {
      await api.createAssignment({
        title,
        description,
        subjectId,
        classId,
        dueDate,
        maxPoints: parseInt(maxPoints),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSubmissions = async (assignment: any) => {
    setViewingAssignment(assignment);
    setLoadingSubs(true);
    try {
      const data = await api.getAssignmentSubmissions(assignment.id);
      setSubmissionsRoster(data.roster);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGrading(true);
    try {
      await api.gradeSubmission(gradingSubmission.id, {
        grade: parseFloat(gradeScore),
        feedback: gradeFeedback,
      });
      setGradingSubmission(null);
      // Reload submissions roster
      if (viewingAssignment) {
        const data = await api.getAssignmentSubmissions(viewingAssignment.id);
        setSubmissionsRoster(data.roster);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  const teachingAssignments = classesData?.teachingAssignments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Coursework & Assignments Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish coursework, review submitted student solutions, and enter evaluations
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish New Assignment</span>
        </button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Active & Past Assignments
          </span>
          <span className="text-xs text-slate-400 font-mono">{assignments.length} total assignments</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading course assignments...</div>
        ) : assignments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {assignments.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-semibold px-2 py-0.5 rounded-sm">
                      {item.subject?.code}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2 py-0.5 rounded-sm">
                      {item.class?.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xl">{item.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span>Due: {item.dueDate.split('T')[0]}</span>
                    <span>•</span>
                    <span>Max: {item.maxPoints} pts</span>
                    <span>•</span>
                    <span className="text-slate-700 font-semibold">{item._count?.submissions || 0} Submissions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => handleOpenSubmissions(item)}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Submissions ({item._count?.submissions || 0})</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No assignments published yet.</div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-slate-300 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Publish New Course Assignment</span>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assignment Title: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Problem Set 5: Integration by Parts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course & Cohort:</label>
                  <select
                    value={`${subjectId}__${classId}`}
                    onChange={(e) => {
                      const [sId, cId] = e.target.value.split('__');
                      setSubjectId(sId);
                      setClassId(cId);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    {teachingAssignments.map((ta: any) => (
                      <option key={ta.id} value={`${ta.subjectId}__${ta.classId}`}>
                        {ta.subject?.name} ({ta.class?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date & Time:</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maximum Points:</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="1000"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assignment Description & Instructions: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail instructions, problems, required formats, and grading rubric..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Roster Modal */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                  {viewingAssignment.subject?.code}
                </span>
                <h2 className="text-sm font-bold text-slate-900 mt-1">{viewingAssignment.title} — Submissions</h2>
              </div>
              <button onClick={() => setViewingAssignment(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSubs ? (
              <div className="p-8 text-center text-slate-400">Loading submissions...</div>
            ) : submissionsRoster.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Submitted At</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Score / Max</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissionsRoster.map((item) => {
                      const sub = item.submission;
                      return (
                        <tr key={item.student.id} className="hover:bg-slate-50/75">
                          <td className="p-3 font-medium text-slate-900">
                            {item.student.user?.fullName}
                            <span className="text-slate-400 text-xs ml-1 font-mono">({item.student.studentId})</span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {sub ? new Date(sub.submittedAt).toLocaleString() : 'Not Submitted'}
                          </td>
                          <td className="p-3">
                            {sub?.status === 'GRADED' ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold">
                                Graded
                              </span>
                            ) : sub ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-sm font-semibold">
                                Submitted
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900">
                            {sub?.grade !== null && sub?.grade !== undefined
                              ? `${sub.grade} / ${viewingAssignment.maxPoints}`
                              : '—'}
                          </td>
                          <td className="p-3 text-center">
                            {sub ? (
                              <button
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeScore(sub.grade !== null ? sub.grade.toString() : '');
                                  setGradeFeedback(sub.feedback || '');
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-2.5 py-1 rounded-sm font-medium"
                              >
                                {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Solution'}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">No student enrollment records found for this cohort.</div>
            )}
          </div>
        </div>
      )}

      {/* Individual Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Grade Student Submission</span>
              <button onClick={() => setGradingSubmission(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-700 block">Submitted Solution Content:</span>
              <p className="text-slate-800 whitespace-pre-wrap">{gradingSubmission.content}</p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Grade Score (Max {viewingAssignment?.maxPoints || 100}): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={viewingAssignment?.maxPoints || 100}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono font-bold text-slate-900 focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evaluative Feedback / Comments:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Excellent asymptotic derivation, verified test coverage..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {grading ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
