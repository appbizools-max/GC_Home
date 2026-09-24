import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Leaf } from 'lucide-react-native';

interface BottomWaveDecorationProps {
  slogan?: string;
  showLeaves?: boolean;
}

export const BottomWaveDecoration: React.FC<BottomWaveDecorationProps> = ({
  slogan = 'Clean Homes. Brighter Lives.',
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
          fill="#EAF5EC"
          fillOpacity="0.85"
        />
        <Path
          d="M0,50 C110,25 210,65 310,35 C345,25 365,30 375,35 L375,85 L0,85 Z"
          fill="#C6E3CB"
          fillOpacity="0.6"
        />
      </Svg>

      {/* Decorative Leaves on Left & Right Margins */}
      {showLeaves && (
        <>
          <View style={styles.floatingLeafLeft}>
            <Leaf size={32} color="#6FAF72" fill="#123D2A" style={{ transform: [{ rotate: '25deg' }] }} />
            <Leaf size={24} color="#6FAF72" fill="#123D2A" style={{ transform: [{ rotate: '-15deg' }], marginTop: -10 }} />
          </View>
          <View style={styles.floatingLeafRight}>
            <Leaf size={32} color="#6FAF72" fill="#123D2A" style={{ transform: [{ rotate: '-25deg' }] }} />
            <Leaf size={24} color="#6FAF72" fill="#123D2A" style={{ transform: [{ rotate: '15deg' }], marginTop: -10 }} />
          </View>
        </>
      )}

      {/* Slogan Banner */}
      <View style={styles.sloganRow}>
        {showLeaves && <Leaf size={14} color="#123D2A" fill="#123D2A" style={{ marginRight: 6 }} />}
        <Text style={styles.sloganText}>{slogan}</Text>
      </View>
      <View style={styles.sloganUnderline} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 75,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    marginTop: 6,
  },
  svgWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  floatingLeafLeft: {
    position: 'absolute',
    bottom: 4,
    left: -4,
    zIndex: 2,
  },
  floatingLeafRight: {
    position: 'absolute',
    bottom: 4,
    right: -4,
    zIndex: 2,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  sloganText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#123D2A',
    letterSpacing: 0.2,
  },
  sloganUnderline: {
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C9A227',
    marginTop: 3,
    zIndex: 3,
  },
});
