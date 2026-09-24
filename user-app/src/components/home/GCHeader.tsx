import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GCLogo } from '../common/GCLogo';
import { Bell, User as UserIcon } from 'lucide-react-native';

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
  unreadNotificationsCount = 0,
  profilePhotoUri,
  onOpenLocation,
  onOpenNotifications,
  onOpenProfile,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* ── Single Row: Brand Left | Actions Right ── */}
      <View style={styles.row}>

        {/* ── LEFT: Circular Logo + Brand Name Stack ── */}
        <View style={styles.brandGroup}>
          {/* Official GC HOME+ circular logo */}
          <GCLogo size={40} />

          {/* Brand text: name + caption */}
          <View style={styles.brandTextCol}>
            <Text style={styles.brandName}>
              GC HOME<Text style={styles.goldPlus}>+</Text>
            </Text>
            <Text style={styles.brandCaption}>Genuine Cleaning. Genuine Care.</Text>
          </View>
        </View>

        {/* ── RIGHT: Notification Bell + Profile Avatar ── */}
        <View style={styles.actionsGroup}>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color="#171A18" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={onOpenProfile}
            activeOpacity={0.8}
            accessibilityLabel="User Profile"
          >
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={18} color="#123D2A" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },

  // ── Single row ──────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Brand (left) ────────────────────────────────────────────────────────────
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 1,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171A18',
    letterSpacing: -0.4,
    lineHeight: 20,
  },
  goldPlus: {
    color: '#C9A227',
    fontWeight: '900',
  },
  brandCaption: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6FAF72',
    letterSpacing: 0.1,
    lineHeight: 13,
  },

  // ── Actions (right) ─────────────────────────────────────────────────────────
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
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
  badge: {
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
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#123D2A',
    overflow: 'hidden',
    backgroundColor: '#EAF5EC',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
