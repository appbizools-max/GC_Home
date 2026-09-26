import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import {
  ArrowLeft,
  Clock,
  Check,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';

export const BecomeMaidInfoScreen: React.FC = () => {
  const { navigateTo, user, maidProfile, fetchMaidProfile } = useAuth();
  
  // Under review status is correct ONLY after the partner actually submits the application
  const status = maidProfile?.status || (user?.role === 'maid' || user?.role === 'partner' ? user?.maidApplicationStatus : 'none') || 'none';
  const prevStatusRef = useRef<string>(status);

  // Handle header back navigation
  const handleHeaderBack = () => {
    if (user?.role === 'customer' && status === 'none') {
      navigateTo('customer_home');
    } else {
      navigateTo('login');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Real-time synchronization with Supabase maid_profiles
  // Listens for Admin APPROVE / REJECT actions in real time
  // ─────────────────────────────────────────────────────────────
  const syncWithSupabase = useCallback(async () => {
    // Only query if an actual user or maid identity exists
    const rawPhone = user?.phone || maidProfile?.phone || '';
    const rawUid = user?.uid || maidProfile?.uid || '';
    const digits = rawPhone.replace(/\D/g, '').slice(-10);

    if (!digits && !rawUid) {
      return;
    }

    try {
      const queryFilter = digits
        ? `phone.eq.${rawPhone},phone.eq.+91${digits},phone.eq.${digits}${rawUid ? `,id.eq.${rawUid},user_id.eq.${rawUid}` : ''}`
        : `id.eq.${rawUid},user_id.eq.${rawUid}`;

      const { data, error } = await supabase
        .from('maid_profiles')
        .select('*')
        .or(queryFilter)
        .limit(1);

      if (!error && data && data.length > 0) {
        const row = data[0];
        const newStatus = row.status || 'pending';

        if (newStatus !== prevStatusRef.current) {
          prevStatusRef.current = newStatus;
          if (fetchMaidProfile) {
            await fetchMaidProfile();
          }

          if (newStatus === 'approved') {
            Alert.alert(
              'Application Approved',
              'Your partner application has been approved.',
              [{ text: 'Open Dashboard', onPress: () => navigateTo('maid_home') }]
            );
          } else if (newStatus === 'rejected') {
            Alert.alert(
              'Application Not Approved',
              row.rejection_reason || 'Revisions requested by Admin. Please update your details and resubmit.',
              [{ text: 'Edit Details', onPress: () => navigateTo('maid_registration_form', { isReapplication: true }) }]
            );
          }
        }
      }
    } catch (err) {
      console.warn('Realtime status sync check error:', err);
    }
  }, [user?.uid, user?.phone, maidProfile?.phone, fetchMaidProfile, navigateTo]);

  useEffect(() => {
    // Initial sync
    syncWithSupabase();

    // 3-second heartbeat poll while on the application status screen
    const interval = setInterval(syncWithSupabase, 3000);

    // Supabase Realtime channel subscription
    const channel = supabase
      .channel('maid_application_status_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maid_profiles' }, () => {
        syncWithSupabase();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // ─────────────────────────────────────────────────────────────
  // Determine submitted steps
  // Only display steps that have actually been successfully submitted.
  // Do NOT show incomplete/unsubmitted steps as completed.
  // ─────────────────────────────────────────────────────────────
  const hasPersonal = Boolean(
    (maidProfile?.fullName || user?.name) &&
    (maidProfile?.phone || user?.phone)
  );

  const hasAddress = Boolean(
    maidProfile?.fullAddress ||
    maidProfile?.address ||
    maidProfile?.locality ||
    maidProfile?.city
  );

  const hasServices = Boolean(
    (maidProfile?.servicesProvided && maidProfile.servicesProvided.length > 0) ||
    ((maidProfile as any)?.skills && (maidProfile as any).skills.length > 0)
  );

  // Check if documents were actually uploaded (not skipped)
  const kycDocs = (maidProfile as any)?.kyc_documents;
  const docsList = Array.isArray(kycDocs?.documents) ? kycDocs.documents : [];
  const hasUploadedDocs = Boolean(
    maidProfile?.idProofUrl ||
    kycDocs?.aadhaarFrontUrl ||
    docsList.length > 0 ||
    (maidProfile as any)?.aadhaar_doc_url
  );
  const isDocsSkipped = Boolean(kycDocs?.skipped);
  const hasDocuments = hasUploadedDocs && !isDocsSkipped;

  const hasBank = Boolean(
    maidProfile?.bankDetails?.accountNumber ||
    (maidProfile as any)?.bank_account_number ||
    maidProfile?.bankDetails?.upiId
  );

  // Fallback for registered / under-review partners
  const isUnderReview = status === 'pending' || status === 'approved' || status === 'rejected';

  const allPossibleSteps = [
    { id: 'personal', label: 'Personal Details', isCompleted: hasPersonal || isUnderReview },
    { id: 'address', label: 'Address Details', isCompleted: hasAddress || isUnderReview },
    { id: 'services', label: 'Services & Experience', isCompleted: hasServices || isUnderReview },
    { id: 'documents', label: 'Document Verification', isCompleted: hasDocuments },
    { id: 'bank', label: 'Bank Details', isCompleted: hasBank || isUnderReview },
  ];

  // Show only completed/submitted steps
  const submittedSteps = allPossibleSteps.filter(s => s.isCompleted);

  // ─────────────────────────────────────────────────────────────
  // CASE 1: APPLICATION UNDER REVIEW (PENDING ADMIN ACTION)
  // Clean, minimal, flat layout with proper spacing.
  // No large box/card design. No unnecessary text/promotions.
  // ─────────────────────────────────────────────────────────────
  if (status === 'pending' || status === 'correction_requested') {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={handleHeaderBack}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Application</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Minimal Flat Content */}
        <ScrollView contentContainerStyle={styles.scrollFlatContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statusIconWrapPending}>
            <Clock size={28} color="#D97706" strokeWidth={2.2} />
          </View>

          <Text style={styles.mainHeading}>
            {status === 'correction_requested' ? 'Correction Requested' : 'Application Under Review'}
          </Text>

          {/* Admin Correction Note if present */}
          {(maidProfile?.adminNotes || status === 'correction_requested') && (
            <View style={{ marginVertical: 12, padding: 14, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 4 }}>Note from Operations:</Text>
              <Text style={{ fontSize: 13, color: '#78350F', fontWeight: '500', lineHeight: 18 }}>
                {maidProfile?.adminNotes || 'Please review your uploaded information or documents and update them.'}
              </Text>
            </View>
          )}

          {/* Submitted Steps List with ✓ tick marks */}
          <View style={styles.stepsList}>
            {submittedSteps.map(step => (
              <View key={step.id} style={styles.stepItemRow}>
                <View style={styles.tickCircle}>
                  <Check size={14} color="#166534" strokeWidth={2.8} />
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Actionable or Non-Actionable Status Indicator */}
        <View style={styles.bottomBar}>
          {status === 'correction_requested' || maidProfile?.adminNotes ? (
            <TouchableOpacity
              style={styles.actionButtonApproved}
              onPress={() => navigateTo('maid_register')}
              activeOpacity={0.88}
            >
              <Text style={styles.actionButtonText}>Update Registration Details</Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          ) : (
            <View style={styles.inProgressIndicator}>
              <Text style={styles.inProgressText}>In Progress</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CASE 2: APPLICATION APPROVED
  // Clean, minimal, flat layout. Opens Maid Partner dashboard.
  // ─────────────────────────────────────────────────────────────
  if (status === 'approved') {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={handleHeaderBack}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Application</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Minimal Flat Content */}
        <View style={styles.flatContent}>
          <View style={styles.statusIconWrapApproved}>
            <CheckCircle size={32} color="#166534" strokeWidth={2.4} />
          </View>

          <Text style={styles.mainHeading}>Application Approved</Text>
          <Text style={styles.approvedSub}>Your partner application has been approved.</Text>

          {/* Submitted Steps List with ✓ tick marks */}
          <View style={styles.stepsList}>
            {submittedSteps.map(step => (
              <View key={step.id} style={styles.stepItemRow}>
                <View style={styles.tickCircle}>
                  <Check size={14} color="#166534" strokeWidth={2.8} />
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Action Button to Open Operational Dashboard */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.actionButtonApproved}
            onPress={() => navigateTo('maid_home')}
            activeOpacity={0.88}
          >
            <Text style={styles.actionButtonText}>Open Partner Dashboard</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CASE 3: APPLICATION NOT APPROVED (REJECTED)
  // Shows Admin rejection reason & allows correction/resubmission.
  // ─────────────────────────────────────────────────────────────
  if (status === 'rejected') {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={handleHeaderBack}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Application</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Minimal Flat Content */}
        <ScrollView contentContainerStyle={styles.scrollFlatContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statusIconWrapRejected}>
            <AlertCircle size={30} color="#DC2626" strokeWidth={2.2} />
          </View>

          <Text style={styles.mainHeading}>Application Not Approved</Text>

          {/* Admin Rejection Reason */}
          <View style={styles.rejectionNotice}>
            <Text style={styles.rejectionReasonLabel}>Reason provided by Operations:</Text>
            <Text style={styles.rejectionReasonText}>
              {maidProfile?.rejectionReason || 'Please review your uploaded information and documents and resubmit.'}
            </Text>
          </View>

          {/* Submitted Steps List */}
          <View style={styles.stepsList}>
            {submittedSteps.map(step => (
              <View key={step.id} style={styles.stepItemRow}>
                <View style={styles.tickCircle}>
                  <Check size={14} color="#166534" strokeWidth={2.8} />
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Action Button to Edit & Resubmit */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.actionButtonReapply}
            onPress={() => navigateTo('maid_registration_form', { isReapplication: true })}
            activeOpacity={0.88}
          >
            <Text style={styles.actionButtonText}>Edit & Resubmit Application</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CASE 4: UNREGISTERED / NEW PARTNER VISITOR
  // Clean minimal screen to start registration
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={handleHeaderBack}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Application</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.flatContent}>
        <View style={styles.statusIconWrapPending}>
          <Clock size={28} color="#0D8846" strokeWidth={2.2} />
        </View>
        <Text style={styles.mainHeading}>Become a Partner</Text>
        <Text style={styles.approvedSub}>Complete a simple 5-step registration to join the GC HOME+ verified partner network.</Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionButtonApproved}
          onPress={() => navigateTo('maid_registration_form')}
          activeOpacity={0.88}
        >
          <Text style={styles.actionButtonText}>Start Registration</Text>
          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 36,
  },

  /* Flat Content Area (No Heavy Box / Card Wrapper) */
  flatContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: 'flex-start',
  },
  scrollFlatContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },

  /* Minimal Status Icon Wrappers */
  statusIconWrapPending: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIconWrapApproved: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIconWrapRejected: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  /* Headings */
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  approvedSub: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },

  /* Rejection Notice */
  rejectionNotice: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 24,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 3,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },

  /* Submitted Steps Checklist (Flat Layout) */
  stepsList: {
    width: '100%',
    marginTop: 18,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tickCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },

  /* Bottom Bar Area */
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },

  /* Non-actionable "In Progress" indicator */
  inProgressIndicator: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inProgressText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Action Buttons */
  actionButtonApproved: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0D8846',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonReapply: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});