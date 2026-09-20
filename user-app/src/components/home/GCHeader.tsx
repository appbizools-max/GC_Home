import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppLogo } from '../ui/AppLogo';
import { Bell, MapPin, ChevronDown, User as UserIcon } from 'lucide-react-native';

interface GCHeaderProps {
  currentLocation: string;
  isUsingGPS?: boolean;
  unreadNotificationsCount?: number;
  profilePhotoUri?: string;
  onOpenLocation: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const GCHeader: React.FC<GCHeaderProps> = ({
  currentLocation,
  isUsingGPS = true,
  unreadNotificationsCount = 2,
  profilePhotoUri,
  onOpenLocation,
  onOpenNotifications,
  onOpenProfile,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* ── TOP ROW: Brand Logo & Actions ── */}
      <View style={styles.topRow}>
        <AppLogo size="sm" showTagline={true} align="left" />

        <View style={styles.topActionsRow}>
          {/* Notification Button with Badge */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color="#10243A" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadDot} />
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onOpenProfile}
            activeOpacity={0.8}
            accessibilityLabel="User Profile"
          >
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={18} color="#168A68" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SECOND ROW: Location (Strictly Below Logo/Name Area) ── */}
      <TouchableOpacity
        style={styles.locationSelectorRow}
        onPress={onOpenLocation}
        activeOpacity={0.75}
        accessibilityLabel="Select Location"
      >
        <View style={styles.locationPinBox}>
          <MapPin size={16} color="#168A68" strokeWidth={2.4} />
        </View>

        <View style={styles.locationTextGroup}>
          <View style={styles.locationTitleRow}>
            <Text style={styles.locationMainText} numberOfLines={1}>
              {currentLocation || 'HSR Layout, Bengaluru, Karnataka 560102'}
            </Text>
            <ChevronDown size={14} color="#10243A" strokeWidth={2.2} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5FCF8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#168A68',
    overflow: 'hidden',
    backgroundColor: '#EAF8F1',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  locationPinBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextGroup: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationMainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
    flexShrink: 1,
  },
});
