import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { FileText, Download, Printer, ShieldCheck, Check, X } from 'lucide-react';

export const StudentDocuments: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalDoc, setActiveModalDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!student?.id) return;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentDocuments(student.id);
        setDocuments(res.documents);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [student?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Official Academic Records & Documents
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified academic transcripts, evaluation certificates, and registrar attested credentials
        </p>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Available Verified Institutional Documents
          </span>
          <span className="text-xs text-slate-400 font-mono">Digital Signature Certified</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading academic documents...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/75 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{doc.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">{doc.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                      <span>Session: {doc.academicYear}</span>
                      <span>•</span>
                      <span>Issued: {doc.issuedDate}</span>
                      <span>•</span>
                      <span>Size: {doc.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setActiveModalDoc(doc)}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Certificate</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalDoc(doc);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document View / Print Modal */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full border border-slate-300 p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-semibold text-sm text-slate-900">{activeModalDoc.title}</span>
              <button
                onClick={() => setActiveModalDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Certificate Frame */}
            <div className="border-2 border-slate-300 p-6 rounded-sm bg-white text-slate-800 space-y-5 print:border-none">
              <div className="text-center border-b border-slate-300 pb-4">
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">
                  Apex Academy of Science & Arts
                </h2>
                <div className="text-xs text-slate-500 tracking-wide mt-0.5">
                  BOARD OF GOVERNORS & OFFICE OF THE REGISTRAR
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">Accredited SIS Document #DOC-2025-0891</div>
              </div>

              <div className="text-center py-2">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  {activeModalDoc.title}
                </h3>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700 bg-slate-50/50 p-4 border border-slate-200 rounded-sm">
                <p>
                  This is to officially certify that <span className="font-bold text-slate-900">{user?.fullName}</span>{' '}
                  (Student ID:{' '}
                  <span className="font-mono font-bold text-slate-900">{student?.studentId}</span>) is a bona fide
                  matriculated student enrolled in regular academic standing in the{' '}
                  <span className="font-semibold text-slate-900">{student?.program?.name || 'Academic Program'}</span>{' '}
                  at Apex Academy.
                </p>
                <p>
                  Class Assignment: <span className="font-semibold text-slate-900">{student?.class?.name}</span> • Academic
                  Year Session: <span className="font-semibold text-slate-900">{activeModalDoc.academicYear}</span>.
                </p>
                <p>
                  All academic records, credits, and assessments maintained herein are verified and conform strictly to the
                  academic requirements and standards promulgated by the Academic Council.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-slate-400 block font-mono">Date of Issuance:</span>
                  <span className="font-semibold text-slate-800">{activeModalDoc.issuedDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono">Document Status:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Certified Authentic
                  </span>
                </div>
              </div>

              <div className="pt-8 flex justify-between items-end text-xs border-t border-slate-200">
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800">
                    Dr. Arthur Sterling
                  </div>
                  <div className="text-slate-500">Registrar & Dean of Academic Records</div>
                </div>

                <div className="text-right">
                  <div className="inline-block p-2 border-2 border-slate-300 rounded-sm text-center">
                    <div className="text-xs font-bold text-slate-700 uppercase">OFFICIAL SEAL</div>
                    <div className="text-xs text-slate-400 font-mono">APEX ACADEMY</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setActiveModalDoc(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Official PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
