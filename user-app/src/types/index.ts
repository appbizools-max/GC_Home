export type UserRole = 'customer' | 'maid' | 'admin';
export type MaidApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  profilePhoto?: string;
  maidApplicationStatus: MaidApplicationStatus;
  createdAt: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface MaidProfile {
  uid: string;
  fullName: string;
  phone: string;
  email?: string;
  dob?: string;
  gender?: string;
  photoUrl: string;
  idProofUrl: string;
  emergencyContact: string;
  address: string;
  city?: string;
  bankDetails: BankDetails;
  serviceArea: string;
  serviceRadiusKm: number;
  healthSafetyDecl: boolean;
  status: MaidApplicationStatus;
  rejectionReason?: string;
  isOnline: boolean;
  rating: number;
  totalRatingsCount: number;
  completedJobsCount: number;
  workingDays: string[];
  appliedAt: string;
  approvedAt?: string;
  aadhaarNumber?: string;
  kycVerificationMethod?: 'digilocker' | 'manual';
  isDigiLockerVerified?: boolean;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  policeClearanceUrl?: string;
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
}

export type BookingStatus =
  | 'pending_assignment'
  | 'maid_assigned'
  | 'maid_accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'payment_pending'
  | 'payment_verified'
  | 'searching_partner'
  | 'partner_offered'
  | 'partner_accepted'
  | 'partner_en_route'
  | 'partner_arrived'
  | 'otp_verified'
  | 'service_in_progress'
  | 'completion_submitted'
  | 'customer_confirmed'
  | 'payment_settled'
  | 'disputed'
  | 'refund_pending'
  | 'refunded';

export type PaymentMethod = 'upi' | 'card' | 'pay_on_completion' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'authorized' | 'failed' | 'refunded' | 'partial_refund' | 'cancelled';

export interface Address {
  id: string;
  label: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
  landmark?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface Booking {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  address: Address;
  date: string;
  timeSlot: string;
  specialInstructions?: string;
  status: BookingStatus;
  assignedMaidId?: string;
  assignedMaidName?: string;
  assignedMaidPhone?: string;
  assignedMaidPhoto?: string;
  assignedMaidRating?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  advanceAmount?: number;
  remainingAmount?: number;
  advancePaid?: boolean;
  partnerEarnings?: number;
  platformCommission?: number;
  tipAmount?: number;
  startOtp?: string;
  otpVerified?: boolean;
  otpVerifiedAt?: string;
  partnerDistanceKm?: number;
  partnerLocationLat?: number;
  partnerLocationLng?: number;
  partnerAcceptedAt?: string;
  partnerArrivedAt?: string;
  estimatedArrivalTime?: string;
  partnerEtaMinutes?: number;
  completionSubmittedAt?: string;
  completionNotes?: string;
  completionPhotos?: string[];
  customerConfirmedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  serviceState?: string;
  createdAt: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
}

export interface JobAssignment {
  assignmentId: string;
  bookingId: string;
  maidId: string;
  status: 'sent' | 'pending' | 'accepted' | 'declined' | 'rejected' | 'expired';
  distanceKm?: number;
  estimatedEarnings: number;
  payoutAmount?: number;
  sentAt: string;
  expiresAt: string;
}

export interface BookingTimelineEvent {
  id: string;
  bookingId: string;
  eventType: string;
  eventTitle: string;
  eventDescription?: string;
  eventStatus?: 'success' | 'error' | 'warning' | 'info';
  actorId?: string;
  actorType?: 'customer' | 'partner' | 'admin' | 'system';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BookingTip {
  id: string;
  bookingId: string;
  customerId: string;
  partnerId: string;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentReport {
  id: string;
  bookingId: string;
  reporterId: string;
  reportedPartnerId?: string;
  reportType: 'asked_for_cash' | 'unauthorized_amount' | 'payment_outside_app' | 'service_issue' | 'other';
  description: string;
  evidenceUrls?: string[];
  amountRequested?: number;
  status: 'pending' | 'under_review' | 'resolved' | 'invalid' | 'action_taken';
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface PartnerLocationHistory {
  id: string;
  partnerId: string;
  bookingId?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  heading?: number;
  speedMps?: number;
  isActiveBooking?: boolean;
  createdAt: string;
}

export interface Earning {
  earningId: string;
  maidId: string;
  bookingId: string;
  serviceName: string;
  amount: number;
  date: string;
  payoutStatus: 'pending' | 'processing' | 'paid';
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
export interface HomeSize {
  id: string;
  label: string;
  roomsCount: number;
  price: number;
  originalPrice?: number;
  subtitle?: string;
}

export interface AddOnItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: any;
  description?: string;
}

export interface CustomerCart {
  service: Service;
  homeSize: HomeSize;
  addOns: AddOnItem[];
  selectedDate: string;
  selectedDateLabel: string;
  selectedSlot: string;
  address?: Address;
  promoCode?: string;
  basePrice: number;
  addOnsTotal: number;
  discountAmount: number;
  platformFee: number;
  taxes: number;
  totalAmount: number;
}

export type TrackingStage =
  | 'confirmed'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'cleaning'
  | 'completed';

export interface AssignedProfessional {
  id: string;
  name: string;
  photoUrl: any;
  rating: number;
  reviewCount: number;
  phone: string;
  isVerified: boolean;
  experience: string;
  vaccinationStatus?: string;
}

export interface CustomerBooking {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  serviceImage: any;
  homeSize: HomeSize;
  addOns: AddOnItem[];
  date: string;
  dateLabel: string;
  timeSlot: string;
  address: Address;
  assignedPro?: AssignedProfessional;
  currentStage: TrackingStage;
  stageHistory: { stage: TrackingStage; timestamp: string; label: string; completed: boolean }[];
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  paymentStatus: 'paid' | 'pending';
  basePrice: number;
  addOnsTotal: number;
  discountAmount: number;
  platformFee: number;
  taxes: number;
  totalAmount: number;
  promoCode?: string;
  createdAt: string;
  startOtp?: string;
  rating?: number;
  reviewText?: string;
  reviewTags?: string[];
}
