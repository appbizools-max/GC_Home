import { Service, MaidProfile, Booking } from '../types';

export const ADMIN_SERVICES_SEED: Service[] = [
  {
    serviceId: 'srv_1',
    name: 'Basic Clean',
    category: 'Standard',
    description: 'Essential dusting, floor sweeping & mopping, trash disposal, and surface wiping.',
    startingPrice: 499,
    pricePerRoom: 150,
    estimatedDuration: '1.5 - 2 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: ['Sweeping & Mopping', 'Dusting', 'Trash removal', 'Basic bathroom wipe']
  },
  {
    serviceId: 'srv_2',
    name: 'Medium Clean',
    category: 'Standard',
    description: 'Deep kitchen counter scrub, detailed bathroom cleaning, interior window glass wiping.',
    startingPrice: 899,
    pricePerRoom: 250,
    estimatedDuration: '2.5 - 3 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: ['All Basic Clean features', 'Tile scrubbing', 'Kitchen sink degrease', 'Window glass wipe']
  },
  {
    serviceId: 'srv_3',
    name: 'Deep Clean',
    category: 'Premium',
    description: 'Comprehensive chemical scrubbing, heavy appliance exterior degreasing, furniture vacuuming.',
    startingPrice: 1499,
    pricePerRoom: 400,
    estimatedDuration: '4 - 5 hrs',
    imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: ['All Medium Clean features', 'Upholstery vacuuming', 'Hard water stain treatment', 'Cabinet interior clean']
  },
  {
    serviceId: 'srv_4',
    name: 'Bathroom Deep Clean',
    category: 'Specialized',
    description: 'Specialized hard water stain removal, shower partition glass polishing, and floor tile scrubbing.',
    startingPrice: 399,
    estimatedDuration: '1 hr',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    isActive: true,
    features: ['Hard water scale removal', 'Mirror & glass polish', 'Grout line dis-infection']
  }
];

export const ADMIN_MAIDS_SEED: MaidProfile[] = [
  {
    uid: 'maid_101',
    fullName: 'Sunita Sharma',
    phone: '+91 98765 43210',
    email: 'sunita.sharma@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    idProofUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    emergencyContact: '+91 98765 00000',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    bankDetails: {
      accountName: 'Sunita Sharma',
      accountNumber: '12345678904829',
      ifscCode: 'SBIN0004821',
      bankName: 'State Bank of India'
    },
    serviceArea: 'Bellandur / HSR Layout',
    serviceRadiusKm: 5,
    healthSafetyDecl: true,
    status: 'approved',
    isOnline: true,
    rating: 4.8,
    totalRatingsCount: 42,
    completedJobsCount: 56,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    appliedAt: '2026-08-10',
    approvedAt: '2026-08-11'
  },
  {
    uid: 'maid_102',
    fullName: 'Pooja Devi',
    phone: '+91 91234 56789',
    email: 'pooja.d@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    idProofUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    emergencyContact: '+91 91234 00000',
    address: 'House 12, Koramangala 4th Block, Bengaluru',
    bankDetails: {
      accountName: 'Pooja Devi',
      accountNumber: '98765432109128',
      ifscCode: 'HDFC0001928',
      bankName: 'HDFC Bank'
    },
    serviceArea: 'Koramangala',
    serviceRadiusKm: 7,
    healthSafetyDecl: true,
    status: 'approved',
    isOnline: true,
    rating: 4.9,
    totalRatingsCount: 88,
    completedJobsCount: 110,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    appliedAt: '2026-07-15',
    approvedAt: '2026-07-16'
  },
  {
    uid: 'maid_103',
    fullName: 'Lakshmi Narayan',
    phone: '+91 99887 76655',
    email: 'lakshmi.n@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
    idProofUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    emergencyContact: '+91 99887 00000',
    address: 'Sector 3, HSR Layout, Bengaluru',
    bankDetails: {
      accountName: 'Lakshmi Narayan',
      accountNumber: '55667788993341',
      ifscCode: 'ICIC0003341',
      bankName: 'ICICI Bank'
    },
    serviceArea: 'HSR Layout',
    serviceRadiusKm: 4,
    healthSafetyDecl: true,
    status: 'pending',
    isOnline: false,
    rating: 0,
    totalRatingsCount: 0,
    completedJobsCount: 0,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    appliedAt: '2026-09-08'
  }
];

export const ADMIN_BOOKINGS_SEED: Booking[] = [
  {
    bookingId: 'BK-9041',
    customerId: 'cust_201',
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
      pincode: '560103'
    },
    date: '2026-09-09',
    timeSlot: '10:00 AM - 12:00 PM',
    specialInstructions: 'Please focus on kitchen grease stains.',
    status: 'maid_assigned',
    assignedMaidId: 'maid_101',
    assignedMaidName: 'Sunita Sharma',
    assignedMaidPhone: '+91 98765 43210',
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
    totalAmount: 899,
    createdAt: '2026-09-08 09:30'
  },
  {
    bookingId: 'BK-9042',
    customerId: 'cust_202',
    customerName: 'Ananya Roy',
    customerPhone: '+91 97444 55566',
    serviceId: 'srv_3',
    serviceName: 'Deep Clean',
    servicePrice: 1499,
    address: {
      id: 'addr_2',
      label: 'Home',
      street: 'Villa 14, Palm Meadows',
      locality: 'Whitefield',
      city: 'Bengaluru',
      pincode: '560066'
    },
    date: '2026-09-09',
    timeSlot: '02:00 PM - 05:00 PM',
    status: 'pending_assignment',
    paymentMethod: 'Card',
    paymentStatus: 'paid',
    totalAmount: 1499,
    createdAt: '2026-09-08 11:15'
  },
  {
    bookingId: 'BK-9038',
    customerId: 'cust_203',
    customerName: 'Vikram Seth',
    customerPhone: '+91 96333 22211',
    serviceId: 'srv_1',
    serviceName: 'Basic Clean',
    servicePrice: 499,
    address: {
      id: 'addr_3',
      label: 'Office',
      street: '3rd Floor, Prestige Meridian',
      locality: 'MG Road',
      city: 'Bengaluru',
      pincode: '560001'
    },
    date: '2026-09-07',
    timeSlot: '11:00 AM - 01:00 PM',
    status: 'completed',
    assignedMaidId: 'maid_102',
    assignedMaidName: 'Pooja Devi',
    assignedMaidPhone: '+91 91234 56789',
    paymentMethod: 'Pay on Completion',
    paymentStatus: 'paid',
    totalAmount: 499,
    createdAt: '2026-09-07 08:00',
    completedAt: '2026-09-07 12:45'
  }
];
