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
    const saved = localStorage.getItem('admin_selected_location');
    return (saved && LOCATION_TIMEZONE_MAP[saved]) ? saved : 'Karimnagar';
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

  const fetchMaids = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('maid_profiles')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;

      if (data) {
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
            city: row.city || 'Bengaluru',
            bankDetails: {
              accountName: row.bank_account_name || row.full_name || '',
              accountNumber: row.bank_account_number || '',
              ifscCode: row.bank_ifsc || '',
              bankName: row.bank_name || '',
              upiId: row.upi_id || parsedKycDocs?.upiId,
            },
            serviceArea: row.service_area || row.preferred_service_area || row.city || 'Bengaluru',
            preferredServiceArea: row.preferred_service_area || row.service_area,
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
            addressProofUrl: row.address_proof_url || parsedKycDocs?.addressProofUrl,
            otherDocsUrls: Array.isArray(row.other_docs_urls) ? row.other_docs_urls : (parsedKycDocs?.otherDocs || []),
            termsAccepted: Boolean(row.terms_accepted),
            privacyAccepted: Boolean(row.privacy_accepted),
            accuracyConfirmed: Boolean(row.accuracy_confirmed),
            correctionRequested: Boolean(row.correction_requested),
          };
        });
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
            city: row.address_city || 'Hyderabad',
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
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      // 1. Concurrently fetch user_profiles, maid_profiles, and bookings from Supabase
      const [profilesRes, maidsRes, bookingsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('maid_profiles').select('*'),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      ]);

      const profilesData = profilesRes.data || [];
      const maidsData = maidsRes.data || [];
      const dbBookings = bookingsRes.data || [];

      // 2. Build quick lookup maps for maid profiles by ID and clean phone
      const maidByPhone = new Map<string, any>();
      const maidById = new Map<string, any>();
      maidsData.forEach((m: any) => {
        if (m.id) maidById.set(m.id, m);
        const cleanP = (m.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanP) maidByPhone.set(cleanP, m);
      });

      const customerMap = new Map<string, any>();

      // 3. Populate from user_profiles table (Every registered user is a Customer)
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
        const completedBookings = userBookings.filter(b => b.status === 'completed');
        const totalSpent = completedBookings.reduce((sum, b) => sum + (Number(b.total_amount || b.service_price) || 0), 0);

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

        customerMap.set(custKey, {
          id: p.id || p.phone,
          name: p.name || p.full_name || (maidMatch ? maidMatch.full_name : 'Registered Customer'),
          phone: p.phone || (maidMatch ? maidMatch.phone : ''),
          email: p.email || (maidMatch ? maidMatch.email : ''),
          avatarUrl: p.profile_photo_url || (maidMatch ? maidMatch.photo_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'),
          customerType: p.customer_type || custType,
          locality: p.city || (maidMatch ? maidMatch.service_area : 'Karimnagar'),
          address: {
            id: 'addr_' + (p.id || '1'),
            label: 'Home',
            street: p.address || (maidMatch ? maidMatch.address : 'Karimnagar'),
            locality: p.city || 'Karimnagar',
            city: p.city || 'Karimnagar',
            pincode: '500081',
          },
          totalBookings: userBookings.length,
          totalSpent: totalSpent,
          joinedDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastBookingDate: userBookings[0]?.scheduled_date || userBookings[0]?.created_at || 'No bookings yet',
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

      // 4. Derive and merge any unprofiled bookings
      dbBookings.forEach(b => {
        const custId = b.customer_id || b.customer_phone || b.id;
        if (!custId) return;

        const cleanPhone = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
        const existing = customerMap.get(custId) || (cleanPhone ? customerMap.get(cleanPhone) : null);
        const userBookings = dbBookings.filter(bk => 
          bk.customer_id === b.customer_id || (b.customer_phone && bk.customer_phone === b.customer_phone)
        );
        const completedBookings = userBookings.filter(bk => bk.status === 'completed');
        const totalSpent = completedBookings.reduce((sum, bk) => sum + (Number(bk.total_amount || bk.service_price) || 0), 0);

        let custType: 'VIP Member' | 'Regular Customer' | 'First-time Customer' = 'First-time Customer';
        if (totalSpent > 5000 || userBookings.length >= 5) {
          custType = 'VIP Member';
        } else if (userBookings.length > 1) {
          custType = 'Regular Customer';
        }

        const joinedDate = b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : (existing?.joinedDate || new Date().toISOString().split('T')[0]);

        if (existing) {
          customerMap.set(existing.id, {
            ...existing,
            name: existing.name && existing.name !== 'Registered Customer' ? existing.name : (b.customer_name || existing.name),
            phone: existing.phone || b.customer_phone || '',
            email: existing.email || b.customer_email || '',
            totalBookings: userBookings.length,
            totalSpent: totalSpent,
            customerType: custType,
            lastBookingDate: b.scheduled_date || b.created_at || existing.lastBookingDate,
            address: existing.address,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maid_profiles' }, () => {
        fetchMaids();
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_assignments' }, () => {
        fetchBookings();
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, fetchCustomers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, fetchOffers)
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
  }, [fetchServices, fetchServiceCategories, fetchServiceAddons, fetchMaids, fetchBookings, fetchCustomers, fetchOffers, fetchCoupons, fetchHomepageBanners, fetchServiceAreas, fetchPayouts, fetchRatings, fetchPlatformSettings, fetchNotifications]);

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
    const targetPartner = maids.find(m => m.uid === partnerId);
    if (!targetPartner) return false;

    const targetBooking = bookings.find(b => b.bookingId === bookingId);
    if (!targetBooking) return false;

    // 1. Update booking assignment_status to 'partner_offered', keep status as 'pending_assignment'
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        assignment_status: 'partner_offered',
        updated_at: new Date().toISOString(),
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (bookingErr) {
      setAdminError(bookingErr.message);
      return false;
    }

    // 2. Insert into partner_assignments table
    try {
      const bookingDbId = targetBooking.id;
      if (bookingDbId) {
        await supabase.from('partner_assignments').insert({
          booking_id: bookingDbId,
          partner_id: targetPartner.uid,
          assignment_type: 'admin',
          distance_km: distanceKm || 1.2,
          estimated_earnings: targetBooking.totalAmount ? Math.round(targetBooking.totalAmount * 0.75) : 500,
          response_status: 'pending',
          offer_sent_at: new Date().toISOString(),
        });
      }
    } catch (assignErr) {
      console.warn('partner_assignments insert warning:', assignErr);
    }

    // 3. Send notification to partner
    try {
      const bookingDbId = targetBooking.id;
      if (bookingDbId) {
        await supabase.from('notifications').insert({
          recipient_id: targetPartner.uid,
          recipient_role: 'maid',
          title: 'New Job Request',
          message: `New assignment request for booking ${bookingId} (${targetBooking.serviceName}). Please accept or reject.`,
          category: 'dispatch',
          related_booking_id: bookingDbId,
        });
      }
    } catch (notifErr) {
      console.warn('Notification insert warning:', notifErr);
    }

    await fetchBookings();
    return true;
  };

  const cancelPartnerAssignmentRequest = async (bookingId: string, partnerId: string): Promise<boolean> => {
    const targetBooking = bookings.find(b => b.bookingId === bookingId);
    if (!targetBooking) return false;

    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        assignment_status: 'unassigned',
        updated_at: new Date().toISOString(),
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (bookingErr) {
      setAdminError(bookingErr.message);
      return false;
    }

    try {
      if (targetBooking.id) {
        await supabase
          .from('partner_assignments')
          .update({
            response_status: 'expired',
            responded_at: new Date().toISOString(),
          })
          .eq('booking_id', targetBooking.id)
          .eq('partner_id', partnerId)
          .eq('response_status', 'pending');
      }
    } catch (err) {
      console.warn('cancel partner_assignment warning:', err);
    }

    await fetchBookings();
    return true;
  };

  const acceptPartnerAssignment = async (bookingId: string, partnerId: string): Promise<boolean> => {
    const targetPartner = maids.find(m => m.uid === partnerId);
    if (!targetPartner) return false;

    const targetBooking = bookings.find(b => b.bookingId === bookingId);
    if (!targetBooking) return false;

    const acceptedAt = new Date().toISOString();

    // 1. Update booking to assigned
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'maid_assigned',
        assignment_status: 'assigned',
        admin_approval_status: 'approved',
        assigned_maid_id: targetPartner.uid,
        assigned_maid_name: targetPartner.fullName,
        assigned_maid_phone: targetPartner.phone,
        assigned_maid_photo_url: targetPartner.photoUrl,
        assigned_maid_rating: targetPartner.rating,
        updated_at: acceptedAt,
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (bookingErr) {
      setAdminError(bookingErr.message);
      return false;
    }

    // 2. Update partner_assignments
    try {
      if (targetBooking.id) {
        await supabase
          .from('partner_assignments')
          .update({
            response_status: 'accepted',
            responded_at: acceptedAt,
          })
          .eq('booking_id', targetBooking.id)
          .eq('partner_id', partnerId);

        // Expire any other pending offers for this booking
        await supabase
          .from('partner_assignments')
          .update({
            response_status: 'expired',
          })
          .eq('booking_id', targetBooking.id)
          .neq('partner_id', partnerId)
          .eq('response_status', 'pending');
      }
    } catch (err) {
      console.warn('update partner_assignments warning:', err);
    }

    // 3. Mark partner as busy / update status
    try {
      await supabase
        .from('maid_profiles')
        .update({
          is_available: false,
          updated_at: acceptedAt,
        })
        .eq('id', partnerId);
    } catch (err) {
      console.warn('update maid_profiles warning:', err);
    }

    await fetchBookings();
    await fetchMaids();
    return true;
  };

  const declinePartnerAssignment = async (bookingId: string, partnerId: string, reason?: string): Promise<boolean> => {
    const targetBooking = bookings.find(b => b.bookingId === bookingId);
    if (!targetBooking) return false;

    const declinedAt = new Date().toISOString();

    // Revert booking to unassigned pending
    const { error: bookingErr } = await supabase
      .from('bookings')
      .update({
        assignment_status: 'unassigned',
        updated_at: declinedAt,
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`);

    if (bookingErr) {
      setAdminError(bookingErr.message);
      return false;
    }

    try {
      if (targetBooking.id) {
        await supabase
          .from('partner_assignments')
          .update({
            response_status: 'declined',
            responded_at: declinedAt,
          })
          .eq('booking_id', targetBooking.id)
          .eq('partner_id', partnerId)
          .eq('response_status', 'pending');
      }
    } catch (err) {
      console.warn('decline partner_assignment warning:', err);
    }

    await fetchBookings();
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
