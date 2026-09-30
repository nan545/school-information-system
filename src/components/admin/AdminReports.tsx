import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { BarChart3, Printer, CheckCircle2, TrendingUp, Award, Layers, Users } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [classPerf, setClassPerf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [ov, cp] = await Promise.all([
          api.getReportsOverview(),
          api.getClassPerformanceReport(),
        ]);
        setOverview(ov);
        setClassPerf(cp);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Generating institutional reports...</div>;
  }

  const kpis = overview?.kpis || {};
  const grades = overview?.gradeDistribution || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Institutional Academic Performance & Compliance Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated statistics for curriculum evaluation, accreditation, and administrative oversight
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Accreditation Report</span>
        </button>
      </div>

      {/* Printable Report Section */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4 text-center">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-widest">
            Apex Academy of Science & Arts
          </h2>
          <div className="text-xs text-slate-500">ACADEMIC YEAR 2024-2025 • COMPREHENSIVE INSTITUTIONAL AUDIT</div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">Generated: {new Date().toLocaleDateString()}</div>
        </div>

        {/* Section 1: Executive Key Metrics */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            1. Core Enrollment & Operational Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Total Students</span>
              <span className="text-lg font-bold text-slate-900">{kpis.studentCount}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Instructional Faculty</span>
              <span className="text-lg font-bold text-slate-900">{kpis.teacherCount}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Academic Departments</span>
              <span className="text-lg font-bold text-slate-900">{kpis.departmentCount}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Accredited Subjects</span>
              <span className="text-lg font-bold text-slate-900">{kpis.subjectCount}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Academic Performance & Examinations */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            2. Academic Standards & Examination Outcomes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Institutional Pass Rate</span>
              <span className="text-lg font-bold text-emerald-700">{kpis.passRate}%</span>
              <span className="text-slate-500 block text-xs">Passing grade requirement</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Weighted Exam Average</span>
              <span className="text-lg font-bold text-blue-700">{kpis.averageExamScore}%</span>
              <span className="text-slate-500 block text-xs">Across all course units</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Attendance Standard</span>
              <span className="text-lg font-bold text-slate-900">{kpis.overallAttendanceRate}%</span>
              <span className="text-slate-500 block text-xs">Campus-wide roll calls</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
            <div className="bg-slate-50 p-2.5 font-semibold text-slate-700 border-b border-slate-200">
              Grade Distribution Across Enrolled Subjects
            </div>
            <div className="p-4 grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
              {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map((g) => (
                <div key={g} className="p-2 border border-slate-100 bg-slate-50/50 rounded-sm">
                  <div className="font-bold text-slate-900">{g}</div>
                  <div className="text-base font-bold text-blue-700 mt-0.5">{grades[g] || 0}</div>
                  <div className="text-slate-400 text-xs">Students</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Class Performance Comparison */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            3. Class Cohort Performance Breakdown
          </h3>
          <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Class Cohort</th>
                  <th className="p-3">Grade Level</th>
                  <th className="p-3">Section</th>
                  <th className="p-3 text-center">Enrolled</th>
                  <th className="p-3 text-center">Mean Score</th>
                  <th className="p-3 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classPerf.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No cohort performance records yet. Data will populate automatically as class cohorts, attendance roll calls, and examination results are recorded.
                    </td>
                  </tr>
                ) : (
                  classPerf.map((c) => (
                    <tr key={c.classId}>
                      <td className="p-3 font-bold text-slate-900">{c.className}</td>
                      <td className="p-3 text-slate-600">{c.gradeLevel}</td>
                      <td className="p-3 font-mono text-slate-600">{c.section}</td>
                      <td className="p-3 text-center font-mono font-medium">{c.enrolledCount}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        {c.averageScore !== 'N/A' ? `${c.averageScore}%` : '—'}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-emerald-700">
                        {c.attendanceRate !== 'N/A' ? `${c.attendanceRate}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Fiscal Clearance Summary */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            4. Revenue & Tuition Clearance Standing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Total Tuition Invoiced:</span>
              <span className="text-base font-bold text-slate-900">${kpis.totalBilled?.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Total Remitted To Treasury:</span>
              <span className="text-base font-bold text-emerald-700">${kpis.totalCollected?.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm">
              <span className="text-slate-400 block">Fiscal Collection Efficiency:</span>
              <span className="text-base font-bold text-blue-700">{kpis.feeCollectionRate}%</span>
            </div>
          </div>
        </div>

        {/* Certified Footer */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div>Certified and verified by Academic Directorate</div>
            <div className="font-mono text-slate-400 mt-0.5">Registrar Sign-off • Apex Academy</div>
          </div>
          <div className="text-right font-mono text-slate-400">
            Document ID: SIS-ACCREDIT-2025-091
          </div>
        </div>
      </div>
    </div>
  );
};
