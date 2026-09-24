import React from 'react';
import { Image, ImageStyle, View, ViewStyle, StyleSheet } from 'react-native';
import ASSETS from '../../assets';

export interface GCLogoProps {
  size?: number;
  width?: number;
  height?: number;
  compact?: boolean;
  accessibilityLabel?: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
}

export const GCLogo: React.FC<GCLogoProps> = ({
  size = 48,
  width,
  height,
  compact = false,
  accessibilityLabel = 'GC HOME+ Official Brand Logo',
  style,
  containerStyle,
}) => {
  const actualWidth = width || (compact ? 32 : size);
  const actualHeight = height || (compact ? 32 : size);

  const imageSource =
    typeof ASSETS.logo === 'string'
      ? { uri: ASSETS.logo }
      : (ASSETS.logo as any);

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={imageSource}
        accessibilityLabel={accessibilityLabel}
        resizeMode="contain"
        style={[
          {
            width: actualWidth,
            height: actualHeight,
          },
          style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GCLogo;
