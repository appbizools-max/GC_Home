import React, { useState, useEffect } from 'react';
import { Send, Bell, Sliders, CheckCircle, Save, Clock, MapPin, Settings, Plus, X, Edit2 } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../config/supabase';
import { useAdmin } from '../../context/AdminContext';

export const SettingsPage: React.FC = () => {
  const { platformSettings, serviceAreas } = useAdmin();

  // Notification State
  const [notifTitle, setNotifTitle] = useState('New Cleaning Special Offer!');
  const [notifBody, setNotifBody] = useState('Book Deep Clean today and get 15% instant cashback in Hyderabad.');
  const [targetGroup, setTargetGroup] = useState('all');
  const [sentSuccess, setSentSuccess] = useState(false);

  // Platform Rules State
  const [defaultRadius, setDefaultRadius] = useState(7);
  const [commissionRate, setCommissionRate] = useState(20);
  const [minBookingAmount, setMinBookingAmount] = useState(299);
  const [maxBookingAmount, setMaxBookingAmount] = useState(9999);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Time Slots State
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

  // Service Areas State
  const [areas, setAreas] = useState<any[]>([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCity, setNewAreaCity] = useState('Hyderabad');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [areasLoading, setAreasLoading] = useState(false);

  // Operational Hours State
  const [operatingStartTime, setOperatingStartTime] = useState('06:00');
  const [operatingEndTime, setOperatingEndTime] = useState('22:00');
  const [operatingDays, setOperatingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const [hoursLoading, setHoursLoading] = useState(false);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      // Load platform settings
      const { data: settings } = await supabase.from('platform_settings').select('*');
      if (settings && settings.length > 0) {
        settings.forEach(s => {
          if (s.key === 'default_radius_km') setDefaultRadius(Number(s.value) || 7);
          if (s.key === 'platform_commission_pct') setCommissionRate(Number(s.value) || 20);
          if (s.key === 'min_booking_amount') setMinBookingAmount(Number(s.value) || 299);
          if (s.key === 'max_booking_amount') setMaxBookingAmount(Number(s.value) || 9999);
          if (s.key === 'operating_start_time') setOperatingStartTime(s.value || '06:00');
          if (s.key === 'operating_end_time') setOperatingEndTime(s.value || '22:00');
          if (s.key === 'operating_days') {
            try {
              const days = JSON.parse(s.value);
              setOperatingDays(days);
            } catch {
              setOperatingDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            }
          }
          if (s.key === 'available_time_slots') {
            try {
              const slots = JSON.parse(s.value);
              setTimeSlots(slots);
            } catch {
              setTimeSlots(['08:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM']);
            }
          }
        });
      }

      // Load service areas
      const { data: areasData } = await supabase.from('service_areas').select('*').eq('is_active', true).order('name');
      if (areasData) {
        setAreas(areasData);
      }
    } catch (err) {
      console.warn('Error loading settings:', err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('notifications').insert({
        recipient_role: targetGroup,
        title: notifTitle,
        message: notifBody,
        category: 'system',
        is_pushed: true,
        push_sent_at: new Date().toISOString(),
      });
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    } catch (err) {
      console.error('Error broadcasting notification:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsToSave = [
        { key: 'default_radius_km', value: String(defaultRadius), description: 'Auto-assignment search radius in km' },
        { key: 'platform_commission_pct', value: String(commissionRate), description: 'Default platform commission percent' },
        { key: 'min_booking_amount', value: String(minBookingAmount), description: 'Minimum booking amount' },
        { key: 'max_booking_amount', value: String(maxBookingAmount), description: 'Maximum booking amount' },
        { key: 'operating_start_time', value: operatingStartTime, description: 'Platform operating start time' },
        { key: 'operating_end_time', value: operatingEndTime, description: 'Platform operating end time' },
        { key: 'operating_days', value: JSON.stringify(operatingDays), description: 'Platform operating days' },
        { key: 'available_time_slots', value: JSON.stringify(timeSlots), description: 'Available booking time slots' },
      ];

      const { error } = await supabaseAdmin.from('platform_settings').upsert(settingsToSave, {
        onConflict: 'key'
      });

      if (error) throw error;

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Error saving platform settings:', err);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.trim()) return;
    if (timeSlots.includes(newTimeSlot.trim())) {
      alert('This time slot already exists');
      return;
    }
    setTimeSlots([...timeSlots, newTimeSlot.trim()]);
    setNewTimeSlot('');
  };

  const handleRemoveTimeSlot = (slot: string) => {
    setTimeSlots(timeSlots.filter(s => s !== slot));
  };

  const handleAddServiceArea = async () => {
    if (!newAreaName.trim()) {
      alert('Please enter area name');
      return;
    }
    
    setAreasLoading(true);
    try {
      const { data, error } = await supabaseAdmin.from('service_areas').insert({
        name: newAreaName.trim(),
        city: newAreaCity.trim(),
        pincode: newAreaPincode.trim() || null,
        is_active: true
      }).select().single();

      if (error) throw error;

      setAreas([...areas, data]);
      setNewAreaName('');
      setNewAreaPincode('');
    } catch (err) {
      console.error('Error adding service area:', err);
      alert('Failed to add service area');
    } finally {
      setAreasLoading(false);
    }
  };

  const handleToggleArea = async (areaId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('service_areas')
        .update({ is_active: !currentStatus })
        .eq('id', areaId);

      if (error) throw error;

      setAreas(areas.map(a => a.id === areaId ? { ...a, is_active: !currentStatus } : a));
    } catch (err) {
      console.error('Error toggling service area:', err);
    }
  };

  const toggleOperatingDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter(d => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-700" />
          Platform Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure platform rules, time slots, service areas, and operational hours
        </p>
      </div>

      {/* FCM Push Notifications */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-700" /> Push Notifications
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Send manual push notification alerts to Customer App or Maid App devices via FCM.
        </p>

        {sentSuccess && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 border border-emerald-200">
            <CheckCircle className="w-4 h-4" /> Push notification broadcast sent successfully!
          </div>
        )}

        <form onSubmit={handleSendNotification} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Target Audience</label>
            <select
              value={targetGroup}
              onChange={e => setTargetGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
            >
              <option value="all">All Users (Customers + Maids)</option>
              <option value="customers">Customers Only</option>
              <option value="maids">Active Verified Maids Only</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Notification Title</label>
            <input
              type="text"
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Message Body</label>
            <textarea
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              required
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 self-start shadow-sm transition-all"
          >
            <Send className="w-4 h-4" /> Broadcast Push Alert
          </button>
        </form>
      </div>

      {/* Platform Operating Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-700" /> Platform Operating Rules
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Configure matching radius, commission rates, and booking amount limits.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Auto-Assignment Search Radius: <span className="text-emerald-700">{defaultRadius} km</span>
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={defaultRadius}
              onChange={e => setDefaultRadius(Number(e.target.value))}
              className="w-full accent-emerald-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              Platform Commission Rate: <span className="text-emerald-700">{commissionRate}%</span>
            </label>
            <input
              type="range"
              min={5}
              max={35}
              value={commissionRate}
              onChange={e => setCommissionRate(Number(e.target.value))}
              className="w-full accent-emerald-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Minimum Booking Amount (₹)</label>
            <input
              type="number"
              value={minBookingAmount}
              onChange={e => setMinBookingAmount(Number(e.target.value))}
              min={99}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Maximum Booking Amount (₹)</label>
            <input
              type="number"
              value={maxBookingAmount}
              onChange={e => setMaxBookingAmount(Number(e.target.value))}
              min={1000}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {settingsSaved && (
          <div className="mt-4 bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
            <CheckCircle className="w-4 h-4" /> Operating rules saved successfully!
          </div>
        )}
      </div>

      {/* Time Slots Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" /> Available Time Slots
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Configure booking time slots for customers. These slots will be available in the user app.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {timeSlots.map((slot, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-2"
            >
              <Clock className="w-3.5 h-3.5" />
              {slot}
              <button
                onClick={() => handleRemoveTimeSlot(slot)}
                className="text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTimeSlot}
            onChange={e => setNewTimeSlot(e.target.value)}
            placeholder="e.g., 08:00 AM - 10:00 AM"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
          />
          <button
            onClick={handleAddTimeSlot}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {/* Service Areas Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-700" /> Service Areas
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Manage serviceable areas for the platform. Add or deactivate localities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {areas.map(area => (
            <div
              key={area.id}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                area.is_active
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{area.name}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {area.city}{area.pincode ? ` - ${area.pincode}` : ''}
                </div>
              </div>
              <button
                onClick={() => handleToggleArea(area.id, area.is_active)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                  area.is_active
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {area.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="text"
            value={newAreaName}
            onChange={e => setNewAreaName(e.target.value)}
            placeholder="Area name (e.g., Kondapur)"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
          />
          <input
            type="text"
            value={newAreaCity}
            onChange={e => setNewAreaCity(e.target.value)}
            placeholder="City"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
          />
          <input
            type="text"
            value={newAreaPincode}
            onChange={e => setNewAreaPincode(e.target.value)}
            placeholder="Pincode (optional)"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
          />
          <button
            onClick={handleAddServiceArea}
            disabled={areasLoading}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Area
          </button>
        </div>
      </div>

      {/* Operational Hours */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" /> Operational Hours
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Set platform operating hours and working days for bookings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Start Time</label>
            <input
              type="time"
              value={operatingStartTime}
              onChange={e => setOperatingStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">End Time</label>
            <input
              type="time"
              value={operatingEndTime}
              onChange={e => setOperatingEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-2">Operating Days</label>
          <div className="flex flex-wrap gap-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              <button
                key={day}
                onClick={() => toggleOperatingDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  operatingDays.includes(day)
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save All Settings Button */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={handleSaveSettings}
          className="w-full md:w-auto px-6 py-3 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Save className="w-5 h-5" /> Save All Platform Settings
        </button>
      </div>
    </div>
  );
};
