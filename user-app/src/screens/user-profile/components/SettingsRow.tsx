import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';

export interface SettingsRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
  isDestructive?: boolean;
  trailingBadge?: string;
  isLast?: boolean;
  accessibilityLabel?: string;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  title,
  description,
  onPress,
  isDestructive = false,
  trailingBadge,
  isLast = false,
  accessibilityLabel,
}) => {
  return (
    <>
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${title}, ${description}`}
      >
        <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
          <Icon
            size={18}
            color={isDestructive ? '#DC2626' : '#0D8846'}
            strokeWidth={2.2}
          />
        </View>

        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isDestructive && styles.titleDestructive]}>
              {title}
            </Text>
            {trailingBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{trailingBadge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        </View>

        <ChevronRight size={18} color={isDestructive ? '#F87171' : '#94A3B8'} />
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxDestructive: {
    backgroundColor: '#FEF2F2',
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2E23',
  },
  titleDestructive: {
    color: '#DC2626',
  },
  badge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C6EAD4',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D8846',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
    marginRight: 16,
  },
});
