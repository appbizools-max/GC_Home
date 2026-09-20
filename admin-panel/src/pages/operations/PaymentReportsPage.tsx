import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { AlertTriangle, CheckCircle, ShieldAlert, FileText, Search, User, Filter, Download } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExporter';

interface PaymentReportItem {
  id: string;
  booking_id: string;
  reporter_id: string;
  reported_partner_id: string | null;
  report_type: string;
  description: string;
  amount_requested: number | null;
  status: 'pending' | 'under_review' | 'resolved' | 'invalid' | 'action_taken';
  resolution_notes?: string;
  created_at: string;
}

export const PaymentReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PaymentReportItem[]>([
    {
      id: 'rep_001',
      booking_id: 'GC-89421',
      reporter_id: 'cust_hyder_90',
      reported_partner_id: 'maid_sunita_01',
      report_type: 'asked_for_cash',
      description: 'Partner demanded ₹150 extra cash at door claiming cleaning supplies fee, despite online payment.',
      amount_requested: 150,
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'rep_002',
      booking_id: 'GC-77120',
      reporter_id: 'cust_warangal_12',
      reported_partner_id: 'maid_ramesh_04',
      report_type: 'unauthorized_amount',
      description: 'Partner refused OTP entry unless ₹200 tip was paid in advance.',
      amount_requested: 200,
      status: 'under_review',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error } = await supabase
          .from('payment_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setReports(data);
        }
      } catch (err) {
        console.warn('Failed to fetch payment reports from Supabase:', err);
      }
    }
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, newStatus: PaymentReportItem['status']) => {
    try {
      await supabase
        .from('payment_reports')
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', reportId);

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Error updating report status:', err);
    }
  };

  const handleExportCSV = () => {
    exportToCSV('payment_violation_reports', filteredReports, [
      { key: 'id', label: 'Report ID' },
      { key: 'booking_id', label: 'Booking ID' },
      { key: 'reported_partner_id', label: 'Partner ID' },
      { key: 'report_type', label: 'Violation Type' },
      { key: 'amount_requested', label: 'Amount Demanded (₹)' },
      { key: 'status', label: 'Investigation Status' },
      { key: 'description', label: 'Description' },
      { key: 'created_at', label: 'Reported At' },
    ]);
  };

  const filteredReports = reports.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      r.booking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Unauthorized Payment Reports</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Investigate customer reports regarding partner cash demands, extra fee requests, and policy violations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search booking ID or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="under_review">Under Investigation</option>
            <option value="action_taken">Action Taken</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Pending Alerts</p>
          <p className="text-2xl font-extrabold text-red-900 mt-1">
            {reports.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Under Investigation</p>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">
            {reports.filter((r) => r.status === 'under_review').length}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Actions / Penalties Taken</p>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">
            {reports.filter((r) => r.status === 'action_taken' || r.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
            <tr>
              <th className="py-3 px-4">Booking & Date</th>
              <th className="py-3 px-4">Violation Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Requested Amt</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-bold text-gray-900">{report.booking_id}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(report.created_at).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3" />
                    {report.report_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 max-w-md">
                  <p className="text-xs text-gray-800 line-clamp-2">{report.description}</p>
                  {report.reported_partner_id && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Reported Partner: <span className="font-semibold text-gray-700">{report.reported_partner_id}</span>
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 font-bold text-red-600">
                  {report.amount_requested ? `₹${report.amount_requested}` : '—'}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      report.status === 'pending'
                        ? 'bg-red-100 text-red-800'
                        : report.status === 'under_review'
                        ? 'bg-amber-100 text-amber-800'
                        : report.status === 'action_taken'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {report.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'under_review')}
                      className="px-2.5 py-1 text-xs font-semibold bg-amber-500 text-white rounded hover:bg-amber-600"
                    >
                      Investigate
                    </button>
                  )}
                  {report.status !== 'action_taken' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'action_taken')}
                      className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Penalize Partner
                    </button>
                  )}
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
