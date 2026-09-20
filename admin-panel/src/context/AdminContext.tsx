import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Service, MaidProfile, Booking, DashboardMetrics, BookingStatus } from '../types';
import { supabase, supabaseAdmin } from '../config/supabase';

interface AdminContextType {
  isAdminLoggedIn: boolean;
  authLoading: boolean;
  adminUser: any | null;
  adminError: string | null;
  setAdminError: (error: string | null) => void;
  services: Service[];
  serviceCategories: any[];
  serviceAddons: any[];
  maids: MaidProfile[];
  bookings: Booking[];
  customers: any[];
  coupons: any[];
  homepageBanners: any[];
  serviceAreas: any[];
  payouts: any[];
  ratings: any[];
  platformSettings: any;
  currentTab: string;
  selectedBookingId: string | null;
  selectedBooking: Booking | null;
  selectedMaidForReview: MaidProfile | null;
  selectedBookingForAssignment: Booking | null;
  createBookingModalOpen: boolean;
  rescheduleModalOpen: boolean;
  cancelModalOpen: boolean;
  setCreateBookingModalOpen: (open: boolean) => void;
  setRescheduleModalOpen: (open: boolean) => void;
  setCancelModalOpen: (open: boolean) => void;
  loginAdmin: () => void;
  loginAdminWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logoutAdmin: () => Promise<void>;
  setCurrentTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  openAssignMaid: (bookingId: string) => void;
  openBookingDetails: (bookingId: string) => void;
  setSelectedMaidForReview: (maid: MaidProfile | null) => void;
  setSelectedBookingForAssignment: (booking: Booking | null) => void;
  
  // Service Operations
  toggleServiceActive: (serviceId: string) => Promise<void>;
  addService: (newService: Omit<Service, 'serviceId'>) => Promise<void>;
  updateService: (serviceId: string, updated: Partial<Service>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  
  // Service Category Operations
  addServiceCategory: (category: any) => Promise<void>;
  updateServiceCategory: (id: string, updates: any) => Promise<void>;
  deleteServiceCategory: (id: string) => Promise<void>;
  
  // Service Addon Operations
  addServiceAddon: (addon: any) => Promise<void>;
  updateServiceAddon: (id: string, updates: any) => Promise<void>;
  deleteServiceAddon: (id: string) => Promise<void>;
  
  // Maid Operations
  approveMaid: (uid: string) => Promise<void>;
  rejectMaid: (uid: string, reason: string) => Promise<void>;
  updateMaidKycDocStatus: (uid: string, docId: string, status: any) => Promise<void>;
  requestMaidCorrection: (uid: string, note: string) => Promise<void>;
  toggleMaidOnlineStatus: (uid: string, isOnline: boolean) => Promise<void>;
  toggleMaidActiveStatus: (uid: string, status: any) => Promise<void>;
  exportMaidsToCSV: () => void;
  
  // Booking Operations
  assignMaidToBooking: (bookingId: string, maidId: string) => void;
  confirmMaidAssignment: (bookingId: string, maidId: string) => Promise<void>;
  autoAssignMaid: (bookingId: string) => void;
  createNewBooking: (newBookingData: Partial<Booking>) => Promise<void>;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string) => Promise<void>;
  cancelBookingWithReason: (bookingId: string, reason: string) => Promise<void>;
  markJobAsCompleted: (bookingId: string) => Promise<void>;
  updateJobStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  
  // Customer Operations
  blockCustomer: (customerId: string) => Promise<void>;
  unblockCustomer: (customerId: string) => Promise<void>;
  updateCustomerNotes: (customerId: string, notes: string) => Promise<void>;
  exportCustomersToCSV: () => void;
  
  // Coupon Operations
  addCoupon: (coupon: any) => Promise<void>;
  updateCoupon: (id: string, updates: any) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponActive: (id: string) => Promise<void>;
  
  // Banner Operations
  addHomepageBanner: (banner: any) => Promise<void>;
  updateHomepageBanner: (id: string, updates: any) => Promise<void>;
  deleteHomepageBanner: (id: string) => Promise<void>;
  
  // Service Area Operations
  addServiceArea: (area: any) => Promise<void>;
  updateServiceArea: (id: string, updates: any) => Promise<void>;
  deleteServiceArea: (id: string) => Promise<void>;
  
  // Payout Operations
  disburseMaidPayout: (maidId: string, amount: number) => Promise<void>;
  updatePayoutStatus: (payoutId: string, status: string) => Promise<void>;
  
  // Rating Operations
  toggleRatingVisibility: (ratingId: string) => Promise<void>;
  
  // Platform Settings Operations
  updatePlatformSettings: (settings: any) => Promise<void>;
  
