import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Bell, Check, Filter, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setCurrentTab } = useAdmin();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredList = notifications.filter(n => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span className="text-emerald-700 font-bold">Notifications</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications Center</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time system updates, booking alerts, and dispatch notifications.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="bg-[#043927] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['all', 'booking', 'dispatch', 'maid', 'payment'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-[#043927] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredList.length} total alerts</span>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredList.map(n => (
          <div
            key={n.id}
            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
              !n.read ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  {!n.read && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{n.message}</p>
                <span className="text-[11px] text-slate-400 font-semibold mt-1.5 block">{n.timestamp}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {n.linkTab && (
                <button
                  onClick={() => {
                    markNotificationAsRead(n.id);
                    setCurrentTab(n.linkTab!);
                  }}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-2xs"
                >
                  View Details
                </button>
              )}
              {!n.read && (
                <button
                  onClick={() => markNotificationAsRead(n.id)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
