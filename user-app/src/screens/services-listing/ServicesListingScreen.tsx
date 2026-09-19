import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  Check,
  Sparkles,
  Home,
  Utensils,
  Droplets,
  Armchair,
  ChevronRight,
} from 'lucide-react-native';
import { Service } from '../../types';

interface CategoryItem {
  id: string;
  label: string;
  icon: any;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'full_home', label: 'Full Home', icon: Home },
  { id: 'kitchen', label: 'Kitchen', icon: Utensils },
  { id: 'bathroom', label: 'Bathroom', icon: Droplets },
  { id: 'deep_care', label: 'Deep Clean', icon: Armchair },
];

export const ServicesListingScreen: React.FC = () => {
  const { services, navigateTo, goBack } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'full_home') {
      return service.serviceId === 'srv_1' || service.serviceId === 'srv_2' || service.serviceId === 'srv_3';
    }
    if (selectedCategory === 'kitchen') {
      return service.serviceId === 'srv_5' || service.serviceId === 'srv_2';
    }
    if (selectedCategory === 'bathroom') {
      return service.serviceId === 'srv_4';
    }
    if (selectedCategory === 'deep_care') {
      return service.serviceId === 'srv_3' || service.serviceId === 'srv_6';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerMainTitle}>Cleaning Packages</Text>
          <Text style={styles.headerSubTitle}>Verified professionals • Guaranteed quality</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Search Bar ── */}
        <View style={styles.searchBox}>
          <Search size={17} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cleaning services..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Clean Horizontal Category Filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.catPill, isActive && styles.catPillActive]}
                activeOpacity={0.8}
              >
                <IconComp size={14} color={isActive ? '#FFFFFF' : '#475569'} />
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Section Title ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>
            {selectedCategory === 'all'
              ? 'Available Services'
              : `${CATEGORIES.find(c => c.id === selectedCategory)?.label} Packages`}
          </Text>
          <Text style={styles.packagesCount}>{filteredServices.length} options</Text>
        </View>

        {/* ── Professional & Simple Service Cards ── */}
        <View style={styles.servicesList}>
          {filteredServices.map(service => {
            const originalPrice = Math.round(service.startingPrice * 1.35);

            return (
              <TouchableOpacity
                key={service.serviceId}
                style={styles.serviceCard}
                onPress={() => navigateTo('service_details', { service })}
                activeOpacity={0.9}
              >
                {/* Left Side: Information */}
                <View style={styles.cardInfo}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.serviceId === 'srv_1' && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAR</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.ratingBadge}>
                      <Star size={11} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingValue}>4.9</Text>
                    </View>
                    <Text style={styles.metaDot}>•</Text>
                    <View style={styles.durationBadge}>
                      <Clock size={11} color="#64748B" />
                      <Text style={styles.durationValue}>{service.estimatedDuration}</Text>
                    </View>
                  </View>

                  {/* 2 Key Inclusions */}
                  <View style={styles.inclusionsList}>
                    {(service.features || []).slice(0, 2).map((item, idx) => (
                      <View key={idx} style={styles.inclusionRow}>
                        <Check size={12} color="#1E4E3D" />
                        <Text style={styles.inclusionText} numberOfLines={1}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Price Row */}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceCurrent}>₹{service.startingPrice}</Text>
                    <Text style={styles.priceOriginal}>₹{originalPrice}</Text>
                    <Text style={styles.viewDetailsText}>View Details →</Text>
                  </View>
                </View>

                {/* Right Side: Photo + Book Action */}
                <View style={styles.cardImageCol}>
                  <Image source={{ uri: service.imageUrl }} style={styles.cardPhoto} />
                  <View style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>BOOK</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  searchBox: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 40,
    paddingRight: 36,
    fontSize: 13,
    color: '#0F172A',
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
  },
  categoryPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#1E4E3D',
    borderColor: '#1E4E3D',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  packagesCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  popularBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E4E3D',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  metaDot: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationValue: {
    fontSize: 11,
    color: '#64748B',
  },
  inclusionsList: {
    gap: 4,
    marginTop: 8,
    marginBottom: 10,
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inclusionText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceCurrent: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  priceOriginal: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4E3D',
    marginLeft: 'auto',
  },
  cardImageCol: {
    width: 95,
    alignItems: 'center',
    position: 'relative',
  },
  cardPhoto: {
    width: 95,
    height: 95,
    borderRadius: 12,
  },
  bookBtn: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1E4E3D',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1E4E3D',
    letterSpacing: 0.5,
  },
});
