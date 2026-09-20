import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import {
  ArrowLeft,
  Star,
  Camera,
  Check,
  CheckCircle2,
  Heart,
  Sparkles,
} from 'lucide-react-native';

const QUICK_TAGS = [
  'Excellent Cleaning',
  'Professional',
  'On Time',
  'Friendly',
  'Good Quality',
  'Value for Money',
];

export const RatingReviewScreen: React.FC = () => {
  const { navigateTo, user } = useAuth();
  const { activeBooking, submitReview, addTip } = useBooking();

  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Excellent Cleaning',
    'Professional',
    'On Time',
  ]);
  const [reviewText, setReviewText] = useState<string>(
    'Sunita ji did a fabulous job! The kitchen and living room are sparkling clean.'
  );
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const booking = activeBooking;
  const pro = booking?.assignedPro;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (booking) {
      submitReview(booking.bookingId, rating, reviewText, selectedTags);
      if (tipAmount > 0 && pro) {
        await addTip(booking.bookingId, user?.uid || 'cust_curr', pro.id, tipAmount);
      }
    }
    setIsSubmitted(true);
    setTimeout(() => {
      navigateTo('home');
    }, 1500);
  };

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('home')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <AppLogo size="sm" showTagline={true} align="left" />

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cleaner Avatar & Title */}
        <View style={styles.proSection}>
          {pro && (
            <Image source={resolveImageSource(pro.photoUrl)} style={styles.proPhoto} />
          )}
          <Text style={styles.proName}>How was your experience with {pro?.name || 'our partner'}?</Text>
          <Text style={styles.proSub}>
            {booking?.serviceName || 'Home Cleaning'} • {booking?.dateLabel || 'Today'}
          </Text>
        </View>

        {/* 5-Star Rating Selector */}
        <View style={styles.starsCard}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(starNum => {
              const isFilled = starNum <= rating;
              return (
                <TouchableOpacity
                  key={starNum}
                  style={styles.starBtn}
                  onPress={() => setRating(starNum)}
                  activeOpacity={0.7}
                >
                  <Star
                    size={36}
                    color={isFilled ? '#F59E0B' : '#CBD5E1'}
                    fill={isFilled ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.ratingDescriptor}>
            {rating === 5 ? 'Exceptional! 🌟' : rating === 4 ? 'Very Good! 👍' : rating === 3 ? 'Good' : 'Needs Improvement'}
          </Text>
        </View>

        {/* Quick Feedback Chips */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What did you like most?</Text>
          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  {isSelected && <Check size={12} color="#0E5B47" strokeWidth={3} />}
                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Text Review Box */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Write a review (Optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about your experience..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
          />
        </View>

        {/* Tip for Partner Card */}
        <View style={[styles.sectionCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Heart size={16} color="#166534" fill="#166534" />
            <Text style={[styles.sectionTitle, { color: '#166534', marginBottom: 0 }]}>
              Add a tip for {pro?.name || 'Partner'} (100% goes to partner)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {[30, 50, 100, 150].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setTipAmount(amt === tipAmount ? 0 : amt)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: tipAmount === amt ? '#166534' : '#DCFCE7',
                  backgroundColor: tipAmount === amt ? '#DCFCE7' : '#FFFFFF',
                }}
              >
                <Text style={{ fontWeight: '800', color: '#166534', fontSize: 13 }}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitted && styles.submitBtnDone]}
          onPress={handleSubmit}
          disabled={isSubmitted}
          activeOpacity={0.88}
        >
          {isSubmitted ? (
            <View style={styles.submittedRow}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Thank you for your review!</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  proSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  proPhoto: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  proName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
    textAlign: 'center',
  },
  proSub: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  starsCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingDescriptor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5B47',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5FCF8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  tagPillSelected: {
    backgroundColor: '#EAF8F1',
    borderColor: '#168A68',
  },
  tagText: {
    fontSize: 11.5,
    color: '#68788C',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#0E5B47',
    fontWeight: '800',
  },
  reviewInput: {
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    fontSize: 13,
    color: '#10243A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submitBtn: {
    backgroundColor: '#0E5B47',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDone: {
    backgroundColor: '#168A68',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
