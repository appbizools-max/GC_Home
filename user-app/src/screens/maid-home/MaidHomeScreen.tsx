import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { Booking } from '../../types';
import { SlotConfirmationModal } from '../../components/booking/SlotConfirmationModal';
import {
  Power,
  Wifi,
  WifiOff,
  DollarSign,
  Briefcase,
  Star,
  Clock,
  ChevronRight,
  MapPin,
  CheckCircle,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Radio,
  X,
  Calendar,
  AlertTriangle,
  Info,
  RotateCcw,
  ArrowLeft,
  RefreshCw,
  User,
} from 'lucide-react-native';

// ── SWIPEABLE JOB CARD COMPONENT ──
interface SwipeableJobCardProps {
  job: Booking;
  payoutDisplay: string;
  category: { icon: string; label: string };
  formatAddress: (addr: any) => string;
  formatDateLabel: (dateStr?: string) => string;
  onSelectDetails: (job: Booking) => void;
  onDeclinePress: (job: Booking, source: 'button' | 'swipe') => void;
  onAcceptPress: (job: Booking) => void;
  isAccepting: boolean;
  isDeclining: boolean;
  resetSwipeTrigger?: number;
}

const SwipeableJobCard: React.FC<SwipeableJobCardProps> = ({
  job,
  payoutDisplay,
  category,
  formatAddress,
  formatDateLabel,
  onSelectDetails,
  onDeclinePress,
  onAcceptPress,
  isAccepting,
  isDeclining,
  resetSwipeTrigger,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  // Reset swipe position if modal cancelled or reset triggered
  useEffect(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  }, [resetSwipeTrigger]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger on rightward horizontal swipe > 12px
        return (
          !isAccepting &&
          !isDeclining &&
          gestureState.dx > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Clamp rightward drag to max 180px with resistance
        const newX = Math.max(0, Math.min(180, gestureState.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= 80) {
          // Keep revealed position and trigger decline confirmation dialog
          Animated.timing(translateX, {
            toValue: 120,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onDeclinePress(job, 'swipe');
          });
        } else {
          // Dragged less than 80px -> Snap card back to origin (0)
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={swipeStyles.cardContainer}>
      {/* Revealed Red Action Layer (Underneath) */}
      <View style={swipeStyles.revealedBackground}>
        <View style={swipeStyles.revealedContent}>
          <XCircle size={20} color="#DC2626" />
          <Text style={swipeStyles.revealedText}>← Swipe to Decline</Text>
        </View>
      </View>

      {/* Main Front Job Card */}
      <Animated.View
        style={[
          swipeStyles.cardFront,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.newJobCard}
          onPress={() => onSelectDetails(job)}
          activeOpacity={0.92}
          disabled={isAccepting || isDeclining}
        >
          {/* Top Bar: Category Pill & Prominent Net Payout */}
          <View style={styles.cardTopBar}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </View>

            <View style={styles.payoutBlock}>
              <Text style={styles.payoutLabel}>PARTNER PAYOUT</Text>
              <Text style={[styles.payoutAmount, payoutDisplay === 'Payout Pending' && { fontSize: 13, color: '#D97706' }]}>
                {payoutDisplay}
              </Text>
            </View>
          </View>

          {/* Service Title & Quantity */}
          <View style={styles.serviceTitleBox}>
            <Text style={styles.jobServiceTitle}>
              {job.serviceName} <Text style={styles.qtyText}>×1</Text>
            </Text>
          </View>

          {/* Location & Time Info */}
          <View style={styles.jobDetailsGroup}>
            <View style={styles.detailRow}>
              <MapPin size={15} color="#0E5B47" />
              <Text style={styles.addressText} numberOfLines={2}>
                {formatAddress(job.address)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={15} color="#64748B" />
              <Text style={styles.timeText}>
                {formatDateLabel(job.date)} · {job.timeSlot || '9:00 AM – 11:00 AM'}
              </Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.declineBtn, isDeclining && styles.declineBtnDisabled]}
              onPress={() => onDeclinePress(job, 'button')}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={isAccepting || isDeclining}
              accessibilityLabel="Decline request"
            >
              {isDeclining ? (
                <>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.declineBtnText}>Declining...</Text>
                </>
              ) : (
                <>
                  <XCircle size={16} color="#DC2626" />
                  <Text style={styles.declineBtnText} numberOfLines={1}>
                    Decline
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptBtn, (isAccepting || isDeclining) && styles.acceptBtnDisabled]}
              onPress={() => onAcceptPress(job)}
              activeOpacity={0.88}
              disabled={isAccepting || isDeclining}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Accept request"
            >
              {isAccepting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Accepting...</Text>
                </>
              ) : (
                <>
                  <CheckCircle size={16} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText} numberOfLines={1}>
                    Accept Request
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const swipeStyles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  revealedBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    paddingLeft: 20,
    zIndex: 1,
  },
  revealedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revealedText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  cardFront: {
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
});

export const MaidHomeScreen: React.FC = () => {
  const { user, maidProfile, toggleMaidOnline, bookings, updateBookingStatus, navigateTo, confirmMaidSlot } = useAuth();

  const [dismissedSlotReminderId, setDismissedSlotReminderId] = useState<string | null>(null);

  const slotReminderBooking = React.useMemo(() => {
    return (
      bookings.find(
        b =>
          (b.assignedMaidId === maidProfile?.uid || b.assignedMaidPhone === maidProfile?.phone) &&
          b.slotReminderSentAt &&
          !b.maidConfirmedSlot &&
          b.bookingId !== dismissedSlotReminderId &&
          b.slotConfirmationStatus !== 'finalized' &&
          b.slotConfirmationStatus !== 'admin_resolved'
      ) || null
    );
  }, [bookings, maidProfile?.uid, maidProfile?.phone, dismissedSlotReminderId]);

  const [activeTab, setActiveTab] = useState<'new_jobs' | 'upcoming_jobs' | 'earnings' | 'profile'>('new_jobs');
  const [declinedBookingIds, setDeclinedBookingIds] = useState<string[]>([]);
  const [showStatusToast, setShowStatusToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals & Async States
  const [declineTargetJob, setDeclineTargetJob] = useState<Booking | null>(null);
  const [declineSource, setDeclineSource] = useState<'button' | 'swipe' | null>(null);
  const [isDecliningId, setIsDecliningId] = useState<string | null>(null);
  const [declineErrorJob, setDeclineErrorJob] = useState<Booking | null>(null);
  const [resetSwipeTrigger, setResetSwipeTrigger] = useState<number>(0);

  // Temporary Undo Toast State (4-second duration)
  const [undoToast, setUndoToast] = useState<{ job: Booking; timer: ReturnType<typeof setTimeout> } | null>(null);

  const [selectedJobDetails, setSelectedJobDetails] = useState<Booking | null>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  // Pulse animation for online indicator
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  const isOnline = maidProfile?.isOnline ?? false;
  const maidId = maidProfile?.uid;

  // ── 1. PERSISTENT STORAGE: Load Declined Requests on Mount ──
  useEffect(() => {
    const loadDeclinedIds = async () => {
      try {
        const storageKey = `@gc_partner_declined_requests_${maidId || 'default'}`;
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setDeclinedBookingIds(parsed);
          }
        }
      } catch (err) {
        console.log('[AsyncStorage] Error loading declined booking IDs:', err);
      }
    };
    loadDeclinedIds();
  }, [maidId]);

  // Persist helper functions
  const persistDeclineId = async (bookingId: string) => {
    try {
      const storageKey = `@gc_partner_declined_requests_${maidId || 'default'}`;
      const updated = Array.from(new Set([...declinedBookingIds, bookingId]));
      setDeclinedBookingIds(updated);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.log('[AsyncStorage] Error saving declined ID:', err);
    }
  };

  const persistRemoveDeclineId = async (bookingId: string) => {
    try {
      const storageKey = `@gc_partner_declined_requests_${maidId || 'default'}`;
      const updated = declinedBookingIds.filter(id => id !== bookingId);
      setDeclinedBookingIds(updated);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.log('[AsyncStorage] Error removing declined ID:', err);
    }
  };

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isOnline) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(0.4);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isOnline]);

  // Handle Online Toggle with Confirmation Banner
  const handleToggleOnline = () => {
    const nextState = !isOnline;
    toggleMaidOnline();
    if (nextState) {
      setShowStatusToast({
        message: "You're available for new jobs",
        type: 'success',
      });
    } else {
      setShowStatusToast({
        message: "You're not receiving new requests",
        type: 'info',
      });
    }
    setTimeout(() => {
      setShowStatusToast(null);
    }, 3500);
  };

  // Active GPS Heartbeat Sync when Online
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOnline && maidProfile?.uid) {
      const syncHeartbeat = async () => {
        try {
          await supabase
            .from('maid_profiles')
            .update({
              last_active: new Date().toISOString(),
            })
            .eq('id', maidProfile.uid);
        } catch (err) {
          console.log('[GPS Heartbeat] Sync error:', err);
        }
      };

      syncHeartbeat();
      interval = setInterval(syncHeartbeat, 30000);
    }
    return () => clearInterval(interval);
  }, [isOnline, maidProfile?.uid]);

  // Filter Jobs:
  // 1. New Jobs = bookings with status 'pending_assignment' where admin has sent an offer to this partner
  //    OR any booking with assignment_status 'partner_offered' and this partner has a pending assignment
  const newJobs = isOnline
    ? bookings.filter(
        b =>
          !declinedBookingIds.includes(b.bookingId) &&
          (
            b.status === 'pending_assignment' ||
            (b.assignmentStatus === 'partner_offered' && b.assignedMaidId === maidId)
          )
      )
    : [];

  // 2. Upcoming / Active Jobs: Assigned to current partner and in-progress/accepted state
  const upcomingJobs = bookings.filter(
    b =>
      maidId &&
      (b.assignedMaidId === maidId || b.assignedMaidName === maidProfile?.fullName) &&
      ['maid_assigned', 'maid_accepted', 'partner_accepted', 'partner_en_route', 'partner_arrived', 'in_progress', 'cleaning_started'].includes(b.status)
  );

  // 3. Completed Jobs
  const completedJobs = bookings.filter(
    b => maidId && (b.assignedMaidId === maidId || b.assignedMaidName === maidProfile?.fullName) && b.status === 'completed'
  );

  // Earnings calculation (strictly based on actual partner payout)
  const calculatedEarnings = completedJobs.reduce(
    (acc, curr) => acc + (curr.partnerPayout && curr.partnerPayout > 0 ? curr.partnerPayout : 0),
    0
  );

  const ratingVal = maidProfile?.rating ? Number(maidProfile.rating).toFixed(1) : '5.0';
  const jobsCompletedCount = maidProfile?.completedJobsCount || completedJobs.length || 0;

  // Normalization Helpers
  const formatAddress = (addr: any) => {
    if (!addr) return 'Hyderabad, Telangana · 500081';
    const house = addr.houseFlat ? `${addr.houseFlat}, ` : '';
    const street = addr.street ? `${addr.street}, ` : '';
    const locality = addr.locality ? `${addr.locality}, ` : '';
    const city = addr.city || 'Hyderabad';
    const state = addr.state || 'Telangana';
    const pincode = addr.pincode || '500081';

    let addressStr = `${house}${street}${locality}${city}, ${state} · ${pincode}`;
    addressStr = addressStr.replace(/(Hyderabad,\s*Telangana),\s*\1/gi, '$1');
    addressStr = addressStr.replace(/(Bengaluru,\s*Karnataka),\s*\1/gi, '$1');
    return addressStr;
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'Today';
    
    const todayIso = new Date().toISOString().split('T')[0];
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowIso = tomorrowObj.toISOString().split('T')[0];
    
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    
    if (cleanDate === todayIso) {
      const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return `Today · ${todayFormatted}`;
    }
    if (cleanDate === tomorrowIso) {
      const tmrwFormatted = new Date(tomorrowIso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return `Tomorrow · ${tmrwFormatted}`;
    }
    if (cleanDate === 'Today' || cleanDate === 'Tomorrow') return cleanDate;

    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[Math.max(0, parseInt(parts[1], 10) - 1)] || 'Jan';
        const day = parseInt(parts[2], 10);
        return `${month} ${day}`;
      }
    }
    return dateStr;
  };

  const getServiceCategory = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('tank') || lower.includes('clean') || lower.includes('deep')) {
      return { icon: '🧹', label: 'Cleaning' };
    }
    if (lower.includes('repair') || lower.includes('tap') || lower.includes('faucet')) {
      return { icon: '🔧', label: 'Repair' };
    }
    if (lower.includes('fan') || lower.includes('electric') || lower.includes('light')) {
      return { icon: '⚡', label: 'Electrical' };
    }
    return { icon: '✨', label: 'Service' };
  };

  // Accept Job Handler
  const handleAcceptJob = async (job: Booking) => {
    setAcceptingJobId(job.bookingId);
    try {
      const acceptedAtIso = new Date().toISOString();

      // 1. Update local state
      updateBookingStatus(job.bookingId, 'maid_assigned', {
        assignedMaidId: maidId,
        assignedMaidName: maidProfile?.fullName || 'Partner',
        assignedMaidPhone: maidProfile?.phone || '',
        assignedMaidPhoto: maidProfile?.photoUrl || '',
      });

      // 2. Update Supabase bookings table
      if (job.bookingId) {
        await supabase
          .from('bookings')
          .update({
            status: 'maid_assigned',
            assignment_status: 'assigned',
            assigned_maid_id: maidId,
            assigned_maid_name: maidProfile?.fullName || 'Partner',
            assigned_maid_phone: maidProfile?.phone || '',
            assigned_maid_photo_url: maidProfile?.photoUrl || '',
            assigned_maid_rating: maidProfile?.rating || 5.0,
            partner_accepted_at: acceptedAtIso,
            updated_at: acceptedAtIso,
          })
          .or(`booking_code.eq.${job.bookingId},id.eq.${job.bookingId}`);

        // 3. Update partner_assignments table
        try {
          const { data: bRow } = await supabase
            .from('bookings')
            .select('id')
            .or(`booking_code.eq.${job.bookingId},id.eq.${job.bookingId}`)
            .maybeSingle();

          const dbBookingId = bRow?.id || job.bookingId;
          if (dbBookingId && maidId) {
            await supabase
              .from('partner_assignments')
              .update({
                response_status: 'accepted',
                responded_at: acceptedAtIso,
              })
              .eq('booking_id', dbBookingId)
              .eq('partner_id', maidId);

            // Expire other pending offers for this booking
            await supabase
              .from('partner_assignments')
              .update({
                response_status: 'expired',
              })
              .eq('booking_id', dbBookingId)
              .neq('partner_id', maidId)
              .eq('response_status', 'pending');
          }
        } catch (assignErr) {
          console.warn('partner_assignments update note:', assignErr);
        }
      }

      setShowStatusToast({
        message: `Job accepted! Added to Upcoming.`,
        type: 'success',
      });

      if (selectedJobDetails?.bookingId === job.bookingId) {
        setSelectedJobDetails(null);
      }
    } catch (err: any) {
      Alert.alert('Unable to accept this request', err.message || 'Please try again.');
    } finally {
      setAcceptingJobId(null);
    }
  };

  // Open Decline Confirmation Modal
  const handleTriggerDecline = (job: Booking, source: 'button' | 'swipe') => {
    setDeclineTargetJob(job);
    setDeclineSource(source);
  };

  // Cancel Decline Modal Handler
  const handleCancelDeclineModal = () => {
    setDeclineTargetJob(null);
    setDeclineSource(null);
    // Reset swipe card position
    setResetSwipeTrigger(prev => prev + 1);
  };

  // Execute Decline API & Persistence
  const handleConfirmDecline = async () => {
    if (!declineTargetJob) return;
    const targetJob = declineTargetJob;

    setIsDecliningId(targetJob.bookingId);
    setDeclineTargetJob(null);

    try {
      const declinedAtIso = new Date().toISOString();

      // 1. Update partner_assignments table in Supabase so Admin Dispatch updates immediately
      try {
        const { data: bRow } = await supabase
          .from('bookings')
          .select('id')
          .or(`booking_code.eq.${targetJob.bookingId},id.eq.${targetJob.bookingId}`)
          .maybeSingle();

        const dbBookingId = bRow?.id || targetJob.bookingId;
        if (dbBookingId && maidId) {
          await supabase
            .from('partner_assignments')
            .update({
              response_status: 'declined',
              responded_at: declinedAtIso,
            })
            .eq('booking_id', dbBookingId)
            .eq('partner_id', maidId);
        }

        // Keep booking unassigned in database so Admin can assign to another partner
        await supabase
          .from('bookings')
          .update({
            assignment_status: 'unassigned',
            updated_at: declinedAtIso,
          })
          .or(`booking_code.eq.${targetJob.bookingId},id.eq.${targetJob.bookingId}`);
      } catch (err) {
        console.warn('partner_assignments decline notice:', err);
      }

      // 2. Hide declined job locally for this partner
      await persistDeclineId(targetJob.bookingId);

      if (selectedJobDetails?.bookingId === targetJob.bookingId) {
        setSelectedJobDetails(null);
      }

      // 3. Show 4-Second Undo Toast
      if (undoToast?.timer) clearTimeout(undoToast.timer);

      const timer = setTimeout(() => {
        setUndoToast(null);
      }, 4000);

      setUndoToast({
        job: targetJob,
        timer,
      });
    } catch (err: any) {
      // Backend API Failure: Keep request visible and show Retry error modal
      setDeclineErrorJob(targetJob);
    } finally {
      setIsDecliningId(null);
      setDeclineSource(null);
    }
  };

  // Undo Decline Action
  const handleUndoDecline = async () => {
    if (!undoToast) return;
    const jobToRestore = undoToast.job;

    if (undoToast.timer) clearTimeout(undoToast.timer);
    setUndoToast(null);

    try {
      // Revert persistent storage
      await persistRemoveDeclineId(jobToRestore.bookingId);

      // Revert AuthContext & Supabase state
      updateBookingStatus(jobToRestore.bookingId, 'pending_assignment');
      await supabase
        .from('bookings')
        .update({
          status: 'pending_assignment',
          updated_at: new Date().toISOString(),
        })
        .or(`booking_code.eq.${jobToRestore.bookingId},id.eq.${jobToRestore.bookingId}`);

      setShowStatusToast({
        message: 'Decline undone. Request restored to New Jobs.',
        type: 'success',
      });
    } catch (err) {
      console.log('Error undoing decline:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Fixed Header Card ── */}
      <View style={styles.headerCard}>
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              {maidProfile?.photoUrl || user?.profilePhoto ? (
                <Image
                  source={{
                    uri: maidProfile?.photoUrl || user?.profilePhoto,
                  }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={[styles.profilePhoto, { backgroundColor: '#E8F8EE', alignItems: 'center', justifyContent: 'center' }]}>
                  <User size={22} color="#0D8846" />
                </View>
              )}
              <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
            </View>

            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>
                {maidProfile?.fullName || 'Pavani'}
              </Text>
              <View style={styles.ratingRow}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>
                  {ratingVal} · {jobsCompletedCount} Jobs
                </Text>
              </View>
            </View>
          </View>

          {/* Accessible Online / Offline Toggle Control */}
          <TouchableOpacity
            onPress={handleToggleOnline}
            style={[styles.toggleBtn, isOnline ? styles.toggleOnline : styles.toggleOffline]}
            activeOpacity={0.8}
            accessibilityLabel={`Toggle status. Currently ${isOnline ? 'ONLINE' : 'OFFLINE'}`}
          >
            {isOnline ? (
              <Wifi size={14} color="#0E5B47" strokeWidth={2.5} />
            ) : (
              <WifiOff size={14} color="#64748B" strokeWidth={2.2} />
            )}
            <Text style={[styles.toggleText, isOnline ? styles.toggleTextOnline : styles.toggleTextOffline]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Sub-Navigation Segmented Tabs ── */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'new_jobs' && styles.tabBtnActive]}
            onPress={() => setActiveTab('new_jobs')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'new_jobs' && styles.tabBtnTextActive]}>
              New Jobs {newJobs.length > 0 ? `(${newJobs.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'upcoming_jobs' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upcoming_jobs')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'upcoming_jobs' && styles.tabBtnTextActive]}>
              Upcoming {upcomingJobs.length > 0 ? `(${upcomingJobs.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'earnings' && styles.tabBtnActive]}
            onPress={() => setActiveTab('earnings')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'earnings' && styles.tabBtnTextActive]}>
              Earnings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
            onPress={() => navigateTo('maid_profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Confirmation Toast Banner ── */}
      {showStatusToast && (
        <View style={[styles.toastContainer, showStatusToast.type === 'info' && styles.toastInfoContainer]}>
          <Sparkles size={16} color={showStatusToast.type === 'info' ? '#475569' : '#0E5B47'} />
          <Text style={[styles.toastText, showStatusToast.type === 'info' && styles.toastInfoText]}>
            {showStatusToast.message}
          </Text>
          <TouchableOpacity onPress={() => setShowStatusToast(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color={showStatusToast.type === 'info' ? '#475569' : '#0E5B47'} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── 4-SECOND UNDO DECLINE SNACKBAR ── */}
      {undoToast && (
        <View style={styles.undoSnackbarContainer}>
          <View style={styles.undoSnackbarLeft}>
            <XCircle size={18} color="#FCA5A5" />
            <Text style={styles.undoSnackbarText}>Request declined</Text>
          </View>
          <TouchableOpacity
            style={styles.undoBtn}
            onPress={handleUndoDecline}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RotateCcw size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── TAB 1: NEW JOBS (INCOMING SERVICE REQUESTS) ── */}
        {activeTab === 'new_jobs' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Incoming Service Requests</Text>
              <Text style={styles.sectionSub}>Swipe right or tap Decline to dismiss a request</Text>
            </View>

            {!isOnline ? (
              /* Offline State Card */
              <View style={styles.offlineCard}>
                <View style={styles.illustrationCircle}>
                  <Radio size={32} color="#64748B" />
                </View>
                <Text style={styles.offlineCardTitle}>You're currently offline</Text>
                <Text style={styles.offlineCardSub}>
                  Go online to start receiving service requests in your area.
                </Text>
                <TouchableOpacity
                  style={styles.goOnlineBtnPrimary}
                  onPress={handleToggleOnline}
                  activeOpacity={0.85}
                >
                  <Power size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.goOnlineBtnText}>Go Online</Text>
                </TouchableOpacity>
              </View>
            ) : newJobs.length === 0 ? (
              /* Online Empty State Card */
              <View style={styles.onlineWaitingCard}>
                <View style={styles.onlineIndicatorBox}>
                  <Animated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
                  <Text style={styles.onlineStatusLabel}>ONLINE</Text>
                </View>
                <Text style={styles.onlineWaitingTitle}>No new service requests</Text>
                <Text style={styles.onlineWaitingSub}>
                  New jobs will appear here when they're available in your service area. Keep your app open!
                </Text>

                <TouchableOpacity
                  style={styles.goOfflineSecondaryBtn}
                  onPress={handleToggleOnline}
                  activeOpacity={0.8}
                >
                  <Text style={styles.goOfflineSecondaryText}>Go Offline</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Online State with Active Job Requests */
              <View style={styles.jobsList}>
                {newJobs.map(job => {
                  const cat = getServiceCategory(job.serviceName);
                  const payoutDisplay = job.partnerPayout && job.partnerPayout > 0
                    ? `₹${job.partnerPayout}`
                    : 'Payout Pending';
                  const isAcceptingThis = acceptingJobId === job.bookingId;
                  const isDecliningThis = isDecliningId === job.bookingId;

                  return (
                    <SwipeableJobCard
                      key={job.bookingId}
                      job={job}
                      payoutDisplay={payoutDisplay}
                      category={cat}
                      formatAddress={formatAddress}
                      formatDateLabel={formatDateLabel}
                      onSelectDetails={setSelectedJobDetails}
                      onDeclinePress={handleTriggerDecline}
                      onAcceptPress={handleAcceptJob}
                      isAccepting={isAcceptingThis}
                      isDeclining={isDecliningThis}
                      resetSwipeTrigger={resetSwipeTrigger}
                    />
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── TAB 2: UPCOMING / ACTIVE JOBS ── */}
        {activeTab === 'upcoming_jobs' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Accepted & Active Jobs</Text>
              <Text style={styles.sectionSub}>Tap any job to open execution stepper</Text>
            </View>

            {upcomingJobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Briefcase size={32} color="#94A3B8" style={{ alignSelf: 'center', marginBottom: 8, opacity: 0.6 }} />
                <Text style={styles.emptyText}>No upcoming jobs accepted yet.</Text>
                <Text style={styles.emptySubText}>Check the "New Jobs" tab to accept service requests.</Text>
              </View>
            ) : (
              <View style={styles.jobsList}>
                {upcomingJobs.map(job => (
                  <View key={job.bookingId} style={styles.jobCard}>
                    <View style={styles.jobCardHeader}>
                      <View style={styles.serviceBadge}>
                        <Text style={styles.serviceBadgeText}>{job.serviceName}</Text>
                      </View>
                      <Text style={styles.payoutText}>
                        {job.partnerPayout && job.partnerPayout > 0 ? `Payout: ₹${job.partnerPayout}` : 'Payout Pending'}
                      </Text>
                    </View>

                    <View style={styles.jobDetailsGroup}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#0E5B47" />
                        <Text style={styles.addressText}>{formatAddress(job.address)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={14} color="#64748B" />
                        <Text style={styles.timeText}>
                          {formatDateLabel(job.date)} | {job.timeSlot}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigateTo('active_job', { booking: job })}
                      style={styles.openStepperBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.openStepperBtnText}>Open Execution Stepper ({job.status})</Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── TAB 3: EARNINGS SUMMARY ── */}
        {activeTab === 'earnings' && (
          <View style={styles.sectionContainer}>
            <View style={styles.earningsHeroCard}>
              <View style={styles.earningsHeroIcon}>
                <DollarSign size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.earningsHeroLabel}>TOTAL PARTNER EARNINGS</Text>
              <Text style={styles.earningsHeroValue}>₹{calculatedEarnings.toLocaleString()}</Text>
              <Text style={styles.earningsHeroSub}>{completedJobs.length} Completed Jobs Total</Text>
            </View>

            <View style={styles.earningsStatsGrid}>
              <View style={styles.earningsStatBox}>
                <TrendingUp size={20} color="#168A68" />
                <Text style={styles.earningsBoxLabel}>This Month</Text>
                <Text style={styles.earningsBoxValue}>₹{calculatedEarnings.toLocaleString()}</Text>
              </View>

              <View style={styles.earningsStatBox}>
                <ShieldCheck size={20} color="#0284C7" />
                <Text style={styles.earningsBoxLabel}>Completed Jobs</Text>
                <Text style={styles.earningsBoxValue}>{completedJobs.length}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.viewFullEarningsBtn} onPress={() => navigateTo('earnings')} activeOpacity={0.88}>
              <Text style={styles.viewFullEarningsBtnText}>View Detailed Earnings & Payout History</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── MODAL 1: DECLINE CONFIRMATION DIALOG (BUTTON & SWIPE) ── */}
      <Modal
        visible={!!declineTargetJob}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDeclineModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalWarningIcon}>
              <AlertTriangle size={28} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Decline this request?</Text>
            <Text style={styles.modalSubtext}>
              {declineSource === 'swipe'
                ? 'This request will be removed from your incoming jobs.'
                : "You won't receive this request again after declining it."}
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleCancelDeclineModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeclineConfirmBtn}
                onPress={handleConfirmDecline}
                activeOpacity={0.88}
              >
                <Text style={styles.modalDeclineConfirmText}>Decline Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: API DECLINE FAILURE / RETRY DIALOG ── */}
      <Modal
        visible={!!declineErrorJob}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeclineErrorJob(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalWarningIcon}>
              <XCircle size={28} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Unable to decline request</Text>
            <Text style={styles.modalSubtext}>
              Network connection error. Please try again.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeclineErrorJob(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeclineConfirmBtn}
                onPress={() => {
                  const jobToRetry = declineErrorJob;
                  setDeclineErrorJob(null);
                  if (jobToRetry) {
                    setDeclineTargetJob(jobToRetry);
                    handleConfirmDecline();
                  }
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.modalDeclineConfirmText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: JOB REQUEST DETAILS MODAL ── */}
      <Modal
        visible={!!selectedJobDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedJobDetails(null)}
      >
        {selectedJobDetails && (
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.detailsHeaderRow}>
                <Text style={styles.detailsModalTitle}>Job Request Details</Text>
                <TouchableOpacity onPress={() => setSelectedJobDetails(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {/* Service Name */}
                <View style={styles.detailSectionItem}>
                  <Text style={styles.detailSectionLabel}>SERVICE REQUESTED</Text>
                  <Text style={styles.detailSectionValue}>{selectedJobDetails.serviceName}</Text>
                </View>

                {/* Location */}
                <View style={styles.detailSectionItem}>
                  <Text style={styles.detailSectionLabel}>CUSTOMER & LOCATION</Text>
                  <Text style={styles.detailSectionValue}>{formatAddress(selectedJobDetails.address)}</Text>
                  <Text style={styles.distanceBadge}>~ 2.5 km away in your service area</Text>
                </View>

                {/* Date & Time */}
                <View style={styles.detailSectionItem}>
                  <Text style={styles.detailSectionLabel}>SCHEDULED TIME</Text>
                  <Text style={styles.detailSectionValue}>
                    {formatDateLabel(selectedJobDetails.date)} · {selectedJobDetails.timeSlot || '9:00 AM – 11:00 AM'}
                  </Text>
                </View>

                {/* Partner Final Payout (Strict Privacy: No customer pricing shown) */}
                <View style={styles.payoutBreakdownCard}>
                  <Text style={styles.detailSectionLabel}>PARTNER PAYOUT</Text>
                  <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                    <Text style={styles.breakdownTotalLabel}>Final Payout</Text>
                    <Text style={styles.breakdownTotalValue}>
                      {selectedJobDetails.partnerPayout && selectedJobDetails.partnerPayout > 0
                        ? `₹${selectedJobDetails.partnerPayout}`
                        : 'Payout Pending'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 8, fontStyle: 'italic' }}>
                    Payout is finalized from Supabase based on the partner agreement. Customer pricing and invoices are kept strictly confidential.
                  </Text>
                </View>

                {/* Special instructions */}
                <View style={styles.detailSectionItem}>
                  <Text style={styles.detailSectionLabel}>SPECIAL INSTRUCTIONS</Text>
                  <Text style={styles.detailSectionValue}>
                    {selectedJobDetails.specialInstructions || 'Please bring standard cleaning tools and reach 5 mins before scheduled time.'}
                  </Text>
                </View>
              </ScrollView>

              {/* Action buttons inside details modal */}
              <View style={[styles.actionButtonsRow, { marginTop: 16 }]}>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => {
                    const target = selectedJobDetails;
                    setSelectedJobDetails(null);
                    handleTriggerDecline(target, 'button');
                  }}
                  activeOpacity={0.8}
                >
                  <XCircle size={16} color="#DC2626" />
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptJob(selectedJobDetails)}
                  activeOpacity={0.88}
                >
                  <CheckCircle size={16} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Accept Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <SlotConfirmationModal
        visible={Boolean(slotReminderBooking)}
        booking={slotReminderBooking}
        role="maid"
        onConfirm={confirmMaidSlot}
        onClose={() => setDismissedSlotReminderId(slotReminderBooking?.bookingId || null)}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusDotOnline: {
    backgroundColor: '#16A34A',
  },
  statusDotOffline: {
    backgroundColor: '#94A3B8',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleOnline: {
    backgroundColor: '#EAF8F1',
    borderColor: '#A7F3D0',
  },
  toggleOffline: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  toggleText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toggleTextOnline: {
    color: '#0E5B47',
  },
  toggleTextOffline: {
    color: '#64748B',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#0E5B47',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF8F1',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastInfoContainer: {
    backgroundColor: '#F1F5F9',
    borderBottomColor: '#CBD5E1',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5B47',
    flex: 1,
    marginHorizontal: 8,
  },
  toastInfoText: {
    color: '#475569',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {},
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Card Layout & Non-Colliding Payout System */
  jobsList: {
    gap: 12,
  },
  newJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  payoutBlock: {
    alignItems: 'flex-end',
    backgroundColor: '#F5FCF8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  payoutLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0E5B47',
    marginTop: 1,
  },
  serviceTitleBox: {
    marginBottom: 10,
  },
  jobServiceTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 21,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  jobDetailsGroup: {
    gap: 6,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 12.5,
    color: '#334155',
    flex: 1,
    lineHeight: 17,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  declineBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  declineBtnDisabled: {
    opacity: 0.6,
  },
  acceptBtn: {
    flex: 2,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0E5B47',
  },
  acceptBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Undo Snackbar */
  undoSnackbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  undoSnackbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoSnackbarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  undoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Empty States */
  offlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  illustrationCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  offlineCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  offlineCardSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  goOnlineBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E5B47',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 18,
  },
  goOnlineBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineWaitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    elevation: 2,
  },
  onlineIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  onlineStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  onlineWaitingTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  onlineWaitingSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  goOfflineSecondaryBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  goOfflineSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceBadge: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5B47',
  },
  payoutText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  openStepperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#168A68',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  openStepperBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsHeroCard: {
    backgroundColor: '#0E5B47',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  earningsHeroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  earningsHeroValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  earningsHeroSub: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 4,
  },
  earningsStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  earningsStatBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earningsBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  earningsBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  viewFullEarningsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#168A68',
    paddingVertical: 14,
    borderRadius: 14,
  },
  viewFullEarningsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalWarningIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  modalDeclineConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalDeclineConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Details Modal */
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailsModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailSectionItem: {
    marginBottom: 12,
  },
  detailSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailSectionValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5B47',
    marginTop: 3,
  },
  payoutBreakdownCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E1E8E5',
    paddingTop: 6,
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  breakdownTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0E5B47',
  },
});

