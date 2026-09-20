import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  ChevronRight,
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Search,
  Star,
  CheckCircle2,
  MoreVertical,
  Plus,
  Minus,
  Navigation,
} from 'lucide-react';
import { MaidProfile } from '../../types';

export const AssignMaidPage: React.FC = () => {
  const { selectedBooking, maids, setCurrentTab, confirmMaidAssignment } = useAdmin();

  const [selectedMaid, setSelectedMaid] = useState<MaidProfile | null>(maids[1] || maids[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('10');
  const [serviceFilter, setServiceFilter] = useState('all');

  if (!selectedBooking) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        <p className="text-sm font-bold">No booking selected for maid assignment.</p>
        <button
          onClick={() => setCurrentTab('pending-bookings')}
          className="mt-4 bg-[#043927] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          Return to Pending Bookings
        </button>
      </div>
    );
  }

  const filteredMaids = maids.filter(m => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return m.fullName.toLowerCase().includes(term) || m.serviceArea.toLowerCase().includes(term);
    }
    return true;
  });

  const handleConfirmAssignment = async () => {
    if (!selectedMaid) {
      alert('Please select a maid to confirm assignment.');
      return;
    }
    await confirmMaidAssignment(selectedBooking.bookingId, selectedMaid.uid);
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-8">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span>New / Pending</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#043927] font-bold">Assign Maid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Assign Maid
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Find and assign the best maid for this booking.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('pending-bookings')}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pending Bookings</span>
        </button>
      </div>

      {/* Main Grid: Left 4 Cols (Booking Details) / Right 8 Cols (Available Maids + Map + Confirmation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Booking Details Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0A192F]">Booking Details</h3>
              <span className="text-xs font-bold text-[#043927]">{selectedBooking.bookingId}</span>
            </div>
            <span className="bg-amber-50 text-amber-700 font-extrabold px-3 py-1 rounded-full text-[10px]">
              Pending Assignment
            </span>
          </div>

          {/* Customer Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedBooking.customerAvatar ? (
                <img
                  src={selectedBooking.customerAvatar}
                  alt={selectedBooking.customerName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-sm">
                  {selectedBooking.customerName[0]}
                </div>
              )}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {selectedBooking.customerName}
                </h4>
                <div className="text-xs text-slate-500 font-medium">
                  {selectedBooking.customerPhone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200">
                <Phone className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Service Info */}
          <div className="border-t border-slate-100 pt-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#043927] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">
                {selectedBooking.serviceName}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {selectedBooking.serviceDuration || '3 Hours'}
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="border-t border-slate-100 pt-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                {selectedBooking.address.street}, {selectedBooking.address.locality}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {selectedBooking.address.city} - {selectedBooking.address.pincode}
              </div>
              <button className="text-[11px] font-bold text-[#043927] hover:underline flex items-center gap-1 mt-1 cursor-pointer">
                <span>View on Map</span>
              </button>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="border-t border-slate-100 pt-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {selectedBooking.date}, {selectedBooking.timeSlot}
              </div>
              <div className="text-xs text-slate-500 font-medium">(Today)</div>
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="border-t border-slate-100 pt-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">Estimated Duration</div>
              <div className="text-xs text-slate-500 font-medium">
                {selectedBooking.serviceDuration || '3 Hours'}
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700">Payment Status</div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-xs">
                Paid
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                ₹{selectedBooking.totalAmount}
              </span>
            </div>
          </div>

          {/* Customer Notes */}
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-bold text-slate-700 mb-1.5">Customer Notes</div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs text-slate-600 font-medium leading-relaxed">
              {selectedBooking.specialInstructions ||
                'Please focus on kitchen and living room. Bring your own cleaning supplies.'}
            </div>
          </div>
        </div>

        {/* Right Column (Available Maids + Map + Confirmation Card) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Available Maids Table Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0A192F]">
                  Available Maids ({filteredMaids.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified and eligible maids near the customer location
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                <select
                  value={distanceFilter}
                  onChange={e => setDistanceFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-slate-700 font-bold"
                >
                  <option value="10">Nearby (10 km)</option>
                  <option value="5">Nearby (5 km)</option>
                </select>

                <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-slate-700 font-bold">
                  <option value="all">All Services</option>
                  <option value="home">Home Cleaning</option>
                </select>

                <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-slate-700 font-bold">
                  <option value="online">Online Only</option>
                </select>

                <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-slate-700 font-bold">
                  <option value="distance">Sort by Distance</option>
                  <option value="rating">Sort by Rating</option>
                </select>

                <div className="relative">
                  <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search maids..."
                    className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Maid Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Maid Name</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Jobs</th>
                    <th className="py-2.5 px-3">Skills</th>
                    <th className="py-2.5 px-3">Availability</th>
                    <th className="py-2.5 px-3">ETA</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredMaids.map((m, idx) => {
                    const isSelected = selectedMaid?.uid === m.uid;
                    const isBusy = !m.isOnline;

                    return (
                      <tr
                        key={m.uid}
                        onClick={() => setSelectedMaid(m)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-[#043927]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <img
                                src={m.photoUrl}
                                alt={m.fullName}
                                className="w-8 h-8 rounded-full object-cover shadow-sm"
                              />
                              <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  m.isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              ></span>
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{m.fullName}</div>
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                {m.isOnline ? '● Online' : '● Busy'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {m.distanceKm || (1.2 + idx * 0.6).toFixed(1)} km
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{m.rating || 4.8}</span>
                            <span className="text-slate-400 font-medium text-[10px]">
                              ({m.totalRatingsCount || 125})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {m.completedJobsCount || 210}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(m.skills || ['Home', 'Kitchen']).map(s => (
                              <span
                                key={s}
                                className="bg-sky-50 text-sky-800 font-semibold px-2 py-0.5 rounded-md text-[10px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {m.isOnline ? (
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Available
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              On Job
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {m.etaMins || 8 + idx * 2} mins
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isBusy ? (
                              <button
                                disabled
                                className="bg-slate-200 text-slate-500 px-3.5 py-1.5 rounded-lg text-xs font-bold opacity-60 cursor-not-allowed"
                              >
                                Unavailable
                              </button>
                            ) : (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedMaid(m);
                                }}
                                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#043927] text-white shadow-sm'
                                    : 'bg-emerald-50 text-[#043927] hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Assign'}
                              </button>
                            )}
                            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Grid: Visual Map & Assignment Confirmation Card */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
            {/* Visual Interactive Map (7 Cols) */}
            <div className="sm:col-span-7 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[300px]">
              <div>
                <h4 className="text-sm font-extrabold text-[#0A192F]">Maid Locations</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  View nearby maids and customer location
                </p>
              </div>

              {/* Map Canvas Mock with Pins */}
              <div
                className="my-3 rounded-2xl border border-slate-200/80 bg-cover bg-center h-48 relative flex items-center justify-center p-4 overflow-hidden"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`,
                }}
              >
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]"></div>

                {/* Customer Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 text-xs z-10 animate-bounce">
                  <MapPin className="w-4 h-4" />
                  <span>Customer (Kondapur)</span>
                </div>

                {/* Maid Pins */}
                <div className="absolute top-1/4 left-1/4 bg-white/95 text-slate-800 font-bold px-2.5 py-1 rounded-lg shadow-lg text-[10px] flex items-center gap-1.5 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Sravani K. • 1.8km</span>
                </div>

                <div className="absolute bottom-1/4 right-1/4 bg-white/95 text-slate-800 font-bold px-2.5 py-1 rounded-lg shadow-lg text-[10px] flex items-center gap-1.5 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Laxmi T. • 1.2km</span>
                </div>

                {/* Map Zoom Controls */}
                <div className="absolute bottom-2 left-2 flex flex-col gap-1 bg-white/90 rounded-lg p-1 border border-slate-200 shadow-sm z-20">
                  <button className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-2 right-2 text-[10px] font-black text-slate-800 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                  Hyderabad
                </div>
              </div>
            </div>

            {/* Assignment Confirmation Card (5 Cols) */}
            <div className="sm:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-[#0A192F] mb-3">
                  Assignment Confirmation
                </h4>

                {selectedMaid ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedMaid.photoUrl}
                        alt={selectedMaid.fullName}
                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                      />
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {selectedMaid.fullName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                          <span className="text-amber-600 font-bold flex items-center gap-0.5">
                            ★ {selectedMaid.rating || 4.8}
                          </span>
                          <span>•</span>
                          <span>{selectedMaid.distanceKm || 1.8} km</span>
                          <span>•</span>
                          <span>{selectedMaid.etaMins || 10} mins ETA</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-3 text-xs space-y-1.5 font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>Booking ID:</span>
                        <span className="font-extrabold text-slate-900">{selectedBooking.bookingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-bold text-slate-900">{selectedBooking.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-bold text-slate-900">{selectedBooking.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span className="font-bold text-slate-900">{selectedBooking.date}, {selectedBooking.timeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Arrival:</span>
                        <span className="font-extrabold text-[#043927]">{selectedMaid.etaMins || 10} mins</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 font-medium">
                    Select a maid from the list to preview assignment
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setCurrentTab('pending-bookings')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-3 rounded-xl text-xs transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmAssignment}
                  className="flex-1 bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold py-3 px-3 rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
