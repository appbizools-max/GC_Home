import React, { createContext, useContext, useState, useEffect } from 'react';
import { Service, MaidProfile, Booking, DashboardMetrics } from '../types';
import { ADMIN_SERVICES_SEED, ADMIN_MAIDS_SEED, ADMIN_BOOKINGS_SEED } from '../services/mockData';
import { supabase } from '../config/supabase';

interface AdminContextType {
  isAdminLoggedIn: boolean;
  services: Service[];
  maids: MaidProfile[];
  bookings: Booking[];
  currentTab: string;
  selectedMaidForReview: MaidProfile | null;
  selectedBookingForAssignment: Booking | null;
  loginAdmin: () => void;
  logoutAdmin: () => void;
  setCurrentTab: (tab: string) => void;
  setSelectedMaidForReview: (maid: MaidProfile | null) => void;
  setSelectedBookingForAssignment: (booking: Booking | null) => void;
  toggleServiceActive: (serviceId: string) => void;
  addService: (newService: Omit<Service, 'serviceId'>) => void;
  updateService: (serviceId: string, updated: Partial<Service>) => void;
  deleteService: (serviceId: string) => void;
  approveMaid: (uid: string) => Promise<void>;
  rejectMaid: (uid: string, reason: string) => Promise<void>;
  assignMaidToBooking: (bookingId: string, maidId: string) => void;
  autoAssignMaid: (bookingId: string) => void;
  cancelBooking: (bookingId: string) => void;
  getDashboardMetrics: () => DashboardMetrics;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [services, setServices] = useState<Service[]>(ADMIN_SERVICES_SEED);
  const [maids, setMaids] = useState<MaidProfile[]>(ADMIN_MAIDS_SEED);
  const [bookings, setBookings] = useState<Booking[]>(ADMIN_BOOKINGS_SEED);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedMaidForReview, setSelectedMaidForReview] = useState<MaidProfile | null>(null);
  const [selectedBookingForAssignment, setSelectedBookingForAssignment] = useState<Booking | null>(null);

  // Fetch & Subscribe to Supabase `maids` table
  useEffect(() => {
    const fetchSupabaseMaids = async () => {
      try {
        const { data, error } = await supabase.from('maids').select('*');
        if (!error && data && data.length > 0) {
          const fetchedProfiles: MaidProfile[] = data.map((row: any) => ({
            uid: row.id || 'maid_' + Math.random(),
            fullName: row.full_name || row.name || 'Maid Partner',
            phone: row.phone || '+91 98000 00000',
            email: row.email || '',
            photoUrl:
              row.photo_url ||
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
            idProofUrl:
              row.id_proof_url ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
            emergencyContact: row.emergency_contact || 'Family (+91 98765 43210)',
            address: row.address || `${row.hub_zone || 'Kondapur'}, ${row.city || 'Hyderabad'}`,
            bankDetails: {
              accountName: row.bank_account_holder || row.full_name || 'Partner Account',
              accountNumber: row.bank_account || '**** **** 4892',
              ifscCode: row.bank_ifsc || 'HDFC0001234',
              bankName: row.bank_name || 'HDFC Bank',
            },
            serviceArea: row.hub_zone || row.city || 'Kondapur Zone, Hyderabad',
            serviceRadiusKm: row.service_radius_km || 5,
            healthSafetyDecl: true,
            status: row.status || 'pending',
            rejectionReason: row.rejection_reason,
            isOnline: row.is_online ?? true,
            rating: row.rating || 5.0,
            totalRatingsCount: 1,
            completedJobsCount: row.jobs_completed || 0,
            workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            appliedAt: row.created_at
              ? new Date(row.created_at).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
          }));

          // Merge fetched Supabase profiles with seeds (avoid duplicates by uid)
          setMaids(prev => {
            const seedList = prev.filter(p => !fetchedProfiles.some(f => f.uid === p.uid));
            return [...fetchedProfiles, ...seedList];
          });
        }
      } catch (err) {
        console.error('Error fetching Supabase maids:', err);
      }
    };

    fetchSupabaseMaids();

    // Real-time subscription to Supabase `maids` table updates
    const channel = supabase
      .channel('maids_realtime_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maids' },
        () => {
          fetchSupabaseMaids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loginAdmin = () => setIsAdminLoggedIn(true);
  const logoutAdmin = () => setIsAdminLoggedIn(false);

  const toggleServiceActive = (serviceId: string) => {
    setServices(prev =>
      prev.map(s => (s.serviceId === serviceId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const addService = (newService: Omit<Service, 'serviceId'>) => {
    const created: Service = {
      ...newService,
      serviceId: 'srv_' + Date.now(),
    };
    setServices(prev => [...prev, created]);
  };

  const updateService = (serviceId: string, updated: Partial<Service>) => {
    setServices(prev =>
      prev.map(s => (s.serviceId === serviceId ? { ...s, ...updated } : s))
    );
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const approveMaid = async (uid: string) => {
    setMaids(prev =>
      prev.map(m =>
        m.uid === uid
          ? { ...m, status: 'approved', approvedAt: new Date().toISOString().split('T')[0] }
          : m
      )
    );
    setSelectedMaidForReview(null);

    try {
      await supabase
        .from('maids')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', uid);
    } catch (err) {
      console.error('Failed to update Supabase maid status to approved:', err);
    }
  };

  const rejectMaid = async (uid: string, reason: string) => {
    setMaids(prev =>
      prev.map(m =>
        m.uid === uid
          ? { ...m, status: 'rejected', rejectionReason: reason }
          : m
      )
    );
    setSelectedMaidForReview(null);

    try {
      await supabase
        .from('maids')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', uid);
    } catch (err) {
      console.error('Failed to update Supabase maid status to rejected:', err);
    }
  };

  const assignMaidToBooking = (bookingId: string, maidId: string) => {
    const targetMaid = maids.find(m => m.uid === maidId);
    if (!targetMaid) return;

    setBookings(prev =>
      prev.map(b =>
        b.bookingId === bookingId
          ? {
              ...b,
              status: 'maid_assigned',
              assignedMaidId: targetMaid.uid,
              assignedMaidName: targetMaid.fullName,
              assignedMaidPhone: targetMaid.phone,
            }
          : b
      )
    );
    setSelectedBookingForAssignment(null);
  };

  const autoAssignMaid = (bookingId: string) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    const availableMaid = maids.find(m => m.status === 'approved' && m.isOnline);
    if (availableMaid) {
      assignMaidToBooking(bookingId, availableMaid.uid);
      alert(`Auto-assigned nearest active maid: ${availableMaid.fullName} (${availableMaid.serviceArea})`);
    } else {
      alert('No active online maids available right now in this radius.');
    }
  };

  const cancelBooking = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => (b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b))
    );
  };

  const getDashboardMetrics = (): DashboardMetrics => {
    const totalBookingsToday = bookings.length;
    const activeMaidsCount = maids.filter(m => m.status === 'approved' && m.isOnline).length;
    const pendingMaidApprovalsCount = maids.filter(m => m.status === 'pending').length;
    const totalRevenueToday = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingAssignmentsCount = bookings.filter(b => b.status === 'pending_assignment').length;

    return {
      totalBookingsToday,
      activeMaidsCount,
      pendingMaidApprovalsCount,
      totalRevenueToday,
      totalRevenueMonth: totalRevenueToday * 14,
      pendingAssignmentsCount,
    };
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminLoggedIn,
        services,
        maids,
        bookings,
        currentTab,
        selectedMaidForReview,
        selectedBookingForAssignment,
        loginAdmin,
        logoutAdmin,
        setCurrentTab,
        setSelectedMaidForReview,
        setSelectedBookingForAssignment,
        toggleServiceActive,
        addService,
        updateService,
        deleteService,
        approveMaid,
        rejectMaid,
        assignMaidToBooking,
        autoAssignMaid,
        cancelBooking,
        getDashboardMetrics,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
