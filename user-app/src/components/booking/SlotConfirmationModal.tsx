import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Clock, CheckCircle, MapPin, User, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { Booking } from '../../types';

interface SlotConfirmationModalProps {
  visible: boolean;
  booking: Booking | null;
  role: 'customer' | 'maid';
  onConfirm: (bookingId: string) => Promise<void>;
  onClose: () => void;
}

export const SlotConfirmationModal: React.FC<SlotConfirmationModalProps> = ({
  visible,
  booking,
  role,
  onConfirm,
  onClose,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  const isAlreadyConfirmed = role === 'customer' ? booking.customerConfirmedSlot : booking.maidConfirmedSlot;
  const confirmedTimestamp = role === 'customer' ? booking.customerSlotConfirmedAt : booking.maidSlotConfirmedAt;

  const handleConfirm = async () => {
    if (submitting || isAlreadyConfirmed) return;
    setSubmitting(true);
    try {
      await onConfirm(booking.bookingId);
      Alert.alert(
        'Slot Response Confirmed ✅',
        `Your confirmation timestamp (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) has been logged in the booking record.`
      );
      onClose();
    } catch {
      Alert.alert('Error', 'Could not record confirmation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Badge */}
          <View style={styles.headerBadge}>
            <Clock size={20} color="#168A68" />
            <Text style={styles.headerBadgeText}>30-Min Pre-Service Slot Reminder</Text>
          </View>

          <Text style={styles.title}>
            {role === 'customer'
              ? 'Please Confirm Your Attendance'
              : 'Confirm Service Slot Readiness'}
          </Text>

          <Text style={styles.subtitle}>
            {role === 'customer'
              ? 'Your scheduled service starts in 30 minutes. Tap confirm to inform your assigned partner and platform.'
              : 'Your assigned customer booking starts in 30 minutes. Tap confirm to log your readiness.'}
          </Text>

          {/* Booking Info Box */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <ShieldCheck size={16} color="#168A68" />
              <Text style={styles.serviceName}>{booking.serviceName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar size={14} color="#64748B" />
              <Text style={styles.infoText}>{booking.date} • {booking.timeSlot}</Text>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={14} color="#64748B" />
              <Text style={styles.infoText} numberOfLines={1}>
                {booking.address?.locality || booking.address?.street || 'Customer Location'}
              </Text>
            </View>

            {role === 'customer' && booking.assignedMaidName && (
              <View style={styles.infoRow}>
                <User size={14} color="#64748B" />
                <Text style={styles.infoText}>Partner: {booking.assignedMaidName}</Text>
              </View>
            )}

            {role === 'maid' && booking.customerName && (
              <View style={styles.infoRow}>
                <User size={14} color="#64748B" />
                <Text style={styles.infoText}>Customer: {booking.customerName}</Text>
              </View>
            )}
          </View>

          {/* Response Status */}
          {isAlreadyConfirmed ? (
            <View style={styles.confirmedBox}>
              <CheckCircle size={18} color="#15803D" />
              <Text style={styles.confirmedText}>
                Confirmed at {confirmedTimestamp ? new Date(confirmedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </Text>
            </View>
          ) : (
            <View style={styles.pendingBox}>
              <AlertTriangle size={16} color="#B45309" />
              <Text style={styles.pendingText}>Response required within 5 minutes</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.confirmBtn, (submitting || isAlreadyConfirmed) && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={submitting || !!isAlreadyConfirmed}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>
                    {isAlreadyConfirmed ? 'Confirmed' : 'Confirm Slot Now'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    flex: 1,
  },
  confirmedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  confirmedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  actionsRow: {
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: '#168A68',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
