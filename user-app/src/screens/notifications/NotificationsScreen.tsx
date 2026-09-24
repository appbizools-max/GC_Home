import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
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

const NOTIFICATIONS_SEED: NotificationItem[] = [];

export const NotificationsScreen: React.FC = () => {
  const { navigateTo, user } = useAuth();
  const [activeCat, setActiveCat] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (user?.uid) {
        query = query.or(`recipient_id.eq.${user.uid},recipient_role.eq.customer,recipient_role.eq.all`);
      } else {
        query = query.or('recipient_role.eq.customer,recipient_role.eq.all');
      }

      const { data, error } = await query;
      if (!error && data) {
        const mapped: NotificationItem[] = data.map((r: any) => ({
          id: r.id,
          title: r.title || 'Notification',
          message: r.message || '',
          time: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          category: (r.category as NotificationCategory) || 'bookings',
          isUnread: !r.is_read,
          targetScreen: r.related_booking_id ? 'booking-tracking' : undefined,
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('user_notifications_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const filtered = notifications.filter(
    n => activeCat === 'all' || n.category === activeCat
  );

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    if (user?.uid) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('recipient_id', user.uid);
      } catch (err) {
        console.warn('Mark all read notice:', err);
      }
    }
  };

  const handleItemPress = async (notif: NotificationItem) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notif.id ? { ...n, isUnread: false } : n))
    );
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id);
    } catch (err) {
      console.warn('Mark read notice:', err);
    }
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
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Bell size={48} color="#CBD5E1" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 }}>No Notifications</Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              You do not have any notifications right now.
            </Text>
          </View>
        ) : (
          filtered.map(item => (
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
          ))
        )}
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
