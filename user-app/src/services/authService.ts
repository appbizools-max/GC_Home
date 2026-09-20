import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Address } from '../types';
import { supabase } from '../config/supabase';
import { ASSETS } from '../assets/index';

const AUTH_STORAGE_KEY = '@gc_home_plus_auth_user';
const TOKEN_STORAGE_KEY = '@gc_home_plus_auth_token';
const ONBOARDING_COMPLETED_KEY = '@gc_home_plus_onboarding_completed';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  debugOtp?: string;
  isExistingUser?: boolean;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  user: User;
  token: string;
}

export interface ProfileInputData {
  uid?: string;
  name: string;
  email?: string;
  city: string;
  address: string;
  profilePhoto?: string;
}

// Known demo / test profiles for seamless onboarding testing
const KNOWN_PROFILES: Record<string, Partial<User>> = {
  '+91 98492 01824': {
    uid: 'user_rohan_98492',
    name: 'Rohan Sharma',
    email: 'rohan@gmail.com',
    phone: '+91 98492 01824',
    role: 'customer',
    maidApplicationStatus: 'none',
    profilePhoto: typeof ASSETS.customerAvatar === 'string' ? ASSETS.customerAvatar : undefined,
    createdAt: '2026-09-01',
  },
  '+91 98111 22233': {
    uid: 'cust_curr',
    name: 'Rahul Verma',
    email: 'rahul.v@example.com',
    phone: '+91 98111 22233',
    role: 'customer',
    maidApplicationStatus: 'none',
    profilePhoto: typeof ASSETS.customerAvatar === 'string' ? ASSETS.customerAvatar : undefined,
    createdAt: '2026-09-01',
  },
};

// Safe storage wrapper (supports React Native AsyncStorage with Web fallback)
const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      try {
        await AsyncStorage.setItem(key, value);
      } catch {}
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      await AsyncStorage.removeItem(key);
    } catch {
      try {
        await AsyncStorage.removeItem(key);
      } catch {}
    }
  },
};

class AuthService {
  private activeOtps = new Map<string, { code: string; expiresAt: number }>();

  /**
   * Request / Send 6-digit OTP to mobile number
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    // Artificial latency for realistic network experience
    await new Promise(r => setTimeout(r, 650));

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    // Default test code or generated 6-digit OTP
    // For convenience in UI demo, code '749216' is standard demo code, or generated 6 digits
    const demoOtp = '749216';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.activeOtps.set(cleanPhone, {
      code: demoOtp,
      expiresAt,
    });

    const isKnown = Boolean(KNOWN_PROFILES[cleanPhone]);

    return {
      success: true,
      message: 'OTP sent successfully via SMS',
      debugOtp: demoOtp,
      isExistingUser: isKnown,
    };
  }

  /**
   * Verify 6-digit OTP
   */
  async verifyOtp(phoneNumber: string, enteredOtp: string): Promise<VerifyOtpResponse> {
    await new Promise(r => setTimeout(r, 700));

    const cleanPhone = phoneNumber.trim();
    const cleanOtp = enteredOtp.replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      throw new Error('Please enter the complete 6-digit OTP.');
    }

    // Check against active OTP or allow demo OTP '749216' / '123456'
    const stored = this.activeOtps.get(cleanPhone);
    const isValid =
      cleanOtp === '749216' ||
      cleanOtp === '123456' ||
      (stored && stored.code === cleanOtp && Date.now() <= stored.expiresAt);

    if (!isValid) {
      if (stored && Date.now() > stored.expiresAt) {
        throw new Error('OTP expired. Please request a new code.');
      }
      throw new Error('Incorrect OTP. Please check the code and try again.');
    }

    // Clean up OTP
    this.activeOtps.delete(cleanPhone);

    // Check if user has an existing profile
    const existingProfile = KNOWN_PROFILES[cleanPhone];
    const sessionToken = 'jwt_' + Math.random().toString(36).substring(2) + Date.now();

    if (existingProfile && existingProfile.name) {
      const user: User = {
        uid: existingProfile.uid || 'user_' + Date.now(),
        name: existingProfile.name,
        phone: cleanPhone,
        email: existingProfile.email || '',
        role: 'customer',
        profilePhoto: existingProfile.profilePhoto,
        maidApplicationStatus: 'none',
        createdAt: existingProfile.createdAt || new Date().toISOString().split('T')[0],
      };

      await safeStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      await safeStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
      await safeStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

      return {
        success: true,
        message: 'Authentication successful',
        isNewUser: false,
        user,
        token: sessionToken,
      };
    }

    // New User - Profile setup required
    const tempUser: User = {
      uid: 'user_' + Date.now(),
      name: '',
      phone: cleanPhone,
      role: 'customer',
      maidApplicationStatus: 'none',
      createdAt: new Date().toISOString().split('T')[0],
    };

    await safeStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
    await safeStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');

    return {
      success: true,
      message: 'OTP verified. Please complete your profile.',
      isNewUser: true,
      user: tempUser,
      token: sessionToken,
    };
  }

  /**
   * Save / Complete user profile setup
   */
  async createProfile(data: ProfileInputData, phone: string): Promise<{ success: boolean; user: User; address: Address }> {
    await new Promise(r => setTimeout(r, 600));

    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Please enter your full name (minimum 2 characters).');
    }
    if (!data.city || data.city.trim().length === 0) {
      throw new Error('Please select your city.');
    }
    if (!data.address || data.address.trim().length < 5) {
      throw new Error('Please provide your complete home address.');
    }

    const uid = data.uid || 'user_' + Date.now();
    const newUser: User = {
      uid,
      name: data.name.trim(),
      phone: phone,
      email: data.email?.trim() || '',
      role: 'customer',
      profilePhoto: data.profilePhoto || '',
      maidApplicationStatus: 'none',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newAddress: Address = {
      id: 'addr_' + Date.now(),
      label: 'Home',
      street: data.address,
      locality: data.city,
      city: data.city,
      pincode: '560102',
    };

    // Store in known profiles cache
    KNOWN_PROFILES[phone] = newUser;

    // Persist securely
    await safeStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    await safeStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

    // Attempt Supabase sync if customers table exists
    try {
      await supabase.from('customers').upsert({
        id: uid,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        city: data.city,
        address: data.address,
        profile_photo: newUser.profilePhoto,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Offline / local fallback
    }

    return {
      success: true,
      user: newUser,
      address: newAddress,
    };
  }

  /**
   * Check and retrieve persisted session
   */
  async getCurrentUser(): Promise<{ user: User | null; token: string | null; onboardingCompleted: boolean }> {
    try {
      const userJson = await safeStorage.getItem(AUTH_STORAGE_KEY);
      const token = await safeStorage.getItem(TOKEN_STORAGE_KEY);
      const onboardingCompleted = (await safeStorage.getItem(ONBOARDING_COMPLETED_KEY)) === 'true';

      if (userJson && token && onboardingCompleted) {
        const user = JSON.parse(userJson) as User;
        return { user, token, onboardingCompleted: true };
      }
      return { user: null, token: null, onboardingCompleted: false };
    } catch {
      return { user: null, token: null, onboardingCompleted: false };
    }
  }

  /**
   * Logout user and clear persisted session
   */
  async logout(): Promise<void> {
    try {
      await safeStorage.removeItem(AUTH_STORAGE_KEY);
      await safeStorage.removeItem(TOKEN_STORAGE_KEY);
      await safeStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch {}
  }
}

export const authService = new AuthService();
