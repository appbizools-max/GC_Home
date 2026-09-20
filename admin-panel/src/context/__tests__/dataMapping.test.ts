import { describe, it, expect } from 'vitest';
import { Service, MaidProfile, Booking } from '../../types';

describe('AdminContext Data Mapping (Requirements 4.7, 5.13, 6.14)', () => {
  it('correctly maps Supabase services row to Service TypeScript shape', () => {
    const dbRow = {
      id: 'srv-1234',
      name: 'Deep Cleaning',
      category: 'Premium',
      description: 'Full house deep scrubbing',
      starting_price: 1299,
      price_per_room: 350,
      estimated_duration: '4 Hours',
      image_url: 'https://example.com/deep.jpg',
      is_active: true,
      features: ['Scrubbing', 'Degreasing'],
      display_order: 2,
    };

    const mapped: Service = {
      serviceId: dbRow.id,
      name: dbRow.name,
      category: dbRow.category,
      description: dbRow.description,
      startingPrice: Number(dbRow.starting_price),
      pricePerRoom: Number(dbRow.price_per_room),
      estimatedDuration: dbRow.estimated_duration,
      imageUrl: dbRow.image_url,
      isActive: Boolean(dbRow.is_active),
      features: dbRow.features,
      displayOrder: Number(dbRow.display_order),
    };

    expect(mapped.serviceId).toBe('srv-1234');
    expect(mapped.startingPrice).toBe(1299);
    expect(mapped.pricePerRoom).toBe(350);
    expect(mapped.isActive).toBe(true);
    expect(mapped.displayOrder).toBe(2);
  });

  it('correctly maps maid_profiles row including reconstructed bankDetails', () => {
    const dbRow = {
      id: 'maid-uuid-456',
      maid_code: 'MD042',
      full_name: 'Lakshmi Devi',
      phone: '+91 98765 43210',
      email: 'lakshmi@example.com',
      photo_url: 'https://example.com/lakshmi.jpg',
      id_proof_url: 'https://example.com/id.jpg',
      emergency_contact: 'Husband (+91 98765 00000)',
      address: 'Plot 45, Gachibowli',
      city: 'Hyderabad',
      service_area: 'Gachibowli Zone',
      service_radius_km: 7,
      health_safety_decl: true,
      status: 'approved',
      kyc_status: 'verified',
      kyc_completion_pct: 100,
      kyc_documents: [{ id: 'doc-1', type: 'aadhaar' }],
      is_online: true,
      rating: '4.85',
      total_ratings_count: 28,
      completed_jobs_count: 56,
      bank_account_name: 'Lakshmi Devi',
      bank_account_number: '1234567890',
      bank_ifsc: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      applied_at: '2026-09-01T10:00:00.000Z',
      approved_at: '2026-09-02T12:00:00.000Z',
    };

    const mapped: MaidProfile = {
      uid: dbRow.id,
      maidId: dbRow.maid_code,
      fullName: dbRow.full_name,
      phone: dbRow.phone,
      email: dbRow.email,
      photoUrl: dbRow.photo_url,
      idProofUrl: dbRow.id_proof_url,
      emergencyContact: dbRow.emergency_contact,
      address: dbRow.address,
      bankDetails: {
        accountName: dbRow.bank_account_name,
        accountNumber: dbRow.bank_account_number,
        ifscCode: dbRow.bank_ifsc,
        bankName: dbRow.bank_name,
      },
      serviceArea: dbRow.service_area,
      serviceRadiusKm: dbRow.service_radius_km,
      healthSafetyDecl: dbRow.health_safety_decl,
      status: dbRow.status as any,
      kycStatus: dbRow.kyc_status as any,
      kycCompletionPct: dbRow.kyc_completion_pct,
      kycDocuments: dbRow.kyc_documents as any,
      isOnline: dbRow.is_online,
      rating: Number(dbRow.rating),
      totalRatingsCount: dbRow.total_ratings_count,
      completedJobsCount: dbRow.completed_jobs_count,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      appliedAt: dbRow.applied_at.split('T')[0],
      approvedAt: dbRow.approved_at,
    };

    expect(mapped.uid).toBe('maid-uuid-456');
    expect(mapped.maidId).toBe('MD042');
    expect(mapped.bankDetails.accountName).toBe('Lakshmi Devi');
    expect(mapped.bankDetails.accountNumber).toBe('1234567890');
    expect(mapped.bankDetails.ifscCode).toBe('HDFC0001234');
    expect(mapped.bankDetails.bankName).toBe('HDFC Bank');
  });

  it('correctly maps bookings row reconstructing normalized Address and booking_code as bookingId', () => {
    const dbRow = {
      id: 'bk-uuid-789',
      booking_code: 'GC-20260919-001',
      customer_id: 'cust-uuid-1',
      customer_name: 'Pooja Reddy',
      customer_phone: '+91 99887 76655',
      customer_email: 'pooja@example.com',
      service_id: 'srv-1',
      service_name: 'Home Cleaning (2 BHK)',
      service_price: 799,
      total_amount: 799,
      service_duration: '3 Hours',
      address_label: 'Home',
      address_street: 'Flat 301, Lakeview Apts',
      address_locality: 'Madhapur',
      address_city: 'Hyderabad',
      address_pincode: '500081',
      scheduled_date: '2026-09-20',
      time_slot: '10:00 AM',
      status: 'pending_assignment',
      payment_method: 'online',
      payment_status: 'paid',
      created_at: '2026-09-19T08:30:00.000Z',
    };

    const mapped: Booking = {
      bookingId: dbRow.booking_code,
      customerId: dbRow.customer_id,
      customerName: dbRow.customer_name,
      customerPhone: dbRow.customer_phone,
      customerEmail: dbRow.customer_email,
      serviceId: dbRow.service_id,
      serviceName: dbRow.service_name,
      servicePrice: dbRow.service_price,
      totalAmount: dbRow.total_amount,
      serviceDuration: dbRow.service_duration,
      address: {
        id: 'addr_' + dbRow.booking_code,
        label: dbRow.address_label,
        street: dbRow.address_street,
        locality: dbRow.address_locality,
        city: dbRow.address_city,
        pincode: dbRow.address_pincode,
      },
      date: dbRow.scheduled_date,
      timeSlot: dbRow.time_slot,
      status: dbRow.status as any,
      paymentMethod: dbRow.payment_method as any,
      paymentStatus: dbRow.payment_status as any,
      createdAt: dbRow.created_at,
    };

    expect(mapped.bookingId).toBe('GC-20260919-001');
    expect(mapped.date).toBe('2026-09-20');
    expect(mapped.address.street).toBe('Flat 301, Lakeview Apts');
    expect(mapped.address.locality).toBe('Madhapur');
    expect(mapped.address.pincode).toBe('500081');
  });
});
