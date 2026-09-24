import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Clock, AlertCircle, Check } from 'lucide-react-native';

interface NativeTimePickerProps {
  startTime: string; // e.g., "08:00" or "08:00 AM"
  endTime: string;   // e.g., "20:00" or "08:00 PM"
  onStartTimeChange: (time24: string, display12: string) => void;
  onEndTimeChange: (time24: string, display12: string) => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '15', '30', '45'];

/**
 * Converts "HH:mm" (24h) or "hh:mm AM/PM" to standard { hour12, minute, period, totalMinutes, display12, time24 }
 */
export function parseTimeString(timeStr: string): {
  hour12: number;
  minute: string;
  period: 'AM' | 'PM';
  totalMinutes: number;
  display12: string;
  time24: string;
} {
  const clean = (timeStr || '').trim();
  const isAmPm = /am|pm/i.test(clean);

  let hour24 = 8;
  let minuteNum = 0;
  let period: 'AM' | 'PM' = 'AM';

  if (isAmPm) {
    const parts = clean.split(/[:\s]+/);
    let h = parseInt(parts[0], 10) || 8;
    minuteNum = parseInt(parts[1], 10) || 0;
    period = /pm/i.test(clean) ? 'PM' : 'AM';
    if (period === 'PM' && h < 12) hour24 = h + 12;
    else if (period === 'AM' && h === 12) hour24 = 0;
    else hour24 = h;
  } else if (clean.includes(':')) {
    const parts = clean.split(':');
    hour24 = parseInt(parts[0], 10) || 8;
    minuteNum = parseInt(parts[1], 10) || 0;
    period = hour24 >= 12 ? 'PM' : 'AM';
  }

  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  const minStr = String(minuteNum).padStart(2, '0');
  const h12Str = String(hour12).padStart(2, '0');
  const h24Str = String(hour24).padStart(2, '0');
  const display12 = `${h12Str}:${minStr} ${period}`;
  const time24 = `${h24Str}:${minStr}`;
  const totalMinutes = hour24 * 60 + minuteNum;

  return {
    hour12,
    minute: minStr,
    period,
    totalMinutes,
    display12,
    time24,
  };
}

