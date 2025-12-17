import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client before importing - must be inline factory
vi.mock('../../lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: null },
          unsubscribe: vi.fn(),
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        single: vi.fn(),
      })),
      rpc: vi.fn(),
    },
  };
});

import { supabase } from '../../lib/supabaseClient';
import { signUpWithProfile, signInWithProfile, ensureUserProfile, fetchProfile } from '../auth';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUpWithProfile', () => {
    it('should create a new user profile with trial plan', async () => {
      const mockClient = supabase as any;
      
      // Mock: email doesn't exist
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      // Mock: auth signup succeeds
      mockClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock: profile upsert succeeds
      mockClient.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({
          data: {
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            plan: 'trial',
            trial_ends_at: expect.any(String),
          },
          error: null,
        }),
      });

      const result = await signUpWithProfile({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toMatchObject({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        plan: 'trial',
      });
      expect(result.trial_ends_at).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
      const mockClient = supabase as any;
      
      // Mock: email exists
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { email: 'test@example.com', auth_user_id: 'existing-id' },
        }),
      });

      await expect(
        signUpWithProfile({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('An account with this email already exists');
    });

    it('should handle RLS errors gracefully by fetching existing profile', async () => {
      const mockClient = supabase as any;
      
      // Mock: email doesn't exist
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      // Mock: auth signup succeeds
      mockClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock: profile upsert fails with RLS error
      mockClient.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'row-level security policy' },
        }),
      });

      // Mock: fetch existing profile succeeds
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            first_name: 'Test',
            plan: 'trial',
            trial_ends_at: '2025-12-20T00:00:00Z',
          },
        }),
      });

      const result = await signUpWithProfile({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(result).toMatchObject({
        email: 'test@example.com',
        first_name: 'Test',
        plan: 'trial',
      });
    });

    it('should throw friendly error for weak password', async () => {
      const mockClient = supabase as any;
      
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      mockClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Password is too weak' },
      });

      await expect(
        signUpWithProfile({
          email: 'test@example.com',
          password: '123',
        })
      ).rejects.toThrow('Password is too weak');
    });
  });

  describe('signInWithProfile', () => {
    it('should sign in and return user profile', async () => {
      const mockClient = supabase as any;

      // Mock: auth signin succeeds
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-123',
            email: 'test@example.com',
          },
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
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
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            first_name: 'Test',
            plan: 'trial',
            trial_ends_at: '2025-12-20T00:00:00Z',
          },
        }),
      });

      // Mock: ensureUserProfile creates profile if missing
      mockClient.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({
          data: {
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            plan: 'trial',
          },
          error: null,
        }),
      });

      const result = await signInWithProfile('test@example.com', 'password123');

      expect(result).toMatchObject({
        email: 'test@example.com',
        first_name: 'Test',
        plan: 'trial',
      });
    });

    it('should throw friendly error for invalid credentials', async () => {
      const mockClient = supabase as any;

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      await expect(
        signInWithProfile('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw friendly error for unverified email', async () => {
      const mockClient = supabase as any;

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Email not confirmed' },
      });

      await expect(
        signInWithProfile('test@example.com', 'password123')
      ).rejects.toThrow('Please verify your email address');
    });
  });

  describe('ensureUserProfile', () => {
    it('should return existing profile if found', async () => {
      const mockClient = supabase as any;

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            plan: 'trial',
            trial_ends_at: '2025-12-20T00:00:00Z',
          },
        }),
      });

      const result = await ensureUserProfile('auth-user-123', 'test@example.com');

      expect(result).toMatchObject({
        email: 'test@example.com',
        plan: 'trial',
      });
    });

    it('should create default trial profile if missing', async () => {
      const mockClient = supabase as any;

      // Mock: profile not found
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      // Mock: profile creation succeeds
      mockClient.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({
          data: {
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            plan: 'trial',
            trial_ends_at: expect.any(String),
          },
          error: null,
        }),
      });

      const result = await ensureUserProfile('auth-user-123', 'test@example.com');

      expect(result).toMatchObject({
        email: 'test@example.com',
        plan: 'trial',
      });
      expect(result?.trial_ends_at).toBeDefined();
    });
  });

  describe('fetchProfile', () => {
    it('should fetch and return user profile', async () => {
      const mockClient = supabase as any;

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            auth_user_id: 'auth-user-123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            plan: 'pro',
            trial_ends_at: null,
          },
        }),
      });

      const result = await fetchProfile('auth-user-123');

      expect(result).toMatchObject({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        plan: 'pro',
      });
    });

    it('should return null if profile not found', async () => {
      const mockClient = supabase as any;

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      const result = await fetchProfile('auth-user-123');

      expect(result).toBeNull();
    });

    it('should throw error if database query fails', async () => {
      const mockClient = supabase as any;

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      await expect(fetchProfile('auth-user-123')).rejects.toThrow();
    });
  });
});
