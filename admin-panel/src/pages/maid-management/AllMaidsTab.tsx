import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import { PaginationControls } from '../../components/PaginationControls';
import { downloadCSV } from '../../utils/exportUtils';
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
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

interface AllMaidsTabProps {
  activeTab?: 'all' | 'pending-approval' | 'pending-kyc' | 'active' | 'inactive';
  initialPartnerId?: string;
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 75, 100];

// Resilient Avatar with initials fallback
export const PartnerAvatar: React.FC<{ photoUrl?: string; name: string; size?: string }> = ({
  photoUrl,
  name,
  size = 'w-9 h-9',
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
        className={`${size} rounded-full bg-emerald-100 text-[#123D2A] font-black flex items-center justify-center shrink-0 border border-emerald-200 text-xs shadow-2xs select-none`}
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

// Formats date into standard "25 Sep 2026"
const formatJoinedDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}
  return dateStr;
};

// Experience range matching helper
const matchExperience = (exp?: string, filter?: string): boolean => {
  if (!filter || filter === 'All') return true;
  if (!exp) return false;
  const num = parseInt(exp.replace(/\D/g, ''), 10);
  if (isNaN(num)) return true;
  if (filter === '0–1 years') return num <= 1;
  if (filter === '1–3 years') return num >= 1 && num <= 3;
  if (filter === '3–5 years') return num >= 3 && num <= 5;
  if (filter === '5+ years') return num >= 5;
  return true;
};

