import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { User, MaidProfile, Service, Booking, MaidApplicationStatus, Address } from '../types';
import { SERVICES_SEED } from '../services/mockData';
import { authService, ProfileInputData } from '../services/authService';
import { supabase } from '../config/supabase';
import { slotConfirmationService } from '../services/slotConfirmationService';

interface HistoryItem {
  screen: string;
  selectedService: Service | null;
  selectedBooking: Booking | null;
  navigationPayload?: any;
}

export interface RegistrationDraft {
  name: string;
  phone: string;
  email?: string;
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
  navigationPayload: any;
  pendingPhoneNumber: string;
  registrationDraft: RegistrationDraft | null;
  setRegistrationDraft: (draft: RegistrationDraft | null) => void;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  canGoBack: boolean;
  goBack: () => boolean;
  checkExistingSession: () => Promise<void>;
  sendLoginOtp: (phoneNumber: string) => Promise<boolean>;
  verifyLoginOtp: (otpCode: string) => Promise<{ success: boolean; message?: string }>;
  startRegistration: (draft: RegistrationDraft) => Promise<{ success: boolean; message?: string }>;
  startCustomerRegistrationFlow: (initialPhone?: string) => void;
  verifyRegistrationOtp: (otpCode: string) => Promise<{ success: boolean; message?: string }>;
  resendLoginOtp: () => Promise<boolean>;
  completeProfileSetup: (profileData: ProfileInputData) => Promise<boolean>;
  loginWithPhone: (phone: string, name?: string) => void;
  loginAsDemoCustomer: () => void;
  logout: () => void;
  clearAuthError: () => void;
  navigateTo: (screen: string, payload?: any) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  addSavedAddress: (addressData: Omit<Address, 'id'>) => Promise<boolean>;
  updateSavedAddress: (addressId: string, updates: Partial<Address>) => Promise<boolean>;
  deleteSavedAddress: (addressId: string) => Promise<boolean>;
  setDefaultSavedAddress: (addressId: string) => Promise<boolean>;
  isMaidPartner: boolean;
  switchUserMode: (mode: 'customer' | 'maid') => void;
  submitMaidApplication: (applicationData: Partial<MaidProfile>) => void;
  createBooking: (bookingData: Omit<Booking, 'bookingId' | 'status' | 'createdAt' | 'customerId'>) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => void;
  toggleMaidOnline: () => void;
  acceptJob: (bookingId: string) => void;
  rejectJob: (bookingId: string) => void;
  simulateAdminApproval: (approved: boolean, reason?: string) => void;
  updatePartnerProfile: (updates: Partial<MaidProfile>) => Promise<boolean>;
  confirmCustomerSlot: (bookingId: string) => Promise<void>;
  confirmMaidSlot: (bookingId: string) => Promise<void>;
  fetchMaidProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string>('');
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [maidProfile, setMaidProfile] = useState<MaidProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Initial Screen starts on splash screen
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [navigationPayload, setNavigationPayload] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const clearAuthError = () => setAuthError(null);

