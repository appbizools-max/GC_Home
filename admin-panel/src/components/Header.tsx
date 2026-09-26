import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Calendar, Bell, ExternalLink, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setCurrentTab,
    sidebarCollapsed,
    toggleSidebarCollapse,
  } = useAdmin();

  const [showNotificationsPopover, setShowNotificationsPopover] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());

  // Real-time clock tick every second (IST timezone)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(now);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4 font-sans select-none flex-shrink-0 z-30 relative">
      {/* Left Section: Hamburger Menu & Global Search */}
      <div className="flex items-center gap-3.5 flex-1 max-w-xl">
        <button
          onClick={toggleSidebarCollapse}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5 text-[#123D2A]" />
        </button>

        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings, customers, partners..."
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123D2A]/20 focus:border-[#123D2A] transition-all font-medium"
          />
        </div>
      </div>

      {/* Control Tools */}
      <div className="flex items-center gap-3">
        {/* Real-time Dynamic Date & Clock Control (IST) */}
        <div
          title="Indian Standard Time (IST)"
          className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm cursor-default"
        >
          <Calendar className="w-3.5 h-3.5 text-[#123D2A]" />
          <div className="flex items-center gap-1.5">
            <span>{formattedDate}</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-[#123D2A] font-black tabular-nums">{formattedTime}</span>
          </div>
        </div>

        {/* Notification Bell with Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationsPopover(!showNotificationsPopover)}
            className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5 text-slate-700" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center border-2 border-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {showNotificationsPopover && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex flex-col gap-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  {unreadNotificationsCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkTab) setCurrentTab(n.linkTab);
                        setShowNotificationsPopover(false);
                      }}
                      className={`pt-2.5 first:pt-0 pb-2 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors ${
                        !n.read ? 'bg-emerald-50/40 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-normal mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setCurrentTab('notifications');
                    setShowNotificationsPopover(false);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Notifications</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#123D2A] text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            AP
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-extrabold text-slate-800 leading-tight">Admin Operations</p>
            <p className="text-[10px] font-semibold text-emerald-800">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};
