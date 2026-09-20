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

  const [selectedJob, setSelectedJob] = useState<Booking>(liveBookings[0] || bookings[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  const totalLiveJobs = liveBookings.length || 22;
  const maidEnRouteCount = liveBookings.filter(b => b.status === 'en_route').length || 6;
  const maidArrivedCount = liveBookings.filter(b => b.status === 'arrived').length || 8;
  const cleaningStartedCount = liveBookings.filter(b => b.status === 'cleaning_started' || b.status === 'in_progress').length || 6;
  const dueSoonCount = 4;

  // Filtered List
  const filteredJobs = liveBookings.filter(b => {
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
              className="bg-[#043927] hover:bg-emerald-950 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
                <span className="text-[11px] font-bold text-emerald-600">↑ 12% <span className="text-slate-400 font-normal">vs yesterday</span></span>
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
                <span className="text-[11px] font-bold text-emerald-600">↑ 20% <span className="text-slate-400 font-normal">vs yesterday</span></span>
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
                <span className="text-[11px] font-bold text-emerald-600">↑ 14% <span className="text-slate-400 font-normal">vs yesterday</span></span>
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
                <span className="text-[11px] font-bold text-emerald-600">↑ 8% <span className="text-slate-400 font-normal">vs yesterday</span></span>
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
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">All Maids</option>
              <option value="Laxmi">Laxmi T.</option>
              <option value="Sravani">Sravani K.</option>
              <option value="Pavani">Pavani M.</option>
              <option value="Anitha">Anitha S.</option>
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

              {/* Map Location Labels */}
              <div className="absolute top-4 left-24 text-[11px] font-extrabold text-slate-600 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">
                Kukatpally
              </div>
              <div className="absolute top-12 right-36 text-[11px] font-extrabold text-slate-600 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">
                Ameerpet
              </div>
              <div className="absolute bottom-20 left-1/3 text-[11px] font-extrabold text-slate-600 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">
                Madhapur
              </div>
              <div className="absolute bottom-10 left-12 text-[11px] font-extrabold text-slate-600 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">
                Gachibowli
              </div>
              <div className="absolute bottom-6 right-8 text-xl font-black text-slate-700/60 tracking-wider">
                Hyderabad
              </div>

              {/* Interactive Pin 1: Meena P. - En Route */}
              <div className="absolute top-10 left-16 flex items-center gap-2 bg-white/95 p-1.5 rounded-xl shadow-lg border border-purple-200 cursor-pointer hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                  alt="Meena"
                  className="w-7 h-7 rounded-full object-cover border-2 border-purple-600"
                />
                <div className="pr-1">
                  <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">Meena P.</span>
                  <span className="text-[10px] font-bold text-purple-600 block">En Route</span>
                </div>
              </div>

              {/* Interactive Pin 2: Anitha S. - Arrived */}
              <div className="absolute top-8 left-1/3 flex items-center gap-2 bg-white/95 p-1.5 rounded-xl shadow-lg border border-emerald-200 cursor-pointer hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=100"
                  alt="Anitha"
                  className="w-7 h-7 rounded-full object-cover border-2 border-emerald-600"
                />
                <div className="pr-1">
                  <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">Anitha S.</span>
                  <span className="text-[10px] font-bold text-emerald-600 block">Arrived</span>
                </div>
              </div>

              {/* Interactive Pin 3: Laxmi T. - Cleaning */}
              <div className="absolute bottom-16 left-1/2 flex items-center gap-2 bg-white/95 p-1.5 rounded-xl shadow-lg border border-blue-200 cursor-pointer hover:scale-105 transition-transform ring-2 ring-blue-500/30">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100"
                  alt="Laxmi"
                  className="w-7 h-7 rounded-full object-cover border-2 border-blue-600"
                />
                <div className="pr-1">
                  <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">Laxmi T.</span>
                  <span className="text-[10px] font-bold text-blue-600 block">Cleaning</span>
                </div>
              </div>

              {/* Interactive Pin 4: Pavani M. - En Route */}
              <div className="absolute bottom-24 right-1/4 flex items-center gap-2 bg-white/95 p-1.5 rounded-xl shadow-lg border border-purple-200 cursor-pointer hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=100"
                  alt="Pavani"
                  className="w-7 h-7 rounded-full object-cover border-2 border-purple-600"
                />
                <div className="pr-1">
                  <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">Pavani M.</span>
                  <span className="text-[10px] font-bold text-purple-600 block">En Route</span>
                </div>
              </div>

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

          {/* Selected Booking Header */}
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Customer:</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                {selectedJob?.bookingId || 'GC-20260916-045'}
              </h4>
            </div>
            <p className="text-xs font-bold text-slate-600">{selectedJob?.serviceName || 'Home Cleaning (2 BHK)'}</p>
          </div>

          {/* 4-Stage Horizontal Stepper */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between relative">
              {/* Stepper Line Background */}
              <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-emerald-600 -z-0"></div>

              {/* Step 1: Assigned */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">Assigned</span>
                <span className="text-[9px] font-semibold text-slate-400">08:50</span>
              </div>

              {/* Step 2: En Route */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">En Route</span>
                <span className="text-[9px] font-semibold text-slate-400">09:05</span>
              </div>

              {/* Step 3: Arrived */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-800">Arrived</span>
                <span className="text-[9px] font-semibold text-slate-400">09:20</span>
              </div>

              {/* Step 4: Cleaning */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-7 h-7 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-emerald-100">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span className="text-[10px] font-black text-emerald-900">Cleaning</span>
                <span className="text-[9px] font-semibold text-slate-400">09:30</span>
              </div>

              {/* Step 5: Complete */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Complete</span>
              </div>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedJob?.customerAvatar ||
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
                  }
                  alt={selectedJob?.customerName || 'Priya Sharma'}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{selectedJob?.customerName || 'Priya Sharma'}</h5>
                  <span className="text-xs font-semibold text-slate-500 block">
                    {selectedJob?.customerPhone || '+91 98765 43210'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${selectedJob?.customerPhone}`}
                  className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${selectedJob?.customerPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-700 font-medium block leading-snug">
                    {selectedJob?.address?.street || 'Flat 4B, Sri Sai Residency'}, {selectedJob?.address?.locality || 'Kondapur'}, Hyderabad - {selectedJob?.address?.pincode || '500084'}
                  </span>
                </div>
              </div>
              <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 flex-shrink-0 shadow-2xs cursor-pointer">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                <span>View on Map</span>
              </button>
            </div>
          </div>

          {/* Maid Partner Box */}
          <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  selectedJob?.assignedMaidPhotoUrl ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
                }
                alt={selectedJob?.assignedMaidName || 'Laxmi T.'}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Maid Partner</span>
                <div className="flex items-center gap-1.5">
                  <h5 className="text-sm font-bold text-slate-900">{selectedJob?.assignedMaidName || 'Laxmi T.'}</h5>
                  <span className="text-xs font-extrabold text-amber-500 flex items-center gap-0.5">
                    ★ {selectedJob?.assignedMaidRating || 4.8}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedJob?.assignedMaidPhone || '+91 91234 56789'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${selectedJob?.assignedMaidPhone}`}
                className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${selectedJob?.assignedMaidPhone}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Job Timing & Customer Note */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Job Info</h5>

            <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Started At</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedJob?.startedAt || '09:00 AM'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Duration</span>
                <span className="text-xs font-bold text-emerald-700 block mt-0.5">{selectedJob?.durationFormatted || '1h 42m'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Est. Completion</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedJob?.estimatedCompletion || '11:00 AM'}</span>
              </div>
            </div>

            {/* Customer Note Box */}
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                Customer Note
              </span>
              <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
                "{selectedJob?.customerNote || selectedJob?.specialInstructions || 'Focus on kitchen and living room. Please bring your own equipment.'}"
              </p>
            </div>
          </div>

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
              className="flex-1 bg-[#043927] hover:bg-emerald-950 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
