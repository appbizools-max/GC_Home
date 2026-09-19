import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Check,
  ShieldCheck,
  Edit2,
  Sparkles,
  ArrowRight,
  Smartphone,
  Banknote,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { PaymentMethod } from '../../types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const QUICK_DATES = [
  { label: 'Today (18 Sep)', date: '2026-09-18' },
  { label: 'Tomorrow (19 Sep)', date: '2026-09-19' },
  { label: '20 Sep', date: '2026-09-20' },
  { label: '21 Sep', date: '2026-09-21' },
];

const CLOCK_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLOCK_CENTER = 110;
const CLOCK_RADIUS = 78;

const TIME_PRESETS = [
  { label: '08:00 AM', hour: 8, minute: '00', period: 'AM' as const },
  { label: '10:00 AM', hour: 10, minute: '00', period: 'AM' as const },
  { label: '01:00 PM', hour: 1, minute: '00', period: 'PM' as const },
  { label: '04:00 PM', hour: 4, minute: '00', period: 'PM' as const },
  { label: '06:00 PM', hour: 6, minute: '00', period: 'PM' as const },
];

const computeArrivalWindow = (hour: number, minute: string, period: 'AM' | 'PM') => {
  const padH = String(hour).padStart(2, '0');
  const startStr = `${padH}:${minute} ${period}`;

  let endHour = hour + 2;
  let endPeriod = period;

  if (period === 'AM') {
    if (hour === 10) {
      endHour = 12;
      endPeriod = 'PM';
    } else if (hour === 11) {
      endHour = 1;
      endPeriod = 'PM';
    } else if (hour === 12) {
      endHour = 2;
      endPeriod = 'AM';
    }
  } else {
    if (hour === 10) {
      endHour = 12;
      endPeriod = 'AM';
    } else if (hour === 11) {
      endHour = 1;
      endPeriod = 'AM';
    } else if (hour === 12) {
      endHour = 2;
      endPeriod = 'PM';
    } else if (endHour > 12) {
      endHour = endHour - 12;
    }
  }

  const padEndH = String(endHour).padStart(2, '0');
  const endStr = `${padEndH}:${minute} ${endPeriod}`;
  return `${startStr} - ${endStr}`;
};

