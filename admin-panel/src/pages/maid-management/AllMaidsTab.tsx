import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  Wifi,
  Star,
  Search,
  RotateCcw,
  Download,
  Eye,
  X,
  MapPin,
  ShieldCheck,
  Phone,
  Briefcase,
  AlertTriangle,
  Globe,
  DollarSign,
  FileCheck,
} from 'lucide-react';

interface AllMaidsTabProps {
  activeTab?: 'all' | 'pending-approval' | 'pending-kyc' | 'active' | 'inactive';
}

// Resilient Avatar with initials fallback
export const PartnerAvatar: React.FC<{ photoUrl?: string; name: string; size?: string }> = ({
  photoUrl,
  name,
  size = 'w-10 h-10',
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = (name || 'Partner')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  if (!photoUrl || imageError) {
    return (
      <div
        className={`${size} rounded-full bg-emerald-100 text-[#123D2A] font-black flex items-center justify-center shrink-0 border border-emerald-200 text-xs shadow-xs select-none`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      onError={() => setImageError(true)}
      className={`${size} rounded-full object-cover border border-slate-200 shrink-0`}
    />
  );
};

export const AllMaidsTab: React.FC<AllMaidsTabProps> = ({ activeTab = 'all' }) => {
  const { maids, toggleMaidActiveStatus, approveMaid, rejectMaid } = useAdmin();

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Partner Drawer
  const [activeDrawerPartner, setActiveDrawerPartner] = useState<MaidProfile | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Extract unique locations and services from current data
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    maids.forEach(m => {
      if (m.serviceArea?.trim()) locSet.add(m.serviceArea.trim());
      (m.preferredAreas || []).forEach(a => {
        if (a?.trim()) locSet.add(a.trim());
      });
    });
    return Array.from(locSet).sort();
  }, [maids]);

  const uniqueServices = useMemo(() => {
    const sSet = new Set<string>();
    maids.forEach(m => {
      (m.servicesProvided || []).forEach(sp => {
        if (sp.serviceName?.trim()) sSet.add(sp.serviceName.trim());
      });
      (m.skills || []).forEach(sk => {
        if (sk?.trim()) sSet.add(sk.trim());
      });
    });
    return Array.from(sSet).sort();
  }, [maids]);

  // Check if any filters are active
  const isFilterActive =
    selectedStatus !== 'All' ||
    selectedLocation !== 'All' ||
    selectedService !== 'All' ||
    selectedLanguage !== 'All' ||
    selectedExperience !== 'All' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedStatus('All');
    setSelectedLocation('All');
    setSelectedService('All');
    setSelectedLanguage('All');
    setSelectedExperience('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Helper to format compact services
  const getServicesSummary = (m: MaidProfile): string => {
    const serviceNames: string[] = [];
    if (m.servicesProvided && Array.isArray(m.servicesProvided) && m.servicesProvided.length > 0) {
      m.servicesProvided.forEach(sp => {
        if (sp.serviceName && !serviceNames.includes(sp.serviceName)) {
          serviceNames.push(sp.serviceName);
        }
      });
    }
    if (serviceNames.length === 0 && m.skills && m.skills.length > 0) {
      m.skills.forEach(s => {
        if (!serviceNames.includes(s)) serviceNames.push(s);
      });
    }
    if (serviceNames.length === 0) return 'Cleaning';
    if (serviceNames.length <= 2) return serviceNames.join(' · ');
    return `${serviceNames[0]} · +${serviceNames.length - 1} more`;
  };

  // Helper to format partner availability
  const getPartnerAvailability = (m: MaidProfile): { label: string; color: string; dot: string } => {
    if (m.currentStatus === 'busy') {
      return { label: 'Busy', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    }
    if (m.isOnline || m.currentStatus === 'online' || m.currentStatus === 'available') {
      return { label: 'Available', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    }
    return { label: 'Offline', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  };

  // Helper to format partner status
  const getPartnerStatusBadge = (m: MaidProfile) => {
    if (m.status === 'pending') {
      if (m.kycStatus === 'pending' || m.kycStatus === 'under_review' || m.kycStatus === 'incomplete') {
        return { label: 'Pending KYC', style: 'bg-amber-50 text-amber-800 border-amber-200' };
      }
      return { label: 'Pending Approval', style: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (m.status === 'rejected') {
      return { label: 'Suspended', style: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
    if (m.status === 'approved') {
      if (m.isOnline) {
        return { label: 'Active', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      }
      return { label: 'Approved', style: 'bg-teal-50 text-teal-800 border-teal-200' };
    }
    return { label: m.status || 'Inactive', style: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // Filter Computation combining top tab + toolbar filters
  const filteredMaids = useMemo(() => {
    return maids.filter(m => {
      // 1. Top Tab filter
      if (activeTab === 'pending-approval') {
        if (m.status !== 'pending') return false;
      } else if (activeTab === 'pending-kyc') {
        const isKycPending =
          m.kycStatus === 'pending' ||
          m.kycStatus === 'under_review' ||
          m.kycStatus === 'incomplete' ||
          (m.status === 'pending' && m.kycStatus !== 'verified');
        if (!isKycPending) return false;
      } else if (activeTab === 'active') {
        if (m.status !== 'approved' || !m.isOnline) return false;
      } else if (activeTab === 'inactive') {
        const isInactive = m.status === 'rejected' || (m.status === 'approved' && !m.isOnline);
        if (!isInactive) return false;
      }

      // 2. Toolbar Dropdown Filters
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Pending Approval' && m.status !== 'pending') return false;
        if (selectedStatus === 'Pending KYC') {
          const isKyc = m.kycStatus === 'pending' || m.kycStatus === 'under_review' || m.kycStatus === 'incomplete';
          if (!isKyc) return false;
        }
        if (selectedStatus === 'Approved' && m.status !== 'approved') return false;
        if (selectedStatus === 'Active' && (m.status !== 'approved' || !m.isOnline)) return false;
        if (selectedStatus === 'Inactive' && (m.status === 'approved' && m.isOnline)) return false;
        if (selectedStatus === 'Suspended' && m.status !== 'rejected') return false;
      }

      if (selectedLocation !== 'All') {
        const loc = selectedLocation.toLowerCase();
        const areaMatch = m.serviceArea?.toLowerCase().includes(loc);
        const prefMatch = (m.preferredAreas || []).some(a => a.toLowerCase().includes(loc));
        if (!areaMatch && !prefMatch) return false;
      }

      if (selectedService !== 'All') {
        const srv = selectedService.toLowerCase();
        const hasService =
          (m.servicesProvided || []).some(sp => sp.serviceName?.toLowerCase().includes(srv)) ||
          (m.skills || []).some(sk => sk.toLowerCase().includes(srv));
        if (!hasService) return false;
      }

      if (selectedLanguage !== 'All') {
        const lang = selectedLanguage.toLowerCase();
        const hasLang = (m.languages || m.languagesSpoken || []).some(l => l.toLowerCase() === lang);
        if (!hasLang) return false;
      }

      if (selectedExperience !== 'All') {
        if (selectedExperience === '1-2 Years' && !m.experience?.includes('1') && !m.experience?.includes('2')) return false;
        if (selectedExperience === '3+ Years' && !m.experience?.includes('3') && !m.experience?.includes('4') && !m.experience?.includes('5')) return false;
      }

      // 3. Search query (Partner name, Phone, Partner ID, Location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = m.fullName?.toLowerCase().includes(q);
        const phoneMatch = m.phone?.toLowerCase().includes(q);
        const idMatch = (m.maidId || m.uid || '').toLowerCase().includes(q);
        const locMatch = m.serviceArea?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !idMatch && !locMatch) return false;
      }

      return true;
    });
  }, [maids, activeTab, selectedStatus, selectedLocation, selectedService, selectedLanguage, selectedExperience, searchQuery]);

  // Server-like pagination calculations
  const totalPages = Math.ceil(filteredMaids.length / rowsPerPage) || 1;
  const paginatedMaids = useMemo(() => {
    return filteredMaids.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredMaids, currentPage, rowsPerPage]);

  // Export filtered partners to CSV
  const handleExportCSV = () => {
    const headers = ['Partner ID', 'Name', 'Phone', 'Status', 'Location', 'Services', 'Availability', 'Joined On'];
    const rows = filteredMaids.map(m => [
      `"${m.maidId || m.uid}"`,
      `"${m.fullName}"`,
      `"${m.phone}"`,
      `"${m.status}"`,
      `"${m.serviceArea || ''}"`,
      `"${getServicesSummary(m)}"`,
      `"${getPartnerAvailability(m).label}"`,
      `"${m.appliedAt || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GC_Home_Partners_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine context-appropriate empty state
  const getEmptyStateMessage = () => {
    if (activeTab === 'pending-approval') {
      return {
        title: 'No pending approvals',
        subtitle: 'All partner applications have been reviewed.',
      };
    }
    if (activeTab === 'pending-kyc') {
      return {
        title: 'No pending KYC',
        subtitle: 'All partner KYC records are up to date.',
      };
    }
    if (isFilterActive) {
      return {
        title: 'No partners found',
        subtitle: 'Try adjusting your filters or search query.',
      };
    }
    return {
      title: 'No partners registered yet',
      subtitle: 'New partner registrations will appear here.',
    };
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* Compact Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Pending KYC">Pending KYC</option>
            <option value="Approved">Approved</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={e => {
              setSelectedLocation(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[130px] truncate"
          >
            <option value="All">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Service Filter */}
          <select
            value={selectedService}
            onChange={e => {
              setSelectedService(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[130px] truncate"
          >
            <option value="All">All Services</option>
            {uniqueServices.map(srv => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={e => {
              setSelectedLanguage(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Languages</option>
            <option value="Telugu">Telugu</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
          </select>

          {/* Experience Filter */}
          <select
            value={selectedExperience}
            onChange={e => {
              setSelectedExperience(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Experience</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="3+ Years">3+ Years</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner, phone, ID..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
            />
          </div>

          {/* Reset Button (Only rendered when filters are active) */}
          {isFilterActive && (
            <button
              onClick={resetFilters}
              title="Reset all active filters"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer animate-fadeIn"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Right Action: CSV Export */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleExportCSV}
            title="Export filtered partners to CSV"
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" /> Export
          </button>
        </div>
      </div>

      {/* Main Partners Table (7 Compact Columns) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop & Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Partner</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Services</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4">Joined On</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedMaids.map(partner => {
                const statusBadge = getPartnerStatusBadge(partner);
                const avail = getPartnerAvailability(partner);
                const servicesSummary = getServicesSummary(partner);

                return (
                  <tr key={partner.uid} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Partner Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <PartnerAvatar photoUrl={partner.photoUrl} name={partner.fullName} size="w-9 h-9" />
                        <div>
                          <strong className="text-slate-900 font-bold block text-xs">{partner.fullName}</strong>
                          <span className="text-[11px] text-slate-500 font-medium">{partner.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge.style}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* 3. Location */}
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {partner.serviceArea || 'Hyderabad'}
                    </td>

                    {/* 4. Services */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 text-[11px]">
                        {servicesSummary}
                      </span>
                    </td>

                    {/* 5. Availability */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${avail.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                        {avail.label}
                      </span>
                    </td>

                    {/* 6. Joined On */}
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {partner.appliedAt ? partner.appliedAt.split('T')[0] : 'Recent'}
                    </td>

                    {/* 7. Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveDrawerPartner(partner)}
                        className="px-3 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedMaids.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">{getEmptyStateMessage().title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{getEmptyStateMessage().subtitle}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Partner Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedMaids.map(partner => {
            const statusBadge = getPartnerStatusBadge(partner);
            const avail = getPartnerAvailability(partner);
            const servicesSummary = getServicesSummary(partner);

            return (
              <div key={partner.uid} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PartnerAvatar photoUrl={partner.photoUrl} name={partner.fullName} size="w-10 h-10" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{partner.fullName}</h4>
                      <p className="text-[11px] text-slate-500">{partner.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge.style}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Location</span>
                    <span className="font-bold text-slate-800">{partner.serviceArea || 'Hyderabad'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Availability</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${avail.label === 'Available' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                      {avail.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Services</span>
                    <span className="font-bold text-slate-800">{servicesSummary}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Joined: {partner.appliedAt ? partner.appliedAt.split('T')[0] : 'Recent'}
                  </span>
                  <button
                    onClick={() => setActiveDrawerPartner(partner)}
                    className="px-3.5 py-1.5 bg-[#123D2A] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            );
          })}

          {paginatedMaids.length === 0 && (
            <div className="py-12 text-center text-slate-400 px-4">
              <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">{getEmptyStateMessage().title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{getEmptyStateMessage().subtitle}</p>
            </div>
          )}
        </div>

        {/* Server-Style Pagination Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-600">
            Showing {filteredMaids.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
            {Math.min(currentPage * rowsPerPage, filteredMaids.length)} of {filteredMaids.length} partners
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-[#123D2A] text-white text-xs font-black rounded-lg shadow-2xs">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Partner Details Drawer (Complete Profile, Documents, Performance & Actions) */}
      {activeDrawerPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3.5">
                  <PartnerAvatar
                    photoUrl={activeDrawerPartner.photoUrl}
                    name={activeDrawerPartner.fullName}
                    size="w-12 h-12"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerPartner.fullName}
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                        {activeDrawerPartner.maidId || activeDrawerPartner.uid}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {activeDrawerPartner.serviceArea || 'Hyderabad'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDrawerPartner(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body Content */}
              <div className="p-6 space-y-6">
                {/* 1. Status & Approval Banner */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Partner Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold mt-1 border ${
                        getPartnerStatusBadge(activeDrawerPartner).style
                      }`}
                    >
                      {getPartnerStatusBadge(activeDrawerPartner).label}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      KYC Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold mt-1 border ${
                        activeDrawerPartner.kycStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {activeDrawerPartner.kycStatus === 'verified' ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* 2. Operational KPIs & Performance */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    Performance & Financials
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-800 block">Jobs Completed</span>
                      <span className="text-lg font-black text-emerald-950">
                        {activeDrawerPartner.completedJobsCount || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <span className="text-[11px] font-bold text-amber-800 block">Rating</span>
                      <span className="text-lg font-black text-amber-950 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        {activeDrawerPartner.rating || 5.0}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 block">This Month Earnings</span>
                      <span className="text-base font-black text-slate-900">
                        ₹{(activeDrawerPartner.earningsThisMonth || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 block">Total Earnings</span>
                      <span className="text-base font-black text-slate-900">
                        ₹{(activeDrawerPartner.totalEarnings || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Personal & Contact Details */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    Contact & Profile
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 font-medium">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                      </span>
                      <strong className="text-slate-900 font-bold">{activeDrawerPartner.phone}</strong>
                    </div>
                    {activeDrawerPartner.alternatePhone && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Alternate Phone</span>
                        <strong className="text-slate-900 font-bold">{activeDrawerPartner.alternatePhone}</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Languages</span>
                      <strong className="text-slate-900 font-bold">
                        {(activeDrawerPartner.languages || activeDrawerPartner.languagesSpoken || ['Telugu', 'Hindi']).join(', ')}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Experience</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerPartner.experience || '3+ Years'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Registered On</span>
                      <strong className="text-slate-900 font-bold">
                        {activeDrawerPartner.appliedAt ? activeDrawerPartner.appliedAt.split('T')[0] : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Services & Service Areas */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    Services Provided
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeDrawerPartner.servicesProvided && activeDrawerPartner.servicesProvided.length > 0)
                      ? activeDrawerPartner.servicesProvided.map((sp, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                          >
                            {sp.serviceName}
                          </span>
                        ))
                      : (activeDrawerPartner.skills || ['Home Cleaning']).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                          >
                            {sk}
                          </span>
                        ))}
                  </div>

                  {activeDrawerPartner.preferredAreas && activeDrawerPartner.preferredAreas.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">Preferred Areas</span>
                      <div className="flex flex-wrap gap-1">
                        {activeDrawerPartner.preferredAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Documents & KYC Verification */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    KYC Documents
                  </h4>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Aadhaar Verification
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          activeDrawerPartner.aadhaarDocUrl || activeDrawerPartner.kycStatus === 'verified'
                            ? 'text-emerald-700 bg-emerald-100'
                            : 'text-amber-700 bg-amber-100'
                        }`}
                      >
                        {activeDrawerPartner.aadhaarDocUrl || activeDrawerPartner.kycStatus === 'verified'
                          ? 'Verified'
                          : 'Pending'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> PAN Card
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          activeDrawerPartner.panDocUrl || activeDrawerPartner.kycStatus === 'verified'
                            ? 'text-emerald-700 bg-emerald-100'
                            : 'text-amber-700 bg-amber-100'
                        }`}
                      >
                        {activeDrawerPartner.panDocUrl || activeDrawerPartner.kycStatus === 'verified'
                          ? 'Verified'
                          : 'Pending'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Police Clearance
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          activeDrawerPartner.kycStatus === 'verified'
                            ? 'text-emerald-700 bg-emerald-100'
                            : 'text-amber-700 bg-amber-100'
                        }`}
                      >
                        {activeDrawerPartner.kycStatus === 'verified' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              {activeDrawerPartner.status === 'pending' ? (
                <>
                  <button
                    onClick={async () => {
                      await approveMaid(activeDrawerPartner.uid);
                      setActiveDrawerPartner(null);
                    }}
                    className="flex-1 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Partner
                  </button>
                  <button
                    onClick={async () => {
                      const reason = window.prompt('Enter rejection reason:');
                      if (reason !== null) {
                        await rejectMaid(activeDrawerPartner.uid, reason || 'Incomplete registration');
                        setActiveDrawerPartner(null);
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    toggleMaidActiveStatus(
                      activeDrawerPartner.uid,
                      activeDrawerPartner.status === 'approved' ? 'rejected' : 'approved'
                    );
                    setActiveDrawerPartner(null);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    activeDrawerPartner.status === 'approved'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : 'bg-[#123D2A] text-white hover:bg-[#184a34]'
                  }`}
                >
                  {activeDrawerPartner.status === 'approved' ? 'Deactivate Partner' : 'Activate Partner'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

