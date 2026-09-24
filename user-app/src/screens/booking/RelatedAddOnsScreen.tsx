import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Check, Plus, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../config/supabase';
import { AddOnItem } from '../../types';

export const RelatedAddOnsScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { cart, toggleAddOn } = useCart();
  const [relatedAddOns, setRelatedAddOns] = useState<AddOnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cartServiceIds = (cart?.items || []).map(i => i.service.serviceId).filter(Boolean);

  useEffect(() => {
    const fetchLinkedAddOns = async () => {
      setIsLoading(true);
      try {
        if (cartServiceIds.length === 0) {
          setRelatedAddOns([]);
          setIsLoading(false);
          return;
        }

        // Fetch add-ons matching cart service IDs or global add-ons (service_id is null)
        const { data, error } = await supabase
          .from('service_addons')
          .select('*')
          .or(`service_id.in.(${cartServiceIds.join(',')}),service_id.is.null`)
          .eq('is_active', true);

        if (!error && data) {
          const mapped: AddOnItem[] = data.map((row: any) => ({
            id: row.id,
            serviceId: row.service_id,
            title: row.name || row.title,
            price: Number(row.price || 0),
            description: row.description || '',
            imageUrl: row.image_url || undefined,
          }));
          setRelatedAddOns(mapped);
        } else {
          setRelatedAddOns([]);
        }
      } catch (err) {
        console.warn('Error fetching linked add-ons:', err);
        setRelatedAddOns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkedAddOns();
  }, [cartServiceIds.join(',')]);

  const selectedAddOnIds = (cart?.addOns || []).map(a => a.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('cart_summary')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommended Add-ons</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoBanner}>
          <Sparkles size={18} color="#0D8846" />
          <Text style={styles.infoBannerText}>
            Add-ons specially tailored for your selected service(s)
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0D8846" />
            <Text style={styles.loadingText}>Fetching linked add-ons...</Text>
          </View>
        ) : relatedAddOns.length === 0 ? (
          <View style={styles.emptyBox}>
            <ShieldCheck size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Additional Add-ons Required</Text>
            <Text style={styles.emptySub}>Your selected services are complete and fully covered!</Text>
          </View>
        ) : (
          <View style={styles.addOnsList}>
            {relatedAddOns.map(addOn => {
              const isSelected = selectedAddOnIds.includes(addOn.id);
              return (
                <TouchableOpacity
                  key={addOn.id}
                  onPress={() => toggleAddOn(addOn)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{addOn.title}</Text>
                      {Boolean(addOn.description) && (
                        <Text style={styles.description}>{addOn.description}</Text>
                      )}
                    </View>
                    <Text style={styles.price}>+₹{addOn.price}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={[styles.toggleBtn, isSelected && styles.toggleBtnSelected]}>
                      {isSelected ? (
                        <>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          <Text style={styles.toggleTextSelected}>Added</Text>
                        </>
                      ) : (
                        <>
                          <Plus size={14} color="#0D8846" strokeWidth={2.5} />
                          <Text style={styles.toggleText}>Add</Text>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>₹{(cart?.totalAmount || 0).toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigateTo('checkout_schedule')}
          style={styles.continueBtn}
          activeOpacity={0.88}
        >
          <Text style={styles.continueBtnText}>Continue to Schedule</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  addOnsList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardSelected: {
    borderColor: '#0D8846',
    backgroundColor: '#F0FDF4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D8846',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0D8846',
    backgroundColor: '#FFFFFF',
  },
  toggleBtnSelected: {
    backgroundColor: '#0D8846',
    borderColor: '#0D8846',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D8846',
  },
  toggleTextSelected: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D8846',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
