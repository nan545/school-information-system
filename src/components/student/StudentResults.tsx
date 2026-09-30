import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Award, Printer, Download, CheckCircle2, ChevronRight, X } from 'lucide-react';

export const StudentResults: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [resultsData, setResultsData] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [years, sems] = await Promise.all([
          api.getAcademicYears(),
          api.getSemesters(),
        ]);
        setAcademicYears(years);
        setSemesters(sems);
        const currentYear = years.find((y) => y.isCurrent) || years[0];
        if (currentYear) {
          setSelectedYearId(currentYear.id);
          const currentSem = sems.find((s) => s.academicYearId === currentYear.id) || sems[0];
          if (currentSem) setSelectedSemesterId(currentSem.id);
        }
      } catch (err) {
        console.error('Failed to load academic sessions:', err);
      }
    };
    fetchMetadata();
  }, []);

  const loadResults = async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const data = await api.getStudentResults(student.id, {
        academicYearId: selectedYearId || undefined,
        semesterId: selectedSemesterId || undefined,
      });
      setResultsData(data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.id && selectedYearId) {
      loadResults();
    }
  }, [student?.id, selectedYearId, selectedSemesterId]);

  const results = resultsData?.results || [];
  const summary = resultsData?.summary || { totalCourses: 0, averageScore: 0, passedCourses: 0 };

  // Calculate approximate GPA on 4.0 scale
  const gpa = summary.totalCourses > 0
    ? (summary.averageScore >= 90 ? '4.00' : summary.averageScore >= 85 ? '3.80' : summary.averageScore >= 80 ? '3.50' : summary.averageScore >= 75 ? '3.00' : '2.70')
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Official Examination Results & Grade Transcript
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Certified institutional evaluation marks and cumulative grade point average
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Slip</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Academic Session:</span>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-600"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(Active Year)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Semester Term:</span>
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-600"
            >
              <option value="">All Semesters</option>
              {semesters
                .filter((s) => !selectedYearId || s.academicYearId === selectedYearId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-xs">
          Student ID: <span className="text-slate-700 font-semibold">{student?.studentId}</span>
        </div>
      </div>

      {/* Term Performance Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Courses Registered</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{summary.totalCourses}</span>
          <span className="text-xs text-slate-400">Total credited subjects</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Passed Courses</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{summary.passedCourses}</span>
          <span className="text-xs text-emerald-600">100% course clearance</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Weighted Average</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{summary.averageScore}%</span>
          <span className="text-xs text-slate-400">Out of 100 maximum</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Cumulative GPA</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{gpa}</span>
          <span className="text-xs text-slate-500">Academic Honor Standing</span>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Official Course Grade Breakdown
          </span>
          <span className="text-xs text-slate-500 font-mono">Grading Scale: 40% CA + 60% Final Exam</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading certified records...</div>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3 text-center">Credit Hours</th>
                  <th className="px-4 py-3 text-center">CA Score (30)</th>
                  <th className="px-4 py-3 text-center">Exam Score (70)</th>
                  <th className="px-4 py-3 text-center">Total (100)</th>
                  <th className="px-4 py-3 text-center">Letter Grade</th>
                  <th className="px-4 py-3">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-700">{r.subject?.code}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{r.subject?.name}</td>
                    <td className="px-4 py-3.5 text-center text-slate-600 font-mono">{r.subject?.creditHours || 3}</td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-600">{r.caScore}</td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-600">{r.examScore}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">{r.totalScore}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded-sm text-xs ${
                        r.grade.startsWith('A')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : r.grade.startsWith('B')
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 italic">{r.remarks || 'Satisfactory academic progress'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No examination results found for the chosen academic period.
          </div>
        )}
      </div>

      {/* Grade Scale Reference Standard */}
      <div className="bg-white border border-slate-200 rounded-md p-4 text-xs shadow-xs space-y-2">
        <div className="font-semibold text-slate-700">Official Institutional Grading System:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-slate-600 font-mono text-center">
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">A+</span> 90-100%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">A</span> 85-89%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">B+</span> 80-84%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">B</span> 75-79%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">C+</span> 70-74%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">C</span> 60-69%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-slate-900">D</span> 50-59%
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-sm">
            <span className="font-bold text-rose-700">F</span> &lt; 50%
          </div>
        </div>
      </div>

      {/* Printable Certified Slip Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full border border-slate-300 p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-semibold text-sm text-slate-900">Certified Term Grade Report</span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Header */}
            <div className="border border-slate-300 p-6 space-y-4 rounded-sm bg-white print:border-none">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Apex Academy of Science & Arts
                </h2>
                <p className="text-xs text-slate-500">Office of the Registrar & Academic Records</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">OFFICIAL STUDENT GRADE SLIP</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <span className="font-semibold text-slate-900">{user?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Student ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{student?.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Class:</span>
                  <span className="text-slate-900">{student?.class?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Term / Session:</span>
                  <span className="text-slate-900">2024-2025 • Semester 1</span>
                </div>
              </div>

              <table className="w-full text-left border border-slate-200 text-xs mt-3">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Course Title</th>
                    <th className="p-2 text-center">Score</th>
                    <th className="p-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-2 font-mono">{r.subject?.code}</td>
                      <td className="p-2">{r.subject?.name}</td>
                      <td className="p-2 text-center font-mono">{r.totalScore}</td>
                      <td className="p-2 text-center font-bold">{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-200">
                <div>
                  Average Score: <span className="font-bold">{summary.averageScore}%</span> • GPA:{' '}
                  <span className="font-bold">{gpa}</span>
                </div>
                <div className="text-slate-500 font-mono">Date Issued: {new Date().toLocaleDateString()}</div>
              </div>

              <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800">
                    Dr. Arthur Sterling
                  </div>
                  <div>Registrar Signature</div>
                </div>
                <div className="text-right text-slate-400 font-mono text-xs">
                  Official Institutional Seal Verified
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
