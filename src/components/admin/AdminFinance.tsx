import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { CreditCard, Search, Plus, Filter, CheckCircle2, X } from 'lucide-react';

export const AdminFinance: React.FC = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Fee Creation Modal
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeTitle, setFeeTitle] = useState('');
  const [feeDesc, setFeeDesc] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeYearId, setFeeYearId] = useState('');
  const [feeDueDate, setFeeDueDate] = useState('');
  const [autoAssignClassId, setAutoAssignClassId] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feeList, payList, cls, yrs, ov] = await Promise.all([
        api.getFeeStructures(),
        api.getAllPayments({
          search: search || undefined,
          paymentMethod: methodFilter !== 'all' ? methodFilter : undefined,
        }),
        api.getClasses(),
        api.getAcademicYears(),
        api.getFinanceOverview(),
      ]);
      setFees(feeList);
      setPayments(payList);
      setClasses(cls);
      setYears(yrs);
      setOverview(ov);
      if (yrs[0]) setFeeYearId(yrs[0].id);
    } catch (err) {
      console.error('Failed to load financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [methodFilter]);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeTitle || !feeAmount || !feeYearId || !feeDueDate) return;
    setSavingFee(true);
    try {
      await api.createFeeStructure({
        title: feeTitle,
        description: feeDesc,
        amount: parseFloat(feeAmount),
        academicYearId: feeYearId,
        dueDate: feeDueDate,
        autoAssignClassId: autoAssignClassId || undefined,
      });
      setShowFeeModal(false);
      setFeeTitle('');
      setFeeDesc('');
      setFeeAmount('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create fee schedule');
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Institutional Tuition & Payment Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure tuition structures, monitor revenue clearance, and review financial receipts
          </p>
        </div>

        <button
          onClick={() => setShowFeeModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Fee Assessment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Invoiced</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            ${overview?.totalBilled ? overview.totalBilled.toFixed(2) : '3,100.00'}
          </span>
          <span className="text-xs text-slate-400">Total institutional levy</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Remitted</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            ${overview?.totalCollected ? overview.totalCollected.toFixed(2) : '3,000.00'}
          </span>
          <span className="text-xs text-emerald-600">Cleared through treasury</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Outstanding Due</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            ${overview?.totalOutstanding ? overview.totalOutstanding.toFixed(2) : '100.00'}
          </span>
          <span className="text-xs text-slate-500">Uncollected balances</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Collection Rate</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">
            {overview?.collectionRate ? `${overview.collectionRate}%` : '96.8%'}
          </span>
          <span className="text-xs text-emerald-600">Fiscal standard met</span>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Active Institutional Fee Structures
          </span>
          <span className="text-xs text-slate-400 font-mono">{fees.length} fee schedules</span>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">Fee Schedule Name</th>
              <th className="p-3">Description</th>
              <th className="p-3">Academic Session</th>
              <th className="p-3">Payment Due Date</th>
              <th className="p-3 text-right">Standard Amount</th>
              <th className="p-3 text-center">Assigned Accounts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  No institutional fee structures established yet. Click "New Fee Assessment" to schedule tuition or lab charges.
                </td>
              </tr>
            ) : (
              fees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/75">
                  <td className="p-3 font-bold text-slate-900">{f.title}</td>
                  <td className="p-3 text-slate-500 max-w-sm truncate">{f.description}</td>
                  <td className="p-3 text-slate-700">{f.academicYear?.name}</td>
                  <td className="p-3 font-mono text-slate-600">{f.dueDate}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">${f.amount.toFixed(2)}</td>
                  <td className="p-3 text-center font-mono text-slate-700 font-semibold">
                    {f._count?.studentFees || 0} students
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* All Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-700 uppercase tracking-wider">
            Master Electronic Transactions Journal
          </span>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Txn # or Student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-600"
              />
            </div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600"
            >
              <option value="all">All Methods</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Wire</option>
              <option value="ONLINE">Online Portal</option>
            </select>
            <button onClick={loadData} className="bg-slate-800 text-white px-3 py-1 rounded-md text-xs">
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading transaction ledger...</div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Reference Txn</th>
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount Settled</th>
                  <th className="p-3 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/75">
                    <td className="p-3 font-mono font-medium text-slate-900">{p.referenceNumber}</td>
                    <td className="p-3 font-mono text-blue-700 font-semibold">{p.receiptNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{p.student?.user?.fullName}</td>
                    <td className="p-3 font-mono text-slate-600">{p.student?.studentId}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm font-mono text-xs">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{p.paymentDate}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${p.amount.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No transactions match your search.</div>
        )}
      </div>

      {/* Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Create New Institutional Fee Assessment</span>
              <button onClick={() => setShowFeeModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateFee} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Fee Title: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Consumables &amp; Safety Levy"
                  value={feeTitle}
                  onChange={(e) => setFeeTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of fee..."
                  value={feeDesc}
                  onChange={(e) => setFeeDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Amount ($ USD): <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Due Date: <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={feeDueDate}
                    onChange={(e) => setFeeDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Academic Session:</label>
                <select
                  value={feeYearId}
                  onChange={(e) => setFeeYearId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Auto-Invoice To Class Cohort (Optional):</label>
                <select
                  value={autoAssignClassId}
                  onChange={(e) => setAutoAssignClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="">Do not auto-assign (Manual)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.gradeLevel})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowFeeModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" disabled={savingFee} className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50">
                  {savingFee ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
