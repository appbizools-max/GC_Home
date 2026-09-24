import { Service } from '../types/index';
import { supabase } from '../config/supabase';
import { ASSETS } from '../assets/index';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  ctaText: string;
  imageUrl: any;
  badgeText: string;
  serviceId?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  iconName: 'home' | 'kitchen' | 'bath' | 'sofa' | 'deep' | 'more';
  bgColor: string;
  iconColor: string;
  routeCategory: string;
  imageUrl?: string;
}

export interface PromoOffer {
  id: string;
  discountText: string;
  subtitle: string;
  code: string;
  discountPercent: number;
  badgeText: string;
  imageUrl?: any;
  validUntil?: string;
}

export interface SupabaseOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingAmount: number;
  maxDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  imageUrl?: string;
  badgeColor?: string;
  totalUsageLimit?: number;
  usageLimitPerUser?: number;
  isActive: boolean;
}

export interface WhyChooseItem {
  id: string;
  title: string;
  iconName: 'verified' | 'eco' | 'clock' | 'heart' | 'satisfaction';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'assignment' | 'promo' | 'system';
  time: string;
  read: boolean;
}

export const HERO_BANNERS_SEED: HeroBanner[] = [
  {
    id: 'banner_1',
    title: 'A Cleaner Home\nA Happier You',
    subtitle: 'Professional Cleaning Services\nat Your Doorstep',
    tagline: 'Clean Spaces\nBrighter Lives 💚',
    ctaText: 'Book Now →',
    imageUrl: ASSETS.heroLivingRoom,
    badgeText: 'Top Rated',
    serviceId: 'srv_1',
  },
  {
    id: 'banner_2',
    title: 'Deep Kitchen &\nAppliance Clean',
    subtitle: '100% Eco-friendly degreasing\nand sanitization',
    tagline: 'Sparkling Clean ✨',
    ctaText: 'Explore Packages →',
    imageUrl: ASSETS.serviceKitchen,
    badgeText: 'Special Offer',
    serviceId: 'srv_2',
  },
  {
    id: 'banner_3',
    title: 'Sofa, Carpet &\nUpholstery Care',
    subtitle: 'High-power shampooing\n& stain removal',
    tagline: 'Fresh Living 🛋️',
    ctaText: 'Book Now →',
    imageUrl: ASSETS.serviceSofa,
    badgeText: 'Bestseller',
    serviceId: 'srv_4',
  },
];

export const SERVICE_CATEGORIES_SEED: ServiceCategory[] = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'Water Tank\nCleaning', iconName: 'home', bgColor: '#E0F2FE', iconColor: '#0284C7', routeCategory: 'water-tank-cleaning' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Electrician', iconName: 'home', bgColor: '#FEF3C7', iconColor: '#D97706', routeCategory: 'electrician' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Plumbing', iconName: 'kitchen', bgColor: '#E0E7FF', iconColor: '#4F46E5', routeCategory: 'plumbing' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'Carpentry', iconName: 'more', bgColor: '#FEF2F2', iconColor: '#DC2626', routeCategory: 'carpentry' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'AC Repair &\nService', iconName: 'deep', bgColor: '#ECFDF5', iconColor: '#059669', routeCategory: 'ac-repair-service' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Geyser Repair', iconName: 'bath', bgColor: '#FFF7ED', iconColor: '#EA580C', routeCategory: 'geyser-repair' },
  { id: '11111111-0000-0000-0000-000000000007', name: 'Painting', iconName: 'home', bgColor: '#F3E8FF', iconColor: '#9333EA', routeCategory: 'painting' },
  { id: '11111111-0000-0000-0000-000000000008', name: 'Pest Control', iconName: 'deep', bgColor: '#F0FDF4', iconColor: '#16A34A', routeCategory: 'pest-control' },
  { id: '11111111-0000-0000-0000-000000000009', name: 'Salon for\nWomen', iconName: 'sofa', bgColor: '#FCE7F3', iconColor: '#DB2777', routeCategory: 'salon-for-women' },
  { id: '11111111-0000-0000-0000-000000000010', name: 'Salon for\nMen', iconName: 'home', bgColor: '#F1F5F9', iconColor: '#334155', routeCategory: 'salon-for-men' },
  { id: '11111111-0000-0000-0000-000000000011', name: 'Makeup Artist', iconName: 'more', bgColor: '#FFF1F2', iconColor: '#E11D48', routeCategory: 'makeup-artist' },
];

export const NEARBY_SERVICES_SEED: (Service & { isBestseller?: boolean; reviewCount: string; rating: number })[] = [];

