import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Clock, AlertCircle, Check, X } from 'lucide-react-native';

interface NativeTimePickerProps {
  startTime: string; // e.g., "09:00 AM" or "09:00"
  endTime: string;   // e.g., "06:00 PM" or "18:00"
  onStartTimeChange: (time24: string, display12: string) => void;
  onEndTimeChange: (time24: string, display12: string) => void;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

// Clock Geometry constants
const CLOCK_SIZE = 240;
const CENTER = CLOCK_SIZE / 2; // 120
const RADIUS = 84; // marker circle radius
const MARKER_SIZE = 34;
const HALF_MARKER = MARKER_SIZE / 2;

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

  let hour24 = 9;
  let minuteNum = 0;
  let period: 'AM' | 'PM' = 'AM';

  if (isAmPm) {
    const parts = clean.split(/[:\s]+/);
    let h = parseInt(parts[0], 10) || 9;
    minuteNum = parseInt(parts[1], 10) || 0;
    period = /pm/i.test(clean) ? 'PM' : 'AM';
    if (period === 'PM' && h < 12) hour24 = h + 12;
    else if (period === 'AM' && h === 12) hour24 = 0;
    else hour24 = h;
  } else if (clean.includes(':')) {
    const parts = clean.split(':');
    hour24 = parseInt(parts[0], 10) || 9;
    minuteNum = parseInt(parts[1], 10) || 0;
    period = hour24 >= 12 ? 'PM' : 'AM';
  }

  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  const minStr = String(minuteNum).padStart(2, '0');
  const h12Clean = `${hour12}`;
  const h12Padded = String(hour12).padStart(2, '0');
  const h24Str = String(hour24).padStart(2, '0');
  // Formatted nicely like "9:00 AM" or "09:00 AM"
  const display12 = `${h12Clean}:${minStr} ${period}`;
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
  const parsedStart = parseTimeString(startTime || '09:00 AM');
  const parsedEnd = parseTimeString(endTime || '06:00 PM');

  // Modal State
  const [modalTarget, setModalTarget] = useState<'start' | 'end' | null>(null);
  const [pickerMode, setPickerMode] = useState<'hour' | 'minute'>('hour');
  const [tempHour, setTempHour] = useState<number>(9);
  const [tempMinute, setTempMinute] = useState<string>('00');
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('AM');

  const openPicker = (target: 'start' | 'end') => {
    const current = target === 'start' ? parsedStart : parsedEnd;
    setTempHour(current.hour12);
    setTempMinute(current.minute);
    setTempPeriod(current.period);
    setPickerMode('hour');
    setModalTarget(target);
  };

  const handleSelectHour = (h: number) => {
    setTempHour(h);
    // Smooth auto-transition to minute selection
    setTimeout(() => {
      setPickerMode('minute');
    }, 280);
  };

  const handleSelectMinute = (m: string) => {
    setTempMinute(m);
  };

  const confirmSelection = () => {
    let hour24 = tempHour;
    if (tempPeriod === 'PM' && tempHour < 12) hour24 = tempHour + 12;
    else if (tempPeriod === 'AM' && tempHour === 12) hour24 = 0;

    const time24 = `${String(hour24).padStart(2, '0')}:${tempMinute}`;
    const display12 = `${tempHour}:${tempMinute} ${tempPeriod}`;

    if (modalTarget === 'start') {
      onStartTimeChange(time24, display12);
    } else if (modalTarget === 'end') {
      onEndTimeChange(time24, display12);
    }
    setModalTarget(null);
  };

  const isInvalid = parsedEnd.totalMinutes <= parsedStart.totalMinutes;

