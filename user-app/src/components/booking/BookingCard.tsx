import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Calendar,
  MapPin,
  ArrowRight,
  Star,
  ShieldCheck,
} from 'lucide-react-native';
import { resolveImageSource } from '../../utils/imageUtils';

export interface BookingCardProps {
  bookingId: string;
  serviceName: string;
  secondaryService?: string;
  price: number;
  dateStr: string; // e.g. "2026-09-23" or "2026-09-22"
  timeSlot: string; // e.g. "9:00 AM – 11:00 AM"
  fullAddressText?: string;
  locality?: string;
  city?: string;
  status: string;
  assignedPro?: {
    name: string;
    photoUrl?: string;
  };
  startOtp?: string;
  rating?: number;
  onTrackBooking?: () => void;
  onRateBooking?: () => void;
  onViewAddressDetails?: () => void;
}

/**
 * Format relative date (TODAY, TOMORROW, 23 Sep)
 */
function getRelativeDateInfo(dateStr: string) {
  if (!dateStr) return { label: 'SCHEDULED', type: 'other', formattedDate: '' };
  
  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowIso = tomorrowObj.toISOString().split('T')[0];

  const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

  let formattedDate = cleanDateStr;
  try {
    const d = new Date(cleanDateStr);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  } catch {
    formattedDate = cleanDateStr;
  }

  if (cleanDateStr === todayIso) {
    return { label: 'TODAY', type: 'today', formattedDate };
  } else if (cleanDateStr === tomorrowIso) {
    return { label: 'TOMORROW', type: 'tomorrow', formattedDate };
  } else {
    return { label: formattedDate.toUpperCase(), type: 'other', formattedDate };
  }
}

/**
 * Format concise location (Locality, Area or City fallback)
 */
function getConciseLocation(locality?: string, city?: string, fullAddressText?: string) {
  if (locality && locality.trim()) {
    if (city && city.trim() && !locality.toLowerCase().includes(city.toLowerCase())) {
      return `${locality.trim()}, ${city.trim()}`;
    }
    return locality.trim();
  }
  if (fullAddressText && fullAddressText.trim()) {
    const parts = fullAddressText.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return parts[0] || 'Hyderabad';
  }
  return city || 'Hyderabad';
}

export const BookingCard: React.FC<BookingCardProps> = ({
  bookingId,
  serviceName,
  secondaryService,
  price,
  dateStr,
  timeSlot,
  fullAddressText,
  locality,
  city,
  status,
  assignedPro,
  startOtp,
  rating,
  onTrackBooking,
  onRateBooking,
  onViewAddressDetails,
}) => {
  const relativeInfo = getRelativeDateInfo(dateStr);
  const conciseLocation = getConciseLocation(locality, city, fullAddressText);

  // Parse primary vs secondary service title if passed as single comma string
  let primaryTitle = serviceName;
  let secondaryTitle = secondaryService;

  if (!secondaryTitle && serviceName.includes(',')) {
    const parts = serviceName.split(',').map(s => s.trim());
    primaryTitle = parts[0];
    secondaryTitle = parts.slice(1).join(', ');
  }

  return (
    <View style={styles.cardContainer}>
      {/* 1. TOP ROW: Relative Date Status Pill + Price */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.dateChip,
            relativeInfo.type === 'today' && styles.dateChipToday,
            relativeInfo.type === 'tomorrow' && styles.dateChipTomorrow,
          ]}
        >
          <Text
            style={[
              styles.dateChipText,
              relativeInfo.type === 'today' && styles.dateChipTextToday,
              relativeInfo.type === 'tomorrow' && styles.dateChipTextTomorrow,
            ]}
          >
            {relativeInfo.label}
          </Text>
        </View>

        {/* PRICE: Prominent & Never Clipped */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{Number(price).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* 2. SERVICE TITLE & BOOKING ID */}
      <View style={styles.titleBlock}>
        <Text style={styles.primaryTitleText} numberOfLines={2}>
          {primaryTitle}
        </Text>
        {secondaryTitle ? (
          <Text style={styles.secondaryTitleText} numberOfLines={1}>
            {secondaryTitle}
          </Text>
        ) : null}
        
        <Text style={styles.bookingIdText}>#{bookingId}</Text>
      </View>

      {/* 3. SUB-CARD DETAILS BOX (Schedule & Location) */}
      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#168A68" strokeWidth={2.2} style={styles.iconStyle} />
          <Text style={styles.detailText}>
            {relativeInfo.formattedDate || 'Scheduled'} · {timeSlot || '9:00 AM – 11:00 AM'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MapPin size={14} color="#168A68" strokeWidth={2.2} style={styles.iconStyle} />
          <Text style={styles.detailText} numberOfLines={1}>
            {conciseLocation}
          </Text>
          {onViewAddressDetails && (
            <TouchableOpacity onPress={onViewAddressDetails} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.viewAddrLink}>View address →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. CLEANER / PRO INFO (If Assigned) */}
      {assignedPro && (
        <View style={styles.proRow}>
          <Image
            source={resolveImageSource(assignedPro.photoUrl)}
            style={styles.proThumb}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.proLabelRow}>
              <ShieldCheck size={12} color="#168A68" />
              <Text style={styles.proLabel}>ASSIGNED PROFESSIONAL</Text>
            </View>
            <Text style={styles.proName}>{assignedPro.name}</Text>
          </View>
          {startOtp ? (
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>START OTP</Text>
              <Text style={styles.otpDigits}>{startOtp}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* 5. PRIMARY ACTION CTA */}
      <View style={styles.ctaRow}>
        {status === 'completed' ? (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onRateBooking}
            activeOpacity={0.85}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Star size={15} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.ctaButtonText}>
              {rating ? 'Edit Rating ★' : 'Rate Experience'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onTrackBooking}
            activeOpacity={0.85}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.ctaButtonText}>Track Booking</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EAF1ED',
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateChipToday: {
    backgroundColor: '#123D2A',
  },
  dateChipTomorrow: {
    backgroundColor: '#EAF5EC',
    borderWidth: 1,
    borderColor: '#C6E3CB',
  },
  dateChipText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.5,
  },
  dateChipTextToday: {
    color: '#FFFFFF',
  },
  dateChipTextTomorrow: {
    color: '#123D2A',
  },
  priceContainer: {
    flexShrink: 0,
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: -0.3,
  },
  titleBlock: {
    gap: 2,
  },
  primaryTitleText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 20,
  },
  secondaryTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  bookingIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 3,
  },
  detailsBox: {
    backgroundColor: '#F5FCF8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconStyle: {
    marginTop: 1,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  viewAddrLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#168A68',
    marginLeft: 4,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  proThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  proLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  proName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBox: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C3E6D5',
  },
  otpLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#123D2A',
  },
  otpDigits: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#123D2A',
    letterSpacing: 0.5,
  },
  ctaRow: {
    paddingTop: 2,
  },
  ctaButton: {
    backgroundColor: '#123D2A',
    borderRadius: 24,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#123D2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
