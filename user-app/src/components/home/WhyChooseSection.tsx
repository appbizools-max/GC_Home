import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  ShieldCheck,
  Leaf,
  Clock,
  Heart,
  Award,
  ChevronRight,
} from 'lucide-react-native';

interface WhyChooseSectionProps {
  onViewAll?: () => void;
}

export const WhyChooseSection: React.FC<WhyChooseSectionProps> = ({ onViewAll }) => {
  const items = [
    {
      id: '1',
      title: 'Verified\nProfessionals',
      icon: ShieldCheck,
    },
    {
      id: '2',
      title: 'Safe &\nEco-Friendly',
      icon: Leaf,
    },
    {
      id: '3',
      title: 'Flexible Booking\nSlots',
      icon: Clock,
    },
    {
      id: '4',
      title: 'Hassle-Free\nExperience',
      icon: Heart,
    },
    {
      id: '5',
      title: '100% Customer\nSatisfaction',
      icon: Award,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Why Choose GC Home Plus?</Text>
        <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={14} color="#168A68" />
        </TouchableOpacity>
      </View>

      {/* 5 Badges Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {items.map(item => {
          const IconComp = item.icon;
          return (
            <View key={item.id} style={styles.itemBox}>
              <View style={styles.iconCircle}>
                <IconComp size={20} color="#168A68" strokeWidth={2.2} />
              </View>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  itemBox: {
    alignItems: 'center',
    width: 72,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10243A',
    textAlign: 'center',
    lineHeight: 12,
  },
});
