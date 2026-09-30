import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { CreditCard, CheckCircle2, Clock, Receipt, Plus, X } from 'lucide-react';

export const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CARD');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState('');

  const loadFinance = async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const data = await api.getStudentPayments(student.id);
      setFinanceData(data);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, [student?.id]);

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id || !payAmount) return;
    setProcessing(true);
    try {
      await api.makeStudentPayment(student.id, {
        studentFeeId: selectedFeeId || undefined,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        notes,
      });
      setPaySuccess('Fee settlement recorded and official receipt generated!');
      setTimeout(() => {
        setPaySuccess('');
        setShowPayModal(false);
        setPayAmount('');
        setNotes('');
        loadFinance();
      }, 1300);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const fees = financeData?.studentFees || [];
  const payments = financeData?.payments || [];
  const summary = financeData?.summary || { totalBilled: 0, totalPaid: 0, balance: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Tuition, Fees & Electronic Payment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official institutional billing statements, fee assessments, and electronic transaction history
          </p>
        </div>

        <button
          onClick={() => {
            setShowPayModal(true);
            const firstUnpaid = fees.find((f: any) => f.status !== 'PAID');
            if (firstUnpaid) {
              setSelectedFeeId(firstUnpaid.id);
              setPayAmount((firstUnpaid.amount - firstUnpaid.paidAmount).toString());
            }
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Pay Outstanding Balance</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Billed Fees</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            ${summary.totalBilled.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">Curricular & lab levies assessed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Settled</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            ${summary.totalPaid.toFixed(2)}
          </span>
          <span className="text-xs text-emerald-600">Cleared through institutional finance</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Outstanding Balance</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            ${summary.balance.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500">Due prior to final exams</span>
        </div>
      </div>

      {/* Invoiced Fee Structures Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Fee Schedule & Assessment Invoices
          </span>
          <span className="text-xs text-slate-400 font-mono">Academic Year 2024-2025</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading billing ledger...</div>
        ) : fees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Fee Item Description</th>
                  <th className="px-4 py-3">Academic Term</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Invoiced Amount</th>
                  <th className="px-4 py-3 text-right">Paid Amount</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((f: any) => {
                  const balanceDue = f.amount - f.paidAmount;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{f.schoolFee?.title}</div>
                        <div className="text-slate-400 text-xs">{f.schoolFee?.description}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {f.schoolFee?.academicYear?.name} • {f.schoolFee?.semester?.name || 'Annual'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{f.schoolFee?.dueDate}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-800">
                        ${f.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-700">
                        ${f.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        ${balanceDue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block font-semibold px-2 py-0.5 rounded-sm text-xs ${
                          f.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : f.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {balanceDue > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedFeeId(f.id);
                              setPayAmount(balanceDue.toString());
                              setShowPayModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded-sm font-medium transition-colors"
                          >
                            Pay Fee
                          </button>
                        ) : (
                          <span className="text-emerald-600 flex items-center justify-center gap-1 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No active fee schedules.</div>
        )}
      </div>

      {/* Payment Transactions History */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Verified Payment Transactions & Official Receipts
          </span>
          <span className="text-xs text-slate-400 font-mono">{payments.length} transactions recorded</span>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="px-4 py-3">Reference / Txn #</th>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Description / Remarks</th>
                  <th className="px-4 py-3 text-right">Amount Settled</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{p.referenceNumber}</td>
                    <td className="px-4 py-3 font-mono text-blue-700 font-semibold">{p.receiptNumber || 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200 font-mono text-xs">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.notes || 'Curricular tuition remittance'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold text-xs">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No prior payment transactions recorded.</div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Institutional Fee Settlement</h2>
              </div>
              <button onClick={() => setShowPayModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            {paySuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-slate-900">{paySuccess}</div>
                <div className="text-xs text-slate-500">Updating financial records...</div>
              </div>
            ) : (
              <form onSubmit={handleMakePayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Fee Item:</label>
                  <select
                    value={selectedFeeId}
                    onChange={(e) => {
                      setSelectedFeeId(e.target.value);
                      const selected = fees.find((f: any) => f.id === e.target.value);
                      if (selected) {
                        setPayAmount((selected.amount - selected.paidAmount).toString());
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    <option value="">General Fee Deposit</option>
                    {fees.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.schoolFee?.title} (Balance: ${(f.amount - f.paidAmount).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount to Settle ($ USD): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  >
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Direct Electronic Bank Wire</option>
                    <option value="ONLINE">Institutional Online Portal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payer Remittance Notes:</label>
                  <input
                    type="text"
                    placeholder="e.g. Settled by guardian online card"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:outline-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Authorize Transaction'}
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