  // Selected angle for hand pointer
  const getHandRotation = (): number => {
    if (pickerMode === 'hour') {
      // 12 is top (0 deg), 1 is 30 deg, etc.
      const val = tempHour % 12;
      return val * 30;
    } else {
      const minNum = parseInt(tempMinute, 10) || 0;
      return minNum * 6; // 360 / 60 = 6 deg per minute
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Working Hours Display Banner ── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <Clock size={16} color="#168A68" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Working Hours</Text>
          <Text style={styles.summaryValue}>
            {parsedStart.display12} – {parsedEnd.display12}
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>
            {((parsedEnd.totalMinutes - parsedStart.totalMinutes) / 60).toFixed(1)} hrs
          </Text>
        </View>
      </View>

      {/* ── Start Time & End Time Clock Buttons ── */}
      <View style={styles.pickersRow}>
        {/* Start Time Trigger */}
        <View style={styles.pickerColumn}>
          <Text style={styles.fieldLabel}>Start Time *</Text>
          <TouchableOpacity
            style={[styles.pickerButton, modalTarget === 'start' && styles.pickerButtonActive]}
            onPress={() => openPicker('start')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Start Time: ${parsedStart.display12}`}
          >
            <Clock size={16} color="#168A68" />
            <View style={styles.pickerTextContainer}>
              <Text style={styles.pickerValueText}>{parsedStart.display12}</Text>
              <Text style={styles.pickerSubLabel}>Tap to open clock</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* End Time Trigger */}
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
            <Clock size={16} color={isInvalid ? '#DC2626' : '#168A68'} />
            <View style={styles.pickerTextContainer}>
              <Text style={[styles.pickerValueText, isInvalid && styles.pickerValueError]}>
                {parsedEnd.display12}
              </Text>
              <Text style={styles.pickerSubLabel}>Tap to open clock</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Validation Banner if End is earlier or equal to Start */}
      {isInvalid && (
        <View style={styles.errorBanner}>
          <AlertCircle size={14} color="#DC2626" />
          <Text style={styles.errorBannerText}>
            End time ({parsedEnd.display12}) must be after start time ({parsedStart.display12}).
          </Text>
        </View>
      )}

      {/* ── ANALOG CLOCK MODAL ── */}
      <Modal
        visible={modalTarget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Clock size={18} color="#168A68" />
                <Text style={styles.modalTitle}>
                  Select {modalTarget === 'start' ? 'Start Time' : 'End Time'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalTarget(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Big Interactive Time Display with AM/PM */}
            <View style={styles.clockHeaderDisplay}>
              <View style={styles.digitsRow}>
                {/* Hour selection tab */}
                <TouchableOpacity
                  style={[
                    styles.timeDigitBox,
                    pickerMode === 'hour' && styles.timeDigitBoxActive,
                  ]}
                  onPress={() => setPickerMode('hour')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeDigitText,
                      pickerMode === 'hour' && styles.timeDigitTextActive,
                    ]}
                  >
                    {String(tempHour).padStart(2, '0')}
                  </Text>
                  <Text style={styles.digitLabel}>HOUR</Text>
                </TouchableOpacity>

                <Text style={styles.digitColon}>:</Text>

                {/* Minute selection tab */}
                <TouchableOpacity
                  style={[
                    styles.timeDigitBox,
                    pickerMode === 'minute' && styles.timeDigitBoxActive,
                  ]}
                  onPress={() => setPickerMode('minute')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeDigitText,
                      pickerMode === 'minute' && styles.timeDigitTextActive,
                    ]}
                  >
                    {tempMinute}
                  </Text>
                  <Text style={styles.digitLabel}>MIN</Text>
                </TouchableOpacity>
              </View>

              {/* AM / PM Toggle Pills */}
              <View style={styles.ampmSelector}>
                <TouchableOpacity
                  style={[styles.ampmBtn, tempPeriod === 'AM' && styles.ampmBtnActive]}
                  onPress={() => setTempPeriod('AM')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.ampmBtnText, tempPeriod === 'AM' && styles.ampmBtnTextActive]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, tempPeriod === 'PM' && styles.ampmBtnActive]}
                  onPress={() => setTempPeriod('PM')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.ampmBtnText, tempPeriod === 'PM' && styles.ampmBtnTextActive]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Instruction Cue */}
            <Text style={styles.clockInstruction}>
              {pickerMode === 'hour' ? '① Select Hour on Clock' : '② Select Minutes on Clock'}
            </Text>

            {/* ── Circular Analog Clock Face ── */}
            <View style={styles.clockFaceWrapper}>
              <View style={styles.clockDial}>
                {/* Center Pivot Pin */}
                <View style={styles.clockCenterPin} />

                {/* Clock Hand Pointer */}
                <View
                  style={[
                    styles.clockHandContainer,
                    {
                      transform: [
                        { rotate: `${getHandRotation()}deg` },
                      ],
                    },
                  ]}
                >
                  <View style={styles.clockHandLine} />
                  <View style={styles.clockHandPointerDisk} />
                </View>

                {/* Radial Clock Numbers */}
                {pickerMode === 'hour'
                  ? HOURS.map(h => {
                      // Angle in radians: (h * 30 - 90) * (PI / 180)
                      const angleDeg = h * 30 - 90;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const left = CENTER + RADIUS * Math.cos(angleRad) - HALF_MARKER;
                      const top = CENTER + RADIUS * Math.sin(angleRad) - HALF_MARKER;
                      const isSelected = tempHour === h;

                      return (
                        <TouchableOpacity
                          key={`hour_${h}`}
                          style={[
                            styles.clockNumberItem,
                            { left, top },
                            isSelected && styles.clockNumberItemSelected,
                          ]}
                          onPress={() => handleSelectHour(h)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.clockNumberText,
                              isSelected && styles.clockNumberTextSelected,
                            ]}
                          >
                            {h}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  : MINUTES.map((m, idx) => {
                      // idx: 0 = 00 (top), 1 = 05, etc.
                      const angleDeg = idx * 30 - 90;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const left = CENTER + RADIUS * Math.cos(angleRad) - HALF_MARKER;
                      const top = CENTER + RADIUS * Math.sin(angleRad) - HALF_MARKER;
                      const isSelected = tempMinute === m;

                      return (
                        <TouchableOpacity
                          key={`min_${m}`}
                          style={[
                            styles.clockNumberItem,
                            { left, top },
                            isSelected && styles.clockNumberItemSelected,
                          ]}
                          onPress={() => handleSelectMinute(m)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.clockNumberText,
                              isSelected && styles.clockNumberTextSelected,
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
              </View>
            </View>

            {/* Quick Mode Switcher Pills */}
            <View style={styles.modeSwitchRow}>
              <TouchableOpacity
                style={[styles.modeTab, pickerMode === 'hour' && styles.modeTabActive]}
                onPress={() => setPickerMode('hour')}
              >
                <Text style={[styles.modeTabText, pickerMode === 'hour' && styles.modeTabTextActive]}>
                  Hour ({tempHour})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, pickerMode === 'minute' && styles.modeTabActive]}
                onPress={() => setPickerMode('minute')}
              >
                <Text style={[styles.modeTabText, pickerMode === 'minute' && styles.modeTabTextActive]}>
                  Minute (:{tempMinute})
                </Text>
              </TouchableOpacity>
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
                <Text style={styles.modalConfirmText}>Confirm Time</Text>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 10,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#064E3B',
    marginTop: 1,
  },
  summaryBadge: {
    backgroundColor: '#168A68',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerValueError: {
    color: '#DC2626',
  },
  pickerSubLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
  },
  errorBannerText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  clockHeaderDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeDigitBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeDigitBoxActive: {
    borderColor: '#168A68',
    backgroundColor: '#DCFCE7',
  },
  timeDigitText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#334155',
  },
  timeDigitTextActive: {
    color: '#0E5B47',
  },
  digitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 1,
  },
  digitColon: {
    fontSize: 24,
    fontWeight: '900',
    color: '#94A3B8',
    marginHorizontal: 2,
  },
  ampmSelector: {
    flexDirection: 'column',
    gap: 4,
  },
  ampmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  ampmBtnActive: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  ampmBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  ampmBtnTextActive: {
    color: '#FFFFFF',
  },
  clockInstruction: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  clockFaceWrapper: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  clockDial: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockCenterPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#168A68',
    zIndex: 10,
  },
  clockHandContainer: {
    position: 'absolute',
    width: 4,
    height: RADIUS,
    left: CENTER - 2,
    top: CENTER - RADIUS,
    transformOrigin: 'bottom center',
    alignItems: 'center',
    zIndex: 5,
  },
  clockHandLine: {
    width: 2,
    height: RADIUS,
    backgroundColor: '#168A68',
  },
  clockHandPointerDisk: {
    position: 'absolute',
    top: -HALF_MARKER,
    left: 2 - HALF_MARKER,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: HALF_MARKER,
    backgroundColor: '#168A68',
    opacity: 0.9,
  },
  clockNumberItem: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: HALF_MARKER,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  clockNumberItemSelected: {
    backgroundColor: '#168A68',
    elevation: 3,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  clockNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  clockNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0369A1',
    fontWeight: '800',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#168A68',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
