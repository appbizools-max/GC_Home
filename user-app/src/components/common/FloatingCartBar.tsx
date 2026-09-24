import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ShoppingCart, ArrowRight } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface FloatingCartBarProps {
  onPressCart?: () => void;
  bottomOffset?: number;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  onPressCart,
  bottomOffset = 16,
}) => {
  const { cart, cartItemsCount } = useCart();
  const { navigateTo } = useAuth();

  if (!cartItemsCount || cartItemsCount === 0) {
    return null;
  }

  const handleOpenCart = () => {
    if (onPressCart) {
      onPressCart();
    } else {
      navigateTo('service-details');
    }
  };

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <TouchableOpacity
        style={styles.cartBarButton}
        onPress={handleOpenCart}
        activeOpacity={0.9}
        accessibilityLabel={`View cart with ${cartItemsCount} items`}
      >
        <View style={styles.leftInfo}>
          <View style={styles.cartIconBadgeContainer}>
            <ShoppingCart size={20} color="#FFFFFF" />
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{cartItemsCount}</Text>
            </View>
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.itemCountText}>
              {cartItemsCount} {cartItemsCount === 1 ? 'Service' : 'Services'} Selected
            </Text>
            <Text style={styles.totalPriceText}>₹ {cart?.totalAmount || 0}</Text>
          </View>
        </View>

        <View style={styles.rightAction}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  cartBarButton: {
    backgroundColor: '#0E5B47',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#168A68',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconBadgeContainer: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0E5B47',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  textGroup: {
    justifyContent: 'center',
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.2,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
