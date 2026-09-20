export type MaidApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type KycDocStatus = 'verified' | 'under_review' | 'pending' | 'rejected' | 'not_submitted';

export interface KycDocument {
  id: string;
  type: 'aadhaar' | 'pan' | 'address_proof' | 'police_verification' | 'bank_passbook' | 'other';
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  status: KycDocStatus;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface MaidHistoryItem {
  id: string;
  date: string;
  action: string;
  actor: string;
  details?: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface MaidProfile {
  uid: string;
  maidId?: string;
  fullName: string;
  phone: string;
  email?: string;
  photoUrl: string;
  idProofUrl: string;
  emergencyContact: string;
  address: string;
  bankDetails: BankDetails;
  serviceArea: string;
  serviceRadiusKm: number;
  healthSafetyDecl: boolean;
  status: MaidApplicationStatus;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  isOnline: boolean;
  rating: number;
  totalRatingsCount: number;
  completedJobsCount: number;
  workingDays: string[];
  appliedAt: string;
  approvedAt?: string;
  distanceKm?: number;
  etaMins?: number;
  skills?: string[];

  // Extended fields for 5 Maid Partners screens
  age?: number;
  gender?: string;
  experience?: string;
  languages?: string[];
  kycCompletionPct?: number;
  missingSections?: string[];
  kycStatus?: 'pending' | 'under_review' | 'verified' | 'rejected' | 'incomplete';
  kycDocuments?: KycDocument[];
  earningsThisMonth?: number;
  totalEarnings?: number;
  uniqueCustomersServed?: number;
  currentStatus?: 'online' | 'busy' | 'available' | 'offline';
  preferredAreas?: string[];
  lastActive?: string;
  lastUpdated?: string;
  adminNotes?: string;
  quote?: string;
  history?: MaidHistoryItem[];
  dob?: string;
  alternatePhone?: string;
}

export interface Service {
  serviceId: string;
  name: string;
  category: string;
  description: string;
  startingPrice: number;
  pricePerRoom?: number;
  estimatedDuration: string;
  imageUrl: string;
  isActive: boolean;
  features: string[];
  displayOrder?: number;
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: number;
}

export type BookingStatus =
  | 'new'
  | 'pending_approval'
  | 'pending_assignment'
  | 'maid_assigned'
  | 'maid_accepted'
  | 'en_route'
  | 'arrived'
  | 'cleaning_started'
  | 'in_progress'
  | 'ongoing'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface Address {
  id: string;
  label: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
}

export interface BookingAuditLog {
  id: string;
  title: string;
  timestamp: string;
  details?: string;
  actor?: string;
  completed?: boolean;
}

export interface BookingPhoto {
  id: string;
  url: string;
  label: string;
  timestamp: string;
  type: 'before' | 'after';
}

export interface CustomerReview {
  rating: number;
  comment?: string;
  reviewedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  customerType: 'Regular Customer' | 'First-time Customer' | 'VIP Member';
  locality: string;
  address: Address;
  totalBookings: number;
  totalSpent: number;
  joinedDate: string;
  lastBookingDate: string;
  status: 'active' | 'blocked';
  ratingGiven: number;
  notes?: string;
}

export interface Booking {
  id?: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatar?: string;
  customerType?: 'Regular Customer' | 'First-time Customer' | 'VIP Member';
  customerTotalBookings?: number;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration?: string;
  address: Address;
  date: string;
  timeSlot: string;
  specialInstructions?: string;
  status: BookingStatus;
  assignedMaidId?: string;
  assignedMaidName?: string;
  assignedMaidPhone?: string;
  assignedMaidPhotoUrl?: string;
  assignedMaidRating?: number;
  assignedMaidDistanceKm?: number;
  assignedMaidEtaMins?: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  totalAmount: number;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  createdTimeFormatted?: string;
  completedAt?: string;
  cancellationReason?: string;
  waitingMinutes?: number;
  beforePhotos?: BookingPhoto[];
  afterPhotos?: BookingPhoto[];
  review?: CustomerReview;
  timelineLogs?: BookingAuditLog[];
  startedAt?: string;
  estimatedCompletion?: string;
  durationFormatted?: string;
  customerNote?: string;
  customerCoordinates?: { lat: number; lng: number };
  maidCoordinates?: { lat: number; lng: number };
  stepperTimes?: { assigned?: string; enRoute?: string; arrived?: string; cleaning?: string; completed?: string };
  completedTimeFormatted?: string;
  cancelledAt?: string;
  cancelledBy?: 'Customer' | 'Maid' | 'Admin';
  refundStatus?: 'Refunded' | 'Pending' | 'Not Applicable';
  refundAmount?: number;
  refundDate?: string;
  discountAmount?: number;
  bookingDate?: string;
  rescheduledFrom?: string;
  rescheduledTo?: string;
  rescheduledBy?: 'Customer' | 'Maid' | 'Admin';
  rescheduleReason?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: 'booking' | 'dispatch' | 'maid' | 'payment';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface DashboardMetrics {
  totalBookingsToday?: number;
  todayBookings?: number;
  activeBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  activeMaids?: number;
  totalMaids?: number;
  totalRevenue?: number;
  todayRevenue?: number;
  averageRating?: number;
  totalCustomers?: number;
  activeMaidsCount?: number;
  pendingMaidApprovalsCount?: number;
  totalRevenueToday?: number;
  totalRevenueMonth?: number;
  pendingAssignmentsCount?: number;
  ongoingBookingsCount?: number;
  completedTodayCount?: number;
  waitingMoreThan5MinsCount?: number;
}

export type ChatSenderRole = 'customer' | 'maid' | 'admin' | 'system';
export type ChatConversationStatus = 'active' | 'archived' | 'blocked' | 'closed';

export interface ChatMessage {
  id: string;
  conversationId: string;
  bookingCode: string;
  senderId: string;
  senderRole: ChatSenderRole;
  senderName: string;
  message: string;
  attachmentUrl?: string;
  isFlagged?: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  bookingId?: string;
  bookingCode: string;
  customerId?: string;
  customerName: string;
  maidId?: string;
  maidName: string;
  status: ChatConversationStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderRole?: ChatSenderRole;
  createdAt: string;
  updatedAt: string;
}

