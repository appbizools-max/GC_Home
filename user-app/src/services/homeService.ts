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
  {
    id: 'cat_home',
    name: 'Home\nCleaning',
    iconName: 'home',
    bgColor: '#EAF8F1',
    iconColor: '#168A68',
    routeCategory: 'home_cleaning',
  },
  {
    id: 'cat_kitchen',
    name: 'Kitchen\nCleaning',
    iconName: 'kitchen',
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
    routeCategory: 'kitchen_cleaning',
  },
  {
    id: 'cat_bath',
    name: 'Bathroom\nCleaning',
    iconName: 'bath',
    bgColor: '#E0F2FE',
    iconColor: '#0284C7',
    routeCategory: 'bathroom_cleaning',
  },
  {
    id: 'cat_sofa',
    name: 'Sofa & Carpet\nCleaning',
    iconName: 'sofa',
    bgColor: '#FCE7F3',
    iconColor: '#DB2777',
    routeCategory: 'sofa_carpet',
  },
  {
    id: 'cat_deep',
    name: 'Deep\nCleaning',
    iconName: 'deep',
    bgColor: '#EDE9FE',
    iconColor: '#7C3AED',
    routeCategory: 'deep_cleaning',
  },
  {
    id: 'cat_more',
    name: 'More\nServices',
    iconName: 'more',
    bgColor: '#F1F5F9',
    iconColor: '#475569',
    routeCategory: 'all',
  },
];

export const NEARBY_SERVICES_SEED: (Service & { isBestseller?: boolean; reviewCount: string; rating: number })[] = [
  {
    serviceId: 'srv_1',
    name: 'Home Cleaning',
    category: 'standard',
    description: 'Comprehensive sweeping, mopping, dusting, and trash removal.',
    startingPrice: 699,
    pricePerRoom: 250,
    estimatedDuration: '2 - 3 hrs',
    imageUrl: ASSETS.heroLivingRoom,
    isActive: true,
    features: ['Floor scrubbing', 'Dusting all furniture', 'Window wiping', 'Sanitized mop heads'],
    isBestseller: true,
    rating: 4.8,
    reviewCount: '2.1K',
  },
  {
    serviceId: 'srv_2',
    name: 'Kitchen Cleaning',
    category: 'specialized',
    description: 'Degreasing stove, chimney exterior, countertop, and sink sanitization.',
    startingPrice: 599,
    pricePerRoom: 300,
    estimatedDuration: '1.5 - 2 hrs',
    imageUrl: ASSETS.serviceKitchen,
    isActive: true,
    features: ['Stovetop degreasing', 'Tile scrubbing', 'Sink descaling', 'Appliance exterior'],
    rating: 4.7,
    reviewCount: '1.5K',
  },
  {
    serviceId: 'srv_3',
    name: 'Bathroom Cleaning',
    category: 'specialized',
    description: 'Tile descaling, toilet & basin sanitization, mirror cleaning.',
    startingPrice: 499,
    pricePerRoom: 200,
    estimatedDuration: '1 - 1.5 hrs',
    imageUrl: ASSETS.serviceBathroom,
    isActive: true,
    features: ['Hard water stain removal', 'Grout line cleaning', 'Exhaust cleaning', 'Antiviral disinfectant'],
    rating: 4.6,
    reviewCount: '1.2K',
  },
  {
    serviceId: 'srv_4',
    name: 'Sofa & Carpet Cleaning',
    category: 'specialized',
    description: 'Deep vacuuming, foam shampooing, and rapid moisture extraction.',
    startingPrice: 799,
    pricePerRoom: 350,
    estimatedDuration: '2 - 2.5 hrs',
    imageUrl: ASSETS.serviceSofa,
    isActive: true,
    features: ['Stain pre-treatment', 'Fabric safe chemical', 'Odor neutralizer', 'Industrial vacuum'],
    rating: 4.8,
    reviewCount: '980',
  },
  {
    serviceId: 'srv_5',
    name: 'Deep Cleaning (Full Home)',
    category: 'premium',
    description: 'Top-to-bottom intensive cleaning including cabinets, fans, balcony.',
    startingPrice: 1499,
    pricePerRoom: 450,
    estimatedDuration: '4 - 5 hrs',
    imageUrl: ASSETS.heroLivingRoom,
    isActive: true,
    features: ['All rooms deep sanitized', 'Inside wardrobe wipe', 'Balcony pressure wash', 'Cobweb removal'],
    isBestseller: true,
    rating: 4.9,
    reviewCount: '3.4K',
  },
];

export const PROMO_OFFER_SEED: PromoOffer = {
  id: 'promo_gchome20',
  discountText: 'Get 20% OFF',
  subtitle: 'on your first booking!',
  code: 'GCHOME20',
  discountPercent: 20,
  badgeText: 'Trusted\nCleaning\nProfessionals 💚',
};

export const NOTIFICATIONS_SEED: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Booking Confirmed 🎉',
    message: 'Your Home Deep Cleaning is scheduled for today at 10:00 AM.',
    type: 'booking',
    time: '10m ago',
    read: false,
  },
  {
    id: 'notif_2',
    title: 'Cleaner Assigned 🧹',
    message: 'Sunita Sharma has been assigned to your service.',
    type: 'assignment',
    time: '1h ago',
    read: false,
  },
  {
    id: 'notif_3',
    title: 'Weekend Special: 20% OFF 🏷️',
    message: 'Use code GCHOME20 for instant discount on all kitchen & bath cleans.',
    type: 'promo',
    time: '1d ago',
    read: true,
  },
];

class HomeService {
  async getDashboardData(locationString: string) {
    // Artificial slight latency for realistic refresh UX
    await new Promise(r => setTimeout(r, 400));

    return {
      banners: HERO_BANNERS_SEED,
      categories: SERVICE_CATEGORIES_SEED,
      services: NEARBY_SERVICES_SEED,
      promoOffer: PROMO_OFFER_SEED,
      notifications: NOTIFICATIONS_SEED,
      unreadCount: NOTIFICATIONS_SEED.filter(n => !n.read).length,
    };
  }

  async searchServices(query: string) {
    if (!query || query.trim().length === 0) {
      return NEARBY_SERVICES_SEED;
    }
    const q = query.toLowerCase().trim();
    return NEARBY_SERVICES_SEED.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.features.some(f => f.toLowerCase().includes(q))
    );
  }
}

export const homeService = new HomeService();
