import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ServiceCategory } from '../../services/homeService';
import { resolveImageSource } from '../../utils/imageUtils';
import {
  Home,
  UtensilsCrossed,
  Bath,
  Armchair,
  Sparkles,
  LayoutGrid,
} from 'lucide-react-native';

interface ServiceCategoryRowProps {
  categories: ServiceCategory[];
  onSelectCategory: (category: ServiceCategory) => void;
}

export const ServiceCategoryRow: React.FC<ServiceCategoryRowProps> = ({
  categories,
  onSelectCategory,
}) => {
  const getIcon = (iconName: ServiceCategory['iconName'], color: string) => {
    switch (iconName) {
      case 'home':
        return <Home size={22} color={color} strokeWidth={2.2} />;
      case 'kitchen':
        return <UtensilsCrossed size={22} color={color} strokeWidth={2.2} />;
      case 'bath':
        return <Bath size={22} color={color} strokeWidth={2.2} />;
      case 'sofa':
        return <Armchair size={22} color={color} strokeWidth={2.2} />;
      case 'deep':
        return <Sparkles size={22} color={color} strokeWidth={2.2} />;
      case 'more':
      default:
        return <LayoutGrid size={22} color={color} strokeWidth={2.2} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryItem}
            onPress={() => onSelectCategory(cat)}
            activeOpacity={0.8}
            accessibilityLabel={cat.name.replace('\n', ' ')}
          >
            {/* Soft Pastel Rounded Square Icon Box or Category Image */}
            <View style={[styles.iconBox, { backgroundColor: cat.bgColor }]}>
              {cat.imageUrl ? (
                <Image
                  source={resolveImageSource(cat.imageUrl)}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
              ) : (
                getIcon(cat.iconName, cat.iconColor)
              )}
            </View>

            {/* Category Name */}
            <Text style={styles.categoryName} numberOfLines={2}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    width: 66,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10243A',
    textAlign: 'center',
    lineHeight: 13,
  },
});