  // Notifications
  notifications: any[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  sendBroadcastNotification: (notification: any) => Promise<void>;
  
  // Dashboard & Reports
  getDashboardMetrics: () => DashboardMetrics;
  exportBookingsToCSV: () => void;
  
  // Location & Timezone
  selectedLocation: string;
  selectedTimezone: string;
  setSelectedLocation: (location: string) => void;
}

export const LOCATION_TIMEZONE_MAP: Record<string, { timezone: string; label: string }> = {
  'Hyderabad': { timezone: 'Asia/Kolkata', label: 'Hyderabad (IST)' },
  'Bengaluru': { timezone: 'Asia/Kolkata', label: 'Bengaluru (IST)' },
  'Mumbai': { timezone: 'Asia/Kolkata', label: 'Mumbai (IST)' },
  'Delhi NCR': { timezone: 'Asia/Kolkata', label: 'Delhi NCR (IST)' },
  'Chennai': { timezone: 'Asia/Kolkata', label: 'Chennai (IST)' },
  'Kolkata': { timezone: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  'Dubai': { timezone: 'Asia/Dubai', label: 'Dubai (GST)' },
  'Singapore': { timezone: 'Asia/Singapore', label: 'Singapore (SGT)' },
  'London': { timezone: 'Europe/London', label: 'London (GMT/BST)' },
  'New York': { timezone: 'America/New_York', label: 'New York (EST/EDT)' },
  'Tokyo': { timezone: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  'Sydney': { timezone: 'Australia/Sydney', label: 'Sydney (AEST)' },
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==================== AUTH STATE ====================
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // ==================== UI STATE ====================
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const [selectedLocation, setSelectedLocationState] = useState<string>(() => {
    return localStorage.getItem('admin_selected_location') || 'Hyderabad';
  });

  const selectedTimezone = LOCATION_TIMEZONE_MAP[selectedLocation]?.timezone || 'Asia/Kolkata';

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedMaidForReview, setSelectedMaidForReview] = useState<MaidProfile | null>(null);
  const [selectedBookingForAssignment, setSelectedBookingForAssignment] = useState<Booking | null>(null);

  // Modals
  const [createBookingModalOpen, setCreateBookingModalOpen] = useState<boolean>(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState<boolean>(false);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);

  // ==================== DATA STATE (NO MOCK DATA - ALL FROM SUPABASE) ====================
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [serviceAddons, setServiceAddons] = useState<any[]>([]);
  const [maids, setMaids] = useState<MaidProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [homepageBanners, setHomepageBanners] = useState<any[]>([]);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({});
  const [notifications, setNotifications] = useState<any[]>([]);

  // Selected Booking computation
  const selectedBooking = bookings.find(b => b.bookingId === selectedBookingId) || null;

  // ==================== AUTH FUNCTIONS ====================
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setSelectedLocation = (location: string) => {
    setSelectedLocationState(location);
    localStorage.setItem('admin_selected_location', location);
    if (adminUser) {
      supabase.auth.updateUser({
        data: { selected_location: location, selected_timezone: LOCATION_TIMEZONE_MAP[location]?.timezone || 'Asia/Kolkata' }
      }).catch(() => {});
    }
  };

  // Initialize Auth Session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuthStored = localStorage.getItem('admin_authenticated') === 'true';
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        
        if (sessionErr) {
          console.warn('[Supabase Auth Session Notice]:', sessionErr.message);
        }

        if (session?.user) {
          const role = session.user.user_metadata?.role;
          if (role && role !== 'admin') {
            await supabase.auth.signOut();
            setIsAdminLoggedIn(false);
            setAdminUser(null);
            localStorage.removeItem('admin_authenticated');
          } else {
            setIsAdminLoggedIn(true);
            setAdminUser(session.user);
            localStorage.setItem('admin_authenticated', 'true');
          }
        } else if (isAuthStored) {
          // Fallback for demo mode
          setIsAdminLoggedIn(true);
          setAdminUser({
            id: 'admin_super_01',
            email: localStorage.getItem('admin_remembered_email') || 'admin@example.com',
            user_metadata: { name: 'Operations Supervisor', role: 'admin' },
          });
        } else {
          setIsAdminLoggedIn(false);
          setAdminUser(null);
          localStorage.removeItem('admin_authenticated');
        }
      } catch (err) {
        console.error('Error in initAuth:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        if (role && role !== 'admin') {
          await supabase.auth.signOut();
          setIsAdminLoggedIn(false);
          setAdminUser(null);
          localStorage.removeItem('admin_authenticated');
        } else {
          setIsAdminLoggedIn(true);
          setAdminUser(session.user);
          localStorage.setItem('admin_authenticated', 'true');
        }
      } else {
        const isAuthStored = localStorage.getItem('admin_authenticated') === 'true';
        if (!isAuthStored) {
          setIsAdminLoggedIn(false);
          setAdminUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('admin_authenticated', 'true');
  };

  const loginAdminWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        console.error('[Supabase Auth Diagnostic]:', error.message, error);

        // Handle fallback for demo
        if (
          error.message.toLowerCase().includes('database error querying schema') ||
          error.message.toLowerCase().includes('api key') ||
          error.message.toLowerCase().includes('apikey')
        ) {
          if (cleanEmail === 'admin@example.com' && cleanPassword === 'Admin@123456') {
            setIsAdminLoggedIn(true);
            setAdminUser({
              id: 'admin_super_01',
              email: 'admin@example.com',
              user_metadata: { name: 'Operations Supervisor', role: 'admin' },
            });
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_remembered_email', cleanEmail);
            return { success: true };
          }
          return { success: false, error: 'Invalid email or password.' };
        }

        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid_grant') ||
          error.message.toLowerCase().includes('invalid password')
        ) {
          return { success: false, error: 'Invalid email or password.' };
        }

        return {
          success: false,
          error: "We couldn't verify your admin account. Please try again.",
        };
      }