export const BookingScreen: React.FC = () => {
  const { selectedService, createBooking, navigateTo, goBack, user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>('2026-09-18');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 8, 1));
  const [selectedHour, setSelectedHour] = useState<number>(10);
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState<boolean>(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState<boolean>(false);

  const selectedSlot = computeArrivalWindow(selectedHour, selectedMinute, selectedPeriod);

  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [street, setStreet] = useState<string>('Flat 402, Green Glen Layout');
  const [locality, setLocality] = useState<string>('Bellandur');
  const [city] = useState<string>('Bengaluru');
  const [pincode] = useState<string>('560103');
  const [instructions, setInstructions] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  if (!selectedService) {
    navigateTo('services_listing');
    return null;
  }

  const baseServicePrice = selectedService.startingPrice;
  const safetyKitFee = 49;
  const discountAmount = 100;
  const finalTotalAmount = Math.max(0, baseServicePrice + safetyKitFee - discountAmount);

  const handleConfirmBooking = () => {
    const booking = createBooking({
      customerName: user?.name || 'Rahul Verma',
      customerPhone: user?.phone || '+91 98111 22233',
      serviceId: selectedService.serviceId,
      serviceName: selectedService.name,
      servicePrice: baseServicePrice,
      address: {
        id: 'addr_' + Date.now(),
        label: 'Home',
        street,
        locality,
        city,
        pincode,
      },
      date: selectedDate,
      timeSlot: selectedSlot,
      specialInstructions: instructions,
      paymentMethod,
      paymentStatus: paymentMethod === 'pay_on_completion' ? 'pending' : 'paid',
      totalAmount: finalTotalAmount,
    });

    navigateTo('booking_confirmation', { booking });
  };

  const calYear = currentMonthDate.getFullYear();
  const calMonth = currentMonthDate.getMonth();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const canGoPrev = !(calYear === 2026 && calMonth <= 8);
  const canGoNext = !(calYear === 2026 && calMonth >= 11);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setCurrentMonthDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setCurrentMonthDate(new Date(calYear, calMonth + 1, 1));
  };

  const formatSelectedDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
    return `${dayName}, ${d} ${MONTH_NAMES[m]} ${y}`;
  };

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Checkout & Schedule</Text>
          <Text style={styles.headerSub}>Step 2 of 2 • Final Step</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Selected Service Summary Card ── */}
        <View style={styles.summaryCard}>
          <Image source={{ uri: selectedService.imageUrl }} style={styles.serviceThumb} />
          <View style={styles.summaryInfo}>
            <View style={styles.verifiedRow}>
              <ShieldCheck size={12} color="#1E4E3D" />
              <Text style={styles.verifiedText}>GC GUARANTEED</Text>
            </View>
            <Text style={styles.serviceNameText}>{selectedService.name}</Text>
            <Text style={styles.serviceDurationText}>{selectedService.estimatedDuration}</Text>
          </View>
          <View style={styles.summaryPriceBox}>
            <Text style={styles.priceLabel}>Package</Text>
            <Text style={styles.priceValueText}>₹{baseServicePrice}</Text>
          </View>
        </View>

        {/* ── Service Schedule (Click to Select Date & Time) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Calendar size={16} color="#1E4E3D" />
            <Text style={styles.sectionTitle}>Service Schedule</Text>
          </View>

          {/* Click to Select Date */}
          <TouchableOpacity
            onPress={() => setIsDatePickerVisible(true)}
            style={styles.clickableSelectorTile}
            activeOpacity={0.78}
          >
            <View style={styles.selectorTileLeft}>
              <View style={styles.selectorIconBadge}>
                <Calendar size={18} color="#1E4E3D" />
              </View>
              <View style={styles.selectorTextCol}>
                <Text style={styles.selectorSubLabel}>SERVICE DATE</Text>
                <Text style={styles.selectorValueText}>
                  {formatSelectedDateLabel(selectedDate)}
                </Text>
              </View>
            </View>
            <View style={styles.changeActionBadge}>
              <Text style={styles.changeActionText}>Select Date</Text>
              <ChevronRight size={14} color="#1E4E3D" />
            </View>
          </TouchableOpacity>

          {/* Click to Select Time */}
          <TouchableOpacity
            onPress={() => setIsTimePickerVisible(true)}
            style={styles.clickableSelectorTile}
            activeOpacity={0.78}
          >
            <View style={styles.selectorTileLeft}>
              <View style={styles.selectorIconBadge}>
                <Clock size={18} color="#1E4E3D" />
              </View>
              <View style={styles.selectorTextCol}>
                <Text style={styles.selectorSubLabel}>ARRIVAL TIME SLOT</Text>
                <Text style={styles.selectorValueText}>{selectedSlot}</Text>
              </View>
            </View>
            <View style={styles.changeActionBadge}>
              <Text style={styles.changeActionText}>Select Time</Text>
              <ChevronRight size={14} color="#1E4E3D" />
            </View>
          </TouchableOpacity>

          {/* Guarantee Subtext */}
          <View style={styles.scheduleGuaranteedStrip}>
            <ShieldCheck size={14} color="#15803D" />
            <Text style={styles.scheduleGuaranteedText}>
              On-time arrival guarantee • Free cancellation up to 2 hrs prior
            </Text>
          </View>
        </View>

        {/* ── Service Address ── */}
        <View style={styles.sectionCard}>
          <View style={styles.addressHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <MapPin size={16} color="#1E4E3D" />
              <Text style={styles.sectionTitle}>Service Address</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsEditingAddress(prev => !prev)}
              style={styles.editBtn}
            >
              <Edit2 size={12} color="#1E4E3D" />
              <Text style={styles.editText}>{isEditingAddress ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditingAddress ? (
            <View style={styles.editAddressInputs}>
              <TextInput
                value={street}
                onChangeText={setStreet}
                placeholder="House / Flat / Street Name"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
              <TextInput
                value={locality}
                onChangeText={setLocality}
                placeholder="Locality / Area"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>
          ) : (
            <View style={styles.addressDisplayBox}>
              <View style={styles.homeTag}>
                <Text style={styles.homeTagText}>HOME</Text>
              </View>
              <Text style={styles.addressLine1}>{street}</Text>
              <Text style={styles.addressLine2}>
                {locality}, {city} - {pincode}
              </Text>
            </View>
          )}
        </View>

        {/* ── Payment Method ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <CreditCard size={16} color="#1E4E3D" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentList}>
            {/* UPI Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('upi')}
              style={[styles.paymentItem, paymentMethod === 'upi' && styles.paymentItemActive]}
              activeOpacity={0.85}
            >
              <View style={styles.paymentLeft}>
                <View style={styles.paymentIconBox}>
                  <Smartphone size={18} color="#1E4E3D" />
                </View>
                <View>
                  <Text style={styles.paymentTitle}>UPI Instant Pay</Text>
                  <Text style={styles.paymentSub}>Google Pay, PhonePe, Paytm, BHIM</Text>
                </View>
              </View>
              <View style={[styles.radioDot, paymentMethod === 'upi' && styles.radioDotActive]} />
            </TouchableOpacity>

            {/* Card Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('card')}
              style={[styles.paymentItem, paymentMethod === 'card' && styles.paymentItemActive]}
              activeOpacity={0.85}
            >
              <View style={styles.paymentLeft}>
                <View style={styles.paymentIconBox}>
                  <CreditCard size={18} color="#1E4E3D" />
                </View>
                <View>
                  <Text style={styles.paymentTitle}>Credit or Debit Card</Text>
                  <Text style={styles.paymentSub}>Visa, Mastercard, RuPay</Text>
                </View>
              </View>
              <View style={[styles.radioDot, paymentMethod === 'card' && styles.radioDotActive]} />
            </TouchableOpacity>

            {/* Pay on Completion Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('pay_on_completion')}
              style={[
                styles.paymentItem,
                paymentMethod === 'pay_on_completion' && styles.paymentItemActive,
              ]}
              activeOpacity={0.85}
            >
              <View style={styles.paymentLeft}>
                <View style={styles.paymentIconBox}>
                  <Banknote size={18} color="#1E4E3D" />
                </View>
                <View>
                  <Text style={styles.paymentTitle}>Pay After Service</Text>
                  <Text style={styles.paymentSub}>Pay via Cash or UPI after clean completes</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioDot,
                  paymentMethod === 'pay_on_completion' && styles.radioDotActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Special Instructions ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notes for the Maid (Optional)</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g. Please focus on kitchen grease stains, ring bell twice..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={2}
            style={styles.instructionInput}
          />
        </View>

        {/* ── Bill Details ── */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Payment Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billItemLabel}>Service Package</Text>
            <Text style={styles.billItemValue}>₹{baseServicePrice}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billItemLabel}>Sanitation & Safety Kit</Text>
            <Text style={styles.billItemValue}>₹{safetyKitFee}</Text>
          </View>

          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Sparkles size={11} color="#166534" />
              <Text style={styles.discountLabel}>GC Welcome Offer</Text>
            </View>
            <Text style={styles.discountValue}>-₹{discountAmount}</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total Payable</Text>
            <Text style={styles.billTotalValue}>₹{finalTotalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Checkout Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomAmountText}>₹{finalTotalAmount}</Text>
          <Text style={styles.bottomSavingsBadge}>Saved ₹{discountAmount}</Text>
        </View>

        <TouchableOpacity
          onPress={handleConfirmBooking}
          style={styles.confirmCtaButton}
          activeOpacity={0.88}
        >
          <Text style={styles.confirmCtaText}>Confirm & Book Slot</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── Modal 1: Date Picker Calendar Modal ── */}
      <Modal
        visible={isDatePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setIsDatePickerVisible(false)}
          />
          <View style={styles.modalSheetContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#1E4E3D" />
                <Text style={styles.modalHeaderTitle}>Select Service Date</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDatePickerVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Date Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickDatesRow}
            >
              {QUICK_DATES.map(item => {
                const isSelected = selectedDate === item.date;
                return (
                  <TouchableOpacity
                    key={item.date}
                    onPress={() => {
                      setSelectedDate(item.date);
                      const [y, m] = item.date.split('-').map(Number);
                      setCurrentMonthDate(new Date(y, m - 1, 1));
                    }}
                    style={[styles.quickDateChip, isSelected && styles.quickDateChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.quickDateText, isSelected && styles.quickDateTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Calendar Container */}
            <View style={styles.calendarContainer}>
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  disabled={!canGoPrev}
                  style={[styles.navArrowBtn, !canGoPrev && styles.navArrowBtnDisabled]}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={18} color={canGoPrev ? '#1E4E3D' : '#CBD5E1'} />
                </TouchableOpacity>

                <Text style={styles.monthYearTitle}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  disabled={!canGoNext}
                  style={[styles.navArrowBtn, !canGoNext && styles.navArrowBtnDisabled]}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={18} color={canGoNext ? '#1E4E3D' : '#CBD5E1'} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdaysRow}>
                {WEEKDAY_NAMES.map(w => (
                  <Text key={w} style={styles.weekdayLabel}>{w}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <View key={`pad_${idx}`} style={styles.dayCellEmpty} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isPast = calYear === 2026 && calMonth === 8 && dayNum < 18;
                  const isToday = calYear === 2026 && calMonth === 8 && dayNum === 18;
                  const isSelected = selectedDate === dayDateStr;

                  return (
                    <TouchableOpacity
                      key={dayDateStr}
                      onPress={() => !isPast && setSelectedDate(dayDateStr)}
                      disabled={isPast}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellActive,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isPast && styles.dayCellTextPast,
                          isSelected && styles.dayCellTextActive,
                          isToday && !isSelected && styles.dayCellTextToday,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Date Indicator */}
            <View style={styles.selectedDateSummary}>
              <Check size={14} color="#15803D" strokeWidth={2.5} />
              <Text style={styles.selectedDateSummaryText}>
                Selected: <Text style={{ fontWeight: '800' }}>{formatSelectedDateLabel(selectedDate)}</Text>
              </Text>
            </View>

            {/* Done CTA */}
            <TouchableOpacity
              onPress={() => setIsDatePickerVisible(false)}
              style={styles.modalDoneBtn}
              activeOpacity={0.88}
            >
              <Text style={styles.modalDoneBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal 2: Time Clock Dial Modal ── */}
      <Modal
        visible={isTimePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTimePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTap}
            activeOpacity={1}
            onPress={() => setIsTimePickerVisible(false)}
          />
          <View style={styles.modalSheetContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#1E4E3D" />
                <Text style={styles.modalHeaderTitle}>Select Arrival Time</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTimePickerVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickDatesRow}
            >
              {TIME_PRESETS.map(preset => {
                const isActive =
                  selectedHour === preset.hour &&
                  selectedMinute === preset.minute &&
                  selectedPeriod === preset.period;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => {
                      setSelectedHour(preset.hour);
                      setSelectedMinute(preset.minute);
                      setSelectedPeriod(preset.period);
                    }}
                    style={[styles.quickDateChip, isActive && styles.quickDateChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.quickDateText, isActive && styles.quickDateTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Digital Readout & Controls */}
            <View style={styles.clockControlsRow}>
              <View style={styles.digitalTimeBox}>
                <Text style={styles.digitalTimeNumber}>
                  {String(selectedHour).padStart(2, '0')}
                </Text>
                <Text style={styles.digitalTimeColon}>:</Text>
                <Text style={styles.digitalTimeNumber}>{selectedMinute}</Text>
              </View>

              <View style={styles.segmentToggleBox}>
                <TouchableOpacity
                  onPress={() => setSelectedMinute('00')}
                  style={[
                    styles.segmentBtn,
                    selectedMinute === '00' && styles.segmentBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      selectedMinute === '00' && styles.segmentBtnTextActive,
                    ]}
                  >
                    :00
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedMinute('30')}
                  style={[
                    styles.segmentBtn,
                    selectedMinute === '30' && styles.segmentBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      selectedMinute === '30' && styles.segmentBtnTextActive,
                    ]}
                  >
                    :30
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.segmentToggleBox}>
                <TouchableOpacity
                  onPress={() => setSelectedPeriod('AM')}
                  style={[
                    styles.segmentBtn,
                    selectedPeriod === 'AM' && styles.segmentBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      selectedPeriod === 'AM' && styles.segmentBtnTextActive,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedPeriod('PM')}
                  style={[
                    styles.segmentBtn,
                    selectedPeriod === 'PM' && styles.segmentBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      selectedPeriod === 'PM' && styles.segmentBtnTextActive,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Clock Face with Rotating Cursor Hand */}
            <View style={styles.clockDialWrapper}>
              <View style={styles.clockFace}>
                <View style={styles.clockCenterPivot} />
                <View
                  style={[
                    styles.clockHandPivot,
                    {
                      transform: [{ rotate: `${(selectedHour % 12) * 30}deg` }],
                    },
                  ]}
                >
                  <View style={styles.cursorKnobHighlight} />
                  <View style={styles.clockHandNeedle} />
                </View>

                {CLOCK_HOURS.map(h => {
                  const angleDeg = (h % 12) * 30 - 90;
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const x = CLOCK_CENTER + CLOCK_RADIUS * Math.cos(angleRad);
                  const y = CLOCK_CENTER + CLOCK_RADIUS * Math.sin(angleRad);
                  const isSelected = selectedHour === h;

                  return (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setSelectedHour(h)}
                      style={[
                        styles.hourTarget,
                        { left: x - 16, top: y - 16 },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.hourNumberText,
                          isSelected && styles.hourNumberTextSelected,
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.clockHintText}>Tap any hour number to move clock cursor</Text>
            </View>

            {/* Arrival Window Strip */}
            <View style={styles.selectedDateSummary}>
              <Check size={14} color="#15803D" strokeWidth={2.5} />
              <Text style={styles.selectedDateSummaryText}>
                Arrival Window: <Text style={{ fontWeight: '800' }}>{selectedSlot}</Text>
              </Text>
            </View>

            {/* Done CTA */}
            <TouchableOpacity
              onPress={() => setIsTimePickerVisible(false)}
              style={styles.modalDoneBtn}
              activeOpacity={0.88}
            >
              <Text style={styles.modalDoneBtnText}>Confirm Arrival Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 110,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E4E3D',
    letterSpacing: 0.5,
  },
  serviceNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceDurationText: {
    fontSize: 11,
    color: '#64748B',
  },
  summaryPriceBox: {
    alignItems: 'flex-end',
    gap: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  priceValueText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedDateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  quickDatesRow: {
    gap: 8,
    paddingVertical: 2,
  },
  quickDateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDateChipActive: {
    backgroundColor: '#1E4E3D',
    borderColor: '#1E4E3D',
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  quickDateTextActive: {
    color: '#FFFFFF',
  },
  calendarContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
    backgroundColor: '#F1F5F9',
  },
  monthYearTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellActive: {
    backgroundColor: '#1E4E3D',
    borderRadius: 18,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#1E4E3D',
    borderRadius: 18,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayCellTextPast: {
    color: '#CBD5E1',
  },
  dayCellTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellTextToday: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  selectedDateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedDateSummaryText: {
    fontSize: 12,
    color: '#166534',
  },
  clockControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 2,
  },
  digitalTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  digitalTimeNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  digitalTimeColon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#64748B',
    marginHorizontal: 2,
  },
  segmentToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: '#1E4E3D',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clockDialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  clockFace: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  clockHandPivot: {
    position: 'absolute',
    left: 94,
    top: 32,
    width: 32,
    height: 156,
    alignItems: 'center',
  },
  cursorKnobHighlight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E4E3D',
    shadowColor: '#1E4E3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  clockHandNeedle: {
    width: 2,
    height: 46,
    backgroundColor: '#1E4E3D',
  },
  clockCenterPivot: {
    position: 'absolute',
    left: 105,
    top: 105,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E4E3D',
    zIndex: 10,
  },
  hourTarget: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 5,
  },
  hourTargetSelected: {},
  hourNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  hourNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  clockHintText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E6F4EA',
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  editAddressInputs: {
    gap: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  addressDisplayBox: {
    gap: 3,
  },
  homeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  homeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  addressLine1: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressLine2: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentList: {
    gap: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1E4E3D',
    borderWidth: 1.5,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  radioDotActive: {
    borderColor: '#1E4E3D',
    backgroundColor: '#1E4E3D',
  },
  instructionInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 56,
    textAlignVertical: 'top',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billItemLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  billItemValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  billTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 6,
  },
  bottomPriceCol: {
    gap: 2,
  },
  bottomAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  bottomSavingsBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  confirmCtaButton: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1E4E3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clickableSelectorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorTileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorTextCol: {
    flex: 1,
    gap: 2,
  },
  selectorSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  selectorValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  changeActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  scheduleGuaranteedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scheduleGuaranteedText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropTap: {
    flex: 1,
  },
  modalSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDoneBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