  /**
   * Check for existing authenticated user session during splash launch
   * Checks Supabase as source of truth for latest role and approval status
   */
  const checkExistingSession = async () => {
    try {
      const session = await authService.getCurrentUser();
      if (!session.user || !session.onboardingCompleted) {
        setUser(null);
        setCurrentScreen('login');
        return;
      }

      let activeUser: User = session.user;
      let authoritativeRole = activeUser.role || 'customer';
      let maidStatus = activeUser.maidApplicationStatus || 'none';

      // Verify authoritative profile from Supabase
      let dbUser: any = null;
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .or(`id.eq.${activeUser.uid},phone.eq.${activeUser.phone}`)
          .maybeSingle();
        dbUser = data;
      } catch (e) {
        console.warn('Supabase user profile verification notice:', e);
      }

      let dbMaid: any = null;
      try {
        const { data } = await supabase
          .from('maid_profiles')
          .select('*')
          .or(`id.eq.${activeUser.uid},user_id.eq.${activeUser.uid},phone.eq.${activeUser.phone}`)
          .maybeSingle();
        dbMaid = data;
      } catch (e) {
        console.warn('Supabase maid profile check notice:', e);
      }

      // If user profile has been deleted from Supabase (e.g. database wipe/purge), purge stale local storage
      if (!dbUser && !dbMaid) {
        await authService.logout();
        setUser(null);
        setMaidProfile(null);
        setCurrentScreen('login');
        return;
      }

      if (dbUser) {
        authoritativeRole = (dbUser.role as any) || authoritativeRole;
        maidStatus = dbUser.maid_application_status || 'none';
        activeUser = {
          ...activeUser,
          name: dbUser.name || dbUser.full_name || activeUser.name,
          phone: dbUser.phone || activeUser.phone,
          email: dbUser.email || activeUser.email,
          role: authoritativeRole,
          maidApplicationStatus: maidStatus as any,
        };
      } else if (dbMaid) {
        authoritativeRole = 'maid';
        maidStatus = dbMaid.status || 'pending';
        activeUser = {
          ...activeUser,
          name: dbMaid.full_name || activeUser.name,
          phone: dbMaid.phone || activeUser.phone,
          email: dbMaid.email || activeUser.email,
          role: 'maid',
          maidApplicationStatus: maidStatus as any,
        };
      }

      const finalUser: User = {
        ...activeUser,
        role: authoritativeRole,
        maidApplicationStatus: maidStatus as any,
      };

      setUser(finalUser);

      // Route strictly:
      // Customer ALWAYS routes to customer_home
      // Partner routes to maid_home (if approved) or maid_status (if pending)
      if (authoritativeRole === 'maid' || authoritativeRole === 'partner') {
        if (maidStatus === 'approved') {
          setCurrentScreen('maid_home');
        } else {
          setCurrentScreen('maid_status');
        }
      } else {
        setCurrentScreen('customer_home');
      }
    } catch {
      setUser(null);
      setCurrentScreen('login');
    }
  };

  /**
   * Send 6-digit OTP to mobile number after verifying user exists in Supabase
   */
  const sendLoginOtp = async (phoneNumber: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const exists = await authService.checkPhoneExists(phoneNumber);
      if (!exists) {
        setIsAuthLoading(false);
        setAuthError('Not an existing customer. Please create an account.');
        return false;
      }

      await authService.sendOtp(phoneNumber);
      setPendingPhoneNumber(phoneNumber);
      setIsAuthLoading(false);
      navigateTo('otp_verification', { isRegistration: false });
      return true;
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError(err?.message || 'Failed to send OTP. Please check your number.');
      return false;
    }
  };

  /**
   * Verify 6-digit OTP code for Login
   * Routes strictly:
   * - Approved Maid/Partner → Maid Home
   * - Customer + Approved Maid/Partner → Maid Home
   * - Customer → Customer Home
   */
  const verifyLoginOtp = async (otpCode: string): Promise<{ success: boolean; message?: string }> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const phoneToVerify = pendingPhoneNumber || registrationDraft?.phone || '+91 9849201824';
      const res = await authService.verifyOtp(phoneToVerify, otpCode);
      setIsAuthLoading(false);

      let activeUser: User = res.user;
      let authoritativeRole = activeUser.role || 'customer';
      let maidStatus = activeUser.maidApplicationStatus || 'none';

      // Query Supabase maid_profiles to check if this user is an approved partner
      const digitsOnly = phoneToVerify.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      const phoneFilter = `id.eq.${activeUser.uid},user_id.eq.${activeUser.uid},phone.eq.${phoneToVerify},phone.eq.+91 ${last10},phone.eq.+91${last10},phone.eq.${last10}`;

      let maidRow: any = null;
      if (authoritativeRole === 'maid' || authoritativeRole === 'partner') {
        try {
          const { data: maidRows } = await supabase
            .from('maid_profiles')
            .select('*')
            .or(phoneFilter)
            .limit(1);

          if (maidRows && maidRows.length > 0) {
            maidRow = maidRows[0];
            maidStatus = maidRow.status || 'pending';
          }
        } catch (e) {
          console.warn('Partner lookup notice:', e);
        }
      }

      const isApprovedMaid = (authoritativeRole === 'maid' || authoritativeRole === 'partner') && maidStatus === 'approved';

      const finalUser: User = {
        ...activeUser,
        role: authoritativeRole,
        maidApplicationStatus: maidStatus as any,
      };

      setUser(finalUser);
      setHistory([]);

      // Route strictly:
      // Customers ALWAYS go to customer_home
      // Approved Partners go to maid_home
      // Pending Partners go to maid_status
      if (authoritativeRole === 'maid' || authoritativeRole === 'partner') {
        if (isApprovedMaid) {
          setCurrentScreen('maid_home');
        } else {
          setCurrentScreen('maid_status');
        }
      } else {
        setCurrentScreen('customer_home');
      }

      return { success: true };
    } catch (err: any) {
      setIsAuthLoading(false);
      const msg = err?.message || 'Incorrect OTP. Please check the code and try again.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Start customer registration flow:
   * Checks whether phone already exists, stores draft data, sends OTP, and navigates to OTP verification
   */
  const startRegistration = async (draft: RegistrationDraft): Promise<{ success: boolean; message?: string }> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const exists = await authService.checkCustomerPhoneExists(draft.phone);
      if (exists) {
        setIsAuthLoading(false);
        const errMsg = 'This mobile number is already registered. Please sign in to continue.';
        setAuthError(errMsg);
        return {
          success: false,
          message: errMsg,
        };
      }

      setMaidProfile(null);
      setRegistrationDraft(draft);
      setPendingPhoneNumber(draft.phone);

      await authService.sendOtp(draft.phone);
      setIsAuthLoading(false);

      navigateTo('otp_verification', { isRegistration: true });
      return { success: true };
    } catch (err: any) {
      setIsAuthLoading(false);
      const msg = err?.message || 'Failed to send verification code. Please try again.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Verify OTP during customer registration and create the profile in Supabase
   */
  const verifyRegistrationOtp = async (otpCode: string): Promise<{ success: boolean; message?: string }> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const phoneToVerify = pendingPhoneNumber || registrationDraft?.phone || '+91 9849201824';

      // Verify OTP (accepts standard default 123456)
      await authService.verifyOtp(phoneToVerify, otpCode, true);

      const name = registrationDraft?.name?.trim() || 'Registered Customer';
      const email = registrationDraft?.email?.trim() || '';

      const profileRes = await authService.createProfile({
        name,
        email: email || undefined,
        profilePhoto: undefined,
      }, phoneToVerify);

      setUser(profileRes.user);
      setMaidProfile(null);
      const newAddr = profileRes.address;
      if (newAddr) {
        setSavedAddresses(prev => [newAddr, ...prev]);
      }

      setRegistrationDraft(null);
      setIsAuthLoading(false);

      setHistory([]);
      setCurrentScreen('customer_home');
      return { success: true };
    } catch (err: any) {
      console.warn('Registration OTP verification error:', err);
      setIsAuthLoading(false);
      const msg = err?.message || 'Incorrect verification code. Please try again.';
      setAuthError(msg);
      return { success: false, message: msg };
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
   * Initialize a clean customer registration flow from Login screen
   */
  const startCustomerRegistrationFlow = (initialPhone?: string) => {
    setUser(null);
    setMaidProfile(null);
    setAuthError(null);
    const cleanDigits = initialPhone ? initialPhone.replace(/\D/g, '').slice(-10) : '';
    setRegistrationDraft({
      name: '',
      phone: cleanDigits ? `+91 ${cleanDigits}` : '',
    });
    setHistory([]);
    setCurrentScreen('complete_profile');
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
      const newAddr = res.address;
      if (newAddr) {
        setSavedAddresses(prev => [newAddr, ...prev]);
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

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    let updatedUser: User | null = null;
    setUser(prev => {
      if (!prev) return null;
      updatedUser = { ...prev, ...updates };
      authService.updateStoredUser(updatedUser).catch(() => {});
      return updatedUser;
    });

    if (user?.uid) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) {
          payload.name = updates.name.trim();
          payload.full_name = updates.name.trim();
        }
        if (updates.email !== undefined) payload.email = updates.email.trim();
        if (updates.phone !== undefined) payload.phone = updates.phone.trim();
        if (updates.profilePhoto !== undefined) payload.profile_photo_url = updates.profilePhoto;
        const { error } = await supabase.from('user_profiles').update(payload).eq('id', user.uid);
        if (error) {
          console.warn('Error syncing updateUserProfile to Supabase:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Error syncing updateUserProfile to Supabase:', err);
        return false;
      }
    }
    return true;
  };

  const addSavedAddress = async (addressData: Omit<Address, 'id'>): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      const newId = 'addr_' + Math.random().toString(36).substring(2, 9) + Date.now();
      const isFirstAddress = savedAddresses.length === 0;
      const shouldBeDefault = Boolean(addressData.isDefault || isFirstAddress);

      const newAddress: Address = {
        id: newId,
        userId: user.uid,
        label: addressData.label || 'Home',
        houseFlat: addressData.houseFlat || '',
        street: addressData.street || '',
        locality: addressData.locality || '',
        landmark: addressData.landmark || '',
        city: addressData.city?.trim() || '',
        state: addressData.state?.trim() || 'Telangana',
        pincode: addressData.pincode?.trim() || '',
        isDefault: shouldBeDefault,
      };

      if (shouldBeDefault) {
        setSavedAddresses(prev => [newAddress, ...prev.map(a => ({ ...a, isDefault: false }))]);
        await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', user.uid);
      } else {
        setSavedAddresses(prev => [newAddress, ...prev]);
      }

      await supabase.from('saved_addresses').insert({
        id: newId,
        user_id: user.uid,
        label: newAddress.label,
        house_flat: newAddress.houseFlat,
        street: newAddress.street,
        locality: newAddress.locality,
        landmark: newAddress.landmark,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        is_default: shouldBeDefault,
        created_at: new Date().toISOString(),
      });

      // ONLY sync to user_profiles if this is the DEFAULT address!
      // If it's a separate non-default address (like a different booking location),
      // the customer's Default Address is preserved without modification.
      if (shouldBeDefault) {
        const fullAddr = [newAddress.houseFlat, newAddress.street, newAddress.locality, newAddress.city, newAddress.pincode].filter(Boolean).join(', ');
        await supabase.from('user_profiles').update({
          address: fullAddr || newAddress.locality || newAddress.city || null,
          city: newAddress.city || null,
          state: newAddress.state || 'Telangana',
          updated_at: new Date().toISOString(),
        }).eq('id', user.uid);

        setUser(prev => prev ? { ...prev, address: fullAddr || newAddress.locality || newAddress.city || '' } : null);
      }
      return true;
    } catch (err) {
      console.warn('Error adding saved address:', err);
      return false;
    }
  };

  const updateSavedAddress = async (addressId: string, updates: Partial<Address>): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      setSavedAddresses(prev => prev.map(a => (a.id === addressId ? { ...a, ...updates } : a)));

      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.label !== undefined) payload.label = updates.label;
      if (updates.houseFlat !== undefined) payload.house_flat = updates.houseFlat;
      if (updates.street !== undefined) payload.street = updates.street;
      if (updates.locality !== undefined) payload.locality = updates.locality;
      if (updates.landmark !== undefined) payload.landmark = updates.landmark;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.state !== undefined) payload.state = updates.state;
      if (updates.pincode !== undefined) payload.pincode = updates.pincode;
      if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

      if (updates.isDefault) {
        await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', user.uid);
      }

      await supabase.from('saved_addresses').update(payload).eq('id', addressId).eq('user_id', user.uid);

      const target = savedAddresses.find(a => a.id === addressId);
      const isDefault = updates.isDefault ?? target?.isDefault;
      if (isDefault) {
        const merged = { ...target, ...updates };
        const fullAddr = [merged.houseFlat, merged.street, merged.locality, merged.city, merged.pincode].filter(Boolean).join(', ');
        await supabase.from('user_profiles').update({
          address: fullAddr || merged.locality || merged.city || null,
          city: merged.city || null,
          state: merged.state || 'Telangana',
          updated_at: new Date().toISOString(),
        }).eq('id', user.uid);

        setUser(prev => prev ? { ...prev, address: fullAddr || merged.locality || merged.city || '' } : null);
      }
      return true;
    } catch (err) {
      console.warn('Error updating saved address:', err);
      return false;
    }
  };

  const deleteSavedAddress = async (addressId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      const remaining = savedAddresses.filter(a => a.id !== addressId);
      const target = savedAddresses.find(a => a.id === addressId);
      const wasDefault = Boolean(target?.isDefault);

      setSavedAddresses(remaining);
      await supabase.from('saved_addresses').delete().eq('id', addressId).eq('user_id', user.uid);

      if (wasDefault && remaining.length > 0) {
        const nextDefault = remaining[0];
        await setDefaultSavedAddress(nextDefault.id);
      } else if (remaining.length === 0) {
        await supabase.from('user_profiles').update({
          address: null,
          city: null,
          updated_at: new Date().toISOString(),
        }).eq('id', user.uid);
        setUser(prev => prev ? { ...prev, address: '' } : null);
      }
      return true;
    } catch (err) {
      console.warn('Error deleting saved address:', err);
      return false;
    }
  };

  const setDefaultSavedAddress = async (addressId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      setSavedAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addressId })));
      await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', user.uid);
      await supabase.from('saved_addresses').update({ is_default: true }).eq('id', addressId).eq('user_id', user.uid);

      const target = savedAddresses.find(a => a.id === addressId);
      if (target) {
        const fullAddr = [target.houseFlat, target.street, target.locality, target.city, target.pincode].filter(Boolean).join(', ');
        await supabase.from('user_profiles').update({
          address: fullAddr || target.locality || target.city || null,
          city: target.city || null,
          state: target.state || 'Telangana',
          updated_at: new Date().toISOString(),
        }).eq('id', user.uid);

        setUser(prev => prev ? { ...prev, address: fullAddr || target.locality || target.city || '' } : null);
      }
      return true;
    } catch (err) {
      console.warn('Error setting default address:', err);
      return false;
    }
  };

  /** @dev Demo/testing only — bypasses Supabase Auth. Not used in production flows. */
  const loginWithPhone = (phone: string, name: string = 'User') => {
    if (!__DEV__) {
      console.warn('[loginWithPhone] Called outside DEV mode — use sendLoginOtp instead.');
      return;
    }
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
    if (user) {
      setCurrentScreen('customer_home');
    } else {
      setCurrentScreen('login');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setMaidProfile(null);
    setHistory([]);
    setCurrentScreen('login');
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('@gc_home_plus_auth_user');
        window.localStorage.removeItem('@gc_home_plus_onboarding_completed');
      }
    } catch {}
  };

  const navigateTo = (screen: string, payload?: any) => {
    if (screen === currentScreen) {
      if (payload !== undefined) setNavigationPayload(payload);
      if (payload?.service) setSelectedService(payload.service);
      if (payload?.booking) setSelectedBooking(payload.booking);
      return;
    }

    // Push current screen to history stack (except transient screens like splash)
    if (currentScreen !== 'splash') {
      setHistory(prev => [
        ...prev,
        {
          screen: currentScreen,
          selectedService,
          selectedBooking,
          navigationPayload,
        },
      ]);
    }

    setNavigationPayload(payload !== undefined ? payload : null);
    if (payload?.service) setSelectedService(payload.service);
    if (payload?.booking) setSelectedBooking(payload.booking);
    setCurrentScreen(screen);
  };

  const goBack = (): boolean => {
    if (history.length > 0) {
      const prevEntry = history[history.length - 1];
      setHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentScreen(prevEntry.screen);
      if (prevEntry.selectedService !== undefined) setSelectedService(prevEntry.selectedService);
      if (prevEntry.selectedBooking !== undefined) setSelectedBooking(prevEntry.selectedBooking);
      setNavigationPayload(prevEntry.navigationPayload !== undefined ? prevEntry.navigationPayload : null);
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

  const fetchServices = useCallback(async () => {
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
  }, []);

  const fetchSupabaseBookings = useCallback(async () => {
    try {
      const partnerUid = maidProfile?.uid || user?.uid;
      let pendingOfferBookingIds: string[] = [];

      if (partnerUid) {
        try {
          const { data: assignments } = await supabase
            .from('partner_assignments')
            .select('booking_id')
            .eq('partner_id', partnerUid)
            .eq('response_status', 'pending');
          if (assignments && assignments.length > 0) {
            pendingOfferBookingIds = assignments.map((a: any) => a.booking_id).filter(Boolean);
          }
        } catch (e) {
          console.log('partner_assignments query note:', e);
        }
      }

      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (user?.uid) {
        if (pendingOfferBookingIds.length > 0) {
          query = query.or(`customer_id.eq.${user.uid},assigned_maid_id.eq.${user.uid},id.in.(${pendingOfferBookingIds.join(',')})`);
        } else {
          query = query.or(`customer_id.eq.${user.uid},assigned_maid_id.eq.${user.uid}`);
        }
      } else {
        query = query.limit(20);
      }

      const { data, error } = await query;

      if (!error && data) {
        const mappedBookings: Booking[] = data.map((row: any) => ({
          bookingId: row.booking_code || row.id,
          customerId: row.customer_id || user?.uid || 'cust_curr',
          customerName: row.customer_name || user?.name || 'Customer',
          customerPhone: row.customer_phone || user?.phone || '+91 98000 00000',
          serviceId: row.service_id || 'srv_1',
          serviceName: row.service_name || 'Cleaning Service',
          servicePrice: Number(row.service_price || row.total_amount || 799),
          totalAmount: Number(row.total_amount || row.service_price || 799),
          address: {
            id: 'addr_' + (row.booking_code || row.id),
            label: row.address_label || 'Home',
            houseFlat: row.address_house_flat || '',
            street: row.address_street || '',
            locality: row.address_locality || '',
            city: row.address_city || '',
            pincode: row.address_pincode || '',
          },
          date: row.scheduled_date || new Date().toISOString().split('T')[0],
          timeSlot: row.time_slot || '10:00 AM',
          specialInstructions: row.special_instructions,
          status: (row.status as any) || 'pending_assignment',
          assignedMaidId: row.assigned_maid_id,
          assignedMaidName: row.assigned_maid_name,
          assignedMaidPhone: row.assigned_maid_phone,
          assignedMaidPhoto: row.assigned_maid_photo_url,
          paymentMethod: (row.payment_method as any) || 'cash',
          paymentStatus: (row.payment_status as any) || 'pending',
          startOtp: row.start_otp || '1234',
          partnerPayout: row.partner_payout !== undefined && row.partner_payout !== null 
            ? Number(row.partner_payout) 
            : (row.partner_earnings !== undefined && row.partner_earnings !== null 
                ? Number(row.partner_earnings) 
                : (row.payout_amount !== undefined && row.payout_amount !== null ? Number(row.payout_amount) : null)),
          partnerEarnings: row.partner_earnings ? Number(row.partner_earnings) : undefined,
          payoutStatus: row.payout_status || null,
          createdAt: row.created_at ? row.created_at.substring(0, 16).replace('T', ' ') : new Date().toISOString(),
          slotReminderSentAt: row.slot_reminder_sent_at,
          slotConfirmationStatus: row.slot_confirmation_status,
          customerConfirmedSlot: row.customer_confirmed_slot,
          customerSlotConfirmedAt: row.customer_slot_confirmed_at,
          maidConfirmedSlot: row.maid_confirmed_slot,
          maidSlotConfirmedAt: row.maid_slot_confirmed_at,
          fiveMinCheckTriggeredAt: row.five_min_check_triggered_at,
          adminFinalizedAt: row.admin_finalized_at,
          adminResolvedAt: row.admin_resolved_at,
          assignmentStatus: row.assignment_status as any,
        }));
        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.log('Error loading bookings from Supabase:', err);
    }
  }, [user?.uid, user?.name, user?.phone, maidProfile?.uid]);

  const fetchUserAddresses = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { data } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.uid)
        .order('is_default', { ascending: false });

      if (data && data.length > 0) {
        const mapped: Address[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          label: row.label || 'Home',
          houseFlat: row.house_flat || '',
          street: row.street_address || row.street || '',
          locality: row.locality || '',
          landmark: row.landmark || '',
          city: row.city || '',
          state: row.state || 'Telangana',
          pincode: row.pincode || '',
          isDefault: Boolean(row.is_default),
        }));
        setSavedAddresses(mapped);
      } else {
        setSavedAddresses([]);
      }
    } catch (addrErr) {
      console.log('Error loading user addresses:', addrErr);
    }
  }, [user?.uid]);

  const fetchMaidProfile = useCallback(async () => {
    if (!user?.uid && !user?.phone) return;
    try {
      const cleanPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
      const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      const uidFilters: string[] = [];
      if (isUuid(user?.uid)) {
        uidFilters.push(`id.eq.${user.uid}`);
      }
      if (user?.uid) {
        uidFilters.push(`user_id.eq.${user.uid}`);
      }
      const phoneFilters: string[] = [];
      if (user?.phone) {
        phoneFilters.push(`phone.eq.${user.phone}`);
      }
      if (cleanPhone) {
        phoneFilters.push(`phone.eq.+91${cleanPhone}`);
        phoneFilters.push(`phone.eq.${cleanPhone}`);
      }
      const filter = [...uidFilters, ...phoneFilters].join(',');
      if (!filter) return;

      const { data, error } = await supabase
        .from('maid_profiles')
        .select('*')
        .or(filter)
        .limit(1);

      if (!error && data && data.length > 0) {
        const row = data[0];
        let parsedServices: any[] = [];
        if (Array.isArray(row.services_provided) && row.services_provided.length > 0) {
          parsedServices = row.services_provided.map((s: any) => {
            if (typeof s === 'string' && s.startsWith('{')) {
              try { return JSON.parse(s); } catch { return { serviceName: s }; }
            }
            return typeof s === 'string' ? { serviceName: s } : s;
          });
        } else if (Array.isArray(row.skills) && row.skills.length > 0) {
          parsedServices = row.skills.map((s: any) => {
            if (typeof s === 'string' && s.startsWith('{')) {
              try { return JSON.parse(s); } catch { return { serviceName: s }; }
            }
            return typeof s === 'string' ? { serviceName: s } : s;
          });
        }

        let parsedKycDocs = row.kyc_documents;
        if (typeof parsedKycDocs === 'string') {
          try { parsedKycDocs = JSON.parse(parsedKycDocs); } catch { parsedKycDocs = {}; }
        }

        const profile: MaidProfile = {
          uid: row.id || user.uid,
          maidCode: row.maid_code || '',
          fullName: row.full_name || user.name || 'Partner',
          phone: row.phone || user.phone,
          email: row.email || user.email || '',
          dob: row.dob || row.date_of_birth || '',
          gender: row.gender || '',
          photoUrl: row.photo_url || parsedKycDocs?.profilePhotoUrl || '',
          idProofUrl: row.id_proof_url || parsedKycDocs?.aadhaarFrontUrl || '',
          emergencyContact: row.emergency_contact || (row.emergency_contact_name ? `${row.emergency_contact_name} (${row.emergency_contact_phone || ''})` : ''),
          emergencyContactName: row.emergency_contact_name,
          emergencyContactPhone: row.emergency_contact_phone,
          address: row.address || row.full_address || '',
          fullAddress: row.full_address || row.address,
          locality: row.locality,
          pincode: row.pincode,
          city: row.city || 'Karimnagar',
          serviceArea: row.service_area || row.preferred_service_area || 'Karimnagar',
          preferredServiceArea: row.preferred_service_area || row.service_area,
          serviceRadiusKm: row.service_radius_km || 10,
          healthSafetyDecl: Boolean(row.health_safety_decl),
          bankDetails: {
            accountName: row.bank_account_name || row.full_name || user.name || '',
            accountNumber: row.bank_account_number || '',
            ifscCode: row.bank_ifsc || '',
            bankName: row.bank_name || '',
            upiId: row.upi_id || parsedKycDocs?.upiId || '',
          },
          status: row.status || 'pending',
          kycStatus: row.kyc_status,
          rejectionReason: row.rejection_reason,
          isOnline: row.is_online ?? true,
          rating: row.rating ? Number(row.rating) : 5.0,
          totalRatingsCount: row.total_ratings_count || 0,
          completedJobsCount: row.completed_jobs_count || 0,
          workingDays: Array.isArray(row.working_days) ? row.working_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          workingHours: row.working_hours || '08:00 AM - 08:00 PM',
          emergencyJobsAccepted: Boolean(row.emergency_jobs_accepted),
          appliedAt: row.applied_at ? new Date(row.applied_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          approvedAt: row.approved_at,
          servicesProvided: parsedServices.map((s: any, idx: number) => ({
            id: s.id || s.serviceId || `srv_${idx}`,
            serviceId: s.serviceId || s.id || `srv_${idx}`,
            serviceName: s.serviceName || s.name || 'Service',
            category: s.category || '',
            experienceYears: s.experienceYears || 3,
            experienceRange: s.experienceRange || `${s.experienceYears || 3} yrs exp`,
            description: s.description || '',
            subServices: s.subServices || [],
          })),
          languagesSpoken: Array.isArray(row.languages_spoken) ? row.languages_spoken : (Array.isArray(row.languages) ? row.languages : ['Telugu', 'English']),
          adminNotes: row.admin_notes,
        };

        setMaidProfile(profile);

        // Only update user's maidApplicationStatus or maid role if user is in Partner mode
        if (user.role === 'maid' || user.role === 'partner') {
          if (row.status === 'approved') {
            setUser(prev => (prev ? { ...prev, role: 'maid', maidApplicationStatus: 'approved' } : null));
          } else {
            setUser(prev => (prev ? { ...prev, maidApplicationStatus: row.status as any } : null));
          }
        }
      } else {
        // No partner profile exists in database
        setMaidProfile(null);
      }
    } catch (err) {
      console.warn('Error fetching maid profile:', err);
    }
  }, [user?.uid, user?.name, user?.phone, user?.email]);

  // Load services, bookings, and maid profile with Realtime sync
  useEffect(() => {
    fetchServices();
    fetchSupabaseBookings();
    fetchUserAddresses();
    fetchMaidProfile();

    const channel = supabase
      .channel('user_app_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchSupabaseBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_addresses' }, () => {
        fetchUserAddresses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maid_profiles' }, () => {
        fetchMaidProfile();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_assignments' }, () => {
        fetchSupabaseBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices, fetchSupabaseBookings, fetchUserAddresses, fetchMaidProfile]);

  const submitMaidApplication = async (data: Partial<MaidProfile>) => {
    const partnerUid = user?.uid || ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }));

    const newProfile: MaidProfile = {
      uid: partnerUid,
      fullName: data.fullName || user?.name || 'Partner',
      phone: data.phone || user?.phone || '',
      email: data.email || user?.email || '',
      photoUrl: data.photoUrl || '',
      idProofUrl: data.idProofUrl || '',
      address: data.address || '',
      city: data.city || 'Karimnagar',
      serviceArea: data.serviceArea || 'Karimnagar',
      serviceRadiusKm: data.serviceRadiusKm || 5,
      emergencyContact: data.emergencyContact || '',
      healthSafetyDecl: data.healthSafetyDecl !== undefined ? data.healthSafetyDecl : true,
      bankDetails: data.bankDetails || {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountName: data.fullName || user?.name || 'Partner',
      },
      rating: 5.0,
      totalRatingsCount: 0,
      completedJobsCount: 0,
      workingDays: data.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      isOnline: true,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
      servicesProvided: data.servicesProvided,
      languagesSpoken: data.languagesSpoken,
    };
    setMaidProfile(newProfile);

    const updatedUser: User = {
      uid: user?.uid || partnerUid,
      name: user?.name || newProfile.fullName,
      phone: user?.phone || newProfile.phone,
      email: user?.email || newProfile.email,
      role: user?.role || 'customer',
      maidApplicationStatus: 'pending',
      createdAt: user?.createdAt || new Date().toISOString().split('T')[0],
    };
    setUser(updatedUser);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('@gc_home_plus_auth_user', JSON.stringify(updatedUser));
        window.localStorage.setItem('@gc_home_plus_onboarding_completed', 'true');
      }
    } catch {}

    setHistory([]);
    setCurrentScreen('maid_status');
  };

  /** @dev Demo/testing only — local state change, does NOT write to Supabase. Use approveMaid() in Admin Panel for production. */
  const simulateAdminApproval = async (approved: boolean, reason?: string) => {
    if (!__DEV__) {
      console.warn('[simulateAdminApproval] Called outside DEV mode — use Admin Panel for real approvals.');
      return;
    }
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
        address_city: newBooking.address?.city || 'Karimnagar',
        address_pincode: newBooking.address?.pincode || '',
        scheduled_date: scheduledDate,
        time_slot: newBooking.timeSlot,
        status: 'pending_assignment',
        payment_method: newBooking.paymentMethod || 'cash',
        payment_status: newBooking.paymentStatus || (newBooking.paymentMethod === 'upi' || newBooking.paymentMethod === 'card' ? 'paid' : 'pending'),
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

    try {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (extra?.assignedMaidId) updatePayload.assigned_maid_id = extra.assignedMaidId;
      if (extra?.assignedMaidName) updatePayload.assigned_maid_name = extra.assignedMaidName;
      if (extra?.assignedMaidPhone) updatePayload.assigned_maid_phone = extra.assignedMaidPhone;
      if (extra?.assignedMaidPhoto) updatePayload.assigned_maid_photo_url = extra.assignedMaidPhoto;
      if (status === 'completed') updatePayload.completed_at = new Date().toISOString();

      supabase
        .from('bookings')
        .update(updatePayload)
        .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`)
        .then(({ error }) => {
          if (error) console.warn('Supabase booking status update notice:', error.message);
        });
    } catch (e) {
      console.warn('Supabase booking update notice:', e);
    }
  };

  const toggleMaidOnline = () => {
    if (maidProfile) {
      const nextOnlineState = !maidProfile.isOnline;
      setMaidProfile({ ...maidProfile, isOnline: nextOnlineState });

      // Update Supabase database
      if (maidProfile.uid) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(maidProfile.uid);
        const query = isUuid
          ? supabase.from('maid_profiles').update({ is_online: nextOnlineState }).eq('id', maidProfile.uid)
          : supabase.from('maid_profiles').update({ is_online: nextOnlineState }).eq('maid_code', maidProfile.uid);

        query.then(({ error }) => {
          if (error) console.log('Notice updating is_online in Supabase:', error.message);
        });
      }

      // Preserve partner dashboard screen and role:
      // Availability status is strictly operational (accepting jobs vs offline).
      // A partner remains inside the Partner experience.
    }
  };

  const isMaidPartner = Boolean(
    maidProfile &&
      (maidProfile.status === 'approved' ||
        user?.maidApplicationStatus === 'approved' ||
        user?.role === 'maid')
  );

  const switchUserMode = (mode: 'customer' | 'maid') => {
    if (mode === 'maid') {
      setUser(prev => (prev ? { ...prev, role: 'maid' } : null));
      setHistory([]);
      setCurrentScreen('maid_home');
    } else {
      setUser(prev => (prev ? { ...prev, role: 'customer' } : null));
      setHistory([]);
      setCurrentScreen('customer_home');
    }
  };

  const acceptJob = (bookingId: string) => {
    updateBookingStatus(bookingId, 'maid_accepted', {
      assignedMaidId: maidProfile?.uid || undefined,
      assignedMaidName: maidProfile?.fullName || undefined,
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

  const updatePartnerProfile = async (updates: Partial<MaidProfile>): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      setMaidProfile(prev => (prev ? { ...prev, ...updates } : null));

      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.dob !== undefined) payload.dob = updates.dob;
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.emergencyContact !== undefined) payload.emergency_contact = updates.emergencyContact;
      if (updates.emergencyContactName !== undefined) payload.emergency_contact_name = updates.emergencyContactName;
      if (updates.emergencyContactPhone !== undefined) payload.emergency_contact_phone = updates.emergencyContactPhone;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.fullAddress !== undefined) payload.full_address = updates.fullAddress;
      if (updates.locality !== undefined) payload.locality = updates.locality;
      if (updates.pincode !== undefined) payload.pincode = updates.pincode;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.serviceArea !== undefined) payload.service_area = updates.serviceArea;
      if (updates.preferredServiceArea !== undefined) payload.preferred_service_area = updates.preferredServiceArea;
      if (updates.serviceRadiusKm !== undefined) payload.service_radius_km = updates.serviceRadiusKm;
      if (updates.workingDays !== undefined) payload.working_days = updates.workingDays;
      if (updates.workingHours !== undefined) payload.working_hours = updates.workingHours;
      if (updates.emergencyJobsAccepted !== undefined) payload.emergency_jobs_accepted = updates.emergencyJobsAccepted;
      if (updates.servicesProvided !== undefined) {
        payload.services_provided = updates.servicesProvided;
        payload.skills = updates.servicesProvided.map(s => JSON.stringify(s));
      }
      if (updates.languagesSpoken !== undefined) {
        payload.languages_spoken = updates.languagesSpoken;
        payload.languages = updates.languagesSpoken;
      }
      if (updates.bankDetails !== undefined) {
        payload.bank_account_name = updates.bankDetails.accountName;
        payload.bank_account_number = updates.bankDetails.accountNumber;
        payload.bank_ifsc = updates.bankDetails.ifscCode;
        payload.bank_name = updates.bankDetails.bankName;
        if (updates.bankDetails.upiId !== undefined) payload.upi_id = updates.bankDetails.upiId;
      }

      const targetId = maidProfile?.uid || user.uid;
      const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
      if (isUuid(targetId)) {
        await supabase.from('maid_profiles').update(payload).eq('id', targetId);
      } else if (user?.phone) {
        await supabase.from('maid_profiles').update(payload).eq('phone', user.phone);
      }
      return true;
    } catch (err) {
      console.warn('Error updating partner profile:', err);
      return false;
    }
  };

  // ── Periodic 30-Min Booking Slot Reminder & 5-Min Check Timer ──
  useEffect(() => {
    if (bookings.length === 0) return;

    const runSlotAudit = async () => {
      await slotConfirmationService.processSlotConfirmations(bookings);
    };

    runSlotAudit();
    const interval = setInterval(runSlotAudit, 15000); // Audit every 15 seconds
    return () => clearInterval(interval);
  }, [bookings]);

  const confirmCustomerSlot = async (bookingId: string) => {
    const target = bookings.find(b => b.bookingId === bookingId);
    if (!target) return;
    const updated = await slotConfirmationService.confirmCustomerSlot(target);
    setBookings(prev => prev.map(b => (b.bookingId === bookingId ? { ...b, ...updated } : b)));
  };

  const confirmMaidSlot = async (bookingId: string) => {
    const target = bookings.find(b => b.bookingId === bookingId);
    if (!target) return;
    const updated = await slotConfirmationService.confirmMaidSlot(target);
    setBookings(prev => prev.map(b => (b.bookingId === bookingId ? { ...b, ...updated } : b)));
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
        navigationPayload,
        pendingPhoneNumber,
        registrationDraft,
        setRegistrationDraft,
        isLoggedIn: !!user,
        isAuthLoading,
        authError,
        canGoBack: history.length > 0,
        goBack,
        checkExistingSession,
        sendLoginOtp,
        verifyLoginOtp,
        startRegistration,
        startCustomerRegistrationFlow,
        verifyRegistrationOtp,
        resendLoginOtp,
        completeProfileSetup,
        loginWithPhone,
        loginAsDemoCustomer,
        logout,
        clearAuthError,
        navigateTo,
        updateUserProfile,
        addSavedAddress,
        updateSavedAddress,
        deleteSavedAddress,
        setDefaultSavedAddress,
        submitMaidApplication,
        createBooking,
        updateBookingStatus,
        toggleMaidOnline,
        acceptJob,
        rejectJob,
        simulateAdminApproval,
        updatePartnerProfile,
        confirmCustomerSlot,
        confirmMaidSlot,
        fetchMaidProfile,
        isMaidPartner,
        switchUserMode,
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