// Compact Interactive Services Cell (+X more popover)
const PartnerServicesCell: React.FC<{ services: string[] }> = ({ services }) => {
  const [open, setOpen] = useState(false);

  if (services.length === 0) {
    return <span className="text-slate-400 text-xs italic">Cleaning</span>;
  }

  const primaryServices = services.slice(0, 2);
  const remainingCount = services.length - 2;

  return (
    <div className="relative inline-block">
      <div className="flex flex-wrap items-center gap-1">
        {primaryServices.map((srv, idx) => (
          <span
            key={idx}
            className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80 text-[11px] whitespace-nowrap"
          >
            {srv}
          </span>
        ))}
        {remainingCount > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="text-[10px] font-extrabold text-[#123D2A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
            title="Click to view all services"
          >
            +{remainingCount} more
          </button>
        )}
      </div>

      {open && remainingCount > 0 && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={e => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-40 animate-fadeIn">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pb-1 border-b border-slate-100">
              All Services ({services.length})
            </span>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {services.map((s, idx) => (
                <div key={idx} className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const AllMaidsTab: React.FC<AllMaidsTabProps> = ({ activeTab = 'all', initialPartnerId }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    maids,
    maidsLoading,
    maidsError,
    refreshMaids,
    services,
    serviceAreas,
    toggleMaidActiveStatus,
    approveMaid,
    rejectMaid,
  } = useAdmin();

  // Read URL query parameters for bookmarkable & refresh-persistent state
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '15', 10);
  const selectedStatus = searchParams.get('status') || 'All';
  const selectedLocation = searchParams.get('location') || 'All';
  const selectedService = searchParams.get('service') || 'All';
  const selectedLanguage = searchParams.get('language') || 'All';
  const selectedExperience = searchParams.get('experience') || 'All';
  const searchQuery = searchParams.get('q') || '';

  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : 15;

  const updateUrlParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === '' ||
          (key === 'status' && val === 'All') ||
          (key === 'location' && val === 'All') ||
          (key === 'service' && val === 'All') ||
          (key === 'language' && val === 'All') ||
          (key === 'experience' && val === 'All') ||
          (key === 'page' && val === '1') ||
          (key === 'pageSize' && val === '15')
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, val);
        }
      });
      return newParams;
    }, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    // Page size change resets to page 1
    updateUrlParams({ pageSize: String(newSize), page: '1' });
  };

  // Selected Partner Drawer
  const [activeDrawerPartner, setActiveDrawerPartner] = useState<MaidProfile | null>(null);

  useEffect(() => {
    if (initialPartnerId && maids.length > 0) {
      const match = maids.find(m => m.uid === initialPartnerId || m.maidId === initialPartnerId);
      if (match) {
        setActiveDrawerPartner(match);
      }
    }
  }, [initialPartnerId, maids]);

  // Dynamic Operational Cities from Supabase service_areas + partner records
  const dynamicLocations = useMemo(() => {
    const locSet = new Set<string>();
    // Preload known GC HOME+ operational cities
    ['Karimnagar', 'Kazipet', 'Hanamkonda', 'Warangal', 'Hyderabad'].forEach(city => locSet.add(city));

    (serviceAreas || []).forEach((sa: any) => {
      if (sa.is_serviceable !== false && sa.is_active !== false) {
        if (sa.city) locSet.add(sa.city);
        if (sa.locality) locSet.add(sa.locality);
        if (sa.locality_name) locSet.add(sa.locality_name);
      }
    });

    maids.forEach(m => {
      if (m.serviceArea?.trim()) locSet.add(m.serviceArea.trim());
      (m.preferredAreas || []).forEach(a => {
        if (a?.trim()) locSet.add(a.trim());
      });
    });

    return Array.from(locSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [serviceAreas, maids]);

  // Dynamic Active Services from Supabase services catalog + partner records
  const dynamicServices = useMemo(() => {
    const sSet = new Set<string>();
    (services || []).forEach(s => {
      if (s.isActive !== false && s.name?.trim()) {
        sSet.add(s.name.trim());
      }
    });

    maids.forEach(m => {
      (m.servicesProvided || []).forEach(sp => {
        if (sp.serviceName?.trim()) sSet.add(sp.serviceName.trim());
      });
      (m.skills || []).forEach(sk => {
        if (sk?.trim()) sSet.add(sk.trim());
      });
    });

    return Array.from(sSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [services, maids]);

  // Check if any filters are active
  const isFilterActive =
    selectedStatus !== 'All' ||
    selectedLocation !== 'All' ||
    selectedService !== 'All' ||
    selectedLanguage !== 'All' ||
    selectedExperience !== 'All' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    const newParams = new URLSearchParams();
    if (pageSize !== 15) {
      newParams.set('pageSize', String(pageSize));
    }
    setSearchParams(newParams, { replace: true });
  };

  // Helper to extract full services list for a partner
  const getPartnerServicesList = (m: MaidProfile): string[] => {
    const list: string[] = [];
    if (m.servicesProvided && Array.isArray(m.servicesProvided)) {
      m.servicesProvided.forEach(sp => {
        if (sp.serviceName && !list.includes(sp.serviceName)) {
          list.push(sp.serviceName);
        }
      });
    }
    if (m.skills && Array.isArray(m.skills)) {
      m.skills.forEach(sk => {
        if (!list.includes(sk)) list.push(sk);
      });
    }
    return list.length > 0 ? list : ['Home Cleaning'];
  };

  // Helper to format partner availability
  const getPartnerAvailability = (m: MaidProfile): { label: string; color: string; dot: string } => {
    if (m.currentStatus === 'busy') {
      return { label: 'Busy', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    }
    if (m.isOnline || m.currentStatus === 'online' || m.currentStatus === 'available') {
      return { label: 'Online', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
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
      return { label: 'Approved', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { label: m.status || 'Inactive', style: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // Filter Computation combining top tab + toolbar filters (AND logic)
  const filteredMaids = useMemo(() => {
    return maids.filter(m => {
      // 1. Top Tab filter
      if (activeTab === 'pending-approval') {
        if (m.status !== 'pending' || !m.submittedAt) return false;
      } else if (activeTab === 'pending-kyc') {
        const isKycPending =
          m.kycStatus === 'pending' ||
          m.kycStatus === 'under_review' ||
          m.kycStatus === 'incomplete' ||
          (m.status === 'pending' && m.kycStatus !== 'verified');
        if (!isKycPending) return false;
      } else if (activeTab === 'active') {
        const isOnline = m.status === 'approved' && (m.isOnline || m.currentStatus === 'online' || m.currentStatus === 'available');
        if (!isOnline) return false;
      } else if (activeTab === 'inactive') {
        const isInactive = m.status === 'approved' && !m.isOnline && m.currentStatus !== 'online';
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
        if (selectedStatus === 'Active' && (m.status !== 'approved' || (!m.isOnline && m.currentStatus !== 'online'))) return false;
        if (selectedStatus === 'Inactive' && (m.status === 'approved' && (m.isOnline || m.currentStatus === 'online'))) return false;
        if (selectedStatus === 'Suspended' && m.status !== 'rejected') return false;
      }

      if (selectedLocation !== 'All') {
        const loc = selectedLocation.toLowerCase();
        const areaMatch = (m.serviceArea || '').toLowerCase().includes(loc);
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
        if (!matchExperience(m.experience, selectedExperience)) return false;
      }

      // 3. Real Search Query (Name, Phone, Partner ID, Locality)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (m.fullName || '').toLowerCase().includes(q);
        const phoneMatch = (m.phone || '').includes(q);
        const idMatch = (m.maidId || m.uid || '').toLowerCase().includes(q);
        const locMatch = (m.serviceArea || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !idMatch && !locMatch) return false;
      }

      return true;
    });
  }, [maids, activeTab, selectedStatus, selectedLocation, selectedService, selectedLanguage, selectedExperience, searchQuery]);

  // Paginated dataset
  const paginatedMaids = useMemo(() => {
    return filteredMaids.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredMaids, currentPage, pageSize]);

  // Export ONLY the currently filtered partners dataset to CSV
  const handleExportCSV = () => {
    const headers = [
      'Partner ID',
      'Full Name',
      'Phone',
      'Account Status',
      'KYC Status',
      'Location',
      'Services',
      'Availability',
      'Joined Date',
    ];

    const rows = filteredMaids.map(m => [
      m.maidId || m.uid,
      m.fullName,
      m.phone,
      m.status,
      m.kycStatus || 'pending',
      m.serviceArea || 'Karimnagar',
      getPartnerServicesList(m).join('; '),
      getPartnerAvailability(m).label,
      formatJoinedDate(m.appliedAt),
    ]);

    downloadCSV('GC_Home_Partners_Export', headers, rows);
  };

  return (
    <div className="flex flex-col gap-4 font-sans select-none pb-8 text-slate-800">
      {/* 1. Combined Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => {
              updateUrlParams({ status: e.target.value, page: '1' });
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs shrink-0"
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Pending KYC">Pending KYC</option>
            <option value="Active">Active (Online)</option>
            <option value="Inactive">Inactive (Offline)</option>
            <option value="Suspended">Suspended</option>
          </select>

          {/* Location Filter (Dynamic from Admin Service Areas in Supabase) */}
          <select
            value={selectedLocation}
            onChange={e => {
              updateUrlParams({ location: e.target.value, page: '1' });
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[140px] truncate shadow-2xs shrink-0"
          >
            <option value="All">All Locations</option>
            {dynamicLocations.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Service Filter (Dynamic from Admin Service Catalog in Supabase) */}
          <select
            value={selectedService}
            onChange={e => {
              updateUrlParams({ service: e.target.value, page: '1' });
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[150px] truncate shadow-2xs shrink-0"
          >
            <option value="All">All Services</option>
            {dynamicServices.map(srv => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={e => {
              updateUrlParams({ language: e.target.value, page: '1' });
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs shrink-0"
          >
            <option value="All">All Languages</option>
            <option value="Telugu">Telugu</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
            <option value="Urdu">Urdu</option>
          </select>

          {/* Experience Filter */}
          <select
            value={selectedExperience}
            onChange={e => {
              updateUrlParams({ experience: e.target.value, page: '1' });
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs shrink-0"
          >
            <option value="All">All Experience</option>
            <option value="0–1 years">0–1 years</option>
            <option value="1–3 years">1–3 years</option>
            <option value="3–5 years">3–5 years</option>
            <option value="5+ years">5+ years</option>
          </select>

          {/* Search Box - Flex expands on desktop without clipping */}
          <div className="relative flex-1 min-w-[240px] md:min-w-[300px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner name, phone number, or partner ID..."
              value={searchQuery}
              onChange={e => {
                updateUrlParams({ q: e.target.value, page: '1' });
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-colors shadow-2xs"
            />
          </div>

          {/* Reset Filters Button (Always Visible) */}
          <button
            onClick={resetFilters}
            title="Reset all active filters and return to All Partners"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
              isFilterActive
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Right Action: CSV Export (Exports filtered dataset) */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={handleExportCSV}
            title="Export filtered partners to CSV"
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Main Partners Table (Compact, Real-Data, Single-Line Headers) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop & Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-10 text-center whitespace-nowrap">#</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[200px]">PARTNER</th>
                <th className="py-3 px-3.5 whitespace-nowrap">STATUS</th>
                <th className="py-3 px-3.5 whitespace-nowrap">LOCATION</th>
                <th className="py-3 px-3.5 whitespace-nowrap">SERVICES</th>
                <th className="py-3 px-3.5 whitespace-nowrap">AVAILABILITY</th>
                <th className="py-3 px-3.5 whitespace-nowrap">JOINED DATE</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-right min-w-[100px]">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {/* Skeleton loading state */}
              {maidsLoading && (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3.5 text-center text-slate-300">...</td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-200" />
                          <div className="space-y-1">
                            <div className="h-3 w-28 bg-slate-200 rounded" />
                            <div className="h-2.5 w-20 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5"><div className="h-4 w-16 bg-slate-200 rounded-full" /></td>
                      <td className="py-3 px-3.5"><div className="h-3 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5"><div className="h-4 w-14 bg-slate-200 rounded-full" /></td>
                      <td className="py-3 px-3.5"><div className="h-3 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-3 px-3.5 text-right"><div className="h-6 w-14 bg-slate-200 rounded inline-block" /></td>
                    </tr>
                  ))}
                </>
              )}

              {/* Real partner rows */}
              {!maidsLoading &&
                paginatedMaids.map((partner, idx) => {
                  const statusBadge = getPartnerStatusBadge(partner);
                  const avail = getPartnerAvailability(partner);
                  const servicesList = getPartnerServicesList(partner);

                  return (
                    <tr key={partner.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 text-center text-slate-400 font-bold whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* 1. Partner Profile: Full Name, ID, Unmasked Phone */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <PartnerAvatar photoUrl={partner.photoUrl} name={partner.fullName} size="w-9 h-9" />
                          <div>
                            <strong className="text-slate-900 font-bold block text-xs tracking-tight">
                              {partner.fullName}
                            </strong>
                            <span className="text-[10px] font-black text-[#123D2A] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                              {partner.maidId || partner.uid?.slice(0, 8) || 'PARTNER'}
                            </span>
                            <a
                              href={`tel:${partner.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="text-[11px] text-slate-500 font-medium hover:text-emerald-700 flex items-center gap-1 mt-0.5 transition-colors"
                              title="Call Partner"
                            >
                              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{partner.phone}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* 2. Status Badge */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge.style}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* 3. Location */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{partner.serviceArea || 'Karimnagar'}</span>
                        </div>
                      </td>

                      {/* 4. Services Column (+X more popover) */}
                      <td className="py-2.5 px-3.5">
                        <PartnerServicesCell services={servicesList} />
                      </td>

                      {/* 5. Availability (Clear Online / Offline badges) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${avail.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                          {avail.label}
                        </span>
                      </td>

                      {/* 6. Joined Date (Standardized 25 Sep 2026 format) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500 font-medium">
                        {formatJoinedDate(partner.appliedAt)}
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setActiveDrawerPartner(partner);
                            navigate(`/admin/partners/${partner.uid}`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {/* Empty state handlers */}
              {!maidsLoading && paginatedMaids.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">
                      {maids.length === 0 ? 'No partners registered yet' : 'No matching partners found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {maids.length === 0
                        ? 'New partner registrations will appear here.'
                        : 'Try changing or clearing your filters.'}
                    </p>
                    {isFilterActive && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Partner Cards (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {maidsLoading && (
            <div className="p-6 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading partners...
            </div>
          )}

          {!maidsLoading &&
            paginatedMaids.map(partner => {
              const statusBadge = getPartnerStatusBadge(partner);
              const avail = getPartnerAvailability(partner);
              const servicesList = getPartnerServicesList(partner);

              return (
                <div key={partner.uid} className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <PartnerAvatar photoUrl={partner.photoUrl} name={partner.fullName} size="w-10 h-10" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{partner.fullName}</h4>
                        <span className="text-[10px] font-black text-[#123D2A] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                          {partner.maidId || partner.uid?.slice(0, 8) || 'PARTNER'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{partner.phone}</p>
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
                      <span className="font-bold text-slate-800">{partner.serviceArea || 'Karimnagar'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Availability</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${avail.label === 'Online' ? 'text-emerald-700' : 'text-slate-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                        {avail.label}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">Services</span>
                      <PartnerServicesCell services={servicesList} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Joined: {formatJoinedDate(partner.appliedAt)}
                    </span>
                    <button
                      onClick={() => {
                        setActiveDrawerPartner(partner);
                        navigate(`/admin/partners/${partner.uid}`);
                      }}
                      className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                </div>
              );
            })}

          {!maidsLoading && paginatedMaids.length === 0 && (
            <div className="py-12 text-center text-slate-400 px-4">
              <Users className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                {maids.length === 0 ? 'No partners registered yet' : 'No matching partners found'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {maids.length === 0
                  ? 'New partner registrations will appear here.'
                  : 'Try changing or clearing your filters.'}
              </p>
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#123D2A] text-white rounded-lg text-xs font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Real Pagination Controls (Rows per page: 15 / 25 / 50 / 75 / 100) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredMaids.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="partners"
          />
        </div>
      </div>

      {/* 4. Partner Details Drawer (Complete Profile, KYC Documents, Performance & Actions) */}
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
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerPartner.fullName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-[#123D2A] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {activeDrawerPartner.maidId || activeDrawerPartner.uid?.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{activeDrawerPartner.phone}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveDrawerPartner(null);
                    navigate('/admin/partners');
                  }}
                  className="p-2 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex flex-col gap-6">
                {/* 1. Status & KYC Alert Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${
                      getPartnerStatusBadge(activeDrawerPartner).style
                    }`}
                  >
                    Status: {getPartnerStatusBadge(activeDrawerPartner).label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      getPartnerAvailability(activeDrawerPartner).color
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${getPartnerAvailability(activeDrawerPartner).dot}`} />
                    {getPartnerAvailability(activeDrawerPartner).label}
                  </span>
                </div>

                {/* 2. Key Metrics Grid */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    Performance & Jobs
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 block">Jobs Completed</span>
                      <span className="text-lg font-black text-slate-900">
                        {activeDrawerPartner.completedJobsCount || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <span className="text-[11px] font-bold text-amber-800 block">Rating</span>
                      <span className="text-lg font-black text-amber-950 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        {activeDrawerPartner.rating ? activeDrawerPartner.rating.toFixed(1) : '5.0'}
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
                      <span className="text-slate-500">Joined On</span>
                      <strong className="text-slate-900 font-bold">
                        {formatJoinedDate(activeDrawerPartner.appliedAt)}
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
                    {getPartnerServicesList(activeDrawerPartner).map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                      >
                        {srv}
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

                {/* 5. Documents & KYC Verification (With direct view action links) */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                    KYC Documents
                  </h4>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Aadhaar Verification
                      </span>
                      <div className="flex items-center gap-2">
                        {activeDrawerPartner.aadhaarDocUrl && (
                          <a
                            href={activeDrawerPartner.aadhaarDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View
                          </a>
                        )}
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
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> PAN Card
                      </span>
                      <div className="flex items-center gap-2">
                        {activeDrawerPartner.panDocUrl && (
                          <a
                            href={activeDrawerPartner.panDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View
                          </a>
                        )}
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

export default AllMaidsTab;
