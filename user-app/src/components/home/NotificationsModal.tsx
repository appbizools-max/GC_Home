import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { NotificationItem } from '../../services/homeService';
import { Bell, X, CheckCheck, Calendar, Sparkles, UserCheck } from 'lucide-react-native';

interface NotificationsModalProps {
  visible: boolean;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  notifications,
  onMarkAllAsRead,
  onClose,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar size={18} color="#168A68" />;
      case 'assignment':
        return <UserCheck size={18} color="#0284C7" />;
      case 'promo':
        return <Sparkles size={18} color="#D97706" />;
      default:
        return <Bell size={18} color="#168A68" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Text style={styles.modalSub}>Updates about your bookings & exclusive offers</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          {/* Mark All Read Action */}
          {notifications.some(n => !n.read) && (
            <TouchableOpacity style={styles.markReadRow} onPress={onMarkAllAsRead}>
              <CheckCheck size={14} color="#168A68" />
              <Text style={styles.markReadText}>Mark all as read</Text>
            </TouchableOpacity>
          )}

          {/* List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Bell size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySub}>No new notifications right now.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.notifCard, !item.read && styles.notifCardUnread]}>
                  <View style={styles.iconCircle}>{getIcon(item.type)}</View>
                  <View style={styles.notifTextCol}>
                    <View style={styles.notifHeader}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.notifMessage}>{item.message}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10243A',
  },
  modalSub: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  markReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10243A',
  },
  emptySub: {
    fontSize: 12,
    color: '#68788C',
  },
  notifCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 10,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#EAF8F1',
    borderColor: '#C6EEDB',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  notifTextCol: {
    flex: 1,
  },
  notifHeader: {
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
    fontSize: 10.5,
    color: '#68788C',
  },
  notifMessage: {
    fontSize: 11.5,
    color: '#68788C',
    lineHeight: 15,
  },
});
