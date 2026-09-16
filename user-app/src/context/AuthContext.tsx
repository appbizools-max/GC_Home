import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MaidProfile, Service, Booking, MaidApplicationStatus } from '../types';
import { SERVICES_SEED, INITIAL_BOOKINGS, INITIAL_MAID_PROFILE } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  maidProfile: MaidProfile | null;
  services: Service[];
  bookings: Booking[];
  currentScreen: string;
  selectedService: Service | null;
  selectedBooking: Booking | null;
  isLoggedIn: boolean;
  loginWithPhone: (phone: string, name?: string) => void;
  logout: () => void;
  navigateTo: (screen: string, payload?: any) => void;
  submitMaidApplication: (applicationData: Partial<MaidProfile>) => void;
  createBooking: (bookingData: Omit<Booking, 'bookingId' | 'status' | 'createdAt' | 'customerId'>) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => void;
  toggleMaidOnline: () => void;
  acceptJob: (bookingId: string) => void;
  rejectJob: (bookingId: string) => void;
  simulateAdminApproval: (approved: boolean, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    uid: 'cust_curr',
    name: 'Rahul Verma',
    phone: '+91 98111 22233',
    email: 'rahul.v@example.com',
    role: 'customer',
    maidApplicationStatus: 'none',
    createdAt: '2026-09-01'
  });

  const [maidProfile, setMaidProfile] = useState<MaidProfile | null>(null);
  const [services] = useState<Service[]>(SERVICES_SEED);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [currentScreen, setCurrentScreen] = useState<string>('customer_home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Route based on role
    if (!user) {
      setCurrentScreen('login');
      return;
    }

    if (user.role === 'maid' && maidProfile?.status === 'approved') {
      setCurrentScreen('maid_home');
    } else if (user.maidApplicationStatus === 'pending' || user.maidApplicationStatus === 'rejected') {
      setCurrentScreen('maid_status');
    } else {
      setCurrentScreen('customer_home');
    }
  }, []);

  const loginWithPhone = (phone: string, name: string = 'User') => {
    const newUser: User = {
      uid: 'user_' + Date.now(),
      name: name,
      phone: phone,
      role: 'customer',
      maidApplicationStatus: 'none',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUser(newUser);
    setMaidProfile(null);
    setCurrentScreen('customer_home');
  };

  const logout = () => {
    setUser(null);
    setMaidProfile(null);
    setCurrentScreen('login');
  };

  const navigateTo = (screen: string, payload?: any) => {
    if (payload?.service) setSelectedService(payload.service);
    if (payload?.booking) setSelectedBooking(payload.booking);
    setCurrentScreen(screen);
  };

  const submitMaidApplication = (data: Partial<MaidProfile>) => {
    if (!user) return;

    const newProfile: MaidProfile = {
      ...INITIAL_MAID_PROFILE,
      uid: user.uid,
      fullName: data.fullName || user.name,
      phone: user.phone,
      email: data.email || user.email,
      address: data.address || '',
      serviceArea: data.serviceArea || 'Bellandur / HSR Layout',
      serviceRadiusKm: data.serviceRadiusKm || 5,
      emergencyContact: data.emergencyContact || '',
      healthSafetyDecl: data.healthSafetyDecl || true,
      bankDetails: data.bankDetails || INITIAL_MAID_PROFILE.bankDetails,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0]
    };

    setMaidProfile(newProfile);
    setUser(prev => prev ? { ...prev, maidApplicationStatus: 'pending' } : null);
    setCurrentScreen('maid_status');
  };

  const simulateAdminApproval = (approved: boolean, reason?: string) => {
    if (!user || !maidProfile) return;

    if (approved) {
      const updatedProfile: MaidProfile = {
        ...maidProfile,
        status: 'approved',
        approvedAt: new Date().toISOString().split('T')[0]
      };
      setMaidProfile(updatedProfile);
      setUser(prev => prev ? { ...prev, role: 'maid', maidApplicationStatus: 'approved' } : null);
      setCurrentScreen('maid_home');
    } else {
      const updatedProfile: MaidProfile = {
        ...maidProfile,
        status: 'rejected',
        rejectionReason: reason || 'Document image was unreadable. Please re-upload clear government ID.'
      };
      setMaidProfile(updatedProfile);
      setUser(prev => prev ? { ...prev, maidApplicationStatus: 'rejected' } : null);
      setCurrentScreen('maid_status');
    }
  };

  const createBooking = (bookingData: Omit<Booking, 'bookingId' | 'status' | 'createdAt' | 'customerId'>): Booking => {
    const newBooking: Booking = {
      ...bookingData,
      bookingId: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      customerId: user?.uid || 'cust_anon',
      status: 'pending_assignment',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      startOtp: String(Math.floor(1000 + Math.random() * 9000))
    };

    setBookings(prev => [newBooking, ...prev]);
    setSelectedBooking(newBooking);
    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => {
    setBookings(prev =>
      prev.map(b => (b.bookingId === bookingId ? { ...b, status, ...extra } : b))
    );
    if (selectedBooking?.bookingId === bookingId) {
      setSelectedBooking(prev => (prev ? { ...prev, status, ...extra } : null));
    }
  };

  const toggleMaidOnline = () => {
    if (maidProfile) {
      setMaidProfile({ ...maidProfile, isOnline: !maidProfile.isOnline });
    }
  };

  const acceptJob = (bookingId: string) => {
    updateBookingStatus(bookingId, 'maid_accepted', {
      assignedMaidId: maidProfile?.uid || 'maid_curr',
      assignedMaidName: maidProfile?.fullName || 'Sunita Sharma',
      assignedMaidPhone: maidProfile?.phone || '+91 98765 43210',
      assignedMaidPhoto: maidProfile?.photoUrl
    });
  };

  const rejectJob = (bookingId: string) => {
    updateBookingStatus(bookingId, 'pending_assignment', {
      assignedMaidId: undefined,
      assignedMaidName: undefined
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        maidProfile,
        services,
        bookings,
        currentScreen,
        selectedService,
        selectedBooking,
        isLoggedIn: !!user,
        loginWithPhone,
        logout,
        navigateTo,
        submitMaidApplication,
        createBooking,
        updateBookingStatus,
        toggleMaidOnline,
        acceptJob,
        rejectJob,
        simulateAdminApproval
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
