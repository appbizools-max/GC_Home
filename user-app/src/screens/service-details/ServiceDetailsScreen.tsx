import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import {
  generateAvailableDates,
  getAvailableSlotsForDate,
  AvailableDate,
  AvailableSlot,
} from '../../services/dateTimeEngine';
import { AddOnItem, Service } from '../../types';
import { supabase } from '../../config/supabase';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Check,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ServiceDetailsScreen: React.FC = () => {
  const { navigateTo, goBack } = useAuth();
  const {
    cart,
    removeServiceFromCart,
    updateItemQuantity,
    toggleAddOn,
    setBookingSchedule,
    clearCart,
    cartItemsCount,
  } = useCart();

  // Dynamic Add-ons State
  const [suggestedAddOns, setSuggestedAddOns] = useState<AddOnItem[]>([]);
  const [isLoadingAddOns, setIsLoadingAddOns] = useState(false);

  // Date & Slot Selection State
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  // Modals Visibility
  const [showDateModal, setShowDateModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);

  // Initialize Dates & Slots
  useEffect(() => {
    const dates = generateAvailableDates(14);
    setAvailableDates(dates);

    const initialDate = dates[0];
    setSelectedDate(initialDate);

    const initialSlots = getAvailableSlotsForDate(initialDate.dateString);
    setAvailableSlots(initialSlots);

    const defaultSlot =
      initialSlots.find(s => s.slotId === 'slot_16_18' && s.isAvailable) ||
      initialSlots.find(s => s.isAvailable) ||
      initialSlots[0];

    setSelectedSlot(defaultSlot);

    if (initialDate && defaultSlot) {
      setBookingSchedule(
        initialDate.dateString,
        initialDate.displayLabel.replace('\n', ', '),
        defaultSlot.displayRange
      );
    }
  }, []);

  // Fetch Live Suggested Add-ons from Supabase matching Cart Services
  const cartServiceIds = (cart?.items || []).map(i => i.service.serviceId).filter(Boolean);

  useEffect(() => {
    const fetchSuggestedAddOns = async () => {
      setIsLoadingAddOns(true);
      try {
        if (cartServiceIds.length === 0) {
          setSuggestedAddOns([]);
          setIsLoadingAddOns(false);
          return;
        }

        const { data, error } = await supabase
          .from('service_addons')
          .select('*')
          .or(`service_id.in.(${cartServiceIds.join(',')}),service_id.is.null`)
          .eq('is_active', true);

        if (!error && data) {
          const mapped: AddOnItem[] = data.map((row: any) => ({
            id: row.id,
            serviceId: row.service_id,
            title: row.name || row.title,
            price: Number(row.price || 0),
            description: row.description || '',
            imageUrl: row.image_url || undefined,
          }));
          setSuggestedAddOns(mapped);
        } else {
          setSuggestedAddOns([]);
        }
      } catch (err) {
        console.warn('Error loading suggested add-ons:', err);
        setSuggestedAddOns([]);
      } finally {
        setIsLoadingAddOns(false);
      }
    };

    fetchSuggestedAddOns();
  }, [cartServiceIds.join(',')]);

  // Handle Date Selection Change
  const handleSelectDate = (date: AvailableDate) => {
    setSelectedDate(date);
    const dateSlots = getAvailableSlotsForDate(date.dateString);
    setAvailableSlots(dateSlots);

    // If currently selected slot is available for new date, keep it; else select first valid
    const validSlot =
      dateSlots.find(s => s.slotId === selectedSlot?.slotId && s.isAvailable) ||
      dateSlots.find(s => s.isAvailable) ||
      null;

    setSelectedSlot(validSlot);

    if (validSlot) {
      setBookingSchedule(
        date.dateString,
        date.displayLabel.replace('\n', ', '),
        validSlot.displayRange
      );
    }

    setShowDateModal(false);
  };

  // Handle Slot Selection Change
  const handleSelectSlot = (slot: AvailableSlot) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
    if (selectedDate) {
      setBookingSchedule(
        selectedDate.dateString,
        selectedDate.displayLabel.replace('\n', ', '),
        slot.displayRange
      );
    }
    setShowSlotModal(false);
  };

  const handleProceedToAddress = () => {
    if (!cart?.items || cart.items.length === 0) return;
    if (selectedDate && selectedSlot) {
      setBookingSchedule(
        selectedDate.dateString,
        selectedDate.displayLabel.replace('\n', ', '),
        selectedSlot.displayRange
      );
    }
    navigateTo('address-confirmation');
  };

  return (
    <View style={styles.safeContainer}>
      {/* Top Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            const popped = goBack();
            if (!popped) navigateTo('services-listing');
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>View Cart</Text>
          <Text style={styles.headerSub}>
            {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'} selected
          </Text>
        </View>

        {cartItemsCount > 0 ? (
          <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart} activeOpacity={0.7}>
            <Text style={styles.clearCartText}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SECTION 1: SELECTED SERVICES LIST ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <ShoppingCart size={18} color="#168A68" />
            <Text style={styles.sectionTitle}>
              Selected Services ({cart?.items.length || 0})
            </Text>
          </View>

          {(!cart?.items || cart.items.length === 0) ? (
            <View style={styles.emptyCartBox}>
              <View style={styles.emptyIconCircle}>
                <ShoppingCart size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
              <Text style={styles.emptyCartSub}>
                Add cleaning services from Home or Services page to continue
              </Text>
              <TouchableOpacity
                style={styles.browseServicesBtn}
                onPress={() => navigateTo('services-listing')}
                activeOpacity={0.88}
              >
                <Text style={styles.browseServicesText}>Browse Services</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cart.items.map((item, idx) => (
              <View
                key={item.service.serviceId || idx}
                style={[
                  styles.serviceCartRow,
                  idx < cart.items.length - 1 && styles.serviceCartRowBorder,
                ]}
              >
                <Image
                  source={resolveImageSource(item.service.imageUrl)}
                  style={styles.serviceCartThumb}
                />

                <View style={styles.serviceCartMeta}>
                  <Text style={styles.serviceCartName}>{item.service.name}</Text>
                  <Text style={styles.serviceCartUnitPrice}>
                    ₹ {item.service.startingPrice} per unit
                  </Text>
                  <Text style={styles.serviceCartSubtotal}>
                    Subtotal: <Text style={styles.boldPrice}>₹ {item.itemTotal}</Text>
                  </Text>
                </View>

                <View style={styles.serviceCartActions}>
                  {/* Stepper Pill [- Qty +] */}
                  <View style={styles.cartStepper}>
                    <TouchableOpacity
                      style={styles.cartStepperBtn}
                      onPress={() => {
                        if (item.quantity <= 1) {
                          removeServiceFromCart(item.service.serviceId);
                        } else {
                          updateItemQuantity(item.service.serviceId, item.quantity - 1);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {item.quantity <= 1 ? (
                        <Trash2 size={11} color="#FFFFFF" strokeWidth={2.5} />
                      ) : (
                        <Minus size={11} color="#FFFFFF" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>

                    <Text style={styles.cartStepperCount}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.cartStepperBtn}
                      onPress={() => updateItemQuantity(item.service.serviceId, item.quantity + 1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={11} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Explicit Remove Button */}
                  <TouchableOpacity
                    style={styles.removeTextBtn}
                    onPress={() => removeServiceFromCart(item.service.serviceId)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={12} color="#EF4444" />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── SECTION 2: SUGGESTED ADD-ONS ── */}
        {cart && cart.items.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Sparkles size={18} color="#168A68" />
              <Text style={styles.sectionTitle}>Suggested Add-ons</Text>
            </View>

            {isLoadingAddOns ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#168A68" />
                <Text style={styles.loadingText}>Fetching suggested add-ons...</Text>
              </View>
            ) : suggestedAddOns.length === 0 ? (
              <View style={styles.noAddonsBox}>
                <ShieldCheck size={18} color="#168A68" />
                <Text style={styles.noAddonsText}>
                  Your selected services are complete and fully covered!
                </Text>
              </View>
            ) : (
              suggestedAddOns.map((addon, idx) => {
                const isSelected = (cart.addOns || []).some(a => a.id === addon.id);
                return (
                  <View
                    key={addon.id}
                    style={[
                      styles.addonRow,
                      isSelected && styles.addonRowSelected,
                      idx < suggestedAddOns.length - 1 && styles.addonRowBorder,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addonTitle}>{addon.title}</Text>
                      {Boolean(addon.description) && (
                        <Text style={styles.addonDesc}>{addon.description}</Text>
                      )}
                      <Text style={styles.addonPrice}>+ ₹ {addon.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addonAddBtn,
                        isSelected && styles.addonAddBtnSelected,
                      ]}
                      onPress={() => toggleAddOn(addon)}
                      activeOpacity={0.8}
                    >
                      {isSelected ? (
                        <>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          <Text style={styles.addonAddTextSelected}>Added</Text>
                        </>
                      ) : (
                        <>
                          <Plus size={12} color="#168A68" strokeWidth={2.5} />
                          <Text style={styles.addonAddText}>Add</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── SECTION 3: DATE & TIME SELECTION DIRECTLY IN CART ── */}
        {cart && cart.items.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <CalendarIcon size={18} color="#168A68" />
              <Text style={styles.sectionTitle}>Service Schedule</Text>
            </View>

            {/* Date Row */}
            <View style={styles.scheduleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleLabel}>SELECTED DATE</Text>
                <Text style={styles.scheduleValue}>
                  {selectedDate?.displayLabel.replace('\n', ', ') || cart.selectedDateLabel || 'Today'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => setShowDateModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.changeBtnText}>Change Date</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Time Slot Row */}
            <View style={styles.scheduleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleLabel}>SELECTED TIME SLOT</Text>
                <Text style={styles.scheduleValue}>
                  {selectedSlot?.displayRange || cart.selectedSlot || 'Select Slot'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => setShowSlotModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.changeBtnText}>Change Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── SECTION 4: BILL DETAILS ── */}
        {cart && cart.items.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bill Details</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Services Subtotal</Text>
              <Text style={styles.billVal}>₹ {cart.subtotal - cart.addOnsTotal}</Text>
            </View>

            {cart.addOnsTotal > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Selected Add-ons</Text>
                <Text style={styles.billVal}>+ ₹ {cart.addOnsTotal}</Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform & Safety Fee</Text>
              <Text style={styles.billVal}>₹ {cart.platformFee}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & GST (18%)</Text>
              <Text style={styles.billVal}>₹ {cart.taxes}</Text>
            </View>

            {cart.discountAmount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#168A68', fontWeight: '700' }]}>
                  Coupon Discount ({cart.promoCode})
                </Text>
                <Text style={[styles.billVal, { color: '#168A68', fontWeight: '800' }]}>
                  - ₹ {cart.discountAmount}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalVal}>₹ {cart.totalAmount}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* STICKY BOTTOM PROCEED BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>Total Amount</Text>
          <Text style={styles.bottomPriceVal}>₹ {cart?.totalAmount || 0}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.proceedBtn,
            (!cart?.items || cart.items.length === 0) && styles.proceedBtnDisabled,
          ]}
          onPress={handleProceedToAddress}
          disabled={!cart?.items || cart.items.length === 0}
          activeOpacity={0.88}
        >
          <Text style={styles.proceedBtnText}>Proceed to Address</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* MODAL: FULL CALENDAR / DATE PICKER */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Date</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#10243A" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerScroll}>
              {availableDates.map(date => {
                const isSelected = selectedDate?.dateString === date.dateString;
                return (
                  <TouchableOpacity
                    key={date.dateString}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    onPress={() => handleSelectDate(date)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayNameText, isSelected && styles.dateTextSelected]}>
                      {date.dayName}
                    </Text>
                    <Text style={[styles.dayNumText, isSelected && styles.dateTextSelected]}>
                      {date.dayNumber}
                    </Text>
                    <Text style={[styles.monthText, isSelected && styles.dateTextSelected]}>
                      {date.monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: TIME SLOT SELECTION */}
      <Modal visible={showSlotModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time Slot</Text>
              <TouchableOpacity onPress={() => setShowSlotModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#10243A" />
              </TouchableOpacity>
            </View>

            <View style={styles.slotsGrid}>
              {availableSlots.map(slot => {
                const isSelected = selectedSlot?.slotId === slot.slotId;
                const isDisabled = !slot.isAvailable;

                return (
                  <TouchableOpacity
                    key={slot.slotId}
                    style={[
                      styles.slotChip,
                      isSelected && styles.slotChipSelected,
                      isDisabled && styles.slotChipDisabled,
                    ]}
                    onPress={() => handleSelectSlot(slot)}
                    disabled={isDisabled}
                    activeOpacity={0.8}
                  >
                    <Clock size={14} color={isSelected ? '#FFFFFF' : isDisabled ? '#94A3B8' : '#168A68'} />
                    <Text
                      style={[
                        styles.slotChipText,
                        isSelected && styles.slotChipTextSelected,
                        isDisabled && styles.slotChipTextDisabled,
                      ]}
                    >
                      {slot.displayRange}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#10243A',
  },
  headerSub: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  clearCartBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  clearCartText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 14,
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
  },
  emptyCartBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5FCF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 4,
  },
  emptyCartSub: {
    fontSize: 12,
    color: '#68788C',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseServicesBtn: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseServicesText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  serviceCartRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  serviceCartThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  serviceCartMeta: {
    flex: 1,
  },
  serviceCartName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10243A',
  },
  serviceCartUnitPrice: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  serviceCartSubtotal: {
    fontSize: 12,
    color: '#10243A',
    marginTop: 2,
  },
  boldPrice: {
    fontWeight: '900',
    color: '#0E5B47',
  },
  serviceCartActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  cartStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E5B47',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 6,
  },
  cartStepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartStepperCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    minWidth: 12,
    textAlign: 'center',
  },
  removeTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  removeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  loadingBox: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#68788C',
  },
  noAddonsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    padding: 10,
    borderRadius: 10,
  },
  noAddonsText: {
    fontSize: 11.5,
    color: '#0E5B47',
    fontWeight: '600',
    flex: 1,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 10,
  },
  addonRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  addonRowSelected: {
    backgroundColor: '#F5FCF8',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  addonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  addonDesc: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  addonPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
    marginTop: 2,
  },
  addonAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#168A68',
    backgroundColor: '#FFFFFF',
  },
  addonAddBtnSelected: {
    backgroundColor: '#168A68',
  },
  addonAddText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#168A68',
  },
  addonAddTextSelected: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#68788C',
    letterSpacing: 0.5,
  },
  scheduleValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EAF8F1',
  },
  changeBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#168A68',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F2',
    marginVertical: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 12.5,
    color: '#68788C',
  },
  billVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10243A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
  },
  totalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0E5B47',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#68788C',
    fontWeight: '600',
  },
  bottomPriceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0E5B47',
  },
  proceedBtn: {
    backgroundColor: '#0E5B47',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  proceedBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  datePickerScroll: {
    gap: 10,
    paddingVertical: 10,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    minWidth: 70,
  },
  dateChipSelected: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#68788C',
  },
  dayNumText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
    marginVertical: 2,
  },
  monthText: {
    fontSize: 10,
    color: '#68788C',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  slotsGrid: {
    gap: 10,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  slotChipSelected: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  slotChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10243A',
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
  },
  slotChipTextDisabled: {
    color: '#94A3B8',
  },
});
