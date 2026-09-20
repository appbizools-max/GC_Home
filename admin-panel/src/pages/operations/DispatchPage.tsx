import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MapPin, Users, Calendar, AlertCircle } from 'lucide-react';

export const DispatchPage: React.FC = () => {
  const { bookings, maids, setCurrentTab } = useAdmin();

  const pendingBookings = bookings.filter(b => b.status === 'pending_assignment' || b.status === 'new');
  const activeMaids = maids.filter(m => m.status === 'approved' && m.isOnline);

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operations Dispatch</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor pending job queues and auto-dispatch nearest available maid partners.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('pending-bookings')}
          className="bg-[#043927] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-emerald-300" />
          <span>View Pending Bookings ({pendingBookings.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
            {pendingBookings.length}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Pending Assignments</span>
            <span className="text-xs font-bold text-amber-600">Requires Dispatch</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            {activeMaids.length}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Active Online Maids</span>
            <span className="text-xs font-bold text-emerald-600">Ready for Job Calls</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
            98.4%
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Dispatch SLA Rate</span>
            <span className="text-xs font-bold text-blue-600">Avg &lt; 5 mins response</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchPage;
