import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Download, IndianRupee, CreditCard, Building2, CheckCircle2, Search, ArrowUpRight, Plus, Ticket, TrendingUp, Users, Edit2, Trash2, Calendar, X, Tag } from 'lucide-react';
import { supabase } from '../../config/supabase';

interface Coupon {
  id: string;
  code: string;
  discount_text: string;
  subtitle: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

interface Payout {
  id: string;
  maid_id: string;
  booking_id?: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  reference_id?: string;
  notes?: string;
  disbursed_at?: string;
  created_at: string;
  maid_name?: string;
  maid_phone?: string;
  bank_name?: string;
  account_number?: string;
}

export const RevenuePage: React.FC = () => {
  const { bookings, maids, exportBookingsToCSV } = useAdmin();
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'coupons'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Fetch coupons and payouts
  useEffect(() => {
    fetchCoupons();
    fetchPayouts();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCoupons(data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          maid_profiles!payouts_maid_id_fkey (
            full_name,
            phone,
            bank_details
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const enrichedPayouts = data.map(p => {
          const maidProfile = (p as any).maid_profiles;
          const bankDetails = maidProfile?.bank_details || {};
          return {
            ...p,
            maid_name: maidProfile?.full_name || 'Unknown',
            maid_phone: maidProfile?.phone || '',
            bank_name: bankDetails.bankName || 'N/A',
            account_number: bankDetails.accountNumber || 'N/A'
          };
        });
        setPayouts(enrichedPayouts);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  };

  // Calculate revenue metrics from live data
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalGross = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPlatformCommission = completedBookings.reduce((sum, b) => {
    // 30% platform commission
    return sum + (b.totalAmount * 0.30);
  }, 0);
  const totalMaidPayouts = completedBookings.reduce((sum, b) => {
    // 70% maid share
    return sum + (b.totalAmount * 0.70);
  }, 0);
  const pendingPayoutDisbursal = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCouponDiscounts = completedBookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);

  // Payout handling
  const handleDisburse = async (payoutId: string, maidId: string, amount: number) => {
    if (!confirm(`Confirm disbursement of ₹${amount.toLocaleString()}?`)) return;
    
    setIsLoading(true);
    try {
      const referenceId = `TXN${Date.now()}`;
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'paid',
          reference_id: referenceId,
          disbursed_at: new Date().toISOString()
        })
        .eq('id', payoutId);
      
      if (!error) {
        alert('✅ Payout disbursed successfully!');
        fetchPayouts();
      } else {
        alert('❌ Failed to disburse payout');
      }
    } catch (err) {
      alert('❌ Error disbursing payout');
    } finally {
      setIsLoading(false);
    }
  };

  // Coupon CRUD operations
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const couponData = {
      code: (formData.get('code') as string).toUpperCase(),
      discount_text: formData.get('discount_text') as string,
      subtitle: formData.get('subtitle') as string || '',
      discount_type: formData.get('discount_type') as string,
      discount_value: parseFloat(formData.get('discount_value') as string),
      min_order_amount: parseFloat(formData.get('min_order_amount') as string || '0'),
      max_discount: formData.get('max_discount') ? parseFloat(formData.get('max_discount') as string) : null,
      usage_limit: parseInt(formData.get('usage_limit') as string || '1000'),
      valid_until: formData.get('valid_until') ? new Date(formData.get('valid_until') as string).toISOString() : null,
      is_active: formData.get('is_active') === 'true'
    };

    setIsLoading(true);
    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (!error) alert('✅ Coupon updated successfully!');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);
        if (!error) alert('✅ Coupon created successfully!');
      }
      
      setShowCouponModal(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (err) {
      alert('❌ Error saving coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon permanently?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (!error) {
        alert('✅ Coupon deleted successfully!');
        fetchCoupons();
      }
    } catch (err) {
      alert('❌ Error deleting coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCouponActive = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (!error) {
        fetchCoupons();
      }
    } catch (err) {
      alert('❌ Error toggling coupon status');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on search
  const filteredPayouts = payouts.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.maid_name?.toLowerCase().includes(q) || 
           p.maid_phone?.includes(q) ||
           p.reference_id?.toLowerCase().includes(q);
  });

  const filteredCoupons = coupons.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(q) || 
           c.discount_text.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span className="text-emerald-700 font-bold">Revenue & Financial Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Revenue & Financial Center</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Payment reconciliation, partner payouts, coupon management, and financial analytics
          </p>
        </div>

        <button
          onClick={exportBookingsToCSV}
          className="bg-[#043927] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>Export Revenue Report</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#043927] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">GROSS REVENUE</span>
            <h3 className="text-2xl font-black mt-1">₹{Math.round(totalGross).toLocaleString()}</h3>
          </div>
          <span className="text-xs text-emerald-100/80 font-medium mt-3 block">{completedBookings.length} Completed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PLATFORM COMMISSION (30%)</span>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">₹{Math.round(totalPlatformCommission).toLocaleString()}</h3>
          </div>
          <span className="text-xs text-emerald-600 font-bold mt-3 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Net Earnings
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MAID PAYOUTS (70%)</span>
            <h3 className="text-2xl font-black text-blue-900 mt-1">₹{Math.round(totalMaidPayouts).toLocaleString()}</h3>
          </div>
          <span className="text-xs text-blue-600 font-bold mt-3 block">Partner Share</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PENDING DISBURSALS</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">₹{Math.round(pendingPayoutDisbursal).toLocaleString()}</h3>
          </div>
          <span className="text-xs text-amber-600 font-bold mt-3 block">{payouts.filter(p => p.status === 'pending').length} Pending</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">COUPON DISCOUNTS</span>
            <h3 className="text-2xl font-black text-purple-900 mt-1">₹{Math.round(totalCouponDiscounts).toLocaleString()}</h3>
          </div>
          <span className="text-xs text-purple-600 font-bold mt-3 block">{coupons.filter(c => c.is_active).length} Active</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'overview'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            <span>Financial Overview</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'payouts'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Payout Management</span>
            {payouts.filter(p => p.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                {payouts.filter(p => p.status === 'pending').length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'coupons'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span>Coupon Management</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-lg font-black text-slate-900 mb-4">Revenue Breakdown & Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method Breakdown */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Method Distribution
              </h4>
              <div className="space-y-2">
                {['Online Payment', 'Cash', 'Wallet', 'UPI'].map(method => {
                  const count = completedBookings.filter(b => b.paymentMethod === method.toLowerCase().replace(' ', '_')).length;
                  const percentage = completedBookings.length > 0 ? (count / completedBookings.length) * 100 : 0;
                  return (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">{method}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Earning Maids */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Top Earning Partners
              </h4>
              <div className="space-y-2">
                {maids
                  .filter(m => m.status === 'approved')
                  .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
                  .slice(0, 4)
                  .map((maid, index) => (
                    <div key={maid.uid} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 w-4">#{index + 1}</span>
                        <img src={maid.photoUrl} alt={maid.fullName} className="w-6 h-6 rounded-full" />
                        <span className="text-xs font-medium text-slate-700">{maid.fullName}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">
                        ₹{Math.round(maid.totalEarnings || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mt-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Recent Completed Transactions</h4>
            <div className="space-y-2">
              {completedBookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{booking.serviceName}</p>
                      <p className="text-[10px] text-slate-500">{booking.customerName} • {new Date(booking.bookingDate || booking.date || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Maid Partner Payout Ledger</h3>
              <p className="text-[11px] text-slate-500 font-medium">Track and disburse partner earnings</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner or reference..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 border-b border-slate-200/80 uppercase tracking-wider">
                  <th className="py-3 px-4">Partner Details</th>
                  <th className="py-3 px-4">Bank Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-400">No payouts found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map(payout => (
                    <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <strong className="text-slate-900 block font-bold">{payout.maid_name}</strong>
                          <span className="text-[11px] text-slate-400">{payout.maid_phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{payout.bank_name}</span>
                        </div>
                        <span className="text-[11px] text-emerald-800 font-medium">A/C: {payout.account_number}</span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-800">₹{Math.round(payout.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          payout.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          payout.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                        {payout.reference_id || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {payout.status === 'pending' && (
                          <button
                            onClick={() => handleDisburse(payout.id, payout.maid_id, payout.amount)}
                            disabled={isLoading}
                            className="bg-[#043927] hover:bg-emerald-950 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Disburse</span>
                          </button>
                        )}
                        {payout.status === 'paid' && (
                          <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Coupon & Promo Management</h3>
              <p className="text-[11px] text-slate-500 font-medium">Create and manage discount coupons</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search coupon code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setShowCouponModal(true);
                }}
                className="bg-[#043927] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Coupon</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoupons.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">No coupons found</p>
                <p className="text-xs text-slate-400 mt-1">Create your first coupon to get started</p>
              </div>
            ) : (
              filteredCoupons.map(coupon => (
                <div
                  key={coupon.id}
                  className={`border-2 rounded-xl p-4 relative ${
                    coupon.is_active ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className={`w-4 h-4 ${coupon.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-sm font-black text-slate-900">{coupon.code}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setShowCouponModal(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-700 mb-1">{coupon.discount_text}</p>
                  {coupon.subtitle && (
                    <p className="text-[10px] text-slate-500 mb-3">{coupon.subtitle}</p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-emerald-700">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Min: ₹{coupon.min_order_amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 mb-3">
                    <span>Used: {coupon.used_count}/{coupon.usage_limit}</span>
                    {coupon.valid_until && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(coupon.valid_until).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCouponActive(coupon.id, coupon.is_active)}
                    disabled={isLoading}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                      coupon.is_active
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editingCoupon?.code}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium uppercase"
                  placeholder="SAVE20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Text *</label>
                <input
                  type="text"
                  name="discount_text"
                  defaultValue={editingCoupon?.discount_text}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Get 20% OFF"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  defaultValue={editingCoupon?.subtitle}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="On all services"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    name="discount_type"
                    defaultValue={editingCoupon?.discount_type || 'percentage'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    name="discount_value"
                    defaultValue={editingCoupon?.discount_value}
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Amount</label>
                  <input
                    type="number"
                    name="min_order_amount"
                    defaultValue={editingCoupon?.min_order_amount || 0}
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount</label>
                  <input
                    type="number"
                    name="max_discount"
                    defaultValue={editingCoupon?.max_discount}
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    name="usage_limit"
                    defaultValue={editingCoupon?.usage_limit || 1000}
                    min="1"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    name="valid_until"
                    defaultValue={editingCoupon?.valid_until ? new Date(editingCoupon.valid_until).toISOString().split('T')[0] : ''}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  name="is_active"
                  defaultValue={editingCoupon?.is_active !== false ? 'true' : 'false'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCouponModal(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#043927] hover:bg-emerald-950 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenuePage;
