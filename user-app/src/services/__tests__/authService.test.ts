import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../authService';

describe('AuthService Flow Tests', () => {
  beforeEach(async () => {
    await authService.logout();
  });

  it('sends OTP for a valid phone number', async () => {
    const res = await authService.sendOtp('+91 98492 01824');
    expect(res.success).toBe(true);
    expect(res.debugOtp).toBe('749216');
  });

  it('fails OTP request for an invalid short phone number', async () => {
    await expect(authService.sendOtp('12345')).rejects.toThrow();
  });

  it('verifies valid 6-digit OTP code', async () => {
    await authService.sendOtp('+91 98492 01824');
    const verifyRes = await authService.verifyOtp('+91 98492 01824', '749216');
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.token).toBeDefined();
  });

  it('rejects incorrect OTP code', async () => {
    await authService.sendOtp('+91 98492 01824');
    await expect(authService.verifyOtp('+91 98492 01824', '000000')).rejects.toThrow(
      'Incorrect OTP. Please check the code and try again.'
    );
  });

  it('creates and completes user profile successfully', async () => {
    const phone = '+91 98765 00000';
    const profileRes = await authService.createProfile(
      {
        name: 'Rohan Sharma',
        email: 'rohan@gmail.com',
        city: 'Bengaluru, Karnataka',
        address: '123, 4th Cross, HSR Layout',
      },
      phone
    );

    expect(profileRes.success).toBe(true);
    expect(profileRes.user.name).toBe('Rohan Sharma');
    expect(profileRes.user.phone).toBe(phone);

    const session = await authService.getCurrentUser();
    expect(session.user?.name).toBe('Rohan Sharma');
    expect(session.onboardingCompleted).toBe(true);
  });
});
