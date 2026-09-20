import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ShieldAlert, Phone, AlertTriangle, CheckCircle, Clock, MapPin, Search } from 'lucide-react';

interface SOSAlert {
  id: string;
  booking_id: string;
  user_id: string;
  user_role: 'customer' | 'maid';
  user_name: string;
  user_phone: string;
  latitude?: number;
  longitude?: number;
  address_text?: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_alarm';
  created_at: string;
  resolved_at?: string;
  notes?: string;
}

export const SOSAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([
    {
      id: 'sos_001',
      booking_id: 'GC-89421',
      user_id: 'cust_hyder_90',
      user_role: 'customer',
      user_name: 'Rahul Verma',
      user_phone: '+91 9849201824',
      latitude: 17.4375,
      longitude: 78.4482,
      address_text: 'Banjara Hills, Road No. 12, Hyderabad',
      status: 'active',
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 'sos_002',
      booking_id: 'GC-77120',
      user_id: 'maid_sunita_01',
      user_role: 'maid',
      user_name: 'Sunita Sharma',
      user_phone: '+91 9876543210',
      latitude: 17.445,
      longitude: 78.382,
      address_text: 'Madhapur, Hitec City, Hyderabad',
      status: 'resolved',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 82800000).toISOString(),
      notes: 'Admin dispatched emergency helpline; customer confirmed safety.',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    async function fetchSOSAlerts() {
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setAlerts(data);
        }
      } catch (err) {
        console.warn('Live SOS alerts notice:', err);
      }
    }
    fetchSOSAlerts();

    const channel = supabase
      .channel('admin_sos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, () => {
        fetchSOSAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (alertId: string, status: SOSAlert['status']) => {
    try {
      await supabase
        .from('sos_alerts')
        .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
        .eq('id', alertId);

      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, status, resolved_at: status === 'resolved' ? new Date().toISOString() : a.resolved_at } : a))
      );
    } catch (err) {
      console.error('Error updating SOS status:', err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesSearch =
      a.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.booking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900">Emergency SOS Monitoring Console</h1>
            {activeCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full animate-bounce">
                {activeCount} CRITICAL
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time emergency signals triggered by customers or maid partners during active bookings in Telangana.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, phone or booking..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-700"
          >
            <option value="all">All Alerts</option>
            <option value="active">Active Critical</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Emergency Helpline Ribbon */}
      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 text-white rounded-xl">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-950">Telangana Emergency Response Dispatch</h3>
            <p className="text-xs text-red-700">Telangana Police Hotline: 100 • GC HOME+ Security Control: +91 040 8899 0000</p>
          </div>
        </div>
        <button
          onClick={() => alert('Dialing GC Control Room: +91 040 8899 0000')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
        >
          Call Control Room
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <th className="p-4">User Info</th>
              <th className="p-4">Role</th>
              <th className="p-4">Booking ID</th>
              <th className="p-4">Location</th>
              <th className="p-4">Triggered At</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredAlerts.map(alert => (
              <tr key={alert.id} className={alert.status === 'active' ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                <td className="p-4">
                  <div className="font-bold text-slate-900">{alert.user_name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{alert.user_phone}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      alert.user_role === 'customer' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {alert.user_role}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-slate-800">{alert.booking_id}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{alert.address_text || 'Hyderabad, Telangana'}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-500 font-medium">
                  {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      alert.status === 'active'
                        ? 'bg-red-600 text-white animate-pulse'
                        : alert.status === 'investigating'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {alert.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'investigating')}
                      className="px-3 py-1 bg-amber-500 text-white rounded-lg font-bold text-[11px] hover:bg-amber-600 transition-colors"
                    >
                      Investigate
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 transition-colors"
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