export const NativeTimePicker: React.FC<NativeTimePickerProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}) => {
  const parsedStart = parseTimeString(startTime || '08:00');
  const parsedEnd = parseTimeString(endTime || '20:00');

  // Modal State
  const [modalTarget, setModalTarget] = useState<'start' | 'end' | null>(null);
  const [tempHour, setTempHour] = useState<number>(8);
  const [tempMinute, setTempMinute] = useState<string>('00');
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('AM');

  const openPicker = (target: 'start' | 'end') => {
    const current = target === 'start' ? parsedStart : parsedEnd;
    setTempHour(current.hour12);
    setTempMinute(current.minute);
    setTempPeriod(current.period);
    setModalTarget(target);
  };

  const confirmSelection = () => {
    let hour24 = tempHour;
    if (tempPeriod === 'PM' && tempHour < 12) hour24 = tempHour + 12;
    else if (tempPeriod === 'AM' && tempHour === 12) hour24 = 0;

    const time24 = `${String(hour24).padStart(2, '0')}:${tempMinute}`;
    const display12 = `${String(tempHour).padStart(2, '0')}:${tempMinute} ${tempPeriod}`;

    if (modalTarget === 'start') {
      onStartTimeChange(time24, display12);
    } else if (modalTarget === 'end') {
      onEndTimeChange(time24, display12);
    }
    setModalTarget(null);
  };

  const isInvalid = parsedEnd.totalMinutes <= parsedStart.totalMinutes;

  return (
    <View style={styles.container}>
      <View style={styles.pickersRow}>
        {/* Start Time Picker Button */}
        <View style={styles.pickerColumn}>
          <Text style={styles.fieldLabel}>Start Time *</Text>
          <TouchableOpacity
            style={[styles.pickerButton, modalTarget === 'start' && styles.pickerButtonActive]}
            onPress={() => openPicker('start')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Start Time: ${parsedStart.display12}`}
          >
            <Clock size={18} color="#168A68" />
            <View style={styles.pickerTextContainer}>
              <Text style={styles.pickerValueText}>{parsedStart.display12}</Text>
              <Text style={styles.pickerSubLabel}>Morning / Shift Start</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* End Time Picker Button */}
        <View style={styles.pickerColumn}>
          <Text style={styles.fieldLabel}>End Time *</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              modalTarget === 'end' && styles.pickerButtonActive,
              isInvalid && styles.pickerButtonError,
            ]}
            onPress={() => openPicker('end')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`End Time: ${parsedEnd.display12}`}
          >
            <Clock size={18} color={isInvalid ? '#DC2626' : '#168A68'} />
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerValueText, isInvalid && styles.pickerValueError]}>
                {parsedEnd.display12}
              </Text>
              <Text style={styles.pickerSubLabel}>Evening / Shift End</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Validation Message */}
      {isInvalid ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={15} color="#DC2626" />
          <Text style={styles.errorBannerText}>
            End time ({parsedEnd.display12}) must be later than start time ({parsedStart.display12}).
          </Text>
        </View>
      ) : (
        <Text style={styles.hintText}>
          Selected operating window: {parsedStart.display12} to {parsedEnd.display12} (
          {((parsedEnd.totalMinutes - parsedStart.totalMinutes) / 60).toFixed(1)} hrs/day)
        </Text>
      )}

      {/* AM/PM Time Selector Modal */}
      <Modal
        visible={modalTarget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Clock size={20} color="#168A68" />
              <Text style={styles.modalTitle}>
                Select {modalTarget === 'start' ? 'Start Time' : 'End Time'}
              </Text>
            </View>

            {/* Current Selection Preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewTimeText}>
                {String(tempHour).padStart(2, '0')}:{tempMinute}
              </Text>
              <View style={styles.previewPeriodBadge}>
                <Text style={styles.previewPeriodText}>{tempPeriod}</Text>
              </View>
            </View>

            {/* AM / PM Toggle */}
            <View style={styles.periodRow}>
              {(['AM', 'PM'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, tempPeriod === p && styles.periodBtnActive]}
                  onPress={() => setTempPeriod(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodBtnText, tempPeriod === p && styles.periodBtnTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hour Selector */}
            <Text style={styles.selectorSubTitle}>Hour (1 - 12)</Text>
            <View style={styles.gridContainer}>
              {HOURS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.chipBtn, tempHour === h && styles.chipBtnActive]}
                  onPress={() => setTempHour(h)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipBtnText, tempHour === h && styles.chipBtnTextActive]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minute Selector */}
            <Text style={styles.selectorSubTitle}>Minute</Text>
            <View style={styles.gridContainer}>
              {MINUTES.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chipBtn, tempMinute === m && styles.chipBtnActive]}
                  onPress={() => setTempMinute(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipBtnText, tempMinute === m && styles.chipBtnTextActive]}>
                    :{m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalTarget(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmSelection}
                activeOpacity={0.88}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.modalConfirmText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonActive: {
    borderColor: '#168A68',
    backgroundColor: '#F0FDF4',
  },
  pickerButtonError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  pickerTextContainer: {
    flex: 1,
  },
  pickerValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerValueError: {
    color: '#DC2626',
  },
  pickerSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  previewTimeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  previewPeriodBadge: {
    backgroundColor: '#168A68',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewPeriodText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  periodBtnActive: {
    borderColor: '#168A68',
    backgroundColor: '#168A68',
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  selectorSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chipBtn: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  chipBtnActive: {
    borderColor: '#168A68',
    backgroundColor: '#ECFDF5',
  },
  chipBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  chipBtnTextActive: {
    color: '#168A68',
    fontWeight: '900',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#168A68',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