export const PROMO_OFFER_SEED: PromoOffer = {
  id: 'promo_gchome20',
  discountText: 'Get 20% OFF',
  subtitle: 'on your first booking!',
  code: 'GCHOME20',
  discountPercent: 20,
  badgeText: 'Trusted\nCleaning\nProfessionals 💚',
};

export const NOTIFICATIONS_SEED: NotificationItem[] = [];

export function normalizeLocationString(raw?: string): string {
  if (!raw || !raw.trim()) return 'HSR Layout, Bengaluru, Karnataka 560102';
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!uniqueParts.some(existing => existing.toLowerCase() === part.toLowerCase())) {
      uniqueParts.push(part);
    }
  }
  return uniqueParts.join(', ');
}

class HomeService {
  private cache: {
    categories: ServiceCategory[] | null;
    services: (Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[] | null;
    topServices: (Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[] | null;
    banners: HeroBanner[] | null;
    notifications: NotificationItem[] | null;
    lastUpdated: number | null;
  } = {
    categories: null,
    services: null,
    topServices: null,
    banners: null,
    notifications: null,
    lastUpdated: null,
  };

  private inFlightServicesPromise: Promise<any> | null = null;
  private inFlightCategoriesPromise: Promise<any> | null = null;
  private inFlightDashboardPromise: Promise<any> | null = null;

  public getCachedServices() {
    return this.cache.services;
  }

  public getCachedCategories() {
    return this.cache.categories;
  }

  public getCachedDashboard() {
    if (this.cache.services && this.cache.categories && this.cache.banners) {
      return {
        banners: this.cache.banners,
        categories: this.cache.categories,
        services: this.cache.topServices || this.cache.services,
        promoOffer: PROMO_OFFER_SEED,
        notifications: this.cache.notifications || [],
        unreadCount: (this.cache.notifications || []).filter(n => !n.read).length,
      };
    }
    return null;
  }

  async getCategoriesFromSupabase(forceRefresh = false): Promise<ServiceCategory[]> {
    if (!forceRefresh && this.cache.categories && this.cache.categories.length > 0) {
      console.log('[PERF] Categories cache hit (0ms)');
      return this.cache.categories;
    }
    if (this.inFlightCategoriesPromise) {
      console.log('[PERF] Deduplicating categories request');
      return this.inFlightCategoriesPromise;
    }

    const start = Date.now();
    console.log('[PERF] Categories API start');

    this.inFlightCategoriesPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
          const fallback = SERVICE_CATEGORIES_SEED;
          this.cache.categories = fallback;
          return fallback;
        }

        const mapped = data.map(row => ({
          id: row.id,
          name: row.name,
          iconName: (row.icon_name || 'home') as any,
          bgColor: row.bg_color || '#EAF8F1',
          iconColor: row.icon_color || '#168A68',
          routeCategory: row.route_category || 'home_cleaning',
          imageUrl: row.image_url || undefined,
        }));

        this.cache.categories = mapped;
        console.log(`[PERF] Categories API success: ${Date.now() - start}ms (${mapped.length} categories)`);
        return mapped;
      } catch {
        const fallback = SERVICE_CATEGORIES_SEED;
        this.cache.categories = fallback;
        return fallback;
      } finally {
        this.inFlightCategoriesPromise = null;
      }
    })();

    return this.inFlightCategoriesPromise;
  }

  async getServicesFromSupabase(forceRefresh = false): Promise<(Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[]> {
    if (!forceRefresh && this.cache.services && this.cache.services.length > 0) {
      console.log('[PERF] Services cache hit (0ms)');
      return this.cache.services;
    }
    if (this.inFlightServicesPromise) {
      console.log('[PERF] Deduplicating services request');
      return this.inFlightServicesPromise;
    }

    const start = Date.now();
    console.log('[PERF] Services API start');

    this.inFlightServicesPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*, category:service_categories(*)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) {
          const fallback = NEARBY_SERVICES_SEED;
          if (fallback.length > 0) this.cache.services = fallback;
          return fallback;
        }

        const mapped = data.map(row => ({
          serviceId: row.id,
          name: row.name,
          category: row.category?.name || row.category || 'Home Cleaning',
          categoryId: row.category_id || (typeof row.category === 'object' ? row.category?.id : undefined),
          description: row.description || '',
          startingPrice: Number(row.starting_price || 0),
          pricePerRoom: row.price_per_room ? Number(row.price_per_room) : undefined,
          estimatedDuration: row.estimated_duration || '2 hours',
          imageUrl: row.image_url || ASSETS.heroLivingRoom,
          isActive: Boolean(row.is_active),
          features: Array.isArray(row.features) ? row.features : [],
          isBestseller: Boolean(row.is_bestseller),
          rating: row.rating ? Number(row.rating) : 4.8,
          reviewCount: row.review_count ? `${row.review_count}` : '1.2K',
        }));

        this.cache.services = mapped;
        this.cache.lastUpdated = Date.now();
        console.log(`[PERF] Services API success: ${Date.now() - start}ms (${mapped.length} services)`);
        return mapped;
      } catch {
        const fallback = NEARBY_SERVICES_SEED;
        return fallback;
      } finally {
        this.inFlightServicesPromise = null;
      }
    })();

    return this.inFlightServicesPromise;
  }

  async getBannersFromSupabase(): Promise<HeroBanner[]> {
    if (this.cache.banners && this.cache.banners.length > 0) {
      return this.cache.banners;
    }
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        this.cache.banners = HERO_BANNERS_SEED;
        return HERO_BANNERS_SEED;
      }

      const STORAGE_BASE = 'https://zpkukinayxcbwyklfdqn.supabase.co/storage/v1/object/public/gc-home-assets/';

      const resolveBannerImage = (imageUrl: string | null): any => {
        if (!imageUrl) return ASSETS.heroLivingRoom;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return { uri: imageUrl };
        }
        return { uri: STORAGE_BASE + imageUrl };
      };

      const mapped = data.map(row => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle || '',
        tagline: row.tagline || '',
        ctaText: row.cta_text || 'Book Now →',
        imageUrl: resolveBannerImage(row.image_url),
        badgeText: row.badge_text || 'Featured',
        serviceId: row.service_id || 'srv_1',
      }));

      this.cache.banners = mapped;
      return mapped;
    } catch {
      this.cache.banners = HERO_BANNERS_SEED;
      return HERO_BANNERS_SEED;
    }
  }

  async getOffersFromSupabase(): Promise<SupabaseOffer[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', now)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const { data: allActive } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (allActive && allActive.length > 0) {
          return allActive.map(this.mapOfferRow);
        }
        return [];
      }

      return data.map(this.mapOfferRow);
    } catch {
      return [];
    }
  }

  private mapOfferRow(row: any): SupabaseOffer {
    return {
      id: row.id,
      code: row.code,
      title: row.title || row.name || '',
      description: row.description || '',
      discountType: (row.discount_type || 'percentage') as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value || 0),
      minBookingAmount: Number(row.min_booking_amount || 0),
      maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      imageUrl: undefined,
      badgeColor: row.badge_color,
      totalUsageLimit: row.total_usage_limit,
      usageLimitPerUser: row.usage_limit_per_user || 1,
      isActive: Boolean(row.is_active),
    };
  }

  async getNotificationsFromSupabase(userId?: string): Promise<NotificationItem[]> {
    if (this.cache.notifications && this.cache.notifications.length > 0) {
      return this.cache.notifications;
    }
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        this.cache.notifications = [];
        return [];
      }

      const mapped = data.map((row: any): NotificationItem => ({
        id: row.id,
        title: row.title || 'Notification',
        message: row.message || row.body || '',
        type: (row.type || 'system') as NotificationItem['type'],
        time: row.created_at
          ? new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
        read: Boolean(row.is_read || row.read),
      }));

      this.cache.notifications = mapped;
      return mapped;
    } catch {
      this.cache.notifications = [];
      return [];
    }
  }

  async getAddonsForService(serviceId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('service_addons')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data) return [];
      return data.map(r => ({
        id: r.id,
        serviceId: r.service_id,
        name: r.name,
        description: r.description,
        price: Number(r.price || 0),
        durationMin: r.duration_min || 30,
        imageUrl: r.image_url,
        isActive: r.is_active,
      }));
    } catch {
      return [];
    }
  }

  async getTopRatedServicesFromSupabase(forceRefresh = false): Promise<(Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[]> {
    if (!forceRefresh && this.cache.topServices && this.cache.topServices.length > 0) {
      return this.cache.topServices;
    }

    try {
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*, category:service_categories(*)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !servicesData || servicesData.length === 0) {
        return [];
      }

      const activeCategories = categoriesData || [];
      const selectedRows: typeof servicesData = [];

      if (activeCategories.length > 0) {
        for (const cat of activeCategories) {
          const catServices = servicesData.filter(s => {
            const sCatId = s.category_id || (typeof s.category === 'object' ? s.category?.id : null);
            const sCatName = s.category?.name || (typeof s.category === 'string' ? s.category : null);
            return (sCatId && sCatId === cat.id) || (sCatName && sCatName.toLowerCase() === cat.name.toLowerCase());
          });

          if (catServices.length === 0) continue;

          const topRatedServices = catServices.filter(s => Boolean(s.is_top_rated || s.is_bestseller));

          let chosen = null;
          if (topRatedServices.length > 0) {
            chosen = [...topRatedServices].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];
          } else {
            chosen = [...catServices].sort((a, b) => {
              const rDiff = Number(b.rating || 0) - Number(a.rating || 0);
              if (rDiff !== 0) return rDiff;
              const revDiff = Number(b.review_count || 0) - Number(a.review_count || 0);
              if (revDiff !== 0) return revDiff;
              return (a.display_order || 0) - (b.display_order || 0);
            })[0];
          }

          if (chosen && !selectedRows.some(r => r.id === chosen.id)) {
            selectedRows.push(chosen);
          }
        }
      } else {
        const catMap = new Map<string, typeof servicesData[0]>();
        for (const service of servicesData) {
          const catKey = service.category?.name || (typeof service.category === 'string' ? service.category : 'General');
          if (!catMap.has(catKey)) {
            catMap.set(catKey, service);
          } else {
            const existing = catMap.get(catKey)!;
            const isServiceTop = Boolean(service.is_top_rated || service.is_bestseller);
            const isExistingTop = Boolean(existing.is_top_rated || existing.is_bestseller);
            if (isServiceTop && !isExistingTop) {
              catMap.set(catKey, service);
            } else if (isServiceTop === isExistingTop) {
              if (Number(service.rating || 0) > Number(existing.rating || 0)) {
                catMap.set(catKey, service);
              }
            }
          }
        }
        selectedRows.push(...Array.from(catMap.values()));
      }

      const mapped = selectedRows.map(row => ({
        serviceId: row.id,
        name: row.name,
        category: row.category?.name || row.category || 'Home Cleaning',
        categoryId: row.category_id || (typeof row.category === 'object' ? row.category?.id : undefined),
        description: row.description || '',
        startingPrice: Number(row.starting_price || 0),
        pricePerRoom: row.price_per_room ? Number(row.price_per_room) : undefined,
        estimatedDuration: row.estimated_duration || '2 hours',
        imageUrl: row.image_url || ASSETS.heroLivingRoom,
        isActive: Boolean(row.is_active),
        features: Array.isArray(row.features) ? row.features : [],
        isBestseller: true,
        rating: row.rating ? Number(row.rating) : 4.8,
        reviewCount: row.review_count ? `${row.review_count}` : '1.2K',
      }));

      this.cache.topServices = mapped;
      return mapped;
    } catch {
      return [];
    }
  }

  async getDashboardData(locationString: string, userId?: string, forceRefresh = false) {
    const normalizedLoc = normalizeLocationString(locationString);

    const cached = this.getCachedDashboard();
    if (!forceRefresh && cached) {
      console.log('[PERF] Dashboard cache hit (0ms)');
      return cached;
    }

    if (this.inFlightDashboardPromise) {
      console.log('[PERF] Deduplicating dashboard request');
      return this.inFlightDashboardPromise;
    }

    const start = Date.now();
    console.log(`[PERF] Dashboard API start for location: ${normalizedLoc}`);

    this.inFlightDashboardPromise = (async () => {
      try {
        const [categories, services, banners, notifications] = await Promise.all([
          this.getCategoriesFromSupabase(forceRefresh),
          this.getTopRatedServicesFromSupabase(forceRefresh),
          this.getBannersFromSupabase(),
          this.getNotificationsFromSupabase(userId),
        ]);

        this.cache.banners = banners;
        this.cache.topServices = services;
        this.cache.notifications = notifications;

        const result = {
          banners,
          categories,
          services,
          promoOffer: PROMO_OFFER_SEED,
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
        };

        console.log(`[PERF] Dashboard API success: ${Date.now() - start}ms`);
        return result;
      } finally {
        this.inFlightDashboardPromise = null;
      }
    })();

    return this.inFlightDashboardPromise;
  }

  async searchServices(query: string) {
    const services = await this.getServicesFromSupabase();
    if (!query || query.trim().length === 0) {
      return services;
    }
    const q = query.toLowerCase().trim();
    return services.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.features.some(f => f.toLowerCase().includes(q))
    );
  }
}

export const homeService = new HomeService();
