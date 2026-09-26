import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Service, MaidProfile, Booking, DashboardMetrics, BookingStatus } from '../types';
import { supabase, supabaseAdmin } from '../config/supabase';
import { formatDateDDMMYYYY } from '../utils/bookingDisplayUtils';

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
  maidsLoading: boolean;
  maidsError: string | null;
  refreshMaids: () => Promise<void>;
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
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
  addService: (newService: Omit<Service, 'serviceId'>) => Promise<boolean>;
  updateService: (serviceId: string, updated: Partial<Service>) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  
  // Service Category Operations
  addServiceCategory: (category: any) => Promise<boolean>;
  updateServiceCategory: (id: string, updates: any) => Promise<boolean>;
  deleteServiceCategory: (id: string) => Promise<boolean>;
  
  // Service Addon Operations
  addServiceAddon: (addon: any) => Promise<boolean>;
  updateServiceAddon: (id: string, updates: any) => Promise<boolean>;
  deleteServiceAddon: (id: string) => Promise<boolean>;
  
  // Maid Operations
  approveMaid: (uid: string) => Promise<void>;
  rejectMaid: (uid: string, reason: string) => Promise<void>;
  updateMaidKycDocStatus: (uid: string, docId: string, status: any) => Promise<void>;
  requestMaidCorrection: (uid: string, note: string) => Promise<void>;
  updateItemVerification: (uid: string, itemPath: string, status: 'verified' | 'rejected' | 'reupload_required', reason?: string) => Promise<void>;
  toggleMaidOnlineStatus: (uid: string, isOnline: boolean) => Promise<void>;
  toggleMaidActiveStatus: (uid: string, status: any) => Promise<void>;
  exportMaidsToCSV: () => void;
  
  // Booking Operations
  assignMaidToBooking: (bookingId: string, maidId: string) => void;
  confirmMaidAssignment: (bookingId: string, maidId: string) => Promise<void>;
  sendPartnerAssignmentRequest: (bookingId: string, partnerId: string, distanceKm?: number, etaMins?: number) => Promise<boolean>;
  cancelPartnerAssignmentRequest: (bookingId: string, partnerId: string) => Promise<boolean>;
  acceptPartnerAssignment: (bookingId: string, partnerId: string) => Promise<boolean>;
  declinePartnerAssignment: (bookingId: string, partnerId: string, reason?: string) => Promise<boolean>;
  autoAssignMaid: (bookingId: string) => void;
  createNewBooking: (newBookingData: Partial<Booking>) => Promise<void>;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string) => Promise<void>;
  cancelBookingWithReason: (bookingId: string, reason: string) => Promise<void>;
  markJobAsCompleted: (bookingId: string) => Promise<void>;
  updateJobStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  finalizeSlotAdmin: (bookingId: string) => Promise<void>;
  resolveRedFlagAdmin: (bookingId: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  
  // Customer Operations
  blockCustomer: (customerId: string) => Promise<void>;
  unblockCustomer: (customerId: string) => Promise<void>;
  updateCustomerNotes: (customerId: string, notes: string) => Promise<void>;
  exportCustomersToCSV: () => void;
  
  // Offer Operations
  offers: any[];
  fetchOffers: () => Promise<void>;
  addOffer: (offer: any) => Promise<boolean>;
  updateOffer: (id: string, updates: any) => Promise<boolean>;
  deleteOffer: (id: string) => Promise<boolean>;
  toggleOfferActive: (id: string) => Promise<boolean>;

  // Coupon Operations (Legacy Aliases)
  addCoupon: (coupon: any) => Promise<void>;
  updateCoupon: (id: string, updates: any) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponActive: (id: string) => Promise<void>;
  
  // Banner Operations
  addHomepageBanner: (banner: any) => Promise<boolean>;
  updateHomepageBanner: (id: string, updates: any) => Promise<boolean>;
  deleteHomepageBanner: (id: string) => Promise<boolean>;
  toggleHomepageBannerActive: (id: string) => Promise<boolean>;
  
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

export const LOCATION_TIMEZONE_MAP: Record<string, { timezone: string; label: string; region: string }> = {
  'Karimnagar': { timezone: 'Asia/Kolkata', label: 'Karimnagar (IST)', region: 'Telangana' },
  'Kazipet': { timezone: 'Asia/Kolkata', label: 'Kazipet (IST)', region: 'Telangana' },
  'Hanamkonda': { timezone: 'Asia/Kolkata', label: 'Hanamkonda (IST)', region: 'Telangana' },
  'Warangal': { timezone: 'Asia/Kolkata', label: 'Warangal (IST)', region: 'Telangana' },
};

// ==================== LOCATION HELPER FUNCTIONS (NO HUB FILTERING) ====================
export const isLocationMatchingHub = (_locationText: string | undefined | null, _hub?: string): boolean => {
  return true;
};

export const isBookingInHub = (_row: any, _hub?: string): boolean => {
  return true;
};

export const isMaidInHub = (_row: any, _hub?: string): boolean => {
  return true;
};

export const isFakeLocation = (loc?: string | null): boolean => {
  if (!loc) return true;
  const cleaned = loc.trim().toLowerCase();
  if (!cleaned) return true;
  return (
    cleaned === 'hyderabad, telangana' ||
    cleaned === 'hyderabad' ||
    cleaned === 'telangana' ||
    cleaned === 'not specified' ||
    cleaned === 'address not added' ||
    cleaned === 'unknown' ||
    cleaned === 'undefined' ||
    cleaned === 'null'
  );
};

export const TAB_ROUTE_MAP: Record<string, string> = {
  'dashboard': '/admin/dashboard',
  'dispatch': '/admin/dispatch',
  'live-jobs': '/admin/live-jobs',
  'operations': '/admin/live-jobs',
  'all-bookings': '/admin/bookings',
  'bookings': '/admin/bookings',
  'pending-bookings': '/admin/bookings/pending',
  'ongoing-bookings': '/admin/bookings/ongoing',
  'completed-bookings': '/admin/bookings/completed',
  'cancelled-bookings': '/admin/bookings/cancelled',
  'rescheduled-bookings': '/admin/bookings/rescheduled',
  'assign-maid': '/admin/bookings/assign',
  'booking-details': '/admin/bookings',
  'maids': '/admin/partners',
  'all-maids': '/admin/partners',
  'pending-approvals': '/admin/partners/pending',
  'pending-maid-details': '/admin/partners/pending',
  'pending-kyc': '/admin/partners/pending-kyc',
  'approved-maids': '/admin/partners/approved',
  'active-maids': '/admin/partners/approved',
  'inactive-maids': '/admin/partners/inactive',
  'customers': '/admin/customers',
  'services': '/admin/services',
  'services-catalog': '/admin/services',
  'categories': '/admin/categories',
  'service-categories': '/admin/categories',
  'addons': '/admin/addons',
  'service-addons': '/admin/addons',
  'offers': '/admin/offers',
  'banners': '/admin/banners',
  'service-areas': '/admin/service-areas',
  'service_areas': '/admin/service-areas',
  'chat': '/admin/chat',
  'chat-management': '/admin/chat',
  'communications': '/admin/chat',
  'payments': '/admin/payments',
  'payment-reports': '/admin/payments',
  'cash-reports': '/admin/payments',
  'partner-payouts': '/admin/payouts',
  'payouts': '/admin/payouts',
  'transactions': '/admin/payouts',
  'revenue': '/admin/financials',
  'financials': '/admin/financials',
  'notifications': '/admin/notifications',
  'reports': '/admin/reports',
  'settings': '/admin/settings',
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

  const [selectedLocation, setSelectedLocationState] = useState<string>('All');
  const selectedTimezone = 'Asia/Kolkata';

  const setSelectedLocation = (_location: string) => {
    setSelectedLocationState('All');
  };

  const selectedLocationRef = useRef<string>('All');

  const navigate = useNavigate();
  const location = useLocation();

  // Compute currentTab from current URL pathname so it stays reactive on back/forward/refresh
  const currentTab = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/admin/bookings/pending')) return 'pending-bookings';
    if (path.includes('/admin/bookings/ongoing')) return 'ongoing-bookings';
    if (path.includes('/admin/bookings/completed')) return 'completed-bookings';
    if (path.includes('/admin/bookings/cancelled')) return 'cancelled-bookings';
    if (path.includes('/admin/bookings/rescheduled')) return 'rescheduled-bookings';
    if (path.includes('/admin/bookings/assign')) return 'assign-maid';
    if (path.match(/\/admin\/bookings\/[^/]+/)) return 'booking-details';
    if (path.includes('/admin/bookings')) return 'all-bookings';
    if (path.includes('/admin/partners/pending-kyc') || path.includes('/admin/partners/kyc')) return 'pending-kyc';
    if (path.includes('/admin/partners/pending')) return 'pending-approvals';
    if (path.includes('/admin/partners/approved') || path.includes('/admin/partners/active')) return 'approved-maids';
    if (path.includes('/admin/partners/inactive')) return 'inactive-maids';
    if (path.includes('/admin/partners')) return 'maids';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/addons')) return 'addons';
    if (path.includes('/admin/offers')) return 'offers';
    if (path.includes('/admin/banners')) return 'banners';
    if (path.includes('/admin/services')) return 'services';
    if (path.includes('/admin/customers')) return 'customers';
    if (path.includes('/admin/service-areas')) return 'service-areas';
    if (path.includes('/admin/chat')) return 'chat';
    if (path.includes('/admin/payments')) return 'payments';
    if (path.includes('/admin/payouts')) return 'payouts';
    if (path.includes('/admin/financials') || path.includes('/admin/revenue')) return 'revenue';
    if (path.includes('/admin/notifications')) return 'notifications';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/dispatch')) return 'dispatch';
    if (path.includes('/admin/live-jobs') || path.includes('/admin/operations')) return 'live-jobs';
    return 'dashboard';
  }, [location.pathname]);

  const setCurrentTab = useCallback((tab: string) => {
    const targetRoute = TAB_ROUTE_MAP[tab] || `/admin/${tab}`;
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  }, [navigate, location.pathname]);

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
  const [maidsLoading, setMaidsLoading] = useState<boolean>(true);
  const [maidsError, setMaidsError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
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
    navigate('/login');
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
          categoryId: row.category_id || row.category?.id || undefined,
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

  const fetchMaids = useCallback(async (_hubToUse?: string, isSilent = false) => {
    if (!isSilent) {
      setMaidsLoading(true);
      setMaidsError(null);
    }
    try {
      // Query all maid profiles without brittle SQL string filters so newly registered partners are always included
      const { data, error } = await supabase
        .from('maid_profiles')
        .select('*');

      if (error) throw error;

      if (data) {
        // Sort newest first by latest available timestamp
        data.sort((a: any, b: any) => {
          const timeA = new Date(a.latest_applied_at || a.applied_at || a.created_at || a.updated_at || 0).getTime();
          const timeB = new Date(b.latest_applied_at || b.applied_at || b.created_at || b.updated_at || 0).getTime();
          return timeB - timeA;
        });

        const fetchedProfiles: MaidProfile[] = data.map((row: any) => {
          let rawSkills: any[] = [];
          if (Array.isArray(row.services_provided) && row.services_provided.length > 0) {
            rawSkills = row.services_provided;
          } else if (Array.isArray(row.skills) && row.skills.length > 0) {
            rawSkills = row.skills;
          }

          const normalizedSkills: string[] = [];
          const normalizedServicesProvided: any[] = [];

          rawSkills.forEach((s: any) => {
            if (typeof s === 'object' && s !== null) {
              const name = s.serviceName || s.name || 'General Service';
              normalizedSkills.push(name);
              normalizedServicesProvided.push(s);
            } else if (typeof s === 'string') {
              if (s.startsWith('{')) {
                try {
                  const obj = JSON.parse(s);
                  const name = obj.serviceName || obj.name || s;
                  normalizedSkills.push(name);
                  normalizedServicesProvided.push(obj);
                } catch {
                  normalizedSkills.push(s);
                }
              } else {
                normalizedSkills.push(s);
              }
            }
          });

          // Fallback if empty
          if (normalizedSkills.length === 0) {
            normalizedSkills.push('General Cleaning');
          }

          let parsedKycDocs = row.kyc_documents;
          if (typeof parsedKycDocs === 'string') {
            try { parsedKycDocs = JSON.parse(parsedKycDocs); } catch { parsedKycDocs = {}; }
          }

          return {
            uid: row.id,
            maidId: row.maid_code || row.id || 'MD001',
            fullName: row.full_name || 'Maid Partner',
            phone: row.phone || '',
            email: row.email || '',
            dob: row.dob || row.date_of_birth || '',
            gender: row.gender || '',
            photoUrl: row.photo_url || parsedKycDocs?.profilePhotoUrl || parsedKycDocs?.photoUrl || '',
            idProofUrl: row.id_proof_url || parsedKycDocs?.aadhaarFrontUrl || '',
            emergencyContact: row.emergency_contact || (row.emergency_contact_name ? `${row.emergency_contact_name} (${row.emergency_contact_phone || ''})` : ''),
            emergencyContactName: row.emergency_contact_name,
            emergencyContactPhone: row.emergency_contact_phone,
            address: row.address || row.full_address || `${row.locality || row.service_area || ''}, ${row.city || ''}`,
            fullAddress: row.full_address || row.address,
            locality: row.locality,
            pincode: row.pincode,
            city: row.city || 'Telangana',
            bankDetails: {
              accountName: row.bank_account_name || row.full_name || '',
              accountNumber: row.bank_account_number || '',
              ifscCode: row.bank_ifsc || '',
              bankName: row.bank_name || '',
              upiId: row.upi_id || parsedKycDocs?.upiId,
            },
            serviceArea: row.service_area || row.preferred_service_area || row.city || 'Telangana',
            preferredServiceArea: row.preferred_service_area || row.service_area,
            preferredCities: Array.isArray(row.preferred_cities) ? row.preferred_cities : (row.service_area ? row.service_area.split(',').map((s: string) => s.trim()) : []),
            serviceRadiusKm: row.service_radius_km || 5,
            healthSafetyDecl: Boolean(row.health_safety_decl),
            status: row.status || 'pending',
            kycStatus: row.kyc_status || 'pending',
            kycCompletionPct: row.kyc_completion_pct || 0,
            kycDocuments: Array.isArray(parsedKycDocs) ? parsedKycDocs : [],
            rejectionReason: row.rejection_reason,
            rejectedBy: row.rejected_by,
            rejectedAt: row.rejected_at,
            isOnline: row.is_online ?? false,
            rating: row.rating ? Number(row.rating) : 5.0,
            totalRatingsCount: row.total_ratings_count || 0,
            completedJobsCount: row.completed_jobs_count || 0,
            workingDays: Array.isArray(row.working_days) ? row.working_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            workingHours: row.working_hours || '08:00 AM - 08:00 PM',
            emergencyJobsAccepted: Boolean(row.emergency_jobs_accepted),
            skills: normalizedSkills,
            servicesProvided: normalizedServicesProvided,
            preferredAreas: Array.isArray(row.preferred_areas) ? row.preferred_areas : [],
            languages: Array.isArray(row.languages) ? row.languages : (Array.isArray(row.languages_spoken) ? row.languages_spoken : []),
            languagesSpoken: Array.isArray(row.languages_spoken) ? row.languages_spoken : (Array.isArray(row.languages) ? row.languages : []),
            earningsThisMonth: row.earnings_this_month || 0,
            totalEarnings: row.total_earnings || 0,
            adminNotes: row.admin_notes,
            appliedAt: row.applied_at ? new Date(row.applied_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            approvedAt: row.approved_at,
            aadhaarDocUrl: row.aadhaar_doc_url || parsedKycDocs?.aadhaarFrontUrl,
            panDocUrl: row.pan_doc_url || parsedKycDocs?.panUrl,
            otherDocsUrls: Array.isArray(row.other_docs_urls)
              ? row.other_docs_urls
              : (Array.isArray(parsedKycDocs?.documents)
                  ? parsedKycDocs.documents.map((d: any) => d.fileUrl).filter(Boolean)
                  : (parsedKycDocs?.otherDocs || [])),
            rawKycDocuments: parsedKycDocs,
            termsAccepted: Boolean(row.terms_accepted),
            privacyAccepted: Boolean(row.privacy_accepted),
            accuracyConfirmed: Boolean(row.accuracy_confirmed),
            correctionRequested: Boolean(row.correction_requested),
            reapplicationCount: row.reapplication_count || (Array.isArray(row.application_history) ? row.application_history.length : 0),
            latestAppliedAt: row.latest_applied_at ? new Date(row.latest_applied_at).toISOString().split('T')[0] : (row.applied_at ? new Date(row.applied_at).toISOString().split('T')[0] : undefined),
            applicationHistory: Array.isArray(row.application_history)
              ? row.application_history
              : (typeof row.application_history === 'string'
                  ? (() => { try { return JSON.parse(row.application_history); } catch { return []; } })()
                  : []),
            submittedAt: row.submitted_at || null,
            verificationStatus: typeof row.verification_status === 'object' && row.verification_status !== null ? row.verification_status : undefined,
          };
        });
        setMaids(fetchedProfiles);
      } else {
        setMaids([]);
      }
    } catch (err: any) {
      console.error('Error fetching maids:', err);
      if (!isSilent) {
        setMaidsError(err.message || 'Failed to load partners from database');
      }
    } finally {
      if (!isSilent) {
        setMaidsLoading(false);
      }
    }
  }, []);

  const fetchBookings = useCallback(async (_hubToUse?: string, isSilent = false) => {
    try {
      if (!isSilent) {
        setBookingsLoading(true);
        setBookingsError(null);
      }

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
          customerPhone: row.customer_phone || '',
          customerEmail: row.customer_email || '',
          serviceId: row.service_id || '',
          serviceName: row.service_name || 'Service',
          servicePrice: Number(row.service_price || row.total_amount || 0),
          totalAmount: Number(row.total_amount || 0),
          couponCode: row.coupon_code || undefined,
          discountAmount: row.discount_amount !== undefined && row.discount_amount !== null ? Number(row.discount_amount) : undefined,
          platformFee: row.platform_fee !== undefined && row.platform_fee !== null ? Number(row.platform_fee) : undefined,
          taxAmount: row.tax_amount !== undefined && row.tax_amount !== null ? Number(row.tax_amount) : undefined,
          serviceDuration: row.service_duration || '3 Hours',
          address: {
            id: 'addr_' + (row.booking_code || row.id),
            label: row.address_label || 'Home',
            street: row.address_street || '',
            locality: row.address_locality || '',
            city: row.address_city || 'Telangana',
            pincode: row.address_pincode || '',
          },
          date: row.scheduled_date || 'Today',
          timeSlot: row.time_slot || '10:00 AM',
          specialInstructions: row.special_instructions,
          status: row.status || 'pending_assignment',
          adminApprovalStatus: row.admin_approval_status || 'pending',
          assignmentStatus: row.assignment_status || 'unassigned',
          categoryName: row.category_name || 'General',
          selectedAddOns: Array.isArray(row.selected_addons) ? row.selected_addons : [],
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
          slotReminderSentAt: row.slot_reminder_sent_at,
          slotConfirmationStatus: row.slot_confirmation_status,
          customerConfirmedSlot: row.customer_confirmed_slot,
          customerSlotConfirmedAt: row.customer_slot_confirmed_at,
          maidConfirmedSlot: row.maid_confirmed_slot,
          maidSlotConfirmedAt: row.maid_slot_confirmed_at,
          fiveMinCheckTriggeredAt: row.five_min_check_triggered_at,
          adminFinalizedAt: row.admin_finalized_at,
          adminResolvedAt: row.admin_resolved_at,
        }));
        setBookings(fetchedBookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      if (!isSilent) {
        setBookingsError(err?.message || 'Failed to fetch bookings from Supabase');
      }
    } finally {
      if (!isSilent) {
        setBookingsLoading(false);
      }
    }
  }, []);

  const fetchCustomers = useCallback(async (_hubToUse?: string) => {
    try {
      // 1. Concurrently fetch user_profiles, maid_profiles, bookings, and saved_addresses from Supabase
      const [profilesRes, maidsRes, bookingsRes, savedAddressesRes] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('maid_profiles').select('*'),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('saved_addresses').select('*').order('is_default', { ascending: false }),
      ]);

      const profilesData = profilesRes.data || [];
      const maidsData = maidsRes.data || [];
      const dbBookings = bookingsRes.data || [];
      const savedAddressesData = savedAddressesRes.data || [];

      // 2. Build quick lookup maps for maid profiles by ID and clean phone
      const maidByPhone = new Map<string, any>();
      const maidById = new Map<string, any>();
      maidsData.forEach((m: any) => {
        if (m.id) maidById.set(m.id, m);
        const cleanP = (m.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanP) maidByPhone.set(cleanP, m);
      });

      // Build saved addresses lookup map by user_id
      const addressesByUser = new Map<string, any[]>();
      savedAddressesData.forEach((addr: any) => {
        if (!addr.user_id) return;
        if (!addressesByUser.has(addr.user_id)) {
          addressesByUser.set(addr.user_id, []);
        }
        addressesByUser.get(addr.user_id)!.push(addr);
      });

      const customerMap = new Map<string, any>();

      // 3. Populate from user_profiles table
      profilesData.forEach((p: any) => {
        if (p.role === 'admin') return; // Skip internal admin accounts

        const custKey = p.id || p.phone;
        if (!custKey) return;

        const cleanPhone = (p.phone || '').replace(/\D/g, '').slice(-10);
        const maidMatch = maidById.get(p.id) || (cleanPhone ? maidByPhone.get(cleanPhone) : null);
        const isPartner = Boolean(maidMatch || p.maid_application_status === 'approved' || p.maid_application_status === 'pending');
        const partnerStatus = maidMatch?.status || p.maid_application_status || 'none';

        // Separate Customer Bookings from Partner Jobs
        const userBookings = dbBookings.filter(b => 
          b.customer_id === p.id || (cleanPhone && (b.customer_phone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
        );

        // Only sum paid bookings for lifetime spend (excluding unpaid Pay After Service & cancelled)
        const paidBookings = userBookings.filter(b => 
          (b.payment_status === 'paid' || b.paymentStatus === 'paid') && b.status !== 'cancelled'
        );
        const totalSpent = paidBookings.reduce((sum, b) => sum + (Number(b.total_amount || b.service_price) || 0), 0);

        // Separate Partner Jobs (services performed as maid)
        const partnerJobs = dbBookings.filter(b => 
          b.assigned_maid_id === p.id || (maidMatch && b.assigned_maid_id === maidMatch.id)
        );

        let custType: 'VIP Member' | 'Regular Customer' | 'First-time Customer' = 'First-time Customer';
        if (totalSpent > 5000 || userBookings.length >= 5) {
          custType = 'VIP Member';
        } else if (userBookings.length > 1) {
          custType = 'Regular Customer';
        }

        const rawEmail = p.email || (maidMatch ? maidMatch.email : '');
        const cleanEmail = rawEmail && !rawEmail.includes('customer@gchome.com') && !rawEmail.includes('example.com') ? rawEmail : '';

        const latestBooking = userBookings[0];
        const lastBookingDateFormatted = latestBooking?.scheduled_date || latestBooking?.created_at
          ? formatDateDDMMYYYY(latestBooking.scheduled_date || latestBooking.created_at)
          : 'No bookings';

        // Retrieve actual address entered/saved by customer
        const userSavedAddrs = addressesByUser.get(p.id) || [];
        const primarySavedAddr = userSavedAddrs.find((a: any) => a.is_default) || userSavedAddrs[0];

        let actualLocality = '';
        if (primarySavedAddr) {
          const loc = (primarySavedAddr.locality || primarySavedAddr.street_address || primarySavedAddr.street || primarySavedAddr.city || '').trim();
          if (loc && !isFakeLocation(loc)) {
            actualLocality = loc;
          }
        }
        if (!actualLocality) {
          const pLoc = (p.locality || p.address || p.city || '').trim();
          if (pLoc && !isFakeLocation(pLoc)) {
            actualLocality = pLoc;
          }
        }
        if (!actualLocality) {
          const bkWithLoc = userBookings.find(b => 
            (b.address_locality && !isFakeLocation(b.address_locality)) ||
            (b.address_street && !isFakeLocation(b.address_street)) ||
            (b.address_city && !isFakeLocation(b.address_city))
          );
          if (bkWithLoc) {
            actualLocality = (bkWithLoc.address_locality || bkWithLoc.address_street || bkWithLoc.address_city || '').trim();
          }
        }

        const displayLocality = actualLocality || 'Address not added';

        const customerAddressObj = primarySavedAddr ? {
          id: primarySavedAddr.id,
          label: primarySavedAddr.label || 'Home',
          street: (primarySavedAddr.street_address || primarySavedAddr.street || '').trim(),
          locality: (primarySavedAddr.locality || '').trim(),
          city: (primarySavedAddr.city && !isFakeLocation(primarySavedAddr.city) ? primarySavedAddr.city : '').trim(),
          pincode: (primarySavedAddr.pincode || '').trim(),
        } : {
          id: 'addr_' + (p.id || '1'),
          label: 'Home',
          street: (p.address && !isFakeLocation(p.address) ? p.address : '').trim(),
          locality: actualLocality && actualLocality !== 'Address not added' ? actualLocality : '',
          city: (p.city && !isFakeLocation(p.city) ? p.city : '').trim(),
          pincode: (p.pincode || '').trim(),
        };

        // Important: Customer's underlying address remains authentic, Hub is an operational scope
        customerMap.set(custKey, {
          id: p.id || p.phone,
          name: p.name || p.full_name || (maidMatch ? maidMatch.full_name : 'Registered Customer'),
          phone: p.phone || (maidMatch ? maidMatch.phone : ''),
          email: cleanEmail,
          avatarUrl: p.profile_photo_url || (maidMatch ? maidMatch.photo_url : '') || '',
          customerType: p.customer_type || custType,
          locality: displayLocality,
          address: customerAddressObj,
          totalBookings: userBookings.length,
          totalSpent: totalSpent,
          joinedDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastBookingDate: lastBookingDateFormatted,
          status: p.is_active === false ? 'blocked' : 'active',
          ratingGiven: 5.0,
          notes: p.notes || '',
          // Dual-role metadata
          isPartner,
          partnerStatus,
          partnerProfile: maidMatch || null,
          partnerJobsCount: partnerJobs.length,
          customerBookingsCount: userBookings.length,
        });
      });

      // 4. Derive and merge any unprofiled bookings in this Hub
      dbBookings.forEach(b => {
        const custId = b.customer_id || b.customer_phone || b.id;
        if (!custId) return;

        const cleanPhone = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
        const existing = customerMap.get(custId) || (cleanPhone ? customerMap.get(cleanPhone) : null);
        const userBookings = dbBookings.filter(bk => 
          bk.customer_id === b.customer_id || (b.customer_phone && bk.customer_phone === b.customer_phone)
        );
        const paidBookings = userBookings.filter(bk => 
          (bk.payment_status === 'paid' || bk.paymentStatus === 'paid') && bk.status !== 'cancelled'
        );
        const totalSpent = paidBookings.reduce((sum, bk) => sum + (Number(bk.total_amount || bk.service_price) || 0), 0);

        let custType: 'VIP Member' | 'Regular Customer' | 'First-time Customer' = 'First-time Customer';
        if (totalSpent > 5000 || userBookings.length >= 5) {
          custType = 'VIP Member';
        } else if (userBookings.length > 1) {
          custType = 'Regular Customer';
        }

        const rawBookingEmail = b.customer_email || '';
        const cleanBookingEmail = rawBookingEmail && !rawBookingEmail.includes('customer@gchome.com') && !rawBookingEmail.includes('example.com') ? rawBookingEmail : '';

        const bookingDateFormatted = b.scheduled_date || b.created_at
          ? formatDateDDMMYYYY(b.scheduled_date || b.created_at)
          : (existing?.lastBookingDate || 'No bookings in hub');

        if (existing) {
          customerMap.set(existing.id, {
            ...existing,
            name: existing.name && existing.name !== 'Registered Customer' ? existing.name : (b.customer_name || existing.name),
            phone: existing.phone || b.customer_phone || '',
            email: existing.email || cleanBookingEmail || '',
            totalBookings: userBookings.length,
            totalSpent: totalSpent,
            customerType: custType,
            lastBookingDate: bookingDateFormatted,
            address: existing.address,
            customerBookingsCount: userBookings.length,
          });
        } else {
          const bLoc = (b.address_locality || b.address_city || b.address_street || '').trim();
          const unprofiledLocality = (bLoc && !isFakeLocation(bLoc)) ? bLoc : 'Address not added';

          customerMap.set(custId, {
            id: custId,
            name: b.customer_name || 'Customer',
            phone: b.customer_phone || '',
            email: cleanBookingEmail,
            avatarUrl: '',
            customerType: custType,
            locality: unprofiledLocality,
            address: {
              id: 'addr_' + custId,
              label: b.address_label || 'Home',
              street: (b.address_street && !isFakeLocation(b.address_street) ? b.address_street : '').trim(),
              locality: (b.address_locality && !isFakeLocation(b.address_locality) ? b.address_locality : '').trim(),
              city: (b.address_city && !isFakeLocation(b.address_city) ? b.address_city : '').trim(),
              pincode: (b.address_pincode || '').trim(),
            },
            totalBookings: userBookings.length,
            totalSpent: totalSpent,
            joinedDate: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastBookingDate: bookingDateFormatted,
            status: 'active',
            ratingGiven: 5.0,
            notes: '',
            isPartner: false,
            partnerStatus: 'none',
            partnerProfile: null,
            partnerJobsCount: 0,
            customerBookingsCount: userBookings.length,
          });
        }
      });

      const customerList = Array.from(customerMap.values());
      setCustomers(customerList);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map(row => ({
        ...row,
        image_url: row.image_url || (row.badge_color?.startsWith('offers/') || row.badge_color?.startsWith('http') ? row.badge_color : ''),
      }));
      setOffers(mapped);
      setCoupons(mapped);
    } catch (err: any) {
      console.error('Error fetching offers:', err);
    }
  }, []);

  const fetchCoupons = fetchOffers;

  const fetchHomepageBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .order('created_at', { ascending: false });

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
      const mapped = (data || []).map((row: any) => ({
        ...row,
        locality: row.locality_name || row.locality || row.zone_name || '',
        is_serviceable: row.is_serviceable !== undefined ? Boolean(row.is_serviceable) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
        is_active: row.is_active !== undefined ? Boolean(row.is_active) : (row.is_serviceable !== undefined ? Boolean(row.is_serviceable) : true),
      }));
      setServiceAreas(mapped);
    } catch (err: any) {
      console.error('Error fetching service areas:', err);
    }
  }, []);

  const fetchPayouts = useCallback(async (_hubToUse?: string) => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*, maid:maid_profiles(full_name, maid_code, city, locality, service_area, preferred_cities), booking:bookings(booking_code, address_city, address_locality, address_street)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
    }
  }, []);

  const fetchRatings = useCallback(async (_hubToUse?: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*, maid:maid_profiles(full_name, city, locality, service_area), booking:bookings(booking_code, address_city, address_locality, address_street)')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Notice fetching ratings:', error.message);
        return;
      }
      setRatings(data || []);
    } catch (err: any) {
      console.warn('Error fetching ratings:', err);
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
    // Initial fetch using active Hub
    fetchServices();
    fetchServiceCategories();
    fetchServiceAddons();
    fetchMaids(selectedLocation);
    fetchBookings(selectedLocation);
    fetchCustomers(selectedLocation);
    fetchCoupons();
    fetchHomepageBanners();
    fetchServiceAreas();
    fetchPayouts(selectedLocation);
    fetchRatings(selectedLocation);
    fetchPlatformSettings();
    fetchNotifications();

    // Fast heartbeat poll to guarantee instant reflection of newly registered partners and bookings without triggering loading state flicker
    const pollInterval = setInterval(() => {
      fetchMaids(selectedLocationRef.current, true);
      fetchBookings(selectedLocationRef.current, true);
      fetchNotifications();
    }, 5000);

    // Setup realtime subscriptions - Always use selectedLocationRef.current with silent updates
    const channel = supabase
      .channel('admin_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchServices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_categories' }, fetchServiceCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_addons' }, fetchServiceAddons)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maid_profiles' }, () => {
        fetchMaids(selectedLocationRef.current, true);
        fetchCustomers(selectedLocationRef.current);
        fetchNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings(selectedLocationRef.current, true);
        fetchCustomers(selectedLocationRef.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_assignments' }, () => {
        fetchBookings(selectedLocationRef.current, true);
        fetchCustomers(selectedLocationRef.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
        fetchCustomers(selectedLocationRef.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_addresses' }, () => {
        fetchCustomers(selectedLocationRef.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, fetchOffers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_banners' }, fetchHomepageBanners)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_areas' }, fetchServiceAreas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts' }, () => {
        fetchPayouts(selectedLocationRef.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, () => {
        fetchRatings(selectedLocationRef.current);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, fetchPlatformSettings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchServices, fetchServiceCategories, fetchServiceAddons, fetchMaids, fetchBookings, fetchCustomers, fetchOffers, fetchCoupons, fetchHomepageBanners, fetchServiceAreas, fetchPayouts, fetchRatings, fetchPlatformSettings, fetchNotifications, selectedLocation]);

  // ==================== NAVIGATION FUNCTIONS ====================
  const openAssignMaid = useCallback((bookingId: string) => {
    setSelectedBookingId(bookingId);
    navigate(`/admin/bookings/assign/${bookingId}`);
  }, [navigate]);

  const openBookingDetails = useCallback((bookingId: string) => {
    setSelectedBookingId(bookingId);
    navigate(`/admin/bookings/${bookingId}`);
  }, [navigate]);

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
    const payload: any = {
      name: newService.name,
      category: newService.category,
      category_id: (newService as any).categoryId || null,
      description: newService.description,
      starting_price: newService.startingPrice,
      price_per_room: newService.pricePerRoom || null,
      estimated_duration: newService.estimatedDuration,
      image_url: newService.imageUrl,
      is_active: newService.isActive ?? true,
      features: newService.features || [],
      display_order: newService.displayOrder || 0,
      is_bestseller: newService.isBestseller ?? false,
      rating: 0,
      review_count: 0,
    };

    const { error } = await supabaseAdmin.from('services').insert([payload]);
    if (error) {
      console.error('Error adding service:', error);
      setAdminError(error.message);
      alert(`Failed to create service: ${error.message}`);
      return false;
    }
    await fetchServices();
    return true;
  };

  const updateService = async (serviceId: string, updated: Partial<Service>) => {
    const payload: any = { updated_at: new Date().toISOString() };
    
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.category !== undefined) payload.category = updated.category;
    if ((updated as any).categoryId !== undefined) payload.category_id = (updated as any).categoryId || null;
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
      console.error('Error updating service:', error);
      setAdminError(error.message);
      alert(`Failed to update service: ${error.message}`);
      return false;
    }
    await fetchServices();
    return true;
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabaseAdmin.from('services').delete().eq('id', serviceId);
    if (error) {
      console.error('Error deleting service:', error);
      setAdminError(error.message);
      alert(`Failed to delete service: ${error.message}`);
      return false;
    }
    await fetchServices();
    return true;
  };

  // ==================== SERVICE CATEGORY OPERATIONS ====================
  const addServiceCategory = async (category: any): Promise<boolean> => {
    const payload: any = { ...category };
    if (!payload.image_url) {
      delete payload.image_url;
    }
    let { error } = await supabaseAdmin.from('service_categories').insert([{
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error && error.message?.includes('image_url')) {
      delete payload.image_url;
      const retry = await supabaseAdmin.from('service_categories').insert([{
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      error = retry.error;
    }
    if (error) {
      console.error('Error adding service category:', error);
      setAdminError(error.message);
      alert(`Failed to create category: ${error.message}`);
      return false;
    }
    await fetchServiceCategories();
    return true;
  };

  const updateServiceCategory = async (id: string, updates: any): Promise<boolean> => {
    const payload: any = { ...updates };
    if (!payload.image_url) {
      delete payload.image_url;
    }
    let { error } = await supabaseAdmin.from('service_categories').update({
      ...payload,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error && error.message?.includes('image_url')) {
      delete payload.image_url;
      const retry = await supabaseAdmin.from('service_categories').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      error = retry.error;
    }
    if (error) {
      console.error('Error updating service category:', error);
      setAdminError(error.message);
      alert(`Failed to update category: ${error.message}`);
      return false;
    }
    await fetchServiceCategories();
    return true;
  };

  const deleteServiceCategory = async (id: string) => {
    const { error } = await supabaseAdmin.from('service_categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting service category:', error);
      setAdminError(error.message);
      alert(`Failed to delete category: ${error.message}`);
      return false;
    }
    await fetchServiceCategories();
    return true;
  };

  // ==================== SERVICE ADDON OPERATIONS ====================
  const addServiceAddon = async (addon: any) => {
    const { error } = await supabaseAdmin.from('service_addons').insert([{
      ...addon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (error) {
      console.error('Error adding service addon:', error);
      setAdminError(error.message);
      alert(`Failed to create addon: ${error.message}`);
      return false;
    }
    await fetchServiceAddons();
    return true;
  };

  const updateServiceAddon = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin.from('service_addons').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      console.error('Error updating service addon:', error);
      setAdminError(error.message);
      alert(`Failed to update addon: ${error.message}`);
      return false;
    }
    await fetchServiceAddons();
    return true;
  };

  const deleteServiceAddon = async (id: string) => {
    const { error } = await supabaseAdmin.from('service_addons').delete().eq('id', id);
    if (error) {
      console.error('Error deleting service addon:', error);
      setAdminError(error.message);
      alert(`Failed to delete addon: ${error.message}`);
      return false;
    }
    await fetchServiceAddons();
    return true;
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

    try {
      const targetMaid = maids.find(m => m.uid === uid || (m as any).id === uid);
      if (targetMaid?.phone) {
        const cleanPhone = targetMaid.phone.replace(/\D/g, '').slice(-10);
        await supabase
          .from('user_profiles')
          .update({
            maid_application_status: 'approved',
            role: 'maid',
            updated_at: approvedAtIso,
          })
          .or(`id.eq.${uid},phone.eq.${targetMaid.phone},phone.eq.+91${cleanPhone},phone.eq.${cleanPhone}`);
      } else {
        await supabase
          .from('user_profiles')
          .update({
            maid_application_status: 'approved',
            role: 'maid',
            updated_at: approvedAtIso,
          })
          .eq('id', uid);
      }
    } catch (uErr) {
      console.warn('Could not update user_profiles on maid approval:', uErr);
    }

    try {
      await supabase.from('notifications').insert({
        recipient_id: uid,
        recipient_role: 'maid',
        title: 'Application Approved',
        message: 'Your partner application has been approved.',
        category: 'updates',
        is_read: false,
        created_at: approvedAtIso,
      });
    } catch (nErr) {
      console.warn('Could not insert notification record:', nErr);
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

    try {
      const targetMaid = maids.find(m => m.uid === uid || (m as any).id === uid);
      if (targetMaid?.phone) {
        const cleanPhone = targetMaid.phone.replace(/\D/g, '').slice(-10);
        await supabase
          .from('user_profiles')
          .update({
            maid_application_status: 'rejected',
            updated_at: rejectedAtIso,
          })
          .or(`id.eq.${uid},phone.eq.${targetMaid.phone},phone.eq.+91${cleanPhone},phone.eq.${cleanPhone}`);
      } else {
        await supabase
          .from('user_profiles')
          .update({
            maid_application_status: 'rejected',
            updated_at: rejectedAtIso,
          })
          .eq('id', uid);
      }
    } catch (uErr) {
      console.warn('Could not update user_profiles on maid rejection:', uErr);
    }

    try {
      await supabase.from('notifications').insert({
        recipient_id: uid,
        recipient_role: 'maid',
        title: 'Application Not Approved',
        message: reason || 'Application revisions requested by Operations team.',
        category: 'updates',
        is_read: false,
        created_at: rejectedAtIso,
      });
    } catch (nErr) {
      console.warn('Could not insert rejection notification record:', nErr);
    }

    try {
      await supabase.from('maid_history').insert({
        maid_id: uid,
        action: 'Application Rejected',
        actor_id: adminUser?.id || null,
        actor_name: rejectedBy,
        details: reason,
      });
    } catch (hErr) {
      console.warn('Could not log rejection in maid_history:', hErr);
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
        admin_notes: `Correction requested: ${note}`,
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

  const updateItemVerification = async (
    uid: string,
    itemPath: string,
    status: 'verified' | 'rejected' | 'reupload_required',
    reason?: string
  ) => {
    try {
      const targetMaid = maids.find(m => m.uid === uid);
      const currentVer: any = targetMaid?.verificationStatus || {
        step1_personal: { status: 'pending' },
        step2_address: { status: 'pending' },
        step3_services: { status: 'pending' },
        step4_documents: { status: 'pending' },
        step5_bank: { status: 'pending' },
        profile_photo: { status: 'pending' },
        documents: {
          aadhaar_front: { status: 'pending' },
          aadhaar_back: { status: 'pending' },
          pan_card: { status: 'pending' },
        },
      };

      const newVer: any = JSON.parse(JSON.stringify(currentVer));
      const now = new Date().toISOString();

      if (itemPath.startsWith('documents.')) {
        const docKey = itemPath.replace('documents.', '');
        if (!newVer.documents) newVer.documents = {};
        newVer.documents[docKey] = {
          status,
          rejectionReason: reason || null,
          verifiedAt: status === 'verified' ? now : null,
          verifiedBy: adminUser?.email || 'Admin',
        };
      } else {
        newVer[itemPath] = {
          status,
          rejectionReason: reason || null,
          verifiedAt: status === 'verified' ? now : null,
          verifiedBy: adminUser?.email || 'Admin',
        };
      }

      const docs = newVer.documents || {};
      const allDocsVerified =
        docs.aadhaar_front?.status === 'verified' &&
        docs.aadhaar_back?.status === 'verified' &&
        docs.pan_card?.status === 'verified';
      if (allDocsVerified) {
        newVer.step4_documents = { status: 'verified', verifiedAt: now };
      } else if (
        docs.aadhaar_front?.status === 'reupload_required' ||
        docs.aadhaar_back?.status === 'reupload_required' ||
        docs.pan_card?.status === 'reupload_required'
      ) {
        newVer.step4_documents = { status: 'reupload_required' };
      }

      const updatePayload: any = {
        verification_status: newVer,
        updated_at: now,
      };

      if (status === 'reupload_required' && reason) {
        updatePayload.correction_requested = true;
        updatePayload.admin_notes = `Re-upload required for ${itemPath.replace('documents.', '').replace('_', ' ')}: ${reason}`;
      }

      const { error } = await supabase
        .from('maid_profiles')
        .update(updatePayload)
        .eq('id', uid);

      if (error) {
        setAdminError(error.message);
        return;
      }

      setMaids(prev =>
        prev.map(m =>
          m.uid === uid
            ? {
                ...m,
                verificationStatus: newVer,
                adminNotes: updatePayload.admin_notes || m.adminNotes,
                correctionRequested: updatePayload.correction_requested ?? m.correctionRequested,
              }
            : m
        )
      );
    } catch (err: any) {
      console.error('Error in updateItemVerification:', err);
    }
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

    let { error } = await supabase
      .from('bookings')
      .update({
        status: 'maid_assigned',
        admin_approval_status: 'approved',
        assignment_status: 'assigned',
        assigned_maid_id: targetMaid.uid,
        assigned_maid_name: targetMaid.fullName,
        assigned_maid_phone: targetMaid.phone,
        assigned_maid_photo_url: targetMaid.photoUrl,
        assigned_maid_rating: targetMaid.rating,
        updated_at: new Date().toISOString(),
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (error && (error.code === '22P02' || error.message?.includes('booking_status'))) {
      console.warn('[Approve Booking Notice] 22P02 enum error caught. Updating partner fields directly...');
      const fallback = await supabase
        .from('bookings')
        .update({
          assigned_maid_id: targetMaid.uid,
          assigned_maid_name: targetMaid.fullName,
          assigned_maid_phone: targetMaid.phone,
          assigned_maid_photo_url: targetMaid.photoUrl,
          assigned_maid_rating: targetMaid.rating,
          updated_at: new Date().toISOString(),
        })
        .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);
      error = fallback.error;
    }

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

  const sendPartnerAssignmentRequest = async (
    bookingId: string,
    partnerId: string,
    distanceKm?: number,
    etaMins?: number
  ): Promise<boolean> => {
    setAdminError(null);

    // 1. Resolve and verify booking exists
    const targetBooking = bookings.find(b => b.bookingId === bookingId || b.id === bookingId);
    if (!targetBooking) {
      const err = 'Booking not found.';
      console.error('[Assign Partner Error] Booking verification failed:', { bookingId, error: err });
      setAdminError(err);
      return false;
    }

    const bookingDbId = targetBooking.id;

    // 2. Resolve and verify partner exists
    const targetPartner = maids.find(m => m.uid === partnerId);
    if (!targetPartner) {
      const err = 'Partner not found.';
      console.error('[Assign Partner Error] Partner verification failed:', { partnerId, error: err });
      setAdminError(err);
      return false;
    }

    // 3. Verify partner status and eligibility
    if (targetPartner.status !== 'approved') {
      const err = `Partner is not eligible: Status is ${targetPartner.status || 'pending approval'}.`;
      console.error('[Assign Partner Error] Partner approval status failed:', { partnerId, status: targetPartner.status });
      setAdminError(err);
      return false;
    }

    if (!targetPartner.isOnline || targetPartner.currentStatus === 'busy') {
      const err = 'Partner is currently offline or busy. Please choose an online partner.';
      console.error('[Assign Partner Error] Partner availability failed:', {
        partnerId,
        isOnline: targetPartner.isOnline,
        currentStatus: targetPartner.currentStatus,
      });
      setAdminError(err);
      return false;
    }

    // 4. Verify service matching between booking and partner skills/services
    const bookingServiceName = (targetBooking.serviceName || '').toLowerCase().trim();
    let isServiceMatched = true;
    if (bookingServiceName) {
      const skillsArr = Array.isArray(targetPartner.skills) ? targetPartner.skills : [];
      const servicesArr = Array.isArray(targetPartner.servicesProvided) ? targetPartner.servicesProvided : [];
      if (skillsArr.length > 0 || servicesArr.length > 0) {
        const skillMatch = skillsArr.some((s: any) => {
          const str = String(s).toLowerCase().trim();
          return str.includes(bookingServiceName) || bookingServiceName.includes(str) || (bookingServiceName.includes('clean') && str.includes('clean'));
        });
        const serviceMatch = servicesArr.some((s: any) => {
          const str = (s?.serviceName || s?.name || '').toLowerCase().trim();
          return str.includes(bookingServiceName) || bookingServiceName.includes(str) || (bookingServiceName.includes('clean') && str.includes('clean'));
        });
        isServiceMatched = Boolean(skillMatch || serviceMatch);
      }
    }

    if (!isServiceMatched) {
      const err = `Partner does not provide the required service: ${targetBooking.serviceName}.`;
      console.error('[Assign Partner Error] Service match failed:', {
        bookingService: targetBooking.serviceName,
        partnerId: targetPartner.uid,
        partnerSkills: targetPartner.skills,
      });
      setAdminError(err);
      return false;
    }

    // 5. Check for existing pending request (prevent duplicates)
    try {
      const { data: existing, error: checkErr } = await supabaseAdmin
        .from('partner_assignments')
        .select('id, response_status')
        .eq('booking_id', bookingDbId)
        .eq('partner_id', targetPartner.uid)
        .eq('response_status', 'pending');

      if (checkErr) {
        console.warn('[Assign Partner Warning] Check assignment query notice:', checkErr);
      } else if (existing && existing.length > 0) {
        const err = 'Assignment request is already pending for this partner.';
        console.warn('[Assign Partner Warning]', err);
        setAdminError(err);
        return false;
      }
    } catch (checkErr) {
      console.warn('[Assign Partner Warning] Duplicate check catch:', checkErr);
    }

    const payload = {
      booking_id: bookingDbId,
      partner_id: targetPartner.uid,
      assignment_type: 'admin',
      response_status: 'pending',
      offer_sent_at: new Date().toISOString(),
      distance_km: distanceKm || null,
    };

    // 6. Create the real assignment request in partner_assignments using privileged client
    const { data: assignData, error: assignErr } = await supabaseAdmin
      .from('partner_assignments')
      .insert(payload)
      .select()
      .single();

    if (assignErr) {
      console.error('[Assign Partner Error] partner_assignments INSERT failed:', {
        bookingId: bookingDbId,
        partnerId: targetPartner.uid,
        authenticatedAdminId: adminUser?.id || 'admin',
        requestPayload: payload,
        supabaseErrorCode: assignErr.code,
        supabaseErrorMessage: assignErr.message,
        supabaseErrorDetails: assignErr.details,
        supabaseErrorHint: assignErr.hint,
      });
      setAdminError(assignErr.message || 'Failed to create assignment request record.');
      return false;
    }

    // 7. Update booking candidate maid details & assignment status
    const bookingUpdatePayload: any = {
      assignment_status: 'partner_offered',
      assigned_maid_id: targetPartner.uid,
      assigned_maid_name: targetPartner.fullName,
      assigned_maid_phone: targetPartner.phone,
      updated_at: new Date().toISOString(),
    };

    let { error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .update(bookingUpdatePayload)
      .eq('id', bookingDbId);

    // If PostgreSQL throws 22P02 enum error due to legacy trigger on assignment_status,
    // update candidate details without assignment_status so booking links to partner candidate cleanly
    if (bookingErr && (bookingErr.code === '22P02' || bookingErr.message?.includes('booking_status'))) {
      console.warn('[Assign Partner Warning] assignment_status update hit legacy trigger, applying candidate maid update:', bookingErr.message);
      const fallbackPayload = {
        assigned_maid_id: targetPartner.uid,
        assigned_maid_name: targetPartner.fullName,
        assigned_maid_phone: targetPartner.phone,
        updated_at: new Date().toISOString(),
      };
      const { error: fallbackErr } = await supabaseAdmin
        .from('bookings')
        .update(fallbackPayload)
        .eq('id', bookingDbId);

      if (fallbackErr) {
        console.error('[Assign Partner Error] Booking update fallback failed:', fallbackErr);
      } else {
        bookingErr = null;
      }
    }

    if (bookingErr) {
      console.error('[Assign Partner Error] bookings UPDATE failed:', {
        bookingId: bookingDbId,
        partnerId: targetPartner.uid,
        authenticatedAdminId: adminUser?.id || 'admin',
        supabaseErrorCode: bookingErr.code,
        supabaseErrorMessage: bookingErr.message,
        supabaseErrorDetails: bookingErr.details,
        supabaseErrorHint: bookingErr.hint,
      });
      // Do not abort if partner_assignment was created, but log warning
    }

    // 8. Send notification to partner
    try {
      await supabaseAdmin.from('notifications').insert({
        recipient_id: targetPartner.uid,
        recipient_role: 'maid',
        title: 'New Job Request',
        body: `New assignment request for booking ${targetBooking.bookingId} (${targetBooking.serviceName}). Please accept or reject.`,
        message: `New assignment request for booking ${targetBooking.bookingId} (${targetBooking.serviceName}). Please accept or reject.`,
        category: 'dispatch',
        related_booking_id: bookingDbId,
      });
    } catch (notifErr: any) {
      console.warn('[Assign Partner Debug] Notification insert notice:', notifErr?.message);
    }

    console.log('[Assign Partner Success] Assignment request dispatched:', {
      assignmentId: assignData?.id,
      bookingId: bookingDbId,
      partnerId: targetPartner.uid,
      partnerName: targetPartner.fullName,
    });

    await fetchBookings(selectedLocationRef.current, true);
    return true;
  };

  const cancelPartnerAssignmentRequest = async (bookingId: string, partnerId: string): Promise<boolean> => {
    setAdminError(null);
    const targetBooking = bookings.find(b => b.bookingId === bookingId || b.id === bookingId);
    if (!targetBooking) return false;

    const bookingDbId = targetBooking.id;

    // 1. Update booking candidate maid fields
    const { error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .update({
        assigned_maid_id: null,
        assigned_maid_name: null,
        assigned_maid_phone: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingDbId);

    if (bookingErr) {
      console.error('[Cancel Assignment Error] Booking reset failed:', bookingErr);
    }

    // Attempt assignment_status reset safely
    try {
      await supabaseAdmin
        .from('bookings')
        .update({ assignment_status: 'unassigned' })
        .eq('id', bookingDbId);
    } catch {}

    // 2. Expire partner_assignments
    try {
      await supabaseAdmin
        .from('partner_assignments')
        .update({
          response_status: 'expired',
          responded_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingDbId)
        .eq('partner_id', partnerId)
        .eq('response_status', 'pending');
    } catch (err) {
      console.warn('[Cancel Assignment Warning] partner_assignments expire notice:', err);
    }

    await fetchBookings(selectedLocationRef.current, true);
    return true;
  };

  const acceptPartnerAssignment = async (bookingId: string, partnerId: string, etaText?: string): Promise<boolean> => {
    setAdminError(null);
    const targetPartner = maids.find(m => m.uid === partnerId);
    if (!targetPartner) return false;

    const targetBooking = bookings.find(b => b.bookingId === bookingId || b.id === bookingId);
    if (!targetBooking) return false;

    const bookingDbId = targetBooking.id;
    const acceptedAt = new Date().toISOString();

    // 1. Update booking to assigned
    const updateData: any = {
      status: 'maid_assigned',
      assigned_maid_id: targetPartner.uid,
      assigned_maid_name: targetPartner.fullName,
      assigned_maid_phone: targetPartner.phone,
      assigned_maid_photo_url: targetPartner.photoUrl,
      assigned_maid_rating: targetPartner.rating,
      partner_accepted_at: acceptedAt,
      updated_at: acceptedAt,
    };

    if (etaText) {
      updateData.partner_eta = etaText;
    }

    // Attempt update with status and approval
    let { error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingDbId);

    if (bookingErr && (bookingErr.code === '22P02' || bookingErr.message?.includes('booking_status'))) {
      console.warn('[Accept Partner Notice] 22P02 enum error caught. Updating partner assignment fields directly...');
      const fallbackData = { ...updateData };
      delete fallbackData.status;
      const fallback = await supabaseAdmin
        .from('bookings')
        .update(fallbackData)
        .eq('id', bookingDbId);
      bookingErr = fallback.error;
    }

    if (bookingErr) {
      console.error('[Accept Partner Error] Booking update failed:', bookingErr);
      setAdminError(bookingErr.message);
      return false;
    }

    // Attempt assignment_status update safely
    try {
      await supabaseAdmin
        .from('bookings')
        .update({ assignment_status: 'assigned', admin_approval_status: 'approved' })
        .eq('id', bookingDbId);
    } catch {}

    // 2. Update partner_assignments
    try {
      const assignUpdate: any = {
        response_status: 'accepted',
        responded_at: acceptedAt,
      };
      if (etaText) assignUpdate.partner_eta = etaText;

      await supabaseAdmin
        .from('partner_assignments')
        .update(assignUpdate)
        .eq('booking_id', bookingDbId)
        .eq('partner_id', targetPartner.uid);
    } catch (assignErr) {
      console.warn('[Accept Partner Warning] partner_assignments update notice:', assignErr);
    }

    await fetchBookings(selectedLocationRef.current, true);
    return true;
  };

  const declinePartnerAssignment = async (bookingId: string, partnerId: string, reason?: string): Promise<boolean> => {
    setAdminError(null);
    const targetBooking = bookings.find(b => b.bookingId === bookingId || b.id === bookingId);
    if (!targetBooking) return false;

    const bookingDbId = targetBooking.id;
    const declinedAt = new Date().toISOString();

    const { error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .update({
        assigned_maid_id: null,
        assigned_maid_name: null,
        assigned_maid_phone: null,
        updated_at: declinedAt,
      })
      .eq('id', bookingDbId);

    if (bookingErr) {
      console.error('[Decline Partner Error] Booking reset failed:', bookingErr);
      setAdminError(bookingErr.message);
      return false;
    }

    try {
      await supabaseAdmin
        .from('bookings')
        .update({ assignment_status: 'unassigned' })
        .eq('id', bookingDbId);
    } catch {}

    try {
      await supabaseAdmin
        .from('partner_assignments')
        .update({
          response_status: 'declined',
          responded_at: declinedAt,
        })
        .eq('booking_id', bookingDbId)
        .eq('partner_id', partnerId);
    } catch (assignErr) {
      console.warn('[Decline Partner Warning] partner_assignments decline notice:', assignErr);
    }

    await fetchBookings(selectedLocationRef.current, true);
    return true;
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
      payment_method: newBookingData.paymentMethod || 'cash',
      payment_status: newBookingData.paymentStatus || (newBookingData.paymentMethod === 'online' ? 'paid' : 'pending'),
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
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'rescheduled',
        scheduled_date: newDate,
        time_slot: newTime,
        reschedule_reason: 'Rescheduled by admin',
        rescheduled_at: timestamp,
        rescheduled_by: adminUser?.email || 'admin',
        updated_at: timestamp,
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
    setRescheduleModalOpen(false);
    alert(`Booking ${bookingId} rescheduled successfully!`);
  };

  const cancelBookingWithReason = async (bookingId: string, reason: string) => {
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: timestamp,
        cancelled_by: adminUser?.email || 'admin',
        updated_at: timestamp,
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

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
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

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
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (error) {
      setAdminError(error.message);
      return;
    }

    await fetchBookings();
  };

  const finalizeSlotAdmin = async (bookingId: string) => {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('bookings')
      .update({
        slot_confirmation_status: 'finalized',
        admin_finalized_at: nowIso,
        updated_at: nowIso,
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (error) {
      setAdminError(error.message);
      return;
    }

    setBookings(prev =>
      prev.map(b =>
        b.bookingId === bookingId || b.id === bookingId
          ? { ...b, slotConfirmationStatus: 'finalized', adminFinalizedAt: nowIso }
          : b
      )
    );
  };

  const resolveRedFlagAdmin = async (bookingId: string) => {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('bookings')
      .update({
        slot_confirmation_status: 'admin_resolved',
        admin_resolved_at: nowIso,
        updated_at: nowIso,
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (error) {
      setAdminError(error.message);
      return;
    }

    setBookings(prev =>
      prev.map(b =>
        b.bookingId === bookingId || b.id === bookingId
          ? { ...b, slotConfirmationStatus: 'admin_resolved', adminResolvedAt: nowIso }
          : b
      )
    );
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

  // ==================== OFFER OPERATIONS ====================
  const addOffer = async (offer: any): Promise<boolean> => {
    const cleanCode = (offer.code || '').trim().toUpperCase();
    const payload: any = {
      code: cleanCode,
      title: offer.title || offer.name,
      description: offer.description || '',
      discount_type: offer.discount_type || offer.discountType || 'percentage',
      discount_value: Number(offer.discount_value ?? offer.discountValue ?? 0),
      min_booking_amount: Number(offer.min_booking_amount ?? offer.minBookingAmount ?? 0),
      max_discount: offer.max_discount ? Number(offer.max_discount) : (offer.maxDiscount ? Number(offer.maxDiscount) : null),
      valid_from: offer.valid_from || offer.validFrom || new Date().toISOString().split('T')[0],
      valid_until: offer.valid_until || offer.validUntil || '2027-12-31',
      total_usage_limit: offer.total_usage_limit ? Number(offer.total_usage_limit) : (offer.usageLimit ? Number(offer.usageLimit) : null),
      usage_limit_per_user: offer.usage_limit_per_user ? Number(offer.usage_limit_per_user) : (offer.perUserLimit ? Number(offer.perUserLimit) : 1),
      is_active: offer.is_active ?? offer.isActive ?? true,
      badge_color: offer.imageUrl || offer.image_url || '#E8F5E9',
      image_url: offer.imageUrl || offer.image_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabaseAdmin.from('offers').insert([payload]);
    if (error && (error.message?.includes('image_url') || (error as any).code === '42703')) {
      delete payload.image_url;
      const retry = await supabaseAdmin.from('offers').insert([payload]);
      error = retry.error;
    }

    if (error) {
      console.error('Error creating offer:', error);
      setAdminError(error.message);
      alert(`Failed to create offer: ${error.message}`);
      return false;
    }
    await fetchOffers();
    return true;
  };

  const updateOffer = async (id: string, updates: any): Promise<boolean> => {
    const payload: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.name) payload.title = updates.name;
    if (updates.code) payload.code = updates.code.trim().toUpperCase();
    if (updates.imageUrl) {
      payload.image_url = updates.imageUrl;
      payload.badge_color = updates.imageUrl;
    }

    let { error } = await supabaseAdmin.from('offers').update(payload).eq('id', id);
    if (error && (error.message?.includes('image_url') || (error as any).code === '42703')) {
      delete payload.image_url;
      const retry = await supabaseAdmin.from('offers').update(payload).eq('id', id);
      error = retry.error;
    }

    if (error) {
      console.error('Error updating offer:', error);
      setAdminError(error.message);
      alert(`Failed to update offer: ${error.message}`);
      return false;
    }
    await fetchOffers();
    return true;
  };

  const deleteOffer = async (id: string): Promise<boolean> => {
    const { error } = await supabaseAdmin.from('offers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting offer:', error);
      setAdminError(error.message);
      alert(`Failed to delete offer: ${error.message}`);
      return false;
    }
    await fetchOffers();
    return true;
  };

  const toggleOfferActive = async (id: string): Promise<boolean> => {
    const current = offers.find(o => o.id === id);
    if (!current) return false;
    return updateOffer(id, { is_active: !current.is_active });
  };

  // Legacy Coupon Aliases
  const addCoupon = async (coupon: any) => { await addOffer(coupon); };
  const updateCoupon = async (id: string, updates: any) => { await updateOffer(id, updates); };
  const deleteCoupon = async (id: string) => { await deleteOffer(id); };
  const toggleCouponActive = async (id: string) => { await toggleOfferActive(id); };

  // ==================== BANNER OPERATIONS ====================
  const addHomepageBanner = async (banner: any): Promise<boolean> => {
    const payload: any = {
      image_url: banner.imageUrl || banner.image_url,
      is_active: banner.isActive ?? banner.is_active ?? true,
      title: 'Homepage Banner',
      cta_text: 'Book Now',
      display_order: banner.displayOrder || banner.display_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('homepage_banners').insert([payload]);
    if (error) {
      console.error('Error adding banner:', error);
      setAdminError(error.message);
      alert('Failed to add banner: ' + error.message);
      return false;
    }
    await fetchHomepageBanners();
    return true;
  };

  const updateHomepageBanner = async (id: string, updates: any): Promise<boolean> => {
    const { error } = await supabaseAdmin.from('homepage_banners').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) {
      console.error('Error updating banner:', error);
      setAdminError(error.message);
      alert('Failed to update banner: ' + error.message);
      return false;
    }
    await fetchHomepageBanners();
    return true;
  };

  const deleteHomepageBanner = async (id: string): Promise<boolean> => {
    const { error } = await supabaseAdmin.from('homepage_banners').delete().eq('id', id);
    if (error) {
      console.error('Error deleting banner:', error);
      setAdminError(error.message);
      alert('Failed to delete banner: ' + error.message);
      return false;
    }
    await fetchHomepageBanners();
    return true;
  };

  const toggleHomepageBannerActive = async (id: string): Promise<boolean> => {
    const current = homepageBanners.find(b => b.id === id);
    if (!current) return false;
    return updateHomepageBanner(id, { is_active: !current.is_active });
  };

  // ==================== SERVICE AREA OPERATIONS ====================
  const addServiceArea = async (area: any) => {
    const loc = area.locality_name || area.locality || area.zone_name || '';
    const isServ = area.is_serviceable !== undefined ? area.is_serviceable : (area.is_active !== undefined ? area.is_active : true);
    const { error } = await supabaseAdmin.from('service_areas').insert([{
      city: area.city || 'Karimnagar',
      state: 'Telangana',
      locality_name: loc,
      zone_name: loc,
      pincode: area.pincode ? String(area.pincode).trim() : null,
      is_serviceable: isServ,
      is_active: isServ,
      created_at: new Date().toISOString(),
    }]);
    if (error) {
      setAdminError(error.message);
      return;
    }
    await fetchServiceAreas();
  };

  const updateServiceArea = async (id: string, updates: any) => {
    const payload: any = {};
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.locality !== undefined || updates.locality_name !== undefined) {
      payload.locality_name = updates.locality_name || updates.locality;
      payload.zone_name = updates.locality_name || updates.locality;
    }
    if (updates.pincode !== undefined) payload.pincode = String(updates.pincode).trim();
    if (updates.is_serviceable !== undefined || updates.is_active !== undefined) {
      const activeVal = updates.is_serviceable !== undefined ? updates.is_serviceable : updates.is_active;
      payload.is_serviceable = activeVal;
      payload.is_active = activeVal;
    }
    const { error } = await supabaseAdmin.from('service_areas').update(payload).eq('id', id);
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
    const headers = ['Booking ID', 'Customer', 'Service', 'Hub / City', 'Locality', 'Date', 'Time', 'Status', 'Amount', 'Assigned Maid', 'Payment Status'];
    const rows = bookings.map(b => [
      b.bookingId,
      b.customerName,
      b.serviceName,
      b.address?.city || selectedLocation,
      b.address?.locality || '',
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
    link.setAttribute('download', `GC_Home_${selectedLocation}_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
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
    maidsLoading,
    maidsError,
    refreshMaids: fetchMaids,
    bookings,
    customers,
    coupons,
    offers,
    fetchOffers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferActive,
    homepageBanners,
    toggleHomepageBannerActive,
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
    updateItemVerification,
    toggleMaidOnlineStatus,
    toggleMaidActiveStatus,
    exportMaidsToCSV,
    assignMaidToBooking,
    confirmMaidAssignment,
    sendPartnerAssignmentRequest,
    cancelPartnerAssignmentRequest,
    acceptPartnerAssignment,
    declinePartnerAssignment,
    refreshBookings: fetchBookings,
    bookingsLoading,
    bookingsError,
    autoAssignMaid,
    createNewBooking,
    rescheduleBooking,
    cancelBookingWithReason,
    markJobAsCompleted,
    updateJobStatus,
    finalizeSlotAdmin,
    resolveRedFlagAdmin,
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
