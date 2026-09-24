import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Leaf, Heart } from 'lucide-react-native';

interface TrustBadgeRowProps {
  variant?: 'splash' | 'login' | 'otp';
}

export const TrustBadgeRow: React.FC<TrustBadgeRowProps> = ({ variant = 'splash' }) => {
  const getLabels = () => {
    switch (variant) {
      case 'login':
        return [
          { title: 'Verified', sub: 'Professionals' },
          { title: 'Eco-Friendly', sub: 'Products' },
          { title: 'Customer', sub: 'First' },
        ];
      case 'otp':
        return [
          { title: 'Trusted', sub: 'Professionals' },
          { title: 'Safe &', sub: 'Eco-Friendly' },
          { title: 'Happier', sub: 'Homes' },
        ];
      case 'splash':
      default:
        return [
          { title: 'Trusted', sub: 'Professionals' },
          { title: 'Safe &', sub: 'Eco-Friendly' },
          { title: 'Healthier', sub: 'Happier Homes' },
        ];
    }
  };

  const labels = getLabels();

  return (
    <View style={styles.container}>
      {/* Badge 1: Professionals */}
      <View style={styles.badgeItem}>
        <View style={styles.iconCircle}>
          <ShieldCheck size={18} color="#123D2A" strokeWidth={2.2} />
        </View>
        <Text style={styles.badgeTitle}>{labels[0].title}</Text>
        <Text style={styles.badgeSub}>{labels[0].sub}</Text>
      </View>

      {/* Badge 2: Safe & Eco-friendly */}
      <View style={styles.badgeItem}>
        <View style={styles.iconCircle}>
          <Leaf size={18} color="#123D2A" strokeWidth={2.2} />
        </View>
        <Text style={styles.badgeTitle}>{labels[1].title}</Text>
        <Text style={styles.badgeSub}>{labels[1].sub}</Text>
      </View>

      {/* Badge 3: Happiness / Homes */}
      <View style={styles.badgeItem}>
        <View style={styles.iconCircle}>
          <Heart size={18} color="#123D2A" strokeWidth={2.2} />
        </View>
        <Text style={styles.badgeTitle}>{labels[2].title}</Text>
        <Text style={styles.badgeSub}>{labels[2].sub}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 8,
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#C6E3CB',
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171A18',
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#68788C',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 13,
  },
});
