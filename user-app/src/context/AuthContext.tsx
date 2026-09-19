import React, { createContext, useContext, useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { User, MaidProfile, Service, Booking, MaidApplicationStatus, Address } from '../types';
import { SERVICES_SEED, INITIAL_BOOKINGS, INITIAL_MAID_PROFILE } from '../services/mockData';
import { supabase } from '../config/supabase';

interface HistoryItem {
  screen: string;
  selectedService: Service | null;
  selectedBooking: Booking | null;
}

interface AuthContextType {
  user: User | null;
  maidProfile: MaidProfile | null;
  services: Service[];
  bookings: Booking[];
  savedAddresses: Address[];
  currentScreen: string;
  selectedService: Service | null;
  selectedBooking: Booking | null;
  isLoggedIn: boolean;
  canGoBack: boolean;
  goBack: () => boolean;
  loginWithPhone: (phone: string, name?: string) => void;
  loginAsDemoCustomer: () => void;
  loginAsDemoMaid: () => void;
  logout: () => void;
  navigateTo: (screen: string, payload?: any) => void;
  updateUserProfile: (updates: Partial<User>) => void;
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
    createdAt: '2026-09-01',
  });

  const [maidProfile, setMaidProfile] = useState<MaidProfile | null>(null);
  const [services] = useState<Service[]>(SERVICES_SEED);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: 'addr_1',
      label: 'Home',
      street: 'Flat 402, Green Glen Layout',
      locality: 'Kondapur',
      city: 'Hyderabad',
      pincode: '500084',
    },
    {
      id: 'addr_2',
      label: 'Office',
      street: 'Plot 18, Cyber Towers',
      locality: 'Hitec City',
      city: 'Hyderabad',
      pincode: '500081',
    },
  ]);
  const [currentScreen, setCurrentScreen] = useState<string>('customer_home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const updateUserProfile = (updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  useEffect(() => {
    // Initial Route based on role
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

  // Real-time synchronization with Supabase `maids` table for maid application status updates
  useEffect(() => {
    if (!user?.uid) return;

    const checkAndSubscribeMaidStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('maids')
          .select('*')
          .eq('id', user.uid)
          .maybeSingle();

        if (!error && data) {
          if (data.status === 'approved') {
            setUser(prev => (prev ? { ...prev, role: 'maid', maidApplicationStatus: 'approved' } : null));
            setMaidProfile(prev =>
              prev
                ? { ...prev, status: 'approved' }
                : {
                    ...INITIAL_MAID_PROFILE,
                    uid: user.uid,
                    fullName: data.full_name || user.name,
                    phone: user.phone,
                    status: 'approved',
                  }
            );
          } else if (data.status === 'rejected') {
            setUser(prev => (prev ? { ...prev, maidApplicationStatus: 'rejected' } : null));
            setMaidProfile(prev =>
              prev
                ? { ...prev, status: 'rejected', rejectionReason: data.rejection_reason }
                : null
            );
          }
        }
      } catch (err) {
        console.log('Supabase sync skipped:', err);
      }
    };

    checkAndSubscribeMaidStatus();

    // Subscribe to Postgres changes on `maids` table for user's UID
    const channel = supabase
      .channel(`maid_user_${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maids',
          filter: `id=eq.${user.uid}`,
        },
        payload => {
          const updatedStatus = payload.new?.status;
          if (updatedStatus === 'approved') {
            setUser(prev => (prev ? { ...prev, role: 'maid', maidApplicationStatus: 'approved' } : null));
            setMaidProfile(prev => (prev ? { ...prev, status: 'approved' } : null));
            setCurrentScreen('maid_home');
          } else if (updatedStatus === 'rejected') {
            setUser(prev => (prev ? { ...prev, maidApplicationStatus: 'rejected' } : null));
            setMaidProfile(prev =>
              prev ? { ...prev, status: 'rejected', rejectionReason: payload.new?.rejection_reason } : null
            );
            setCurrentScreen('maid_status');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  const loginWithPhone = (phone: string, name: string = 'User') => {
    const newUser: User = {
      uid: 'user_' + Date.now(),
      name: name,
      phone: phone,
      role: 'customer',
      maidApplicationStatus: 'none',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    setMaidProfile(null);
    setCurrentScreen('customer_home');
  };

  const loginAsDemoCustomer = () => {
    const customerUser: User = {
      uid: 'cust_curr',
      name: 'Rahul Verma',
      phone: '+91 98111 22233',
      email: 'rahul.v@example.com',
      role: 'customer',
      maidApplicationStatus: 'none',
      createdAt: '2026-09-01',
    };
    setUser(customerUser);
    setMaidProfile(null);
    setCurrentScreen('customer_home');
  };

  const loginAsDemoMaid = () => {
    const maidUser: User = {
      uid: 'maid_curr',
      name: 'Sunita Devi',
      phone: '+91 98492 01824',
      email: 'sunita.d@gchomeplus.com',
      role: 'maid',
      maidApplicationStatus: 'approved',
      createdAt: '2026-08-15',
    };
    const approvedProfile: MaidProfile = {
      ...INITIAL_MAID_PROFILE,
      uid: 'maid_curr',
      fullName: 'Sunita Devi',
      phone: '+91 98492 01824',
      status: 'approved',
      isOnline: true,
      rating: 4.8,
      completedJobsCount: 42,
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    };
    setUser(maidUser);
    setMaidProfile(approvedProfile);
    setCurrentScreen('maid_home');
  };

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const logout = () => {
    setUser(null);
    setMaidProfile(null);
    setHistory([]);
    setCurrentScreen('login');
  };

  const navigateTo = (screen: string, payload?: any) => {
    if (screen === currentScreen) return;

    // Push current screen to history stack
    setHistory(prev => [
      ...prev,
      {
        screen: currentScreen,
        selectedService,
        selectedBooking,
      },
    ]);

    if (payload?.service) setSelectedService(payload.service);
    if (payload?.booking) setSelectedBooking(payload.booking);
    setCurrentScreen(screen);
  };

  const goBack = (): boolean => {
    if (history.length > 0) {
      const prevEntry = history[history.length - 1];
      setHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentScreen(prevEntry.screen);
      if (prevEntry.selectedService) setSelectedService(prevEntry.selectedService);
      if (prevEntry.selectedBooking) setSelectedBooking(prevEntry.selectedBooking);
      return true;
    }

    // If no history but on secondary screen, fallback to home
    const isMaid = user?.role === 'maid' && maidProfile?.status === 'approved';
    const homeScreen = isMaid ? 'maid_home' : 'customer_home';

    if (currentScreen !== homeScreen && currentScreen !== 'login') {
      setCurrentScreen(homeScreen);
      return true;
    }

    return false; // Root screen: allow default Android minimize/exit
  };

  // Global Android Hardware Back Button listener
  useEffect(() => {
    const onHardwareBack = () => {
      return goBack();
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack
    );

    return () => backHandler.remove();
  }, [history, currentScreen, user, maidProfile, selectedService, selectedBooking]);

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
      appliedAt: new Date().toISOString().split('T')[0],
    };

    setMaidProfile(newProfile);
    setUser(prev => (prev ? { ...prev, maidApplicationStatus: 'pending' } : null));
    setCurrentScreen('maid_status');
  };

  const simulateAdminApproval = async (approved: boolean, reason?: string) => {
    if (!user || !maidProfile) return;

    if (approved) {
      const updatedProfile: MaidProfile = {
        ...maidProfile,
        status: 'approved',
        approvedAt: new Date().toISOString().split('T')[0],
      };
      setMaidProfile(updatedProfile);
      setUser(prev => (prev ? { ...prev, role: 'maid', maidApplicationStatus: 'approved' } : null));
      setCurrentScreen('maid_home');

      try {
        await supabase.from('maids').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', user.uid);
      } catch (err) {
        console.log('Supabase sync err:', err);
      }
    } else {
      const updatedProfile: MaidProfile = {
        ...maidProfile,
        status: 'rejected',
        rejectionReason: reason || 'Document image was unreadable. Please re-upload clear government ID.',
      };
      setMaidProfile(updatedProfile);
      setUser(prev => (prev ? { ...prev, maidApplicationStatus: 'rejected' } : null));
      setCurrentScreen('maid_status');

      try {
        await supabase.from('maids').update({ status: 'rejected', rejection_reason: reason }).eq('id', user.uid);
      } catch (err) {
        console.log('Supabase sync err:', err);
      }
    }
  };

  const createBooking = (bookingData: Omit<Booking, 'bookingId' | 'status' | 'createdAt' | 'customerId'>): Booking => {
    const newBooking: Booking = {
      ...bookingData,
      bookingId: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      customerId: user?.uid || 'cust_anon',
      status: 'pending_assignment',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      startOtp: String(Math.floor(1000 + Math.random() * 9000)),
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
      assignedMaidPhoto: maidProfile?.photoUrl,
    });
  };

  const rejectJob = (bookingId: string) => {
    updateBookingStatus(bookingId, 'pending_assignment', {
      assignedMaidId: undefined,
      assignedMaidName: undefined,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        maidProfile,
        services,
        bookings,
        savedAddresses,
        currentScreen,
        selectedService,
        selectedBooking,
        isLoggedIn: !!user,
        loginWithPhone,
        loginAsDemoCustomer,
        loginAsDemoMaid,
        logout,
        navigateTo,
        goBack,
        canGoBack: history.length > 0,
        updateUserProfile,
        submitMaidApplication,
        createBooking,
        updateBookingStatus,
        toggleMaidOnline,
        acceptJob,
        rejectJob,
        simulateAdminApproval,
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
