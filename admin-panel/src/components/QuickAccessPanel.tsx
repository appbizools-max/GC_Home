import React from 'react';
import {
  Compass,
  Zap,
  UserCheck,
  Wrench,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface QuickAccessPanelProps {
  onNewBooking?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const QuickAccessPanel: React.FC<QuickAccessPanelProps> = ({
  onNavigateTab,
}) => {
  const actions = [
    {
      id: 'dispatch',
      title: 'Dispatch Queue',
      desc: 'Match pending jobs',
      icon: Compass,
      color: 'bg-amber-500 text-white hover:bg-amber-600',
      action: () => onNavigateTab('dispatch'),
    },
    {
      id: 'live_jobs',
      title: 'Live Jobs',
      desc: 'Monitor active execution',
      icon: Zap,
      color: 'bg-blue-500 text-white hover:bg-blue-600',
      action: () => onNavigateTab('ongoing-bookings'),
    },
    {
      id: 'approve_maids',
      title: 'Partner KYC',
      desc: 'Approve maid applications',
      icon: UserCheck,
      color: 'bg-indigo-500 text-white hover:bg-indigo-600',
      action: () => onNavigateTab('pending-approvals'),
    },
    {
      id: 'service_catalog',
      title: 'Service Catalog',
      desc: 'Categories, Services & Add-ons',
      icon: Wrench,
      color: 'bg-teal-500 text-white hover:bg-teal-600',
      action: () => onNavigateTab('services'),
    },
    {
      id: 'financials',
      title: 'Financials',
      desc: 'Payments & Partner payouts',
      icon: BarChart3,
      color: 'bg-purple-500 text-white hover:bg-purple-600',
      action: () => onNavigateTab('payments'),
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Quick Access Panel</span>
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">Essential Shortcuts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map(act => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.action}
              className="group flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-100/80 transition text-left cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg ${act.color} flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-emerald-900">
                {act.title}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                {act.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
