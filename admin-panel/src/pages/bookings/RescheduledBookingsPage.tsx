import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking } from '../../types';
import {
  Calendar,
  User,
  Shield,
  Clock,
  Download,
  Search,
  Filter,
  Layers,
  Phone,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const RescheduledBookingsPage: React.FC = () => {
  const { bookings, exportBookingsToCSV, openBookingDetails } = useAdmin();

  // Strictly filter only rescheduled bookings
  const rescheduledBookings = bookings.filter(b => b.status === 'rescheduled');

  const [selectedBooking, setSelectedBooking] = useState<Booking>(rescheduledBookings[0] || bookings[0]);
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [rescheduledByFilter, setRescheduledByFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sample mock rows matching the exact visual screenshot 1
  const mockRescheduledRows: Booking[] = [
    {
      bookingId: 'GC-20260916-301',
      customerId: 'c1',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      serviceId: 's1',
      serviceName: 'Home Cleaning (2 BHK)',
      servicePrice: 799,
      address: { id: 'a1', label: 'Home', street: 'Flat 4B, Sri Sai Residency', locality: 'Kondapur', city: 'Hyderabad', pincode: '500084' },
      date: '17 Sep 2026',
      timeSlot: '10:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '16 Sep 2026, 10:00 AM',
      rescheduledTo: '17 Sep 2026, 10:00 AM',
      rescheduledBy: 'Customer',
      rescheduleReason: 'Personal Issue',
      createdAt: '2026-09-16 08:30',
      totalAmount: 799,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid',
      customerNote: 'I have a personal commitment tomorrow. Please reschedule to the next day.'
    },
    {
      bookingId: 'GC-20260916-298',
      customerId: 'c2',
      customerName: 'Rahul Verma',
      customerPhone: '+91 91234 56789',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      serviceId: 's2',
      serviceName: 'Deep Cleaning',
      servicePrice: 1299,
      address: { id: 'a2', label: 'Home', street: 'Plot 12, Mindspace', locality: 'Madhapur', city: 'Hyderabad', pincode: '500081' },
      date: '18 Sep 2026',
      timeSlot: '11:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '15 Sep 2026, 02:00 PM',
      rescheduledTo: '18 Sep 2026, 11:00 AM',
      rescheduledBy: 'Maid',
      rescheduleReason: 'Health Issue',
      createdAt: '2026-09-15 13:00',
      totalAmount: 1299,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-295',
      customerId: 'c3',
      customerName: 'Sneha Patel',
      customerPhone: '+91 87654 32109',
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      serviceId: 's3',
      serviceName: 'Bathroom Cleaning',
      servicePrice: 499,
      address: { id: 'a3', label: 'Home', street: 'Tower C, Financial Dist', locality: 'Gachibowli', city: 'Hyderabad', pincode: '500032' },
      date: '19 Sep 2026',
      timeSlot: '10:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '16 Sep 2026, 11:00 AM',
      rescheduledTo: '19 Sep 2026, 10:00 AM',
      rescheduledBy: 'Customer',
      rescheduleReason: 'Work Meeting',
      createdAt: '2026-09-16 09:15',
      totalAmount: 499,
      paymentMethod: 'COD',
      paymentStatus: 'pending'
    },
    {
      bookingId: 'GC-20260916-291',
      customerId: 'c4',
      customerName: 'Arjun Mehta',
      customerPhone: '+91 98712 33445',
      customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      serviceId: 's4',
      serviceName: 'Sofa Cleaning',
      servicePrice: 699,
      address: { id: 'a4', label: 'Home', street: 'Plot 4, Secret Lake', locality: 'Manikonda', city: 'Hyderabad', pincode: '500089' },
      date: '17 Sep 2026',
      timeSlot: '03:00 PM',
      status: 'rescheduled',
      rescheduledFrom: '14 Sep 2026, 01:00 PM',
      rescheduledTo: '17 Sep 2026, 03:00 PM',
      rescheduledBy: 'Admin',
      rescheduleReason: 'Maid Availability',
      createdAt: '2026-09-14 10:00',
      totalAmount: 699,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-288',
      customerId: 'c5',
      customerName: 'Kavya Nair',
      customerPhone: '+91 90123 45678',
      customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
      serviceId: 's5',
      serviceName: 'Kitchen Cleaning',
      servicePrice: 599,
      address: { id: 'a5', label: 'Home', street: 'B-302, Hill County', locality: 'Bachupally', city: 'Hyderabad', pincode: '500090' },
      date: '18 Sep 2026',
      timeSlot: '09:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '16 Sep 2026, 09:00 AM',
      rescheduledTo: '18 Sep 2026, 09:00 AM',
      rescheduledBy: 'Customer',
      rescheduleReason: 'Family Event',
      createdAt: '2026-09-16 08:00',
      totalAmount: 599,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-285',
      customerId: 'c6',
      customerName: 'Vikram Singh',
      customerPhone: '+91 98712 34567',
      customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      serviceId: 's1',
      serviceName: 'Home Cleaning (3 BHK)',
      servicePrice: 999,
      address: { id: 'a6', label: 'Home', street: 'Flat 10, Forum Road', locality: 'Kukatpally', city: 'Hyderabad', pincode: '500072' },
      date: '20 Sep 2026',
      timeSlot: '10:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '16 Sep 2026, 04:00 PM',
      rescheduledTo: '20 Sep 2026, 10:00 AM',
      rescheduledBy: 'Maid',
      rescheduleReason: 'Transportation Issue',
      createdAt: '2026-09-16 12:00',
      totalAmount: 999,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-279',
      customerId: 'c7',
      customerName: 'Neha Gupta',
      customerPhone: '+91 98701 23456',
      customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      serviceId: 's6',
      serviceName: 'Balcony Cleaning',
      servicePrice: 449,
      address: { id: 'a7', label: 'Home', street: 'B-10, Hill View', locality: 'Miyapur', city: 'Hyderabad', pincode: '500049' },
      date: '17 Sep 2026',
      timeSlot: '11:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '15 Sep 2026, 05:00 PM',
      rescheduledTo: '17 Sep 2026, 11:00 AM',
      rescheduledBy: 'Customer',
      rescheduleReason: 'Guest Visit',
      createdAt: '2026-09-15 14:00',
      totalAmount: 449,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-276',
      customerId: 'c8',
      customerName: 'Suresh Babu',
      customerPhone: '+91 99876 54321',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      serviceId: 's2',
      serviceName: 'Deep Cleaning',
      servicePrice: 1499,
      address: { id: 'a8', label: 'Home', street: 'Plot 88, Jubilee Hills', locality: 'Jubilee Hills', city: 'Hyderabad', pincode: '500033' },
      date: '18 Sep 2026',
      timeSlot: '02:00 PM',
      status: 'rescheduled',
      rescheduledFrom: '14 Sep 2026, 06:00 PM',
      rescheduledTo: '18 Sep 2026, 02:00 PM',
      rescheduledBy: 'Admin',
      rescheduleReason: 'Weather Conditions',
      createdAt: '2026-09-14 11:00',
      totalAmount: 1499,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-272',
      customerId: 'c9',
      customerName: 'Pooja Iyer',
      customerPhone: '+91 91230 45678',
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      serviceId: 's1',
      serviceName: 'Home Cleaning (2 BHK)',
      servicePrice: 799,
      address: { id: 'a9', label: 'Home', street: 'Flat 502, Green Towers', locality: 'HSR Layout', city: 'Hyderabad', pincode: '500102' },
      date: '19 Sep 2026',
      timeSlot: '09:00 AM',
      status: 'rescheduled',
      rescheduledFrom: '16 Sep 2026, 07:30 PM',
      rescheduledTo: '19 Sep 2026, 09:00 AM',
      rescheduledBy: 'Customer',
      rescheduleReason: 'Personal Emergency',
      createdAt: '2026-09-16 15:00',
      totalAmount: 799,
      paymentMethod: 'Online (UPI)',
      paymentStatus: 'paid'
    },
    {
      bookingId: 'GC-20260916-268',
      customerId: 'c10',
      customerName: 'Rohit Kumar',
      customerPhone: '+91 99871 22334',
      customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      serviceId: 's3',
      serviceName: 'Bathroom Cleaning',
      servicePrice: 499,
      address: { id: 'a10', label: 'Home', street: 'Villa 4, Cyber City', locality: 'Madhapur', city: 'Hyderabad', pincode: '500081' },
      date: '17 Sep 2026',
      timeSlot: '12:00 PM',
      status: 'rescheduled',
      rescheduledFrom: '15 Sep 2026, 08:00 PM',
      rescheduledTo: '17 Sep 2026, 12:00 PM',
      rescheduledBy: 'Maid',
      rescheduleReason: 'Other Commitments',
      createdAt: '2026-09-15 16:00',
      totalAmount: 499,
      paymentMethod: 'COD',
      paymentStatus: 'pending'
    }
  ];

  const allRescheduledList = rescheduledBookings.length > 0 ? rescheduledBookings : mockRescheduledRows;

  const totalRescheduledCount = 18;
  const customerRescheduledCount = 10;
  const maidRescheduledCount = 5;
  const adminRescheduledCount = 3;

  const getRescheduledByBadge = (by?: string) => {
    switch (by) {
      case 'Customer':
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Customer</span>;
      case 'Maid':
        return <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Maid</span>;
      case 'Admin':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Admin</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold">{by || 'Customer'}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span>Bookings</span> ➔ <span className="text-emerald-700 font-bold">Rescheduled Bookings</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rescheduled Bookings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View and manage all rescheduled cleaning services.
          </p>
        </div>

        <button
          onClick={exportBookingsToCSV}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* 4 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Rescheduled</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{totalRescheduledCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 12% <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Rescheduled by Customer</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{customerRescheduledCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 11% <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Rescheduled by Maid</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{maidRescheduledCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 25% <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Rescheduled by Admin</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{adminRescheduledCount}</span>
              <span className="text-[11px] font-bold text-slate-500">↑ 0% <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-auto">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">01 Sep 2026 - 16 Sep 2026</option>
              <option value="today">Today</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Reasons</option>
              <option value="Personal Issue">Personal Issue</option>
              <option value="Health Issue">Health Issue</option>
              <option value="Work Meeting">Work Meeting</option>
            </select>
          </div>

          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={rescheduledByFilter}
              onChange={e => setRescheduledByFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">Rescheduled By</option>
              <option value="Customer">Customer</option>
              <option value="Maid">Maid</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="relative">
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">All Services</option>
              <option value="Home Cleaning">Home Cleaning</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">New Scheduled Date</option>
              <option value="17">17 Sep 2026</option>
              <option value="18">18 Sep 2026</option>
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rescheduled bookings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rescheduled Bookings ({totalRescheduledCount})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Bookings that were rescheduled to a new date and time.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 border-b border-slate-200/80 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Rescheduled From</th>
                    <th className="py-3 px-4">Rescheduled To</th>
                    <th className="py-3 px-4">Rescheduled By</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {allRescheduledList.map((job, idx) => {
                    const isSelected = selectedBooking?.bookingId === job.bookingId;
                    return (
                      <tr
                        key={job.bookingId}
                        onClick={() => {
                          setSelectedBooking(job);
                          setShowDrawer(true);
                        }}
                        className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-600 hover:underline">
                          {job.bookingId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={job.customerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'}
                              alt={job.customerName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{job.customerName}</span>
                              <span className="text-[11px] text-slate-400 block">{job.customerPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{job.serviceName}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{job.rescheduledFrom || '16 Sep 2026 10:00 AM'}</td>
                        <td className="py-3.5 px-4 text-rose-600 font-bold">{job.rescheduledTo || '17 Sep 2026 10:00 AM'}</td>
                        <td className="py-3.5 px-4">{getRescheduledByBadge(job.rescheduledBy || 'Customer')}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{job.rescheduleReason || 'Personal Issue'}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-blue-100 text-blue-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                            Upcoming
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedBooking(job);
                              setShowDrawer(true);
                            }}
                            className="border border-slate-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-2xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>Showing 1 to 10 of {totalRescheduledCount} rescheduled bookings</span>
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#043927] text-white flex items-center justify-center font-bold">1</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">2</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Reschedule Details Drawer */}
        {showDrawer && selectedBooking && (
          <div className="w-full lg:w-[380px] bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 flex-shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Reschedule Details</h3>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">{selectedBooking.bookingId}</h4>
                <span className="text-[11px] text-slate-400 font-medium">Rescheduled on 16 Sep 2026, 09:15 AM</span>
              </div>
              <span className="bg-blue-100 text-blue-700 font-extrabold text-[11px] px-2.5 py-1 rounded-full">
                Rescheduled
              </span>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'details' ? 'border-b-2 border-emerald-600 text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'timeline' ? 'border-b-2 border-emerald-600 text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Customer Box */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-3">
                <img
                  src={selectedBooking.customerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'}
                  alt={selectedBooking.customerName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{selectedBooking.customerName}</h5>
                  <span className="text-xs font-semibold text-slate-500 block">{selectedBooking.customerPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a href={`tel:${selectedBooking.customerPhone}`} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/${selectedBooking.customerPhone}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Service & Reschedule Breakdown */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-700 font-medium">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Service</span>
                <span className="font-bold text-slate-900 block">{selectedBooking.serviceName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Original Schedule</span>
                  <span className="font-bold text-slate-800 block line-through">{selectedBooking.rescheduledFrom || '16 Sep 2026, 10:00 AM'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">New Schedule</span>
                  <span className="font-bold text-emerald-800 block">{selectedBooking.rescheduledTo || '17 Sep 2026, 10:00 AM'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Rescheduled By</span>
                  <span className="font-bold text-slate-900 block">{selectedBooking.rescheduledBy || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Reason</span>
                  <span className="font-bold text-slate-900 block">{selectedBooking.rescheduleReason || 'Personal Issue'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Status</span>
                <span className="bg-blue-100 text-blue-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                  Upcoming
                </span>
              </div>

              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60">
                <span className="text-[11px] font-bold text-amber-900 block">Customer Note</span>
                <p className="text-xs text-amber-950 font-medium mt-0.5">
                  "{selectedBooking.customerNote || 'I have a personal commitment tomorrow. Please reschedule to the next day.'}"
                </p>
              </div>
            </div>

            <button
              onClick={() => openBookingDetails(selectedBooking.bookingId)}
              className="w-full bg-[#043927] hover:bg-emerald-950 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-2"
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>View Full Booking Details ➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RescheduledBookingsPage;
