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
  | 'cancelled';

export type PaymentMethod = 'upi' | 'card' | 'pay_on_completion';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Address {
  id: string;
  label: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
  landmark?: string;
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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  startOtp?: string;
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
  status: 'sent' | 'accepted' | 'rejected' | 'expired';
  payoutAmount: number;
  sentAt: string;
  expiresAt: string;
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
