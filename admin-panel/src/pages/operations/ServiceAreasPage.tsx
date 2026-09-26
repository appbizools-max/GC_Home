import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, supabaseAdmin } from '../../config/supabase';
import {
  MapPin,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  ShieldAlert,
  Loader2,
  Building2,
  Check,
  AlertTriangle,
} from 'lucide-react';

export interface ServiceArea {
  id: string;
  city: string;
  locality: string;
  pincode: string;
  state: string;
  is_serviceable: boolean;
  is_active: boolean;
  created_at?: string;
}

export const TELANGANA_CITIES = [
  'Karimnagar',
  'Kazipet',
  'Hanamkonda',
  'Warangal',
] as const;

export type TelanganaCity = typeof TELANGANA_CITIES[number];

export const ServiceAreasPage: React.FC = () => {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [cityInput, setCityInput] = useState<string>('Karimnagar');
  const [localityInput, setLocalityInput] = useState<string>('');
  const [pincodeInput, setPincodeInput] = useState<string>('');
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');
  const [postalInfo, setPostalInfo] = useState<string | null>(null);
  const [validatingPin, setValidatingPin] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const postalLookupTimeoutRef = useRef<any>(null);

  const fetchServiceAreas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .order('city', { ascending: true })
        .order('locality_name', { ascending: true });

      if (!error && data) {
        const mapped: ServiceArea[] = data.map((row: any) => ({
          id: row.id,
          city: row.city || 'Karimnagar',
          locality: row.locality_name || row.locality || row.zone_name || 'Area',
          pincode: row.pincode ? String(row.pincode).trim() : '',
          state: row.state || 'Telangana',
          is_serviceable: row.is_serviceable !== undefined ? Boolean(row.is_serviceable) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
          is_active: row.is_active !== undefined ? Boolean(row.is_active) : (row.is_serviceable !== undefined ? Boolean(row.is_serviceable) : true),
          created_at: row.created_at,
        }));
        setServiceAreas(mapped);
      }
    } catch (err) {
      console.warn('Notice fetching service areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceAreas();

    // Supabase Realtime synchronization
    const channel = supabase
      .channel('service_areas_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_areas' },
        () => {
          fetchServiceAreas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setServiceAreas(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, is_active: nextStatus, is_serviceable: nextStatus }
          : a
      )
    );

    try {
      const { error } = await supabaseAdmin
        .from('service_areas')
        .update({
          is_active: nextStatus,
          is_serviceable: nextStatus,
        })
        .eq('id', id);

      if (error) {
        console.error('Error toggling service area status:', error);
        // Rollback
        setServiceAreas(prev =>
          prev.map(a =>
            a.id === id
              ? { ...a, is_active: currentStatus, is_serviceable: currentStatus }
              : a
          )
        );
      }
    } catch (err) {
      console.warn('Error updating area status:', err);
    }
  };

  const handleDeleteArea = async (id: string) => {
    const target = serviceAreas.find(a => a.id === id);
    const label = target ? `${target.city} - ${target.locality} (${target.pincode})` : 'this area';
    if (!window.confirm(`Are you sure you want to remove ${label}?`)) return;

    setServiceAreas(prev => prev.filter(a => a.id !== id));
    try {
      const { error } = await supabaseAdmin.from('service_areas').delete().eq('id', id);
      if (error) {
        console.error('Error deleting service area:', error);
        fetchServiceAreas();
      }
    } catch (err) {
      console.warn('Error deleting area:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingArea(null);
    setCityInput('Karimnagar');
    setLocalityInput('');
    setPincodeInput('');
    setIsActiveInput(true);
    setFormError('');
    setPostalInfo(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (area: ServiceArea) => {
    setEditingArea(area);
    setCityInput(area.city || 'Karimnagar');
    setLocalityInput(area.locality);
    setPincodeInput(area.pincode);
    setIsActiveInput(area.is_serviceable && area.is_active);
    setFormError('');
    setPostalInfo(null);
    setModalOpen(true);
  };

  // Live Pincode Verification on change
  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincodeInput(clean);
    setFormError('');
    setPostalInfo(null);

    if (postalLookupTimeoutRef.current) {
      clearTimeout(postalLookupTimeoutRef.current);
    }

    if (clean.length === 6) {
      setValidatingPin(true);
      postalLookupTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
          const data = await res.json();
          if (
            Array.isArray(data) &&
            data[0]?.Status === 'Success' &&
            Array.isArray(data[0]?.PostOffice) &&
            data[0].PostOffice.length > 0
          ) {
            const firstPo = data[0].PostOffice[0];
            const state = (firstPo.State || '').trim();
            const district = (firstPo.District || '').trim();

            if (state.toLowerCase() !== 'telangana') {
              setFormError(`PIN code ${clean} belongs to ${state}. GC HOME+ only operates in Telangana.`);
              setPostalInfo(null);
            } else {
              setPostalInfo(`Verified: ${district}, Telangana (${data[0].PostOffice.length} postal zones)`);
            }
          } else {
            setFormError(`PIN code ${clean} not found in official Indian postal directory.`);
            setPostalInfo(null);
          }
        } catch {
          // If offline / network error
          setPostalInfo(null);
        } finally {
          setValidatingPin(false);
        }
      }, 350);
    } else {
      setValidatingPin(false);
    }
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCity = cityInput.trim();
    const cleanLocality = localityInput.trim();
    const cleanPincode = pincodeInput.replace(/\D/g, '').trim();

    if (!cleanCity || !cleanLocality || !cleanPincode) {
      setFormError('Please fill in City, Locality, and Pincode.');
      return;
    }

    if (cleanPincode.length !== 6) {
      setFormError('Pincode must be exactly 6 digits.');
      return;
    }

    setSaving(true);

    try {
      // 1. PIN-Code Validation via official Postal API
      const postalRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
      const postalData = await postalRes.json();

      if (
        !Array.isArray(postalData) ||
        postalData[0]?.Status !== 'Success' ||
        !Array.isArray(postalData[0]?.PostOffice) ||
        postalData[0].PostOffice.length === 0
      ) {
        setFormError(`Invalid PIN code. PIN ${cleanPincode} does not exist in postal records.`);
        setSaving(false);
        return;
      }

      const stateDetected = (postalData[0].PostOffice[0]?.State || '').trim();
      if (stateDetected.toLowerCase() !== 'telangana') {
        setFormError(
          `PIN code ${cleanPincode} belongs to ${stateDetected}. GC HOME+ operates exclusively in Telangana.`
        );
        setSaving(false);
        return;
      }

      // 2. Duplicate Check: Prevent duplicate City + Locality + Pincode
      const duplicateExists = serviceAreas.some(area => {
        if (editingArea && area.id === editingArea.id) return false;
        return (
          area.city.toLowerCase() === cleanCity.toLowerCase() &&
          area.locality.toLowerCase() === cleanLocality.toLowerCase() &&
          area.pincode === cleanPincode
        );
      });

      if (duplicateExists) {
        setFormError(
          `Service Area "${cleanCity} - ${cleanLocality} (${cleanPincode})" already exists.`
        );
        setSaving(false);
        return;
      }

      // 3. Save to Supabase (Single Source of Truth)
      const payload = {
        city: cleanCity,
        state: 'Telangana',
        locality_name: cleanLocality,
        zone_name: cleanLocality,
        pincode: cleanPincode,
        is_serviceable: isActiveInput,
        is_active: isActiveInput,
      };

      if (editingArea) {
        // Edit existing area
        const { error } = await supabaseAdmin
          .from('service_areas')
          .update(payload)
          .eq('id', editingArea.id);

        if (error) throw error;

        setServiceAreas(prev =>
          prev.map(a =>
            a.id === editingArea.id
              ? {
                  ...a,
                  city: cleanCity,
                  locality: cleanLocality,
                  pincode: cleanPincode,
                  state: 'Telangana',
                  is_serviceable: isActiveInput,
                  is_active: isActiveInput,
                }
              : a
          )
        );
      } else {
        // Add new service area
        const { data, error } = await supabaseAdmin
          .from('service_areas')
          .insert([payload])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newRow = data[0];
          const createdArea: ServiceArea = {
            id: newRow.id,
            city: newRow.city || cleanCity,
            locality: newRow.locality_name || cleanLocality,
            pincode: newRow.pincode || cleanPincode,
            state: newRow.state || 'Telangana',
            is_serviceable: isActiveInput,
            is_active: isActiveInput,
            created_at: newRow.created_at,
          };
          setServiceAreas(prev => [createdArea, ...prev]);
        }
      }

      setModalOpen(false);
    } catch (err: any) {
      console.error('Error saving service area:', err);
      setFormError(err?.message || 'Failed to save service area. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Dynamically derive available cities from real Supabase service areas
  const availableCities = useMemo(() => {
    const citySet = new Set<string>(TELANGANA_CITIES);
    serviceAreas.forEach(a => {
      if (a.city && a.city.trim()) {
        citySet.add(a.city.trim());
      }
    });
    return Array.from(citySet).sort((a, b) => a.localeCompare(b));
  }, [serviceAreas]);

  // Filtered view
  const filteredAreas = serviceAreas.filter(a => {
    const matchesSearch =
      a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.pincode.includes(searchTerm) ||
      a.state.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity =
      selectedCityFilter === 'all'
        ? true
        : a.city.toLowerCase() === selectedCityFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? a.is_serviceable && a.is_active
        : !(a.is_serviceable && a.is_active);

    return matchesSearch && matchesCity && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800">
              Telangana State Operations
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <MapPin className="w-6 h-6 text-[#168A68]" /> Service Areas Coverage
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage active cities, localities, and 6-digit postal PIN codes for GC HOME+ service availability.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Service Area
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city, locality, or pincode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168A68]"
          />
        </div>

        {/* Right: City and Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setSelectedCityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCityFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Cities
            </button>
            {availableCities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCityFilter(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCityFilter.toLowerCase() === city.toLowerCase()
                    ? 'bg-[#123D2A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({serviceAreas.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'active'
                  ? 'bg-[#168A68] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({serviceAreas.filter(a => a.is_serviceable && a.is_active).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({serviceAreas.filter(a => !(a.is_serviceable && a.is_active)).length})
            </button>
          </div>
        </div>
      </div>

      {/* Service Areas Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-semibold text-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#168A68]" />
            Loading service areas from Supabase...
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-semibold text-sm flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            No service areas found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">City</th>
                  <th className="py-4 px-6">Locality</th>
                  <th className="py-4 px-6">Pincode</th>
                  <th className="py-4 px-6">State</th>
                  <th className="py-4 px-6">Coverage</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredAreas.map(area => {
                  const isActive = area.is_serviceable && area.is_active;
                  return (
                    <tr key={area.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* City */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#168A68] shrink-0" />
                          <span>{area.city}</span>
                        </div>
                      </td>

                      {/* Locality */}
                      <td className="py-4 px-6 text-slate-800 font-medium">
                        {area.locality || '—'}
                      </td>

                      {/* Pincode */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200/80 rounded-md px-2.5 py-1 inline-block">
                          {area.pincode || '—'}
                        </span>
                      </td>

                      {/* State */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {area.state || 'Telangana'}
                        </span>
                      </td>

                      {/* Coverage Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleActive(area.id, isActive)}
                          title={isActive ? 'Click to deactivate area' : 'Click to activate area'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(area)}
                          title="Edit Area"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer font-bold text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          title="Delete Area"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer font-bold text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add / Edit Service Area */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#168A68]" />
                  {editingArea ? 'Edit Service Area' : 'Add New Service Area'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Operated exclusively within Telangana State
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            ) : null}

            <form onSubmit={handleSaveArea} className="space-y-4">
              {/* City Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City *
                </label>
                <select
                  required
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#168A68] cursor-pointer"
                >
                  {availableCities.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Restricted to Telangana operations hubs. Karimnagar is default.
                </p>
              </div>

              {/* State (Read-only Telangana) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="Telangana"
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed select-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                    Locked
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatically set to Telangana. Cannot be modified.
                </p>
              </div>

              {/* Locality / Area Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Locality / Area Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kothapalli, Collectorate Road, Subedari"
                  value={localityInput}
                  onChange={e => setLocalityInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#168A68]"
                />
              </div>

              {/* Pincode with Postal Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pincode *
                  </label>
                  {validatingPin && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin text-[#168A68]" /> Validating with Postal API...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 505001"
                  value={pincodeInput}
                  onChange={e => handlePincodeChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#168A68]"
                />
                {postalInfo ? (
                  <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {postalInfo}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter 6-digit postal code. Must belong to Telangana.
                  </p>
                )}
              </div>

              {/* Active Coverage Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActiveInput}
                  onChange={e => setIsActiveInput(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#168A68] rounded border-slate-300 focus:ring-[#168A68] cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active Coverage
                  <span className="block text-[11px] font-normal text-slate-500">
                    Customers in this pincode can place bookings
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || validatingPin}
                  className="inline-flex items-center gap-2 px-5 py-2.2 bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingArea ? (
                    'Update Area'
                  ) : (
                    'Add Area'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
