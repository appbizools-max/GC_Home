import React, { createContext, useContext, useState } from 'react';
import { Service, AddOnItem, Address, CustomerCart, CartItem } from '../types';
import { supabase } from '../config/supabase';

interface CartContextType {
  cart: CustomerCart | null;
  addServiceToCart: (service: Service, quantity?: number) => void;
  removeServiceFromCart: (serviceId: string) => void;
  toggleServiceInCart: (service: Service) => void;
  updateItemQuantity: (serviceId: string, quantity: number) => void;
  toggleAddOn: (addOn: AddOnItem) => void;
  setBookingSchedule: (date: string, dateLabel: string, slot: string) => void;
  setDeliveryAddress: (address: Address) => void;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string; discount: number }>;
  removeCouponCode: () => void;
  clearCart: () => void;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PLATFORM_FEE = 29;
const TAX_RATE = 0.18; // 18% GST

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CustomerCart | null>(null);

  const filterApplicableAddOns = (items: CartItem[], addOns: AddOnItem[]) => {
    const remainingServiceIds = items.map(i => i.service.serviceId);
    return addOns.filter(addon => {
      if (!addon.serviceId) return true; // Global add-on
      return remainingServiceIds.includes(addon.serviceId);
    });
  };

  const calculateCart = (
    items: CartItem[],
    addOns: AddOnItem[],
    date: string,
    dateLabel: string,
    slot: string,
    address?: Address,
    promoCode?: string,
    explicitDiscount?: number
  ): CustomerCart => {
    const itemsSubtotal = items.reduce((acc, curr) => acc + curr.itemTotal, 0);
    const validAddOns = filterApplicableAddOns(items, addOns);
    const addOnsTotal = validAddOns.reduce((acc, curr) => acc + curr.price, 0);
    const subtotal = itemsSubtotal + addOnsTotal;

    const discountAmount = explicitDiscount !== undefined ? explicitDiscount : 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxes = Math.round(taxableAmount * TAX_RATE);
    const fee = subtotal > 0 ? PLATFORM_FEE : 0;
    const totalAmount = taxableAmount + fee + taxes;

    return {
      items,
      addOns: validAddOns,
      selectedDate: date,
      selectedDateLabel: dateLabel,
      selectedSlot: slot,
      address,
      promoCode,
      subtotal,
      addOnsTotal,
      discountAmount,
      platformFee: fee,
      taxes,
      totalAmount,
    };
  };

  const addServiceToCart = (service: Service, quantity: number = 1) => {
    setCart(prev => {
      const existingItems = prev?.items || [];
      const index = existingItems.findIndex(i => i.service.serviceId === service.serviceId);

      let newItems: CartItem[] = [];
      if (index >= 0) {
        newItems = existingItems.map((item, idx) => {
          if (idx === index) {
            const newQty = item.quantity + quantity;
            const unitPrice = service.startingPrice || 0;
            return {
              ...item,
              quantity: newQty,
              itemTotal: unitPrice * newQty,
            };
          }
          return item;
        });
      } else {
        const unitPrice = service.startingPrice || 0;
        newItems = [
          ...existingItems,
          {
            service,
            quantity,
            itemTotal: unitPrice * quantity,
          },
        ];
      }

      return calculateCart(
        newItems,
        prev?.addOns || [],
        prev?.selectedDate || 'Today',
        prev?.selectedDateLabel || 'Today',
        prev?.selectedSlot || '10:00 AM',
        prev?.address,
        prev?.promoCode,
        prev?.discountAmount
      );
    });
  };

  const removeServiceFromCart = (serviceId: string) => {
    setCart(prev => {
      if (!prev) return null;
      const newItems = prev.items.filter(i => i.service.serviceId !== serviceId);
      const remainingAddOns = filterApplicableAddOns(newItems, prev.addOns);
      if (newItems.length === 0 && remainingAddOns.length === 0) return null;

      return calculateCart(
        newItems,
        remainingAddOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        prev.promoCode,
        prev.discountAmount
      );
    });
  };

  const toggleServiceInCart = (service: Service) => {
    if (cart?.items.some(i => i.service.serviceId === service.serviceId)) {
      removeServiceFromCart(service.serviceId);
    } else {
      addServiceToCart(service, 1);
    }
  };

  const updateItemQuantity = (serviceId: string, quantity: number) => {
    setCart(prev => {
      if (!prev) return null;
      if (quantity <= 0) {
        const newItems = prev.items.filter(i => i.service.serviceId !== serviceId);
        return calculateCart(
          newItems,
          prev.addOns,
          prev.selectedDate,
          prev.selectedDateLabel,
          prev.selectedSlot,
          prev.address,
          prev.promoCode,
          prev.discountAmount
        );
      }

      const newItems = prev.items.map(item => {
        if (item.service.serviceId === serviceId) {
          const unitPrice = item.service.startingPrice || 0;
          return {
            ...item,
            quantity,
            itemTotal: unitPrice * quantity,
          };
        }
        return item;
      });

      return calculateCart(
        newItems,
        prev.addOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        prev.promoCode,
        prev.discountAmount
      );
    });
  };

  const toggleAddOn = (addOn: AddOnItem) => {
    setCart(prev => {
      if (!prev) return null;
      const exists = prev.addOns.some(a => a.id === addOn.id);
      const newAddOns = exists
        ? prev.addOns.filter(a => a.id !== addOn.id)
        : [...prev.addOns, addOn];

      return calculateCart(
        prev.items,
        newAddOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        prev.promoCode,
        prev.discountAmount
      );
    });
  };

  const setBookingSchedule = (date: string, dateLabel: string, slot: string) => {
    setCart(prev => {
      if (!prev) return null;
      return calculateCart(
        prev.items,
        prev.addOns,
        date,
        dateLabel,
        slot,
        prev.address,
        prev.promoCode,
        prev.discountAmount
      );
    });
  };

  const setDeliveryAddress = (address: Address) => {
    setCart(prev => {
      if (!prev) return null;
      return { ...prev, address };
    });
  };

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string; discount: number }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Please enter a coupon code', discount: 0 };
    }

    if (!cart) {
      return { success: false, message: 'No active cart found', discount: 0 };
    }

    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('code', clean)
        .single();

      if (error || !data) {
        return { success: false, message: `Coupon "${clean}" is invalid`, discount: 0 };
      }

      if (!data.is_active) {
        return { success: false, message: `Coupon "${clean}" is no longer active`, discount: 0 };
      }

      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        return { success: false, message: `Coupon "${clean}" is not yet active`, discount: 0 };
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        return { success: false, message: `Coupon "${clean}" has expired`, discount: 0 };
      }

      const subtotal = cart.subtotal;

      if (data.min_booking_amount && subtotal < Number(data.min_booking_amount)) {
        return {
          success: false,
          message: `Minimum order of ₹${data.min_booking_amount} required for coupon ${clean}`,
          discount: 0,
        };
      }

      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        const pct = Number(data.discount_value || 0);
        discountAmount = Math.round((subtotal * pct) / 100);
        if (data.max_discount && discountAmount > Number(data.max_discount)) {
          discountAmount = Number(data.max_discount);
        }
      } else {
        const fixed = Number(data.discount_value || 0);
        discountAmount = Math.min(fixed, subtotal);
      }

      setCart(prev => {
        if (!prev) return null;
        return calculateCart(
          prev.items,
          prev.addOns,
          prev.selectedDate,
          prev.selectedDateLabel,
          prev.selectedSlot,
          prev.address,
          clean,
          discountAmount
        );
      });

      return {
        success: true,
        message: `Coupon "${clean}" applied! Saved ₹${discountAmount}`,
        discount: discountAmount,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to apply coupon', discount: 0 };
    }
  };

  const removeCouponCode = () => {
    setCart(prev => {
      if (!prev) return null;
      return calculateCart(
        prev.items,
        prev.addOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        undefined,
        0
      );
    });
  };

  const clearCart = () => setCart(null);

  const cartItemsCount = cart
    ? cart.items.reduce((acc, curr) => acc + curr.quantity, 0) + cart.addOns.length
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        addServiceToCart,
        removeServiceFromCart,
        toggleServiceInCart,
        updateItemQuantity,
        toggleAddOn,
        setBookingSchedule,
        setDeliveryAddress,
        applyCouponCode,
        removeCouponCode,
        clearCart,
        cartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
