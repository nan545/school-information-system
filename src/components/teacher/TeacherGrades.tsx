import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Award, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const TeacherGrades: React.FC = () => {
  const { user } = useAuth();
  const teacher = user?.teacher;

  const [classesData, setClassesData] = useState<any>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [scoresMap, setScoresMap] = useState<Record<string, { caScore: number; examScore: number; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!teacher?.id) return;
    const fetchInit = async () => {
      try {
        const [cls, sems] = await Promise.all([
          api.getTeacherClasses(teacher.id),
          api.getSemesters(),
        ]);
        setClassesData(cls);
        setSemesters(sems);

        const currentSem = sems.find((s) => s.isCurrent) || sems[0];
        if (currentSem) setSelectedSemesterId(currentSem.id);

        const firstAssign = cls.teachingAssignments[0];
        if (firstAssign) {
          setSelectedSubjectId(firstAssign.subjectId);
          if (firstAssign.classId) setSelectedClassId(firstAssign.classId);
        }
      } catch (err) {
        console.error('Failed to load grade metadata:', err);
        setErrorMessage('Could not load classes and semesters. Refresh the page to try again.');
      }
    };
    fetchInit();
  }, [teacher?.id]);

  useEffect(() => {
    if (!teacher?.id || !selectedClassId || !selectedSubjectId || !selectedSemesterId) return;

    const loadStudentsAndExistingResults = async () => {
      setLoading(true);
      try {
        const [studentList, existingResults] = await Promise.all([
          api.getTeacherStudents(teacher.id, selectedClassId),
          api.getResults({
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            semesterId: selectedSemesterId,
          }),
        ]);

        setStudents(studentList);

        const map: Record<string, { caScore: number; examScore: number; remarks: string }> = {};
        studentList.forEach((st: any) => {
          const match = existingResults.find((r: any) => r.studentId === st.id);
          map[st.id] = {
            caScore: match ? match.caScore : 0,
            examScore: match ? match.examScore : 0,
            remarks: match ? match.remarks || '' : '',
          };
        });
        setScoresMap(map);
      } catch (err) {
        console.error('Failed to load marks roster:', err);
        setErrorMessage('Could not load the course roster or existing grades.');
      } finally {
        setLoading(false);
      }
    };
    loadStudentsAndExistingResults();
  }, [teacher?.id, selectedClassId, selectedSubjectId, selectedSemesterId]);

  const handleScoreChange = (studentId: string, field: 'caScore' | 'examScore' | 'remarks', val: any) => {
    setScoresMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'remarks' ? val : Math.max(0, parseFloat(val) || 0),
      },
    }));
  };

  const calculateGrade = (total: number) => {
    if (total >= 90) return 'A+';
    if (total >= 85) return 'A';
    if (total >= 80) return 'B+';
    if (total >= 75) return 'B';
    if (total >= 70) return 'C+';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    return 'F';
  };

  const handleSaveGrades = async () => {
    if (!selectedSubjectId || !selectedSemesterId) return;
    if (students.some((student) => {
      const score = scoresMap[student.id];
      return !score || score.caScore < 0 || score.caScore > 30 || score.examScore < 0 || score.examScore > 70;
    })) {
      setErrorMessage('Check each score: CA must be 0–30 and exam must be 0–70.');
      return;
    }
    setSaving(true);
    setSaveSuccess('');
    setErrorMessage('');
    try {
      const sem = semesters.find((s) => s.id === selectedSemesterId);
      const academicYearId = sem?.academicYearId || 'cm10000000000000000000000';

      const records = students.map((st) => ({
        studentId: st.id,
        caScore: scoresMap[st.id]?.caScore || 0,
        examScore: scoresMap[st.id]?.examScore || 0,
        remarks: scoresMap[st.id]?.remarks || null,
      }));

      await api.batchRecordResults({
        subjectId: selectedSubjectId,
        academicYearId,
        semesterId: selectedSemesterId,
        records,
      });

      setSaveSuccess(`Successfully saved grades for ${records.length} students.`);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save examination grades');
    } finally {
      setSaving(false);
    }
  };

  const teachingAssignments = classesData?.teachingAssignments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Official Examination & Continuous Assessment Mark Sheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter certified marks (30% Continuous Assessment + 70% Final Examination) for student transcripts
          </p>
        </div>

        <button
          onClick={handleSaveGrades}
          disabled={saving || students.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving Marks...' : 'Save All Marks'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium p-3 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Course & Class:</span>
            <select
              value={`${selectedSubjectId}__${selectedClassId}`}
              onChange={(e) => {
                const [subId, clsId] = e.target.value.split('__');
                setSelectedSubjectId(subId);
                setSelectedClassId(clsId);
              }}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-blue-600"
            >
              {teachingAssignments.map((ta: any) => (
                <option key={ta.id} value={`${ta.subjectId}__${ta.classId}`}>
                  {ta.subject?.name} ({ta.subject?.code}) — {ta.class?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Term / Semester:</span>
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-blue-600"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-xs">
          Grading: <span className="text-slate-700 font-medium">CA (max 30) + Exam (max 70) = Total (100)</span>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Evaluation Register
          </span>
          <span className="text-xs text-slate-400 font-mono">{students.length} students on roster</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading evaluation marks sheet...</div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 w-28 text-center">CA Score (30)</th>
                  <th className="px-4 py-3 w-28 text-center">Exam Score (70)</th>
                  <th className="px-4 py-3 w-24 text-center">Total (100)</th>
                  <th className="px-4 py-3 w-20 text-center">Grade</th>
                  <th className="px-4 py-3">Faculty Remark / Evaluation Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const ca = scoresMap[st.id]?.caScore || 0;
                  const exam = scoresMap[st.id]?.examScore || 0;
                  const total = ca + exam;
                  const grade = calculateGrade(total);
                  const remarks = scoresMap[st.id]?.remarks || '';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{st.studentId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{st.user?.fullName}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={ca}
                          onChange={(e) => handleScoreChange(st.id, 'caScore', e.target.value)}
                          className="w-20 bg-slate-50 border border-slate-300 rounded-sm p-1 text-center font-mono font-medium text-xs text-slate-900 focus:outline-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="70"
                          value={exam}
                          onChange={(e) => handleScoreChange(st.id, 'examScore', e.target.value)}
                          className="w-20 bg-slate-50 border border-slate-300 rounded-sm p-1 text-center font-mono font-medium text-xs text-slate-900 focus:outline-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {total}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded-sm text-xs ${
                          grade.startsWith('A')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : grade.startsWith('B')
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="e.g. Outstanding comprehension; strong project work"
                          value={remarks}
                          onChange={(e) => handleScoreChange(st.id, 'remarks', e.target.value)}
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
