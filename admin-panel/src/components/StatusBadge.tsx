import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = status;

  if (
    s.includes('pending') ||
    s === 'new' ||
    s === 'searching_partner' ||
    s === 'partner_offered' ||
    s === 'scheduled'
  ) {
    colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
    label = s === 'new' ? 'Pending Assignment' : s.replace(/_/g, ' ');
  } else if (
    s.includes('progress') ||
    s.includes('ongoing') ||
    s.includes('started') ||
    s.includes('route') ||
    s.includes('arrived') ||
    s.includes('accepted') ||
    s === 'maid_assigned' ||
    s === 'otp_verified'
  ) {
    colorClasses = 'bg-blue-100 text-blue-900 border-blue-300';
    label = s.replace(/_/g, ' ');
  } else if (
    s.includes('complete') ||
    s.includes('confirmed') ||
    s.includes('settled') ||
    s === 'approved' ||
    s === 'paid'
  ) {
    colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    label = s.replace(/_/g, ' ');
  } else if (
    s.includes('cancel') ||
    s.includes('reject') ||
    s.includes('refund') ||
    s === 'disputed' ||
    s === 'failed'
  ) {
    colorClasses = 'bg-red-100 text-red-900 border-red-300';
    label = s.replace(/_/g, ' ');
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5'
      : size === 'lg'
      ? 'text-xs px-3 py-1.5 font-extrabold'
      : 'text-[11px] px-2.5 py-1 font-bold';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border capitalize shadow-xs font-semibold ${colorClasses} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      <span>{label}</span>
    </span>
  );
};
