import React, { createContext, useContext, useState } from 'react';
import { Service, MaidProfile, Booking, DashboardMetrics } from '../types';
import { ADMIN_SERVICES_SEED, ADMIN_MAIDS_SEED, ADMIN_BOOKINGS_SEED } from '../services/mockData';

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
  approveMaid: (uid: string) => void;
  rejectMaid: (uid: string, reason: string) => void;
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
      serviceId: 'srv_' + Date.now()
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

  const approveMaid = (uid: string) => {
    setMaids(prev =>
      prev.map(m =>
        m.uid === uid
          ? { ...m, status: 'approved', approvedAt: new Date().toISOString().split('T')[0] }
          : m
      )
    );
    setSelectedMaidForReview(null);
  };

  const rejectMaid = (uid: string, reason: string) => {
    setMaids(prev =>
      prev.map(m =>
        m.uid === uid
          ? { ...m, status: 'rejected', rejectionReason: reason }
          : m
      )
    );
    setSelectedMaidForReview(null);
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
              assignedMaidPhone: targetMaid.phone
            }
          : b
      )
    );
    setSelectedBookingForAssignment(null);
  };

  const autoAssignMaid = (bookingId: string) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    // Find first available approved maid
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
      pendingAssignmentsCount
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
        getDashboardMetrics
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
