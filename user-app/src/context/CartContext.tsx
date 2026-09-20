import React, { createContext, useContext, useState } from 'react';
import { Service, HomeSize, AddOnItem, Address, CustomerCart } from '../types';

interface CartContextType {
  cart: CustomerCart | null;
  setCartService: (service: Service, homeSize?: HomeSize) => void;
  setHomeSize: (homeSize: HomeSize) => void;
  toggleAddOn: (addOn: AddOnItem) => void;
  setBookingSchedule: (date: string, dateLabel: string, slot: string) => void;
  setDeliveryAddress: (address: Address) => void;
  applyCouponCode: (code: string) => { success: boolean; message: string; discount: number };
  removeCouponCode: () => void;
  clearCart: () => void;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PLATFORM_FEE = 29;
const TAX_RATE = 0.18; // 18% GST

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CustomerCart | null>(null);

  const calculateCart = (
    service: Service,
    homeSize: HomeSize,
    addOns: AddOnItem[],
    date: string,
    dateLabel: string,
    slot: string,
    address?: Address,
    promoCode?: string
  ): CustomerCart => {
    const basePrice = homeSize.price;
    const addOnsTotal = addOns.reduce((acc, curr) => acc + curr.price, 0);
    const subtotal = basePrice + addOnsTotal;

    let discountAmount = 0;
    if (promoCode && promoCode.toUpperCase() === 'GCHOME20') {
      discountAmount = Math.round(subtotal * 0.2); // 20% OFF
    } else if (promoCode && promoCode.toUpperCase() === 'FIRST50') {
      discountAmount = Math.min(50, subtotal);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxes = Math.round(taxableAmount * TAX_RATE);
    const totalAmount = taxableAmount + PLATFORM_FEE + taxes;

    return {
      service,
      homeSize,
      addOns,
      selectedDate: date,
      selectedDateLabel: dateLabel,
      selectedSlot: slot,
      address,
      promoCode,
      basePrice,
      addOnsTotal,
      discountAmount,
      platformFee: PLATFORM_FEE,
      taxes,
      totalAmount,
    };
  };

  const setCartService = (service: Service, customSize?: HomeSize) => {
    const defaultHomeSize: HomeSize = customSize || {
      id: '1bhk',
      label: '1 BHK',
      roomsCount: 1,
      price: service.startingPrice || 699,
      subtitle: 'Ideal for studio / 1 BHK apartments',
    };

    setCart(prev => {
      return calculateCart(
        service,
        defaultHomeSize,
        prev?.addOns || [],
        prev?.selectedDate || 'Today',
        prev?.selectedDateLabel || 'Today, 26 Apr',
        prev?.selectedSlot || '4:00 PM – 6:00 PM',
        prev?.address,
        prev?.promoCode
      );
    });
  };

  const setHomeSize = (homeSize: HomeSize) => {
    setCart(prev => {
      if (!prev) return null;
      return calculateCart(
        prev.service,
        homeSize,
        prev.addOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        prev.promoCode
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
        prev.service,
        prev.homeSize,
        newAddOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        prev.promoCode
      );
    });
  };

  const setBookingSchedule = (date: string, dateLabel: string, slot: string) => {
    setCart(prev => {
      if (!prev) return null;
      return calculateCart(
        prev.service,
        prev.homeSize,
        prev.addOns,
        date,
        dateLabel,
        slot,
        prev.address,
        prev.promoCode
      );
    });
  };

  const setDeliveryAddress = (address: Address) => {
    setCart(prev => {
      if (!prev) return null;
      return { ...prev, address };
    });
  };

  const applyCouponCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'GCHOME20') {
      setCart(prev => {
        if (!prev) return null;
        return calculateCart(
          prev.service,
          prev.homeSize,
          prev.addOns,
          prev.selectedDate,
          prev.selectedDateLabel,
          prev.selectedSlot,
          prev.address,
          'GCHOME20'
        );
      });
      return { success: true, message: 'Coupon GCHOME20 applied! You saved 20%', discount: 20 };
    }
    if (clean === 'FIRST50') {
      setCart(prev => {
        if (!prev) return null;
        return calculateCart(
          prev.service,
          prev.homeSize,
          prev.addOns,
          prev.selectedDate,
          prev.selectedDateLabel,
          prev.selectedSlot,
          prev.address,
          'FIRST50'
        );
      });
      return { success: true, message: 'Coupon FIRST50 applied! ₹50 OFF', discount: 50 };
    }
    return { success: false, message: 'Invalid or expired coupon code', discount: 0 };
  };

  const removeCouponCode = () => {
    setCart(prev => {
      if (!prev) return null;
      return calculateCart(
        prev.service,
        prev.homeSize,
        prev.addOns,
        prev.selectedDate,
        prev.selectedDateLabel,
        prev.selectedSlot,
        prev.address,
        undefined
      );
    });
  };

  const clearCart = () => setCart(null);

  const cartItemsCount = cart ? 1 + cart.addOns.length : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        setCartService,
        setHomeSize,
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
