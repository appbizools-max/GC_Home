import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking, BookingStatus } from '../../types';
import {
  Play,
  Car,
  MapPin,
  Sparkles,
  CheckCircle2,
  Maximize2,
  RefreshCw,
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
  Map as MapIcon,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Check,
  Camera,
} from 'lucide-react';

export const LiveJobsPage: React.FC = () => {
  const { bookings, maids, markJobAsCompleted, updateJobStatus } = useAdmin();

  // Filter live jobs (statuses: en_route, arrived, cleaning_started, in_progress, ongoing)
  const liveBookings = bookings.filter(b =>
    ['en_route', 'arrived', 'cleaning_started', 'in_progress', 'ongoing', 'maid_assigned'].includes(b.status)
  );

  const [selectedJob, setSelectedJob] = useState<Booking | null>(liveBookings[0] || bookings[0] || null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [maidFilter, setMaidFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // KPI Calculations
  const totalLiveJobs = liveBookings.length;
  const maidEnRouteCount = liveBookings.filter(b => b.status === 'en_route').length;
  const maidArrivedCount = liveBookings.filter(b => b.status === 'arrived').length;
  const cleaningStartedCount = liveBookings.filter(b => b.status === 'cleaning_started' || b.status === 'in_progress').length;
  const dueSoonCount = 0;

  // Filtered List
  const filteredJobs = liveBookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (maidFilter !== 'all' && b.assignedMaidName !== maidFilter && b.assignedMaidId !== maidFilter) return false;
    if (locationFilter !== 'all' && b.address?.locality !== locationFilter && b.address?.city !== locationFilter) return false;
    if (serviceFilter !== 'all' && !b.serviceName.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = (b.bookingId || '').toLowerCase().includes(q);
      const matchCust = (b.customerName || '').toLowerCase().includes(q);
      const matchMaid = (b.assignedMaidName || '').toLowerCase().includes(q);
      const matchLoc = (b.address?.locality || b.address?.city || '').toLowerCase().includes(q);
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Live Jobs
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track ongoing cleaning services in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullScreen}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isFullScreen ? 'Exit Full Screen' : 'View in Full Screen'}</span>
            </button>

            <button
              onClick={handleRefresh}
              className="bg-[#123D2A] hover:bg-emerald-950 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-200 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span>Last updated: 16 Sep 2026, 10:42 AM</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Live Jobs */}
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
              <span className="text-xs font-semibold text-slate-500 block">Total Live Jobs</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{totalLiveJobs}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 2: Maid En Route */}
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
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{maidEnRouteCount}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 3: Maid Arrived */}
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
              <span className="text-xs font-semibold text-slate-500 block">Maid Arrived</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{maidArrivedCount}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 4: Cleaning Started */}
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
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{cleaningStartedCount}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Card 5: Due to Complete Soon */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Due to Complete Soon</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{dueSoonCount}</span>
                <span className="text-[11px] font-semibold text-slate-500">Within 1 hour</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          {/* Location Dropdown */}
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
              <option value="Bachupally">Bachupally</option>
              <option value="Kukatpally">Kukatpally</option>
            </select>
          </div>

          {/* Services Dropdown */}
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
              <option value="Sofa">Sofa Cleaning</option>
              <option value="Kitchen">Kitchen Cleaning</option>
            </select>
          </div>

          {/* Status Dropdown */}
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

          {/* Maids Dropdown */}
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={maidFilter}
              onChange={e => setMaidFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Maids</option>
              {maids.filter(m => m.status === 'approved').map(m => (
                <option key={m.uid} value={m.fullName}>{m.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search live jobs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Main Split Content: Table & Map on Left, Live Job Details Side Drawer on Right */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Live Jobs Table & Interactive Map */}
        <div className="flex-1 flex flex-col gap-5 w-full">
          {/* Live Jobs Table Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Live Jobs ({filteredJobs.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Real-time status of ongoing cleaning services
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
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredJobs.slice(0, 6).map((job, idx) => {
                    const isSelected = selectedJob?.bookingId === job.bookingId;
                    return (
                      <tr
                        key={job.bookingId}
                        onClick={() => setSelectedJob(job)}
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
                              <div>
                                <span className="font-bold text-slate-800 block leading-tight">
                                  {job.assignedMaidName}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-amber-600 font-bold text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{job.address.locality}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{job.timeSlot}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-red-50 text-red-600 border border-red-200/60 px-2 py-0.5 rounded-full font-bold text-[11px]">
                            {job.durationFormatted || '1h 42m'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(job.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedJob(job);
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

          {/* Live Location Map Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Live Location Map
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Real-time view of maids and ongoing jobs
                </p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                <span>View All in Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Styled Map Container */}
            <div className="relative w-full h-[320px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {/* Map Canvas Background Vector Graphic */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')`,
                }}
              ></div>

              {/* Operational Region Indicators */}
              <div className="absolute top-4 left-6 text-[11px] font-extrabold text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                Telangana Operations
              </div>
              <div className="absolute bottom-6 right-8 text-xl font-black text-slate-700/40 tracking-wider uppercase pointer-events-none">
                Live Operations Map
              </div>

              {/* Dynamic Interactive Pins from Filtered Live Jobs */}
              {filteredJobs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p className="text-xs font-bold text-slate-700">No active live jobs match current filters</p>
                    <span className="text-[11px] text-slate-500 font-medium">All active bookings will appear on this operational radar</span>
                  </div>
                </div>
              ) : (
                filteredJobs.slice(0, 8).map((job, idx) => {
                  const isSelected = selectedJob?.bookingId === job.bookingId || selectedJob?.id === job.id;
                  const positions = [
                    { top: '22%', left: '15%' },
                    { top: '15%', left: '42%' },
                    { top: '55%', left: '50%' },
                    { top: '65%', left: '22%' },
                    { top: '35%', left: '68%' },
                    { top: '70%', left: '72%' },
                    { top: '38%', left: '32%' },
                    { top: '75%', left: '45%' },
                  ];
                  const pos = positions[idx % positions.length];
                  const partnerName = job.assignedMaidName || 'Unassigned';
                  const statusLabel =
                    job.status === 'en_route' ? 'En Route' :
                    job.status === 'arrived' ? 'Arrived' :
                    job.status === 'cleaning_started' || job.status === 'in_progress' ? 'Cleaning' :
                    job.status === 'maid_assigned' ? 'Assigned' : 'Active';

                  const borderCol =
                    job.status === 'en_route' ? 'border-purple-600' :
                    job.status === 'arrived' ? 'border-emerald-600' :
                    job.status === 'cleaning_started' || job.status === 'in_progress' ? 'border-blue-600' :
                    'border-amber-600';

                  const statusBadgeColor =
                    job.status === 'en_route' ? 'text-purple-600' :
                    job.status === 'arrived' ? 'text-emerald-600' :
                    job.status === 'cleaning_started' || job.status === 'in_progress' ? 'text-blue-600' :
                    'text-amber-600';

                  return (
                    <div
                      key={job.bookingId || job.id}
                      style={{ position: 'absolute', top: pos.top, left: pos.left }}
                      onClick={() => setSelectedJob(job)}
                      className={`flex items-center gap-2 bg-white/95 p-1.5 rounded-xl shadow-lg border border-slate-200 cursor-pointer hover:scale-105 transition-all z-10 ${
                        isSelected ? 'ring-2 ring-emerald-500 scale-105 shadow-xl' : ''
                      }`}
                    >
                      {job.assignedMaidPhotoUrl ? (
                        <img
                          src={job.assignedMaidPhotoUrl}
                          alt={partnerName}
                          className={`w-7 h-7 rounded-full object-cover border-2 ${borderCol}`}
                        />
                      ) : (
                        <div className={`w-7 h-7 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center text-[10px] font-black border-2 ${borderCol}`}>
                          {partnerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="pr-1 text-left">
                        <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">{partnerName}</span>
                        <span className={`text-[10px] font-bold ${statusBadgeColor} block`}>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Zoom Controls */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 flex flex-col divide-y divide-slate-100">
                <button className="p-1.5 hover:bg-slate-100 text-slate-700 cursor-pointer">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 text-slate-700 cursor-pointer">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 text-slate-700 cursor-pointer">
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Map Legend (Right Side) */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200 text-[11px] font-semibold flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-700">Customer Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <span className="text-slate-700">Maid En Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-slate-700">Maid Arrived</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-slate-700">Cleaning in Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-700">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Job Details Side Drawer */}
        <div className="w-full lg:w-[380px] bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-5 flex-shrink-0">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Live Job Details</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Live Tracking
              </span>
              <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!selectedJob ? (
            <div className="py-20 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Job Selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Select any active booking from the list or map above to view its live operational status.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Booking Header */}
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Booking Reference:</span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                    {selectedJob.bookingId}
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ₹{selectedJob.totalAmount || 0}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-600 mt-0.5">{selectedJob.serviceName}</p>
              </div>

              {/* Dynamic Horizontal Stepper */}
              {(() => {
                const getStep = (s: string) => {
                  if (['completed'].includes(s)) return 5;
                  if (['cleaning_started', 'in_progress', 'ongoing'].includes(s)) return 4;
                  if (['arrived'].includes(s)) return 3;
                  if (['en_route'].includes(s)) return 2;
                  if (['maid_assigned', 'maid_accepted'].includes(s)) return 1;
                  return 0;
                };
                const currentStep = getStep(selectedJob.status);
                const steps = [
                  { num: 1, label: 'Assigned' },
                  { num: 2, label: 'En Route' },
                  { num: 3, label: 'Arrived' },
                  { num: 4, label: 'Cleaning' },
                  { num: 5, label: 'Complete' },
                ];

                return (
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, (currentStep - 1) * 25))}%` }}
                        />
                      </div>

                      {steps.map(st => {
                        const isDone = currentStep > st.num;
                        const isCurrent = currentStep === st.num;
                        return (
                          <div key={st.num} className="flex flex-col items-center gap-1 z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-[#123D2A] text-white ring-4 ring-emerald-100'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              {isDone ? <Check className="w-4 h-4" /> : isCurrent ? <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> : st.num}
                            </div>
                            <span className={`text-[10px] ${isCurrent ? 'font-black text-emerald-900' : isDone ? 'font-bold text-slate-800' : 'font-semibold text-slate-400'}`}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Customer Info Box */}
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedJob.customerAvatar ? (
                      <img
                        src={selectedJob.customerAvatar}
                        alt={selectedJob.customerName || 'Customer'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold text-sm border border-emerald-200">
                        {selectedJob.customerName ? selectedJob.customerName.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">{selectedJob.customerName || 'Customer'}</h5>
                      <span className="text-xs font-semibold text-slate-500 block">
                        {selectedJob.customerPhone || 'Phone unavailable'}
                      </span>
                    </div>
                  </div>

                  {selectedJob.customerPhone && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${selectedJob.customerPhone}`}
                        className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/${selectedJob.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-700 font-medium block leading-snug">
                        {[
                          selectedJob.address?.street,
                          selectedJob.address?.locality,
                          selectedJob.address?.city,
                          selectedJob.address?.pincode ? `- ${selectedJob.address.pincode}` : '',
                        ].filter(Boolean).join(', ') || 'Address not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maid Partner Box */}
              {selectedJob.assignedMaidName ? (
                <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedJob.assignedMaidPhotoUrl ? (
                      <img
                        src={selectedJob.assignedMaidPhotoUrl}
                        alt={selectedJob.assignedMaidName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold text-sm border border-emerald-200">
                        {selectedJob.assignedMaidName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Maid Partner</span>
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-sm font-bold text-slate-900">{selectedJob.assignedMaidName}</h5>
                        {selectedJob.assignedMaidRating ? (
                          <span className="text-xs font-extrabold text-amber-500 flex items-center gap-0.5">
                            ★ {selectedJob.assignedMaidRating}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {selectedJob.assignedMaidPhone || 'Phone unavailable'}
                      </span>
                    </div>
                  </div>

                  {selectedJob.assignedMaidPhone && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${selectedJob.assignedMaidPhone}`}
                        className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/${selectedJob.assignedMaidPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-center">
                  <span className="text-xs font-bold text-amber-900 block">No Partner Assigned Yet</span>
                  <p className="text-[11px] text-amber-700 mt-0.5">This booking is in queue for dispatch</p>
                </div>
              )}

              {/* Job Timing & Schedule */}
              <div className="flex flex-col gap-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Schedule & Details</h5>

                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-center">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Date</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedJob.date || 'Today'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Time Slot</span>
                    <span className="text-xs font-bold text-emerald-700 block mt-0.5">{selectedJob.timeSlot || 'Anytime'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Status</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5 uppercase tracking-wide">
                      {selectedJob.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Customer Note Box (Only if provided) */}
                {(selectedJob.customerNote || selectedJob.specialInstructions) && (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                    <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      Customer Instructions
                    </span>
                    <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
                      "{selectedJob.customerNote || selectedJob.specialInstructions}"
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowPhotoModal(true)}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-500" />
              <span>View Photos</span>
            </button>

            <button
              onClick={async () => {
                if (selectedJob) {
                  await markJobAsCompleted(selectedJob.bookingId);
                  alert(`Job ${selectedJob.bookingId} marked as completed!`);
                }
              }}
              className="flex-1 bg-[#123D2A] hover:bg-emerald-950 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Mark as Completed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Proof of Work Photos ({selectedJob?.bookingId})
              </h4>
              <button onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">Before Cleaning</span>
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80"
                  alt="Before"
                  className="w-full h-40 object-cover rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">After Cleaning</span>
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80"
                  alt="After"
                  className="w-full h-40 object-cover rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveJobsPage;

