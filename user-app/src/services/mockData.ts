import { Service, MaidProfile, Booking } from '../types';

export const SERVICES_SEED: Service[] = [
  {
    serviceId: 'srv_1',
    name: 'Basic Clean',
    category: 'Standard',
    description: 'Essential dusting, floor sweeping & mopping, trash disposal, and surface wiping for everyday home maintenance.',
    startingPrice: 499,
    pricePerRoom: 150,
    estimatedDuration: '1.5 - 2 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: [
      'Sweeping & Mopping of all rooms',
      'Dusting of open furniture surfaces',
      'Trash bag replacement & waste disposal',
      'Basic bathroom sanitization'
    ]
  },
  {
    serviceId: 'srv_2',
    name: 'Medium Clean',
    category: 'Standard',
    description: 'Deep kitchen counter scrub, detailed bathroom cleaning, interior window glass wiping, and ceiling cobweb removal.',
    startingPrice: 899,
    pricePerRoom: 250,
    estimatedDuration: '2.5 - 3 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: [
      'All Basic Clean inclusions',
      'Detailed bathroom degreasing & tile scrub',
      'Kitchen sink & countertop deep wipe',
      'Window glass interior cleaning',
      'Fan & light fixture dusting'
    ]
  },
  {
    serviceId: 'srv_3',
    name: 'Deep Clean',
    category: 'Premium',
    description: 'Comprehensive chemical scrubbing, heavy appliance exterior degreasing, sofa vacuuming, and complete stain treatment.',
    startingPrice: 1499,
    pricePerRoom: 400,
    estimatedDuration: '4 - 5 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: [
      'All Medium Clean inclusions',
      'Heavy duty chemical tile scrub',
      'Upholstery & mattress vacuuming',
      'Hard water stain removal',
      'Cabinet interior & balcony washing'
    ]
  },
  {
    serviceId: 'srv_4',
    name: 'Bathroom Special Clean',
    category: 'Specialized',
    description: 'Specialized hard water stain removal, shower partition glass polishing, floor tile scrubbing, and dis-infection.',
    startingPrice: 399,
    estimatedDuration: '1 hr',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: [
      'Hard water scale removal',
      'Shower glass & mirror polishing',
      'Grout line scrub & sanitization'
    ]
  },
  {
    serviceId: 'srv_5',
    name: 'Kitchen Deep Degreasing',
    category: 'Kitchen',
    description: 'Intensive grease and oil removal from chimney exterior, exhaust fan, stovetop, slab tiles, and sink drainage.',
    startingPrice: 699,
    estimatedDuration: '2 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: [
      'Exhaust fan & chimney exterior degreasing',
      'Countertop & wall splashback stain removal',
      'Stainless steel sink scrubbing & faucet shine',
      'Cabinet exterior wiping & sanitization'
    ]
  },
  {
    serviceId: 'srv_6',
    name: 'Sofa & Upholstery Care',
    category: 'Specialized',
    description: 'Deep fabric extraction vacuuming, high-foam stain removal shampooing, deodorization, and allergen treatment.',
    startingPrice: 599,
    estimatedDuration: '1.5 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: [
      'Deep high-suction dust & mite vacuuming',
      'Eco shampoo foam scrub & spot stain removal',
      'Fabric deodorization & rapid air dry treatment'
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    bookingId: 'BK-9041',
    customerId: 'cust_curr',
    customerName: 'Rahul Verma',
    customerPhone: '+91 98111 22233',
    serviceId: 'srv_2',
    serviceName: 'Medium Clean',
    servicePrice: 899,
    address: {
      id: 'addr_1',
      label: 'Home',
      street: 'Flat 402, Green Glen Layout',
      locality: 'Bellandur',
      city: 'Bengaluru',
      pincode: '560103',
      landmark: 'Near Central Mall'
    },
    date: '2026-09-09',
    timeSlot: '10:00 AM - 12:00 PM',
    specialInstructions: 'Please pay extra attention to kitchen grease stains.',
    status: 'maid_assigned',
    assignedMaidId: 'maid_101',
    assignedMaidName: 'Sunita Sharma',
    assignedMaidPhone: '+91 98765 43210',
    assignedMaidPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    totalAmount: 899,
    startOtp: '4829',
    createdAt: '2026-09-08 09:30'
  },
  {
    bookingId: 'BK-9038',
    customerId: 'cust_curr',
    customerName: 'Rahul Verma',
    customerPhone: '+91 98111 22233',
    serviceId: 'srv_1',
    serviceName: 'Basic Clean',
    servicePrice: 499,
    address: {
      id: 'addr_1',
      label: 'Home',
      street: 'Flat 402, Green Glen Layout',
      locality: 'Bellandur',
      city: 'Bengaluru',
      pincode: '560103'
    },
    date: '2026-09-02',
    timeSlot: '02:00 PM - 04:00 PM',
    status: 'completed',
    assignedMaidId: 'maid_102',
    assignedMaidName: 'Pooja Devi',
    assignedMaidPhone: '+91 91234 56789',
    assignedMaidPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    paymentMethod: 'pay_on_completion',
    paymentStatus: 'paid',
    totalAmount: 499,
    createdAt: '2026-09-02 08:00',
    completedAt: '2026-09-02 15:30',
    rating: 5,
    review: 'Pooja did a brilliant job! Very polite and punctual.'
  }
];

export const INITIAL_MAID_PROFILE: MaidProfile = {
  uid: 'maid_curr',
  fullName: 'Sunita Sharma',
  phone: '+91 98765 43210',
  email: 'sunita.sharma@example.com',
  photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  idProofUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
  emergencyContact: '+91 98765 00000',
  address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
  bankDetails: {
    accountName: 'Sunita Sharma',
    accountNumber: 'XXXX-XXXX-4829',
    ifscCode: 'SBIN0004821',
    bankName: 'State Bank of India'
  },
  serviceArea: 'Bellandur / HSR Layout',
  serviceRadiusKm: 5,
  healthSafetyDecl: true,
  status: 'pending', // Will flip dynamically in auth state
  isOnline: true,
  rating: 4.8,
  totalRatingsCount: 42,
  completedJobsCount: 56,
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  appliedAt: '2026-09-08'
};
