import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Leaf } from 'lucide-react-native';

interface BottomWaveDecorationProps {
  slogan?: string;
  showLeaves?: boolean;
}

export const BottomWaveDecoration: React.FC<BottomWaveDecorationProps> = ({
  slogan = 'Clean Spaces. Brighter Lives.',
  showLeaves = true,
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width="100%"
        height="85"
        viewBox="0 0 375 85"
        preserveAspectRatio="none"
        style={styles.svgWave}
      >
        <Path
          d="M0,35 C90,15 180,55 270,25 C320,10 355,20 375,30 L375,85 L0,85 Z"
          fill="#EAF8F1"
          fillOpacity="0.8"
        />
        <Path
          d="M0,50 C110,25 210,65 310,35 C345,25 365,30 375,35 L375,85 L0,85 Z"
          fill="#D1F2E2"
          fillOpacity="0.6"
        />
      </Svg>

      {/* Slogan Banner */}
      <View style={styles.sloganRow}>
        {showLeaves && <Leaf size={14} color="#168A68" fill="#168A68" style={{ marginRight: 4 }} />}
        <Text style={styles.sloganText}>{slogan}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 65,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    marginTop: 'auto',
  },
  svgWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  sloganText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0E5B47',
    letterSpacing: 0.2,
  },
});
