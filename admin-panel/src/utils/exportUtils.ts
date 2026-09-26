import { Booking, MaidProfile, Customer } from '../types';
import { formatDateDDMMYYYY } from './bookingDisplayUtils';

/**
 * Downloads a CSV file with given filename, column headers, and 2D row data array.
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCsvCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCsvCell).join(',');
  const bodyRows = rows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
  const csvContent = '\uFEFF' + headerRow + '\n' + bodyRows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBookingsToCSV(bookings: Booking[]): void {
  const headers = [
    'Booking ID',
    'Customer Name',
    'Customer Phone',
    'Service Name',
    'Category',
    'Date',
    'Time Slot',
    'Status',
    'Assigned Maid',
    'Total Amount (₹)',
    'Payment Method',
    'Payment Status',
    'Created At',
  ];

  const rows = bookings.map(b => [
    b.bookingId,
    b.customerName,
    b.customerPhone,
    b.serviceName,
    b.categoryName || 'General',
    b.date,
    b.timeSlot,
    b.status,
    b.assignedMaidName || 'Unassigned',
    b.totalAmount,
    b.paymentMethod,
    b.paymentStatus,
    b.createdAt,
  ]);

  downloadCSV('gc_home_bookings_export', headers, rows);
}

export function exportFinancialsToCSV(bookings: Booking[], payouts: any[]): void {
  const headers = [
    'Transaction / Booking ID',
    'Customer Name',
    'Service Name',
    'Gross Amount (₹)',
    'Partner Payout (₹)',
    'Platform Commission (₹)',
    'Payment Method',
    'Payment Status',
    'Date',
  ];

  const rows = bookings.map(b => {
    const gross = b.totalAmount || 0;
    const payout = Math.round(gross * 0.8);
    const comm = gross - payout;
    return [
      b.bookingId,
      b.customerName,
      b.serviceName,
      gross,
      payout,
      comm,
      b.paymentMethod,
      b.paymentStatus,
      b.date,
    ];
  });

  downloadCSV('gc_home_financials_report', headers, rows);
}

export function exportCustomersToCSV(customers: Customer[]): void {
  const headers = [
    'Customer ID',
    'Customer Name',
    'Phone',
    'Email',
    'Customer Type',
    'Locality',
    'Total Bookings',
    'Lifetime Spend (₹)',
    'Joined Date',
    'Status',
  ];

  const rows = customers.map(c => {
    const rawEmail = c.email || '';
    const cleanEmail = rawEmail.includes('customer@gchome.com') || rawEmail.includes('example.com') ? '' : rawEmail;
    return [
      c.id,
      c.name,
      c.phone,
      cleanEmail || 'Not provided',
      c.customerType || 'First-time Customer',
      c.locality || c.address?.locality || '',
      c.totalBookings || 0,
      c.totalSpent || 0,
      formatDateDDMMYYYY(c.joinedDate) || 'N/A',
      c.status || 'active',
    ];
  });

  downloadCSV('gc_home_customers_export', headers, rows);
}

export function exportMaidsToCSV(maids: MaidProfile[]): void {
  const headers = [
    'Partner ID',
    'Full Name',
    'Phone',
    'Service Area',
    'KYC Status',
    'Application Status',
    'Rating',
    'Completed Jobs',
    'Is Online',
    'Applied At',
  ];

  const rows = maids.map(m => [
    m.maidId || m.uid,
    m.fullName,
    m.phone,
    m.serviceArea || 'Hyderabad',
    m.kycStatus || 'pending',
    m.status,
    m.rating || 5.0,
    m.completedJobsCount || 0,
    m.isOnline ? 'Online' : 'Offline',
    m.appliedAt || '2026-01-01',
  ]);

  downloadCSV('gc_home_maid_partners_export', headers, rows);
}
