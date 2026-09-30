import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { FileSpreadsheet, Search, Filter } from 'lucide-react';

export const StudentAssessments: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!student?.id) return;
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        const data = await api.getStudentAssessments(student.id);
        setAssessments(data);
      } catch (err) {
        console.error('Failed to load continuous assessments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, [student?.id]);

  const filtered = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.name.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          Continuous Assessment (CA) Record Book
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed itemized grading logs for quizzes, laboratory investigations, midterm tests, and homework projects
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assessment title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-blue-600"
          >
            <option value="all">All Assessment Types</option>
            <option value="QUIZ">Quizzes</option>
            <option value="TEST">Midterm Tests</option>
            <option value="LAB">Laboratory Practicals</option>
            <option value="PROJECT">Projects</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading assessment records...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Subject / Course</th>
                  <th className="px-4 py-3">Assessment Title</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">Score / Max</th>
                  <th className="px-4 py-3 text-center">Percentage</th>
                  <th className="px-4 py-3">Instructor Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const percentage = ((item.score / item.maxScore) * 100).toFixed(1);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{item.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.subject?.name}
                        <span className="text-slate-400 ml-1 font-mono">({item.subject?.code})</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm font-medium border border-slate-200">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {item.score} / {item.maxScore}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-blue-700">
                        {percentage}%
                      </td>
                      <td className="px-4 py-3 text-slate-600 italic">
                        {item.feedback || 'Marked and verified by course instructor.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No continuous assessment scores found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};
