/**
 * GC HOME+ — Postal PIN Code Lookup Service
 * Fetches location details (State, District, City, Post Offices/Areas)
 * using the official Indian Postal PIN Code API: https://api.postalpincode.in/pincode/{PINCODE}
 */

import { supabase } from '../config/supabase';

export interface PostOfficeDetail {
  name: string;
  branchType?: string;
  deliveryStatus?: string;
  district?: string;
  division?: string;
  state?: string;
}

export interface PincodeLookupResult {
  success: boolean;
  state?: string;
  district?: string;
  city?: string;
  postOffices: string[];
  details?: PostOfficeDetail[];
  errorType?: 'invalid' | 'notFound' | 'networkError';
  message?: string;
}

/**
 * Normalizes postal division/district into clean consumer-friendly city name
 * e.g., "Hyderabad City" -> "Hyderabad", "Bangalore South" -> "Bengaluru"
 */
export function cleanCityName(division?: string, district?: string): string {
  const raw = (division || district || '').trim();
  if (!raw) return 'Hyderabad';

  const lower = raw.toLowerCase();

  if (lower.includes('hyderabad')) return 'Hyderabad';
  if (lower.includes('bangalore') || lower.includes('bengaluru')) return 'Bengaluru';
  if (lower.includes('vijayawada')) return 'Vijayawada';
  if (lower.includes('visakhapatnam') || lower.includes('vizag')) return 'Visakhapatnam';
  if (lower.includes('chennai')) return 'Chennai';
  if (lower.includes('mumbai')) return 'Mumbai';
  if (lower.includes('delhi')) return 'New Delhi';
  if (lower.includes('pune')) return 'Pune';
  if (lower.includes('secunderabad')) return 'Secunderabad';
  if (lower.includes('warangal')) return 'Warangal';
  if (lower.includes('guntur')) return 'Guntur';

  // Strip generic administrative suffixes like "City", "Urban", "Rural", "North", "South", "Division"
  return raw
    .replace(/\s+(City|Division|Urban|Rural|North|South|East|West|Central|H\.O|S\.O)\b/gi, '')
    .trim() || raw;
}

class PincodeService {
  private cache = new Map<string, PincodeLookupResult>();

  /**
   * Fetch State, District, City, and all Post Offices for a 6-digit Indian PIN code.
   */
  async fetchPincodeDetails(pincode: string): Promise<PincodeLookupResult> {
    const cleanPin = pincode.replace(/\D/g, '').trim();

    if (cleanPin.length !== 6) {
      return {
        success: false,
        postOffices: [],
        errorType: 'invalid',
        message: 'Please enter a valid 6-digit PIN code.',
      };
    }

    // Check cache to avoid redundant network queries
    if (this.cache.has(cleanPin)) {
      return this.cache.get(cleanPin)!;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0]?.Status === 'Success' &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const poList = data[0].PostOffice;
        const firstPo = poList[0];

        const state = (firstPo.State || '').trim();
        const district = (firstPo.District || '').trim();
        const city = cleanCityName(firstPo.Division, firstPo.District);

        // Deduplicate post office / locality names
        const namesSet = new Set<string>();
        const postOffices: string[] = [];
        const details: PostOfficeDetail[] = [];

        for (const po of poList) {
          const poName = (po.Name || '').trim();
          if (poName && !namesSet.has(poName)) {
            namesSet.add(poName);
            postOffices.push(poName);
            details.push({
              name: poName,
              branchType: po.BranchType,
              deliveryStatus: po.DeliveryStatus,
              district: po.District,
              division: po.Division,
              state: po.State,
            });
          }
        }

        const result: PincodeLookupResult = {
          success: true,
          state: state || 'Telangana',
          district: district || 'Hyderabad',
          city: city || 'Hyderabad',
          postOffices,
          details,
        };

        this.cache.set(cleanPin, result);
        return result;
      }

      // PIN code not found in postal directory
      const notFoundResult: PincodeLookupResult = {
        success: false,
        postOffices: [],
        errorType: 'notFound',
        message: "We couldn't find this PIN code. Please check the PIN and try again.",
      };
      return notFoundResult;
    } catch {
      clearTimeout(timeoutId);
      // Graceful fallback on network timeout or external API downtime:
      // Never block manual entry
      return {
        success: false,
        postOffices: [],
        errorType: 'networkError',
        message: 'Unable to automatically find this PIN. You can enter your address manually.',
      };
    }
  }
}

export const pincodeService = new PincodeService();

export interface ServiceabilityCheckResult {
  isServiceable: boolean;
  message: string;
  area?: {
    id: string;
    city: string;
    locality?: string;
    pincode: string;
    state?: string;
    is_serviceable: boolean;
  };
}

/**
 * Checks serviceability directly from Supabase service_areas table.
 * Supabase is the single source of truth.
 * No hardcoded PINs.
 */
export async function checkPincodeServiceability(
  pincode: string | undefined | null
): Promise<ServiceabilityCheckResult> {
  const cleanPin = String(pincode || '').replace(/\D/g, '').trim();

  if (cleanPin.length !== 6) {
    return {
      isServiceable: false,
      message: 'Sorry, GC HOME+ is currently not available in your area.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('pincode', cleanPin);

    if (error || !data || data.length === 0) {
      return {
        isServiceable: false,
        message: 'Sorry, GC HOME+ is currently not available in your area.',
      };
    }

    // Must be active and serviceable
    const activeMatch = data.find(
      (row: any) =>
        row.is_serviceable !== false &&
        row.is_active !== false
    );

    if (activeMatch) {
      return {
        isServiceable: true,
        message: 'Services available in your area.',
        area: {
          id: activeMatch.id,
          city: activeMatch.city,
          locality: activeMatch.locality_name || activeMatch.locality || activeMatch.zone_name,
          pincode: activeMatch.pincode,
          state: activeMatch.state,
          is_serviceable: true,
        },
      };
    }

    return {
      isServiceable: false,
      message: 'Sorry, GC HOME+ is currently not available in your area.',
    };
  } catch (err) {
    console.warn('Error querying service_areas from Supabase:', err);
    return {
      isServiceable: false,
      message: 'Sorry, GC HOME+ is currently not available in your area.',
    };
  }
}
