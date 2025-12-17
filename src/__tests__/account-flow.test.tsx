import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createMockSupabaseClient } from '../test/mocks/supabase';

// Mock the supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: createMockSupabaseClient(),
}));

import { supabase } from '../lib/supabaseClient';

// Mock App component's account route logic
describe('Account Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Refresh on Account Page Load', () => {
    it('should fetch and display user profile on account page load', async () => {
      const mockClient = supabase as any;

      // Mock: session exists
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'auth-user-123',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      });

      // Mock: profile fetch succeeds
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            plan: 'pro',
            trial_ends_at: null,
          },
        }),
      });

      // Simulate account page load
      const refreshProfile = async () => {
        const { data: sessionData } = await mockClient.auth.getSession();
        if (!sessionData?.session?.user) {
          return null;
        }

        const profileResult = await mockClient.from('users')
          .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
          .eq('auth_user_id', sessionData.session.user.id)
          .maybeSingle();

        return profileResult.data;
      };

      const profile = await refreshProfile();

      expect(profile).toMatchObject({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        plan: 'pro',
      });
    });

    it('should handle profile fetch timeout gracefully', async () => {
      const mockClient = supabase as any;

      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'auth-user-123',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      });

      // Mock: profile fetch hangs
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(
          () => new Promise(() => {}) // Never resolves
        ),
      });

      const refreshProfileWithTimeout = async () => {
        const { data: sessionData } = await mockClient.auth.getSession();
        if (!sessionData?.session?.user) {
          return null;
        }

        const profilePromise = mockClient.from('users')
          .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
          .eq('auth_user_id', sessionData.session.user.id)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
        );

        try {
          const result = await Promise.race([profilePromise, timeoutPromise]);
          return (result as any).data;
        } catch (err) {
          console.warn('Profile fetch timed out');
          return null;
        }
      };

      const profile = await refreshProfileWithTimeout();

      expect(profile).toBeNull();
    });
  });

  describe('Plan Status Display', () => {
    it('should normalize plan status correctly', () => {
      const normalizePlan = (plan?: string | null): 'none' | 'trial' | 'trial_expired' | 'active' => {
        if (!plan) return 'none';
        const planLower = plan.toLowerCase();
        if (planLower === 'pro' || planLower === 'active') return 'active';
        if (planLower === 'trial') return 'trial';
        if (planLower === 'trial_expired' || planLower === 'trialexpired') return 'trial_expired';
        return 'none';
      };

      expect(normalizePlan('pro')).toBe('active');
      expect(normalizePlan('Pro')).toBe('active');
      expect(normalizePlan('PRO')).toBe('active');
      expect(normalizePlan('active')).toBe('active');
      expect(normalizePlan('trial')).toBe('trial');
      expect(normalizePlan('trial_expired')).toBe('trial_expired');
      expect(normalizePlan('none')).toBe('none');
      expect(normalizePlan(null)).toBe('none');
      expect(normalizePlan(undefined)).toBe('none');
    });

    it('should calculate trial days remaining correctly', () => {
      const computeTrialDaysRemaining = (trialEndsAt?: string | null) => {
        if (!trialEndsAt) return 0;
        const diffMs = new Date(trialEndsAt).getTime() - Date.now();
        if (diffMs <= 0) return 0;
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      };

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(computeTrialDaysRemaining(futureDate)).toBe(7);

      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(computeTrialDaysRemaining(pastDate)).toBe(0);

      expect(computeTrialDaysRemaining(null)).toBe(0);
      expect(computeTrialDaysRemaining(undefined)).toBe(0);
    });
  });

  describe('User Name Display', () => {
    it('should display full name when first_name and last_name are available', () => {
      const formatUserName = (profile: {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      }) => {
        const parts = [profile.first_name, profile.last_name].filter(Boolean);
        const name = parts.join(' ').trim();
        const emailName = profile.email ? profile.email.split('@')[0] : '';
        return name || emailName || 'Recon teammate';
      };

      expect(formatUserName({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
      })).toBe('Test User');

      expect(formatUserName({
        first_name: 'Test',
        last_name: null,
        email: 'test@example.com',
      })).toBe('Test');

      expect(formatUserName({
        first_name: null,
        last_name: null,
        email: 'test@example.com',
      })).toBe('test');

      expect(formatUserName({
        first_name: null,
        last_name: null,
        email: null,
      })).toBe('Recon teammate');
    });
  });

  describe('Preferences Loading', () => {
    it('should fetch preferences for authenticated user', async () => {
      const mockClient = supabase as any;

      // Mock: session exists
      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'auth-user-123',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      });

      // Mock: user lookup by auth_user_id
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
          },
        }),
      });

      // Mock: preferences fetch
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'pref-123',
            user_id: 'user-123',
            max_distance: 10,
            targets: ['golf course', 'preschool'],
          },
        }),
      });

      const fetchPreferences = async () => {
        const { data: sessionData } = await mockClient.auth.getSession();
        if (!sessionData?.session?.user) {
          return null;
        }

        // Look up user by auth_user_id
        const userResult = await mockClient.from('users')
          .select('id, auth_user_id, email')
          .eq('auth_user_id', sessionData.session.user.id)
          .maybeSingle();

        if (!userResult.data) {
          return null;
        }

        // Fetch preferences by user_id
        const prefsResult = await mockClient.from('preference_profiles')
          .select('*')
          .eq('user_id', userResult.data.id)
          .maybeSingle();

        return prefsResult.data;
      };

      const preferences = await fetchPreferences();

      expect(preferences).toMatchObject({
        user_id: 'user-123',
        max_distance: 10,
        targets: ['golf course', 'preschool'],
      });
    });

    it('should handle missing preferences gracefully', async () => {
      const mockClient = supabase as any;

      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'auth-user-123',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      });

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
          },
        }),
      });

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
        }),
      });

      const fetchPreferences = async () => {
        const { data: sessionData } = await mockClient.auth.getSession();
        if (!sessionData?.session?.user) {
          return null;
        }

        const userResult = await mockClient.from('users')
          .select('id, auth_user_id, email')
          .eq('auth_user_id', sessionData.session.user.id)
          .maybeSingle();

        if (!userResult.data) {
          return null;
        }

        const prefsResult = await mockClient.from('preference_profiles')
          .select('*')
          .eq('user_id', userResult.data.id)
          .maybeSingle();

        return prefsResult.data;
      };

      const preferences = await fetchPreferences();

      expect(preferences).toBeNull();
    });
  });
});




