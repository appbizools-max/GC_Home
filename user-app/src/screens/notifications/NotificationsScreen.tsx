import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../../components/ui/AppLogo';
import {
  ArrowLeft,
  Bell,
  Calendar,
  CreditCard,
  Tag,
  Sparkles,
  ChevronRight,
  CheckCheck,
} from 'lucide-react-native';

type NotificationCategory = 'all' | 'bookings' | 'payments' | 'offers' | 'updates';

interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  targetScreen?: string;
}

const NOTIFICATIONS_SEED: NotificationItem[] = [
  {
    id: 'notif_1',
    category: 'bookings',
    title: 'Professional Assigned',
    message: 'Sunita Devi has been assigned for your 4:00 PM Home Cleaning appointment.',
    time: '10 mins ago',
    isUnread: true,
    targetScreen: 'booking-tracking',
  },
  {
    id: 'notif_2',
    category: 'offers',
    title: '20% OFF Coupon Available',
    message: 'Use code GCHOME20 at checkout for 20% flat discount on full home deep cleaning.',
    time: '2 hours ago',
    isUnread: true,
    targetScreen: 'offers',
  },
  {
    id: 'notif_3',
    category: 'payments',
    title: 'Payment Successful',
    message: 'Payment of ₹848 for Booking #GC-89421 was received securely via UPI.',
    time: 'Yesterday',
    isUnread: false,
    targetScreen: 'my-bookings',
  },
  {
    id: 'notif_4',
    category: 'updates',
    title: 'Eco-Friendly Guarantee',
    message: 'We have updated our safety protocols with 100% plant-based organic cleaning agents.',
    time: '2 days ago',
    isUnread: false,
    targetScreen: 'customer_home',
  },
];

export const NotificationsScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const [activeCat, setActiveCat] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState(NOTIFICATIONS_SEED);

  const filtered = notifications.filter(
    n => activeCat === 'all' || n.category === activeCat
  );

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const handleItemPress = (notif: NotificationItem) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notif.id ? { ...n, isUnread: false } : n))
    );
    if (notif.targetScreen) {
      navigateTo(notif.targetScreen);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'bookings':
        return <Calendar size={18} color="#168A68" />;
      case 'payments':
        return <CreditCard size={18} color="#0284C7" />;
      case 'offers':
        return <Tag size={18} color="#EA580C" />;
      default:
        return <Sparkles size={18} color="#168A68" />;
    }
  };

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('home')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <AppLogo size="sm" showTagline={true} align="left" />

        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <CheckCheck size={20} color="#168A68" />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {[
          { id: 'all', label: 'All' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'payments', label: 'Payments' },
          { id: 'offers', label: 'Offers' },
          { id: 'updates', label: 'Updates' },
        ].map(cat => {
          const isSelected = activeCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, isSelected && styles.catPillSelected]}
              onPress={() => setActiveCat(cat.id as NotificationCategory)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catPillText, isSelected && styles.catPillTextSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.notifCard, item.isUnread && styles.notifCardUnread]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.88}
          >
            <View style={styles.iconBox}>{getCategoryIcon(item.category)}</View>

            <View style={styles.notifBody}>
              <View style={styles.titleRow}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              <Text style={styles.notifMsg}>{item.message}</Text>
            </View>

            {item.isUnread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  catPillSelected: {
    backgroundColor: '#0E5B47',
    borderColor: '#0E5B47',
  },
  catPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#68788C',
  },
  catPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  notifCardUnread: {
    backgroundColor: '#F5FCF8',
    borderColor: '#C6EEDB',
    borderWidth: 1.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notifBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifMsg: {
    fontSize: 11.5,
    color: '#68788C',
    lineHeight: 16,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#168A68',
    marginLeft: 6,
    marginTop: 4,
  },
});
