import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, CreditCard } from 'lucide-react-native';
import { PaymentMethod } from '../../types';

export const BookingScreen: React.FC = () => {
  const { selectedService, createBooking, navigateTo, user } = useAuth();

  const [date, setDate] = useState('2026-09-10');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [street, setStreet] = useState('Flat 402, Green Glen Layout');
  const [locality, setLocality] = useState('Bellandur');
  const [city] = useState('Bengaluru');
  const [pincode] = useState('560103');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  if (!selectedService) {
    navigateTo('customer_home');
    return null;
  }

  const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM'
  ];

  const handleConfirm = () => {
    const booking = createBooking({
      customerName: user?.name || 'Rahul Verma',
      customerPhone: user?.phone || '+91 98111 22233',
      serviceId: selectedService.serviceId,
      serviceName: selectedService.name,
      servicePrice: selectedService.startingPrice,
      address: {
        id: 'addr_' + Date.now(),
        label: 'Home',
        street,
        locality,
        city,
        pincode
      },
      date,
      timeSlot,
      specialInstructions: instructions,
      paymentMethod,
      paymentStatus: paymentMethod === 'pay_on_completion' ? 'pending' : 'paid',
      totalAmount: selectedService.startingPrice
    });

    navigateTo('booking_confirmation', { booking });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigateTo('service_details', { service: selectedService })}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Booking</Text>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>SERVICE PACKAGE</Text>
          <Text style={styles.summaryTitle}>{selectedService.name}</Text>
        </View>
        <Text style={styles.summaryPrice}>₹{selectedService.startingPrice}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Calendar size={16} color="#2D8A68" />
          <Text style={styles.cardTitle}>Select Date & Slot</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Appointment Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time Slot</Text>
          <View style={styles.slotsGrid}>
            {timeSlots.map(slot => (
              <TouchableOpacity
                key={slot}
                onPress={() => setTimeSlot(slot)}
                style={[
                  styles.slotBtn,
                  timeSlot === slot ? styles.slotBtnActive : styles.slotBtnInactive
                ]}
              >
                <Text style={[
                  styles.slotText,
                  timeSlot === slot ? styles.slotTextActive : styles.slotTextInactive
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <MapPin size={16} color="#2D8A68" />
          <Text style={styles.cardTitle}>Service Address</Text>
        </View>

        <View style={styles.addressInputs}>
          <TextInput
            value={street}
            onChangeText={setStreet}
            placeholder="Flat / Building / House No."
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
          <TextInput
            value={locality}
            onChangeText={setLocality}
            placeholder="Locality / Area"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <CreditCard size={16} color="#2D8A68" />
          <Text style={styles.cardTitle}>Payment Method</Text>
        </View>

        <View style={styles.paymentMethodsList}>
          {[
            { id: 'upi', label: 'UPI / GPay / PhonePe / Paytm', desc: 'Instant & Secure' },
            { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
            { id: 'pay_on_completion', label: 'Pay on Completion', desc: 'Pay after service is finished' }
          ].map(pm => (
            <TouchableOpacity
              key={pm.id}
              onPress={() => setPaymentMethod(pm.id as PaymentMethod)}
              style={[
                styles.paymentOption,
                paymentMethod === pm.id ? styles.paymentOptionActive : styles.paymentOptionInactive
              ]}
            >
              <View>
                <Text style={styles.paymentOptionLabel}>{pm.label}</Text>
                <Text style={styles.paymentOptionDesc}>{pm.desc}</Text>
              </View>
              <View style={[
                styles.radioCircle,
                paymentMethod === pm.id && styles.radioCircleActive
              ]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Special Instructions (Optional)</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Please bring extra hard water stain cleaner, beware of pet dog."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          style={[styles.input, styles.multilineInput]}
        />
      </View>

      <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn} activeOpacity={0.85}>
        <Text style={styles.confirmBtnText}>
          Confirm & Book Appointment (₹{selectedService.startingPrice})
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryCard: {
    backgroundColor: '#EBF8F2',
    borderColor: '#BBE9D2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D8A68',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E4E3D',
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  slotsGrid: {
    gap: 8,
  },
  slotBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  slotBtnActive: {
    borderWidth: 2,
    borderColor: '#2D8A68',
    backgroundColor: '#EBF8F2',
  },
  slotBtnInactive: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#1E4E3D',
  },
  slotTextInactive: {
    color: '#475569',
  },
  addressInputs: {
    gap: 8,
  },
  paymentMethodsList: {
    gap: 8,
  },
  paymentOption: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionActive: {
    borderWidth: 2,
    borderColor: '#2D8A68',
    backgroundColor: '#EBF8F2',
  },
  paymentOptionInactive: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  paymentOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  radioCircleActive: {
    borderColor: '#2D8A68',
    backgroundColor: '#2D8A68',
  },
  confirmBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
