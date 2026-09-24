import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GCLogo } from '../common/GCLogo';
import { BRAND_COLORS } from '../../theme/colors';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showTitle?: boolean;
  align?: 'center' | 'left';
  useImage?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showTagline = false,
  showTitle = false,
  align = 'center',
}) => {
  const iconSizes = {
    sm: 36,
    md: 56,
    lg: 72,
    xl: 96,
  };

  const titleSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  };

  const currentIconSize = iconSizes[size];
  const currentTitleSize = titleSizes[size];

  return (
    <View style={[styles.container, align === 'left' ? styles.alignLeft : styles.alignCenter]}>
      {/* Official Circular Brand Logo */}
      <GCLogo size={currentIconSize} />

      {/* Optional Brand Typography */}
      {(showTitle || showTagline) && (
        <View style={align === 'left' ? styles.textLeft : styles.textCenter}>
          {showTitle && (
            <Text style={[styles.brandTitle, { fontSize: currentTitleSize }]}>
              GC HOME<Text style={styles.goldPlus}>+</Text>
            </Text>
          )}
          {showTagline && (
            <Text style={styles.brandTagline}>Genuine Cleaning. Genuine Care.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textCenter: {
    alignItems: 'center',
  },
  textLeft: {
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontWeight: '900',
    color: BRAND_COLORS.charcoal,
    letterSpacing: -0.3,
  },
  goldPlus: {
    color: BRAND_COLORS.gold,
    fontWeight: '900',
  },
  brandTagline: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default AppLogo;
