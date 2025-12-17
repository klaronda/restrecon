import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the supabase client before importing - must be inline factory
vi.mock('../../../lib/supabaseClient', () => {
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

import { supabase } from '../../../lib/supabaseClient';
import { LoginPage } from '../login-page';

const renderLoginPage = (props = {}) => {
  const defaultProps = {
    onLogin: vi.fn(),
  };
  return render(
    <BrowserRouter>
      <LoginPage {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL
    window.history.pushState({}, '', '/login');
  });

  describe('Session Check', () => {
    it('should show loading state while checking session', () => {
      const mockClient = supabase as any;
      mockClient.auth.getSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderLoginPage();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('should show login form after session check timeout (2s)', async () => {
      const mockClient = supabase as any;
      mockClient.auth.getSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderLoginPage();

      // Should show loading initially
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();

      // Should show form after timeout
      await waitFor(
        () => {
          expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
          expect(screen.getByText('Log In')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should redirect to account if user is already logged in', async () => {
      const mockClient = supabase as any;
      const mockNavigate = vi.fn();

      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token',
            refresh_token: 'refresh',
          },
        },
        error: null,
      });

      // Mock useNavigate
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
        };
      });

      renderLoginPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/account', { replace: true });
      });
    });

    it('should redirect to extension callback if extension login and user logged in', async () => {
      const mockClient = supabase as any;
      const originalLocation = window.location;

      // Mock window.location.href
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      mockClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token-123',
            refresh_token: 'refresh-123',
          },
        },
        error: null,
      });

      // Set URL with extension params
      window.history.pushState(
        {},
        '',
        '/login?extension=true&redirect=chrome-extension://test/callback.html&state=state-123'
      );

      renderLoginPage();

      await waitFor(() => {
        expect(window.location.href).toContain('chrome-extension://test/callback.html');
        expect(window.location.href).toContain('access_token=token-123');
        expect(window.location.href).toContain('refresh_token=refresh-123');
        expect(window.location.href).toContain('state=state-123');
      });

      // Restore window.location
      window.location = originalLocation;
    });
  });

  describe('Login Form', () => {
    it('should display login form with email and password fields', async () => {
      const mockClient = supabase as any;
      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enter mission control/i })).toBeInTheDocument();
      });
    });

    it('should call onLogin when form is submitted with valid credentials', async () => {
      const mockClient = supabase as any;
      const mockOnLogin = vi.fn().mockResolvedValue(undefined);

      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      renderLoginPage({ onLogin: mockOnLogin });

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /enter mission control/i });

      // Fill form
      emailInput.setAttribute('value', 'test@example.com');
      passwordInput.setAttribute('value', 'password123');

      // Submit form
      submitButton.click();

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should display error message when login fails', async () => {
      const mockClient = supabase as any;
      const mockOnLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      renderLoginPage({ onLogin: mockOnLogin });

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /enter mission control/i });
      submitButton.click();

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      const mockClient = supabase as any;
      const mockOnLogin = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      renderLoginPage({ onLogin: mockOnLogin });

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /enter mission control/i });
      submitButton.click();

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Extension Login Flow', () => {
    it('should handle extension login with redirect URL', async () => {
      const mockClient = supabase as any;
      const originalLocation = window.location;

      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      mockClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token-123',
            refresh_token: 'refresh-123',
          },
        },
        error: null,
      });

      // Set URL with extension params
      window.history.pushState(
        {},
        '',
        '/login?extension=true&redirect=chrome-extension://test/callback.html&state=state-123'
      );

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Note: Full extension flow test would require more complex setup
      // This tests that the component renders correctly with extension params

      window.location = originalLocation;
    });
  });
});

