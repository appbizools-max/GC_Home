import { Service, MaidProfile, Booking } from '../types';

export const SERVICES_SEED: Service[] = [
  {
    serviceId: '22222222-0001-0000-0000-000000000001',
    name: 'Overhead Tank Cleaning – 500L',
    category: 'Water Tank Cleaning',
    description: 'Deep mechanical scrubbing, high-pressure washing, and UV disinfection for 500L overhead tanks.',
    startingPrice: 499,
    estimatedDuration: '45 mins',
    imageUrl: 'categories/water_tank.jpg',
    isActive: true,
    features: ['Mechanical scrubbing', 'High pressure washing', 'UV Disinfection', 'Sludge extraction']
  },
  {
    serviceId: '22222222-0002-0000-0000-000000000001',
    name: 'Fan Installation',
    category: 'Electrician',
    description: 'Ceiling or wall fan installation, hook mounting, and wiring check.',
    startingPrice: 199,
    estimatedDuration: '30 mins',
    imageUrl: 'services/electrician.jpg',
    isActive: true,
    features: ['Hook mounting', 'Safety check', 'Wiring setup']
  },
  {
    serviceId: '22222222-0003-0000-0000-000000000001',
    name: 'Tap/Faucet Repair',
    category: 'Plumbing',
    description: 'Leaking tap repair, washer replacement, or new mixer tap fitting.',
    startingPrice: 129,
    estimatedDuration: '25 mins',
    imageUrl: 'services/plumbing.jpg',
    isActive: true,
    features: ['Washer replacement', 'Leak fix', 'Pressure check']
  },
  {
    serviceId: '22222222-0005-0000-0000-000000000001',
    name: 'AC General Service',
    category: 'AC Repair & Service',
    description: 'Filter cleaning, cooling coil foam wash, drain tray flushing, and performance check.',
    startingPrice: 399,
    estimatedDuration: '45 mins',
    imageUrl: 'services/ac_service.jpg',
    isActive: true,
    features: ['Coil foam wash', 'Filter cleaning', 'Gas pressure test']
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_MAID_PROFILE: MaidProfile = {
  uid: '',
  fullName: '',
  phone: '',
  email: '',
  photoUrl: '',
  idProofUrl: '',
  emergencyContact: '',
  address: '',
  bankDetails: {
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  },
  serviceArea: 'Hyderabad',
  serviceRadiusKm: 5,
  healthSafetyDecl: true,
  status: 'none' as any,
  isOnline: false,
  rating: 5.0,
  totalRatingsCount: 0,
  completedJobsCount: 0,
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  appliedAt: ''
};