      if (!data?.session || !data?.user) {
        return { success: false, error: "We couldn't verify your admin account. Please try again." };
      }

      // Check admin role
      const role = data.user.user_metadata?.role;
      if (role && role !== 'admin') {
        await supabase.auth.signOut();
        setIsAdminLoggedIn(false);
        setAdminUser(null);
        localStorage.removeItem('admin_authenticated');
        return { success: false, error: 'This account does not have administrator access.' };
      }

      setIsAdminLoggedIn(true);
      setAdminUser(data.user);
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_remembered_email', cleanEmail);
      return { success: true };
    } catch (err: any) {
      console.error('[Supabase Auth Exception]:', err);

      // Demo fallback
      if (cleanEmail === 'admin@example.com' && cleanPassword === 'Admin@123456') {
        setIsAdminLoggedIn(true);
        setAdminUser({
          id: 'admin_super_01',
          email: 'admin@example.com',
          user_metadata: { name: 'Operations Supervisor', role: 'admin' },
        });
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_remembered_email', cleanEmail);
        return { success: true };
      }

      return {
        success: false,
        error: 'Unable to connect to the server. Check your connection and try again.',
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) alert(`Google Authentication Error: ${error.message}`);
    } catch (err: any) {
      alert(`Google Auth Error: ${err.message}`);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, message: `Password reset link sent to ${email}.` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logoutAdmin = async () => {
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    localStorage.removeItem('admin_authenticated');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // ==================== DATA FETCHING FUNCTIONS ====================
  
  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, category:service_categories(*)')
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedServices: Service[] = data.map((row: any) => ({
          serviceId: row.id,
          name: row.name,
          category: row.category?.name || row.category || 'General',
          description: row.description || '',
          startingPrice: Number(row.starting_price || 0),
          pricePerRoom: row.price_per_room ? Number(row.price_per_room) : undefined,
          estimatedDuration: row.estimated_duration || '',
          imageUrl: row.image_url || '',
          isActive: Boolean(row.is_active),
          features: Array.isArray(row.features) ? row.features : [],
          displayOrder: Number(row.display_order || 0),
          isBestseller: Boolean(row.is_bestseller),
          rating: row.rating ? Number(row.rating) : 0,
          reviewCount: row.review_count || 0,
        }));
        setServices(mappedServices);
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setAdminError(err.message || 'Error fetching services');
    }
  }, []);

  const fetchServiceCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServiceCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching service categories:', err);
    }
  }, []);

  const fetchServiceAddons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('service_addons')
        .select('*, service:services(name)')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServiceAddons(data || []);
    } catch (err: any) {
      console.error('Error fetching service addons:', err);
    }
  }, []);

  const fetchMaids = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('maid_profiles')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const fetchedProfiles: MaidProfile[] = data.map((row: any) => ({
          uid: row.id,
          maidId: row.maid_code || row.id || 'MD001',
          fullName: row.full_name || 'Maid Partner',
          phone: row.phone || '+91 98000 00000',
          email: row.email || '',
          photoUrl: row.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          idProofUrl: row.id_proof_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
          emergencyContact: row.emergency_contact || 'Family (+91 98765 43210)',
          address: row.address || `${row.service_area || 'Kondapur'}, ${row.city || 'Hyderabad'}`,
          bankDetails: {
            accountName: row.bank_account_name || row.full_name || 'Partner Account',
            accountNumber: row.bank_account_number || '**** **** 4892',
            ifscCode: row.bank_ifsc || 'HDFC0001234',
            bankName: row.bank_name || 'HDFC Bank',
          },
          serviceArea: row.service_area || row.city || 'Kondapur Zone, Hyderabad',
          serviceRadiusKm: row.service_radius_km || 5,
          healthSafetyDecl: Boolean(row.health_safety_decl),
          status: row.status || 'pending',
          kycStatus: row.kyc_status || 'pending',
          kycCompletionPct: row.kyc_completion_pct || 0,
          kycDocuments: Array.isArray(row.kyc_documents) ? row.kyc_documents : [],
          rejectionReason: row.rejection_reason,
          rejectedBy: row.rejected_by,
          rejectedAt: row.rejected_at,
          isOnline: row.is_online ?? false,
          rating: row.rating ? Number(row.rating) : 0,
          totalRatingsCount: row.total_ratings_count || 0,
          completedJobsCount: row.completed_jobs_count || 0,
          workingDays: Array.isArray(row.working_days) ? row.working_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          skills: Array.isArray(row.skills) ? row.skills : [],
          preferredAreas: Array.isArray(row.preferred_areas) ? row.preferred_areas : [],
          languages: Array.isArray(row.languages) ? row.languages : [],
          earningsThisMonth: row.earnings_this_month || 0,
          totalEarnings: row.total_earnings || 0,
          adminNotes: row.admin_notes,
          appliedAt: row.applied_at ? new Date(row.applied_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          approvedAt: row.approved_at,
        }));
        setMaids(fetchedProfiles);
      }
    } catch (err: any) {
      console.error('Error fetching maids:', err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const fetchedBookings: Booking[] = data.map((row: any) => ({
          id: row.id,
          bookingId: row.booking_code || row.id || `GC-${Date.now()}`,
          customerId: row.customer_id || 'cust_01',
          customerName: row.customer_name || 'Customer',
          customerPhone: row.customer_phone || '+91 98765 43210',
          customerEmail: row.customer_email,
          serviceId: row.service_id || 'srv_1',
          serviceName: row.service_name || 'Home Cleaning',
          servicePrice: Number(row.service_price || row.total_amount || 799),
          totalAmount: Number(row.total_amount || 799),
          serviceDuration: row.service_duration || '3 Hours',
          address: {
            id: 'addr_' + (row.booking_code || row.id),
            label: row.address_label || 'Home',
            street: row.address_street || '',
            locality: row.address_locality || '',
            city: row.address_city || 'Hyderabad',
            pincode: row.address_pincode || '',
          },
          date: row.scheduled_date || 'Today',
          timeSlot: row.time_slot || '10:00 AM',
          specialInstructions: row.special_instructions,
          status: row.status || 'pending_assignment',
          assignedMaidId: row.assigned_maid_id,
          assignedMaidName: row.assigned_maid_name,
          assignedMaidPhone: row.assigned_maid_phone,
          assignedMaidPhotoUrl: row.assigned_maid_photo_url,
          assignedMaidRating: row.assigned_maid_rating ? Number(row.assigned_maid_rating) : undefined,
          paymentMethod: row.payment_method || 'online',
          paymentStatus: row.payment_status || 'pending',
          cancellationReason: row.cancellation_reason,
          rescheduleReason: row.reschedule_reason,
          timelineLogs: Array.isArray(row.timeline_logs) ? row.timeline_logs : [],
          customerRating: row.customer_rating,
          customerReview: row.customer_review,
          createdAt: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString(),
          completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
        }));
        setBookings(fetchedBookings);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, saved_addresses(*)')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
    }
  }, []);

  const fetchHomepageBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*, service:services(name)')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setHomepageBanners(data || []);
    } catch (err: any) {
      console.error('Error fetching homepage banners:', err);
    }
  }, []);

  const fetchServiceAreas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .order('city', { ascending: true });

      if (error) throw error;
      setServiceAreas(data || []);
    } catch (err: any) {
      console.error('Error fetching service areas:', err);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*, maid:maid_profiles(full_name, maid_code), booking:bookings(booking_code)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
    }
  }, []);

  const fetchRatings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*, booking:bookings(booking_code, customer_name), maid:maid_profiles(full_name), service:services(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (err: any) {
      console.error('Error fetching ratings:', err);
    }
  }, []);

  const fetchPlatformSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;
      
      // Convert array of key-value pairs to object
      const settingsObj: any = {};
      data?.forEach((setting: any) => {
        settingsObj[setting.key] = setting.value;
      });
      setPlatformSettings(settingsObj);
    } catch (err: any) {
      console.error('Error fetching platform settings:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        setNotifications(
          data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            category: n.category,
            timestamp: n.created_at
              ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            read: n.is_read,
            linkTab: n.link_tab || 'all-bookings',
          }))
        );
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // ==================== REALTIME SUBSCRIPTIONS ====================
  useEffect(() => {
    // Initial fetch
    fetchServices();
    fetchServiceCategories();
    fetchServiceAddons();
    fetchMaids();
    fetchBookings();
    fetchCustomers();
    fetchCoupons();
    fetchHomepageBanners();
    fetchServiceAreas();
    fetchPayouts();
    fetchRatings();
    fetchPlatformSettings();
    fetchNotifications();

    // Setup realtime subscriptions
    const channel = supabase
      .channel('admin_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchServices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_categories' }, fetchServiceCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_addons' }, fetchServiceAddons)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maid_profiles' }, fetchMaids)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchBookings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, fetchCustomers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, fetchCoupons)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_banners' }, fetchHomepageBanners)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_areas' }, fetchServiceAreas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts' }, fetchPayouts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, fetchRatings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, fetchPlatformSettings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices, fetchServiceCategories, fetchServiceAddons, fetchMaids, fetchBookings, fetchCustomers, fetchCoupons, fetchHomepageBanners, fetchServiceAreas, fetchPayouts, fetchRatings, fetchPlatformSettings, fetchNotifications]);

  // ==================== NAVIGATION FUNCTIONS ====================
  const openAssignMaid = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCurrentTab('assign-maid');
  };

  const openBookingDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCurrentTab('booking-details');
  };

  // ==================== SERVICE OPERATIONS ====================
  const toggleServiceActive = async (serviceId: string) => {
    const current = services.find(s => s.serviceId === serviceId);
    if (!current) return;
    const nextActive = !current.isActive;

    const { error } = await supabaseAdmin
      .from('services')
      .update({ is_active: nextActive, updated_at: new Date().toISOString() })
      .eq('id', serviceId);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServices();
  };

  const addService = async (newService: Omit<Service, 'serviceId'>) => {
    const payload = {
      name: newService.name,
      category: newService.category,
      description: newService.description,
      starting_price: newService.startingPrice,
      price_per_room: newService.pricePerRoom || null,
      estimated_duration: newService.estimatedDuration,
      image_url: newService.imageUrl,
      is_active: newService.isActive ?? true,
      features: newService.features || [],
      display_order: newService.displayOrder || 0,
      is_bestseller: false,
      rating: 0,
      review_count: 0,
    };

    const { error } = await supabaseAdmin.from('services').insert([payload]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServices();
  };

  const updateService = async (serviceId: string, updated: Partial<Service>) => {
    const payload: any = { updated_at: new Date().toISOString() };
    
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.category !== undefined) payload.category = updated.category;
    if (updated.description !== undefined) payload.description = updated.description;
    if (updated.startingPrice !== undefined) payload.starting_price = updated.startingPrice;
    if (updated.pricePerRoom !== undefined) payload.price_per_room = updated.pricePerRoom;
    if (updated.estimatedDuration !== undefined) payload.estimated_duration = updated.estimatedDuration;
    if (updated.imageUrl !== undefined) payload.image_url = updated.imageUrl;
    if (updated.isActive !== undefined) payload.is_active = updated.isActive;
    if (updated.features !== undefined) payload.features = updated.features;
    if (updated.displayOrder !== undefined) payload.display_order = updated.displayOrder;
    if (updated.isBestseller !== undefined) payload.is_bestseller = updated.isBestseller;

    const { error } = await supabaseAdmin.from('services').update(payload).eq('id', serviceId);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServices();
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabaseAdmin.from('services').delete().eq('id', serviceId);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServices();
  };

  // ==================== SERVICE CATEGORY OPERATIONS ====================
  const addServiceCategory = async (category: any) => {
    const { error } = await supabaseAdmin.from('service_categories').insert([{
      ...category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceCategories();
  };

  const updateServiceCategory = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin.from('service_categories').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceCategories();
  };

  const deleteServiceCategory = async (id: string) => {
    const { error } = await supabaseAdmin.from('service_categories').delete().eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceCategories();
  };

  // ==================== SERVICE ADDON OPERATIONS ====================
  const addServiceAddon = async (addon: any) => {
    const { error } = await supabaseAdmin.from('service_addons').insert([{
      ...addon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAddons();
  };

  const updateServiceAddon = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin.from('service_addons').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAddons();
  };

  const deleteServiceAddon = async (id: string) => {
    const { error } = await supabaseAdmin.from('service_addons').delete().eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAddons();
  };

  // ==================== MAID OPERATIONS ====================
  const approveMaid = async (uid: string) => {
    setSelectedMaidForReview(null);
    const approvedAtIso = new Date().toISOString();
    const { error } = await supabase
      .from('maid_profiles')
      .update({ 
        status: 'approved', 
        approved_at: approvedAtIso,
        updated_at: approvedAtIso 
      })
      .eq('id', uid);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchMaids();
  };

  const rejectMaid = async (uid: string, reason: string) => {
    setSelectedMaidForReview(null);
    const rejectedAtIso = new Date().toISOString();
    const rejectedBy = adminUser?.email || 'Admin';
    const { error } = await supabase
      .from('maid_profiles')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: rejectedAtIso,
        rejected_by: rejectedBy,
        updated_at: rejectedAtIso,
      })
      .eq('id', uid);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchMaids();
  };

  const updateMaidKycDocStatus = async (uid: string, docId: string, status: any) => {
    try {
      await supabase
        .from('maid_kyc_documents')
        .update({
          status,
          verified_at: new Date().toISOString(),
          verified_by: adminUser?.id || null,
          verified_by_name: adminUser?.email || 'Admin',
        })
        .eq('id', docId);

      await supabase
        .from('maid_history')
        .insert({
          maid_id: uid,
          action: `KYC Document ${status === 'verified' ? 'Approved' : 'Rejected'}`,
          actor_id: adminUser?.id || null,
          actor_name: adminUser?.email || 'Admin',
          details: `Document ID: ${docId}, Status: ${status}`,
        });

      await fetchMaids();
    } catch (err) {
      console.warn('KYC persistence notice:', err);
    }
  };

  const requestMaidCorrection = async (uid: string, note: string) => {
    const { error } = await supabase
      .from('maid_profiles')
      .update({
        status: 'pending',
        kyc_status: 'incomplete',
        admin_notes: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', uid);

    if (error) {
      setAdminError(error.message);
      return;
    }

    try {
      await supabase
        .from('maid_history')
        .insert({
          maid_id: uid,
          action: 'Correction Requested',
          actor_id: adminUser?.id || null,
          actor_name: adminUser?.email || 'Admin',
          details: note,
        });
    } catch (err) {
      console.warn('Error recording maid history:', err);
    }

    await fetchMaids();
    alert(`Correction request sent to Maid Partner. Admin notes updated.`);
  };

  const toggleMaidOnlineStatus = async (uid: string, isOnline: boolean) => {
    const { error } = await supabase
      .from('maid_profiles')
      .update({ 
        is_online: isOnline,
        updated_at: new Date().toISOString() 
      })
      .eq('id', uid);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchMaids();
  };

  const toggleMaidActiveStatus = async (uid: string, status: any) => {
    const { error } = await supabase
      .from('maid_profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', uid);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchMaids();
  };

  const exportMaidsToCSV = () => {
    const headers = ['Maid ID', 'Name', 'Phone', 'Status', 'Location', 'Rating', 'Jobs Completed', 'Earnings'];
    const rows = maids.map(m => [
      m.maidId || m.uid,
      m.fullName,
      m.phone,
      m.status,
      m.serviceArea,
      m.rating,
      m.completedJobsCount,
      m.totalEarnings || m.earningsThisMonth || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GC_Home_Maid_Partners_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==================== BOOKING OPERATIONS ====================
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
              assignedMaidPhotoUrl: targetMaid.photoUrl,
              assignedMaidRating: targetMaid.rating,
            }
          : b
      )
    );
  };

  const confirmMaidAssignment = async (bookingId: string, maidId: string) => {
    const targetMaid = maids.find(m => m.uid === maidId);
    if (!targetMaid) return;

    const targetBooking = bookings.find(b => b.bookingId === bookingId);
    if (!targetBooking) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'maid_assigned',
        assigned_maid_id: targetMaid.uid,
        assigned_maid_name: targetMaid.fullName,
        assigned_maid_phone: targetMaid.phone,
        assigned_maid_photo_url: targetMaid.photoUrl,
        assigned_maid_rating: targetMaid.rating,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', bookingId);

    if (error) {
      setAdminError(error.message);
      return;
    }

    // Create assignment and notification records
    try {
      const bookingDbId = targetBooking.id;
      if (bookingDbId) {
        await supabase.from('notifications').insert({
          recipient_id: targetMaid.uid,
          recipient_role: 'maid',
          title: 'New Job Assigned',
          message: `You have been assigned to booking ${bookingId} by Admin.`,
          category: 'dispatch',
          related_booking_id: bookingDbId,
        });
      }
    } catch (persistErr) {
      console.warn('Assignment notification error:', persistErr);
    }

    await fetchBookings();
    alert(`Success: ${targetMaid.fullName} has been assigned to booking ${bookingId}!`);
    openBookingDetails(bookingId);
  };

  const autoAssignMaid = (bookingId: string) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    const availableMaid = maids.find(m => m.status === 'approved' && m.isOnline);
    if (availableMaid) {
      confirmMaidAssignment(bookingId, availableMaid.uid);
    } else {
      alert('No active online maids available right now.');
    }
  };

  const createNewBooking = async (newBookingData: Partial<Booking>) => {
    const newCode = `GC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const scheduledDate = newBookingData.date && /^\d{4}-\d{2}-\d{2}$/.test(newBookingData.date)
      ? newBookingData.date
      : new Date().toISOString().split('T')[0];

    const addressObj = newBookingData.address || {
      id: 'addr_new',
      label: 'Home',
      street: 'Kondapur Main Road',
      locality: 'Kondapur',
      city: 'Hyderabad',
      pincode: '500084',
    };

    const payload = {
      booking_code: newCode,
      customer_name: newBookingData.customerName || 'New Customer',
      customer_phone: newBookingData.customerPhone || '+91 98000 00000',
      customer_email: newBookingData.customerEmail || 'customer@example.com',
      service_id: newBookingData.serviceId || null,
      service_name: newBookingData.serviceName || 'Home Cleaning',
      service_price: newBookingData.servicePrice || 799,
      total_amount: newBookingData.totalAmount || 799,
      service_duration: newBookingData.serviceDuration || '3 Hours',
      address_label: addressObj.label || 'Home',
      address_street: addressObj.street || '',
      address_locality: addressObj.locality || '',
      address_city: addressObj.city || 'Hyderabad',
      address_pincode: addressObj.pincode || '',
      scheduled_date: scheduledDate,
      time_slot: newBookingData.timeSlot || '10:00 AM',
      special_instructions: newBookingData.specialInstructions || '',
      status: 'pending_assignment' as const,
      payment_method: 'online' as const,
      payment_status: 'paid' as const,
    };

    const { error } = await supabase
      .from('bookings')
      .insert([payload]);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
    setCreateBookingModalOpen(false);
    alert(`Booking ${newCode} created successfully!`);
  };

  const rescheduleBooking = async (bookingId: string, newDate: string, newTime: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'rescheduled',
        scheduled_date: newDate,
        time_slot: newTime,
        reschedule_reason: 'Rescheduled by admin',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', bookingId);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
    setRescheduleModalOpen(false);
    alert(`Booking ${bookingId} rescheduled successfully!`);
  };

  const cancelBookingWithReason = async (bookingId: string, reason: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', bookingId);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
    setCancelModalOpen(false);
    alert(`Booking ${bookingId} cancelled.`);
  };

  const markJobAsCompleted = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', bookingId);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
    alert(`Job marked as completed!`);
  };

  const updateJobStatus = async (bookingId: string, status: BookingStatus) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', bookingId);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
  };

  // ==================== CUSTOMER OPERATIONS ====================
  const blockCustomer = async (customerId: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_blocked: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', customerId);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCustomers();
  };

  const unblockCustomer = async (customerId: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_blocked: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', customerId);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCustomers();
  };

  const updateCustomerNotes = async (customerId: string, notes: string) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        admin_notes: notes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', customerId);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCustomers();
  };

  const exportCustomersToCSV = () => {
    const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Type', 'Total Bookings', 'Total Spent', 'Join Date'];
    const rows = customers.map(c => [
      c.id,
      c.full_name || c.name,
      c.phone,
      c.email,
      c.customer_type,
      c.total_bookings,
      c.total_spent,
      new Date(c.created_at).toLocaleDateString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GC_Home_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==================== COUPON OPERATIONS ====================
  const addCoupon = async (coupon: any) => {
    const { error } = await supabaseAdmin.from('coupons').insert([{
      ...coupon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCoupons();
  };

  const updateCoupon = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin.from('coupons').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCoupons();
  };

  const toggleCouponActive = async (id: string) => {
    const current = coupons.find(c => c.id === id);
    if (!current) return;

    const { error } = await supabaseAdmin.from('coupons').update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchCoupons();
  };

  // ==================== BANNER OPERATIONS ====================
  const addHomepageBanner = async (banner: any) => {
    const { error } = await supabaseAdmin.from('homepage_banners').insert([{
      ...banner,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchHomepageBanners();
  };

  const updateHomepageBanner = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin.from('homepage_banners').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchHomepageBanners();
  };

  const deleteHomepageBanner = async (id: string) => {
    const { error } = await supabaseAdmin.from('homepage_banners').delete().eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchHomepageBanners();
  };

  // ==================== SERVICE AREA OPERATIONS ====================
  const addServiceArea = async (area: any) => {
    const { error } = await supabaseAdmin.from('service_areas').insert([{
      ...area,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAreas();
  };

  const updateServiceArea = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin.from('service_areas').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAreas();
  };

  const deleteServiceArea = async (id: string) => {
    const { error } = await supabaseAdmin.from('service_areas').delete().eq('id', id);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAreas();
  };

  // ==================== PAYOUT OPERATIONS ====================
  const disburseMaidPayout = async (maidId: string, amount: number) => {
    const { error } = await supabaseAdmin.from('payouts').insert([{
      maid_id: maidId,
      amount,
      status: 'processing',
      reference_id: `PAYOUT-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchPayouts();
    alert(`Payout of ₹${amount} initiated for maid.`);
  };

  const updatePayoutStatus = async (payoutId: string, status: string) => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updateData.disbursed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from('payouts').update(updateData).eq('id', payoutId);
    
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchPayouts();
  };

  // ==================== RATING OPERATIONS ====================
  const toggleRatingVisibility = async (ratingId: string) => {
    const current = ratings.find(r => r.id === ratingId);
    if (!current) return;

    const { error } = await supabaseAdmin.from('ratings').update({
      is_visible: !current.is_visible,
    }).eq('id', ratingId);
    
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchRatings();
  };

  // ==================== PLATFORM SETTINGS OPERATIONS ====================
  const updatePlatformSettings = async (settings: any) => {
    try {
      // Update multiple settings
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        await supabaseAdmin
          .from('platform_settings')
          .upsert({
            key: update.key,
            value: update.value,
            updated_at: update.updated_at,
          }, {
            onConflict: 'key'
          });
      }

      await fetchPlatformSettings();
    } catch (err: any) {
      setAdminError(err.message);
    }
  };

  // ==================== NOTIFICATION OPERATIONS ====================
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .then(() => fetchNotifications());
  };

  const markAllNotificationsAsRead = () => {
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
      .then(() => fetchNotifications());
  };

  const sendBroadcastNotification = async (notification: any) => {
    const { error } = await supabaseAdmin.from('notifications').insert([{
      ...notification,
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchNotifications();
    alert('Broadcast notification sent successfully!');
  };

  // ==================== DASHBOARD & REPORTS ====================
  const getDashboardMetrics = (): DashboardMetrics => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(b => 
      b.date === today || (b.createdAt && b.createdAt.startsWith(today))
    );

    const activeBookings = bookings.filter(b => 
      ['maid_assigned', 'maid_accepted', 'en_route', 'arrived', 'cleaning_started', 'in_progress'].includes(b.status)
    );

    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    
    const activeMaids = maids.filter(m => m.status === 'approved' && m.isOnline);
    
    const totalRevenue = bookings
      .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const todayRevenue = todayBookings
      .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const avgRating = ratings.length > 0
      ? ratings.filter(r => r.is_visible).reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.filter(r => r.is_visible).length
      : 0;

    return {
      todayBookings: todayBookings.length,
      activeBookings: activeBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      activeMaids: activeMaids.length,
      totalMaids: maids.length,
      totalRevenue,
      todayRevenue,
      averageRating: Number(avgRating.toFixed(1)),
      totalCustomers: customers.length,
    };
  };

  const exportBookingsToCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Service', 'Date', 'Time', 'Status', 'Amount', 'Assigned Maid', 'Payment Status'];
    const rows = bookings.map(b => [
      b.bookingId,
      b.customerName,
      b.serviceName,
      b.date,
      b.timeSlot,
      b.status,
      b.totalAmount,
      b.assignedMaidName || 'Unassigned',
      b.paymentStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GC_Home_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==================== CONTEXT VALUE ====================
  const value: AdminContextType = {
    isAdminLoggedIn,
    authLoading,
    adminUser,
    adminError,
    setAdminError,
    services,
    serviceCategories,
    serviceAddons,
    maids,
    bookings,
    customers,
    coupons,
    homepageBanners,
    serviceAreas,
    payouts,
    ratings,
    platformSettings,
    currentTab,
    selectedBookingId,
    selectedBooking,
    selectedMaidForReview,
    selectedBookingForAssignment,
    createBookingModalOpen,
    rescheduleModalOpen,
    cancelModalOpen,
    setCreateBookingModalOpen,
    setRescheduleModalOpen,
    setCancelModalOpen,
    loginAdmin,
    loginAdminWithCredentials,
    loginWithGoogle,
    resetPassword,
    logoutAdmin,
    setCurrentTab,
    sidebarCollapsed,
    toggleSidebarCollapse,
    openAssignMaid,
    openBookingDetails,
    setSelectedMaidForReview,
    setSelectedBookingForAssignment,
    toggleServiceActive,
    addService,
    updateService,
    deleteService,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    addServiceAddon,
    updateServiceAddon,
    deleteServiceAddon,
    approveMaid,
    rejectMaid,
    updateMaidKycDocStatus,
    requestMaidCorrection,
    toggleMaidOnlineStatus,
    toggleMaidActiveStatus,
    exportMaidsToCSV,
    assignMaidToBooking,
    confirmMaidAssignment,
    autoAssignMaid,
    createNewBooking,
    rescheduleBooking,
    cancelBookingWithReason,
    markJobAsCompleted,
    updateJobStatus,
    blockCustomer,
    unblockCustomer,
    updateCustomerNotes,
    exportCustomersToCSV,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponActive,
    addHomepageBanner,
    updateHomepageBanner,
    deleteHomepageBanner,
    addServiceArea,
    updateServiceArea,
    deleteServiceArea,
    disburseMaidPayout,
    updatePayoutStatus,
    toggleRatingVisibility,
    updatePlatformSettings,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    sendBroadcastNotification,
    getDashboardMetrics,
    exportBookingsToCSV,
    selectedLocation,
    selectedTimezone,
    setSelectedLocation,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
