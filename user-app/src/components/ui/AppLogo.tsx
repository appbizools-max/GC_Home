import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { ASSETS } from '../../assets/index';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  align?: 'center' | 'left';
  useImage?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showTagline = true,
  align = 'center',
  useImage = false,
}) => {
  const iconSizes = {
    sm: 36,
    md: 52,
    lg: 64,
  };

  const titleSizes = {
    sm: 17,
    md: 22,
    lg: 26,
  };

  const currentIconSize = iconSizes[size];
  const currentTitleSize = titleSizes[size];

  return (
    <View style={[styles.container, align === 'left' ? styles.alignLeft : styles.alignCenter]}>
      {/* Brand Icon SVG Badge */}
      <View
        style={[
          styles.iconBadge,
          {
            width: currentIconSize,
            height: currentIconSize,
            borderRadius: currentIconSize * 0.28,
          },
        ]}
      >
        {useImage ? (
          <Image
            source={typeof ASSETS.logo === 'string' ? { uri: ASSETS.logo } : ASSETS.logo}
            style={{ width: currentIconSize * 0.85, height: currentIconSize * 0.85, borderRadius: (currentIconSize * 0.85) / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Svg width={currentIconSize * 0.72} height={currentIconSize * 0.72} viewBox="0 0 48 48" fill="none">
            {/* House Outline */}
            <Path
              d="M24 6L6 20V40C6 41.1046 6.89543 42 8 42H40C41.1046 42 42 41.1046 42 40V20L24 6Z"
              fill="#168A68"
            />
            {/* Windows / Living Space */}
            <Rect x="14" y="24" width="8" height="12" rx="2" fill="#FFFFFF" fillOpacity="0.3" />
            <Rect x="26" y="24" width="8" height="12" rx="2" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Vibrant Sprout Leaf */}
            <Path
              d="M24 38C24 38 22 28 32 24C32 34 24 38 24 38Z"
              fill="#A7F3D0"
            />
            <Path
              d="M24 38C24 38 26 31 20 28C20 35 24 38 24 38Z"
              fill="#6EE7B7"
            />
            {/* Sparkle Clean Star */}
            <Path
              d="M38 10L39.5 13.5L43 15L39.5 16.5L38 20L36.5 16.5L33 15L36.5 13.5L38 10Z"
              fill="#FBBF24"
            />
            <Circle cx="12" cy="14" r="1.5" fill="#FBBF24" />
          </Svg>
        )}
      </View>

      {/* Brand Typography */}
      <View style={align === 'left' ? styles.textLeft : styles.textCenter}>
        <Text style={[styles.brandTitle, { fontSize: currentTitleSize }]}>GC Home Plus</Text>
        {showTagline && (
          <Text style={styles.brandTagline}>Genuine Cleaning. Genuine Care.</Text>
        )}
      </View>
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
  iconBadge: {
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textCenter: {
    alignItems: 'center',
  },
  textLeft: {
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontWeight: '900',
    color: '#10243A',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 12.5,
    color: '#68788C',
    fontWeight: '500',
    marginTop: 1,
  },
});
