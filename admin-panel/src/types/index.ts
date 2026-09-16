export type MaidApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

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
  isOnline: boolean;
  rating: number;
  totalRatingsCount: number;
  completedJobsCount: number;
  workingDays: string[];
  appliedAt: string;
  approvedAt?: string;
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

export interface Address {
  id: string;
  label: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
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
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  totalAmount: number;
  createdAt: string;
  completedAt?: string;
}

export interface DashboardMetrics {
  totalBookingsToday: number;
  activeMaidsCount: number;
  pendingMaidApprovalsCount: number;
  totalRevenueToday: number;
  totalRevenueMonth: number;
  pendingAssignmentsCount: number;
}
