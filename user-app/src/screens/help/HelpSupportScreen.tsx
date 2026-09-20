import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Headphones,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react-native';

const FAQS = [
  {
    q: 'How are GC Home Plus cleaners verified?',
    a: 'Every cleaner undergoes triple-layer screening: Government Aadhaar verification, court criminal record check, and professional background references.',
  },
  {
    q: 'What chemicals & equipment are used?',
    a: 'We use 100% certified eco-friendly, non-toxic detergents safe for children, infants, and pets. Our equipment is sanitized between every household visit.',
  },
  {
    q: 'What is the GC Home Plus Service Guarantee?',
    a: 'If you are unsatisfied with any aspect of the cleaning, notify us within 24 hours and a specialist will re-clean the area free of charge.',
  },
  {
    q: 'Can I reschedule or cancel my booking?',
    a: 'Yes, you can reschedule or cancel directly from the "My Bookings" tab with zero cancellation fee up to 2 hours before the scheduled time slot.',
  },
];

export const HelpSupportScreen: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleEmail = () => {
    Linking.openURL('mailto:care@gchomeplus.com').catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSub}>We're here 24/7 to ensure genuine care for your home</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Cards Row */}
        <View style={styles.contactGrid}>
          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: '#EAF8F1' }]}>
              <MessageCircle size={20} color="#168A68" />
            </View>
            <Text style={styles.contactTitle}>In-App Live Chat</Text>
            <Text style={styles.contactValue}>24/7 Available</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Mail size={20} color="#0284C7" />
            </View>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactValue}>Quick Response</Text>
          </TouchableOpacity>
        </View>

        {/* Email Support Card */}
        <TouchableOpacity style={styles.emailCard} onPress={handleEmail} activeOpacity={0.8}>
          <Mail size={18} color="#168A68" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emailTitle}>Email Customer Care</Text>
            <Text style={styles.emailSub}>care@gchomeplus.com • 2h response time</Text>
          </View>
          <ExternalLink size={15} color="#94A3B8" />
        </TouchableOpacity>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <FileQuestion size={18} color="#168A68" />
            <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          </View>

          <View style={styles.faqList}>
            {FAQS.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.faqItem}
                  onPress={() => setExpandedIndex(isExpanded ? null : idx)}
                  activeOpacity={0.85}
                >
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#168A68" />
                    ) : (
                      <ChevronDown size={18} color="#68788C" />
                    )}
                  </View>
                  {isExpanded && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Safety Badge Reassurance */}
        <View style={styles.safetyCard}>
          <ShieldCheck size={22} color="#168A68" />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>₹3,00,000 Damage Protection</Text>
            <Text style={styles.safetySub}>
              Every booking is insured for accidental damages with guaranteed 24h issue resolution.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10243A',
  },
  headerSub: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  contactValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#168A68',
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    gap: 12,
  },
  emailTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
  },
  emailSub: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 2,
  },
  faqSection: {
    marginTop: 6,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  faqSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10243A',
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 8,
    lineHeight: 16,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8F1',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    gap: 12,
    marginTop: 4,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5B47',
  },
  safetySub: {
    fontSize: 11,
    color: '#168A68',
    marginTop: 2,
    lineHeight: 15,
  },
});
