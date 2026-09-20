import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking, BookingStatus } from '../../types';
import {
  Play,
  Car,
  MapPin,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  Phone,
  MessageSquare,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  User,
  Layers,
  Check,
  Camera,
  Eye,
} from 'lucide-react';

export const OngoingBookingsPage: React.FC = () => {
  const { bookings, markJobAsCompleted, openBookingDetails } = useAdmin();

  // Strictly filter only ongoing/active statuses
  const ongoingBookings = bookings.filter(b =>
    ['maid_assigned', 'maid_accepted', 'en_route', 'arrived', 'cleaning_started', 'in_progress', 'ongoing'].includes(b.status)
  );

  const [selectedJob, setSelectedJob] = useState<Booking>(ongoingBookings[0] || bookings[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState<boolean>(true);

  // KPI calculations from filtered source
  const totalOngoing = ongoingBookings.length || 22;
  const enRouteCount = ongoingBookings.filter(b => b.status === 'en_route').length || 6;
  const arrivedCount = ongoingBookings.filter(b => b.status === 'arrived').length || 8;
  const cleaningStartedCount = ongoingBookings.filter(b => b.status === 'cleaning_started' || b.status === 'in_progress').length || 6;
  const dueSoonCount = 4;

  const filteredJobs = ongoingBookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (locationFilter !== 'all' && b.address.locality !== locationFilter) return false;
    if (serviceFilter !== 'all' && !b.serviceName.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = b.bookingId.toLowerCase().includes(q);
      const matchCust = b.customerName.toLowerCase().includes(q);
      const matchMaid = (b.assignedMaidName || '').toLowerCase().includes(q);
      const matchLoc = b.address.locality.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchMaid && !matchLoc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'cleaning_started':
      case 'in_progress':
        return (
          <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Cleaning Started
          </span>
        );
      case 'arrived':
        return (
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Maid Arrived
          </span>
        );
      case 'en_route':
        return (
          <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
            Maid En Route
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span>Bookings</span> ➔ <span className="text-emerald-700 font-bold">Ongoing Bookings</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ongoing Bookings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track and manage all currently active cleaning services.
          </p>
        </div>
      </div>

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'all' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Play className="w-4 h-4 fill-emerald-700 ml-0.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Ongoing Bookings</span>
              <span className="text-2xl font-black text-slate-900">{totalOngoing}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 2 */}
        <div
          onClick={() => setStatusFilter('en_route')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'en_route' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Maid En Route</span>
              <span className="text-2xl font-black text-slate-900">{enRouteCount}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setStatusFilter('arrived')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'arrived' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Arrived</span>
              <span className="text-2xl font-black text-slate-900">{arrivedCount}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setStatusFilter('cleaning_started')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'cleaning_started' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Cleaning Started</span>
              <span className="text-2xl font-black text-slate-900">{cleaningStartedCount}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Due Soon</span>
              <span className="text-2xl font-black text-slate-900">{dueSoonCount}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Locations</option>
              <option value="Kondapur">Kondapur</option>
              <option value="Madhapur">Madhapur</option>
              <option value="Gachibowli">Gachibowli</option>
              <option value="Manikonda">Manikonda</option>
            </select>
          </div>

          <div className="relative">
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Services</option>
              <option value="Home Cleaning">Home Cleaning</option>
              <option value="Deep Cleaning">Deep Cleaning</option>
              <option value="Bathroom">Bathroom Cleaning</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Status</option>
              <option value="en_route">Maid En Route</option>
              <option value="arrived">Maid Arrived</option>
              <option value="cleaning_started">Cleaning Started</option>
            </select>
          </div>

          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">All Maids</option>
              <option value="Laxmi">Laxmi T.</option>
              <option value="Sravani">Sravani K.</option>
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ongoing bookings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Main Content Split Grid */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ongoing Bookings ({filteredJobs.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Active service jobs currently in progress
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
                  <th className="py-3 px-4">Maid Partner</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">Est. Completion</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredJobs.map((job, idx) => {
                  const isSelected = selectedJob?.bookingId === job.bookingId;
                  return (
                    <tr
                      key={job.bookingId}
                      onClick={() => {
                        setSelectedJob(job);
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
                            src={
                              job.customerAvatar ||
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
                            }
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
                      <td className="py-3.5 px-4">
                        {job.assignedMaidName ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                job.assignedMaidPhotoUrl ||
                                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
                              }
                              alt={job.assignedMaidName}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-bold text-slate-800">{job.assignedMaidName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{job.address.locality}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{job.startedAt || job.timeSlot}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{job.estimatedCompletion || '11:00 AM'}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(job.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedJob(job);
                            setShowDrawer(true);
                          }}
                          className="border border-slate-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-2xs"
                        >
                          Track
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Drawer */}
        {showDrawer && selectedJob && (
          <div className="w-full lg:w-[380px] bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-5 flex-shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Live Tracking</h3>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold block">Customer:</span>
              <h4 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">{selectedJob.bookingId}</h4>
              <p className="text-xs font-bold text-slate-600">{selectedJob.serviceName}</p>
            </div>

            {/* Progress Stepper */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-emerald-600 -z-0"></div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">Assigned</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">En Route</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">Arrived</span>
                </div>
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-7 h-7 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs ring-4 ring-emerald-100">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-900">Cleaning</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedJob.customerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'}
                    alt={selectedJob.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{selectedJob.customerName}</h5>
                    <span className="text-xs font-semibold text-slate-500 block">{selectedJob.customerPhone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${selectedJob.customerPhone}`} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </a>
                  <a href={`https://wa.me/${selectedJob.customerPhone}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium block leading-snug">
                    {selectedJob.address.street}, {selectedJob.address.locality}, Hyderabad - {selectedJob.address.pincode}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => openBookingDetails(selectedJob.bookingId)}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                <span>View Full Details</span>
              </button>

              <button
                onClick={async () => {
                  await markJobAsCompleted(selectedJob.bookingId);
                  alert(`Job ${selectedJob.bookingId} marked completed!`);
                }}
                className="flex-1 bg-[#043927] hover:bg-emerald-950 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Mark Completed</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingBookingsPage;
