import React, { createContext, useContext, useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { User, MaidProfile, Service, Booking, MaidApplicationStatus, Address } from '../types';
import { SERVICES_SEED, INITIAL_BOOKINGS, INITIAL_MAID_PROFILE } from '../services/mockData';
import { authService, ProfileInputData } from '../services/authService';
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
  pendingPhoneNumber: string;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  canGoBack: boolean;
  goBack: () => boolean;
  checkExistingSession: () => Promise<void>;
  sendLoginOtp: (phoneNumber: string) => Promise<boolean>;
  verifyLoginOtp: (otpCode: string) => Promise<boolean>;
  resendLoginOtp: () => Promise<boolean>;
  completeProfileSetup: (profileData: ProfileInputData) => Promise<boolean>;
  loginWithPhone: (phone: string, name?: string) => void;
  loginAsDemoCustomer: () => void;
  logout: () => void;
  clearAuthError: () => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string>('+91 9849201824');
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [maidProfile, setMaidProfile] = useState<MaidProfile | null>(null);
  const [services, setServices] = useState<Service[]>(SERVICES_SEED);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: 'addr_1',
      label: 'Home',
      street: '123, 4th Cross, HSR Layout',
      locality: 'HSR Layout',
      city: 'Bengaluru, Karnataka',
      pincode: '560102',
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

  // Initial Screen starts on splash screen
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const clearAuthError = () => setAuthError(null);

  /**
   * Check for existing authenticated user session during splash launch
   */
  const checkExistingSession = async () => {
    try {
      const session = await authService.getCurrentUser();
      if (session.user && session.onboardingCompleted) {
        setUser(session.user);
        setCurrentScreen('customer_home');
      } else {
        setUser(null);
        setCurrentScreen('login');
      }
    } catch {
      setCurrentScreen('login');
    }
  };

  /**
   * Send 6-digit OTP to mobile number
   */
  const sendLoginOtp = async (phoneNumber: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await authService.sendOtp(phoneNumber);
      setPendingPhoneNumber(phoneNumber);
      setIsAuthLoading(false);
      navigateTo('otp_verification');
      return true;
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError(err?.message || 'Failed to send OTP. Please check your number.');
      return false;
    }
  };

  /**
   * Verify 6-digit OTP code
   */
  const verifyLoginOtp = async (otpCode: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authService.verifyOtp(pendingPhoneNumber, otpCode);
      setIsAuthLoading(false);

      if (res.isNewUser) {
        setUser(res.user);
        navigateTo('profile_setup');
      } else {
        setUser(res.user);
        // Clear history stack to prevent back-nav to auth
        setHistory([]);
        setCurrentScreen('customer_home');
      }
      return true;
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError(err?.message || 'Incorrect OTP. Please check the code and try again.');
      return false;
    }
  };

  /**
   * Resend OTP code
   */
  const resendLoginOtp = async (): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await authService.sendOtp(pendingPhoneNumber);
      setIsAuthLoading(false);
      return true;
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError(err?.message || 'Failed to resend OTP.');
      return false;
    }
  };

  /**
   * Save and complete user profile setup
   */
  const completeProfileSetup = async (profileData: ProfileInputData): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authService.createProfile(profileData, pendingPhoneNumber);
      setUser(res.user);
      if (res.address) {
        setSavedAddresses(prev => [res.address, ...prev]);
      }
      setIsAuthLoading(false);
      // Clear history stack to finalize onboarding
      setHistory([]);
      setCurrentScreen('customer_home');
      return true;
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError(err?.message || "We couldn't save your profile. Please try again.");
      return false;
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

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
    setHistory([]);
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
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-09-01',
    };
    setUser(customerUser);
    setMaidProfile(null);
    setHistory([]);
    setCurrentScreen('customer_home');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setMaidProfile(null);
    setHistory([]);
    setCurrentScreen('login');
  };

  const navigateTo = (screen: string, payload?: any) => {
    if (screen === currentScreen) return;

    // Push current screen to history stack (except transient screens like splash)
    if (currentScreen !== 'splash') {
      setHistory(prev => [
        ...prev,
        {
          screen: currentScreen,
          selectedService,
          selectedBooking,
        },
      ]);
    }

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

    // Onboarding back behavior
    if (currentScreen === 'otp_verification') {
      setCurrentScreen('login');
      return true;
    }
    if (currentScreen === 'profile_setup') {
      setCurrentScreen('otp_verification');
      return true;
    }

    if (currentScreen !== 'customer_home' && currentScreen !== 'login' && currentScreen !== 'splash') {
      setCurrentScreen('customer_home');
      return true;
    }

    return false;
  };

  // Hardware Back Button listener
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

  // Load services and bookings from Supabase DB with Realtime sync
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mappedServices: Service[] = data.map((row: any) => ({
            serviceId: row.id,
            name: row.name,
            category: row.category,
            description: row.description || '',
            startingPrice: Number(row.starting_price || 0),
            pricePerRoom: row.price_per_room ? Number(row.price_per_room) : undefined,
            estimatedDuration: row.estimated_duration || '',
            imageUrl: row.image_url || '',
            isActive: Boolean(row.is_active),
            features: Array.isArray(row.features) ? row.features : [],
          }));
          setServices(mappedServices);
        }
      } catch (err) {
        console.log('Error loading services from Supabase:', err);
      }
    };

    const fetchSupabaseBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mappedBookings: Booking[] = data.map((row: any) => ({
            bookingId: row.booking_code || row.id,
            customerId: row.customer_id || 'cust_curr',
            customerName: row.customer_name || 'Customer',
            customerPhone: row.customer_phone || '+91 98000 00000',
            serviceId: row.service_id || 'srv_1',
            serviceName: row.service_name || 'Cleaning Service',
            servicePrice: Number(row.service_price || row.total_amount || 799),
            totalAmount: Number(row.total_amount || row.service_price || 799),
            address: {
              id: 'addr_' + (row.booking_code || row.id),
              label: row.address_label || 'Home',
              street: row.address_street || '',
              locality: row.address_locality || '',
              city: row.address_city || 'Bengaluru',
              pincode: row.address_pincode || '560102',
            },
            date: row.scheduled_date || new Date().toISOString().split('T')[0],
            timeSlot: row.time_slot || '10:00 AM',
            specialInstructions: row.special_instructions,
            status: (row.status as any) || 'pending_assignment',
            assignedMaidId: row.assigned_maid_id,
            assignedMaidName: row.assigned_maid_name,
            assignedMaidPhone: row.assigned_maid_phone,
            assignedMaidPhoto: row.assigned_maid_photo_url,
            paymentMethod: (row.payment_method as any) || 'upi',
            paymentStatus: (row.payment_status as any) || 'paid',
            startOtp: row.start_otp || '1234',
            createdAt: row.created_at ? row.created_at.substring(0, 16).replace('T', ' ') : new Date().toISOString(),
          }));
          setBookings(mappedBookings);
        }
      } catch (err) {
        console.log('Error loading bookings from Supabase:', err);
      }
    };

    fetchServices();
    fetchSupabaseBookings();

    const channel = supabase
      .channel('user_app_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchSupabaseBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submitMaidApplication = async (data: Partial<MaidProfile>) => {
    if (!user) return;
    const newProfile: MaidProfile = {
      ...INITIAL_MAID_PROFILE,
      uid: user.uid,
      fullName: data.fullName || user.name,
      phone: user.phone,
      email: data.email || user.email,
      address: data.address || '',
      serviceArea: data.serviceArea || 'HSR Layout / Bellandur',
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
      setMaidProfile({ ...maidProfile, status: 'approved' });
      setUser(prev => (prev ? { ...prev, role: 'maid', maidApplicationStatus: 'approved' } : null));
      setCurrentScreen('maid_home');
    } else {
      setMaidProfile({ ...maidProfile, status: 'rejected', rejectionReason: reason });
      setUser(prev => (prev ? { ...prev, maidApplicationStatus: 'rejected' } : null));
      setCurrentScreen('maid_status');
    }
  };

  const createBooking = (bookingData: Omit<Booking, 'bookingId' | 'status' | 'createdAt' | 'customerId'>): Booking => {
    const generatedCode = 'GC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    const newBooking: Booking = {
      ...bookingData,
      bookingId: generatedCode,
      customerId: user?.uid || 'cust_anon',
      status: 'pending_assignment',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      startOtp: String(Math.floor(1000 + Math.random() * 9000)),
    };

    setBookings(prev => [newBooking, ...prev]);
    setSelectedBooking(newBooking);

    const scheduledDate = newBooking.date && /^\d{4}-\d{2}-\d{2}$/.test(newBooking.date)
      ? newBooking.date
      : new Date().toISOString().split('T')[0];

    supabase.from('bookings').insert([
      {
        booking_code: generatedCode,
        customer_id: user?.uid && /^[0-9a-f-]{36}$/.test(user.uid) ? user.uid : null,
        customer_name: newBooking.customerName || user?.name || 'Customer',
        customer_phone: newBooking.customerPhone || user?.phone || '+91 98000 00000',
        service_id: newBooking.serviceId && /^[0-9a-f-]{36}$/.test(newBooking.serviceId) ? newBooking.serviceId : null,
        service_name: newBooking.serviceName,
        service_price: newBooking.servicePrice,
        total_amount: newBooking.totalAmount || newBooking.servicePrice,
        address_label: newBooking.address?.label || 'Home',
        address_street: newBooking.address?.street || '',
        address_locality: newBooking.address?.locality || '',
        address_city: newBooking.address?.city || 'Bengaluru',
        address_pincode: newBooking.address?.pincode || '',
        scheduled_date: scheduledDate,
        time_slot: newBooking.timeSlot,
        status: 'pending_assignment',
        payment_method: 'online',
        payment_status: 'paid',
        start_otp: newBooking.startOtp,
      },
    ]).then(({ error }) => {
      if (error) console.log('Supabase booking insert notice:', error.message);
    });

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
      const nextOnlineState = !maidProfile.isOnline;
      setMaidProfile({ ...maidProfile, isOnline: nextOnlineState });

      // Update Supabase database
      if (maidProfile.uid) {
        supabase
          .from('maid_profiles')
          .update({ is_online: nextOnlineState })
          .eq('id', maidProfile.uid)
          .then(({ error }) => {
            if (error) console.log('Notice updating is_online in Supabase:', error.message);
          });
      }

      // Dynamic navigation & role switching:
      if (nextOnlineState) {
        // Going ONLINE -> Switch to Maid Partner Console
        setUser(prev => prev ? { ...prev, role: 'maid' } : null);
        setHistory([]);
        setCurrentScreen('maid_home');
      } else {
        // Going OFFLINE -> Switch to Customer App UI
        setUser(prev => prev ? { ...prev, role: 'customer' } : null);
        setHistory([]);
        setCurrentScreen('customer_home');
      }
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
        pendingPhoneNumber,
        isLoggedIn: !!user,
        isAuthLoading,
        authError,
        canGoBack: history.length > 0,
        goBack,
        checkExistingSession,
        sendLoginOtp,
        verifyLoginOtp,
        resendLoginOtp,
        completeProfileSetup,
        loginWithPhone,
        loginAsDemoCustomer,
        logout,
        clearAuthError,
        navigateTo,
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
