import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ code?: string; status?: string; original?: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const isDevMode = import.meta.env.DEV;

  // Check if this is an extension login
  const isExtension = searchParams.get('extension') === 'true';
  const redirectUrl = searchParams.get('redirect');
  const stateToken = searchParams.get('state');

  // Check if user is already logged in (for both extension and normal flow)
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const checkExistingSession = async () => {
      try {
        console.log('[login-page] Starting session check', {
          isExtension,
          hasRedirectUrl: !!redirectUrl,
          hasStateToken: !!stateToken,
          supabaseInitialized: !!supabase
        });

        // Add timeout fallback to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('[login-page] Session check timeout (3s), showing login form');
            setCheckingSession(false);
          }
        }, 3000); // Increased to 3s for better reliability

        // Race the session check with the timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        console.log('[login-page] Racing session check with timeout');

        let sessionResult;
        try {
          sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
          console.log('[login-page] Session check completed', {
            hasSession: !!(sessionResult as any)?.data?.session,
            hasError: !!(sessionResult as any)?.error
          });
        } catch (raceErr) {
          // Timeout won the race
          console.warn('[login-page] Session check timed out, showing login form', raceErr);
          if (isMounted) {
            setCheckingSession(false);
          }
          return;
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!isMounted) return;
        
        const { data: { session }, error: sessionError } = sessionResult as any;
        
        if (session && !sessionError) {
          // User is already logged in
          if (isExtension && redirectUrl) {
            // EXTENSION FLOW: Even if already logged in, show the login form
            // This allows the extension to get its own session/authentication
            console.log('[login-page] User already logged in, but showing login form for extension auth');
            setCheckingSession(false);
          } else {
            // NORMAL FLOW: User is already logged in, redirect to account
            console.log('[login-page] User already logged in, redirecting to account');
            navigate('/account');
            return;
          }
        } else {
          // Not logged in, show login form
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('[login-page] Error checking session:', err);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };
    
    checkExistingSession();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isExtension, redirectUrl, stateToken, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    if (!email || !password) return;
    try {
      setIsLoading(true);
      
      // If extension login, sign in directly to get session immediately
      if (isExtension && redirectUrl) {
        console.log('[login-page] Starting extension login flow', {
          email: email.substring(0, 3) + '...',
          hasRedirectUrl: !!redirectUrl,
          redirectUrl: redirectUrl.substring(0, 50) + '...'
        });

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('[login-page] Extension login result', {
          hasData: !!signInData,
          hasSession: !!signInData?.session,
          hasError: !!signInError,
          errorMessage: signInError?.message?.substring(0, 50)
        });
        
        if (signInError) {
          // Log detailed error for extension login
          console.error('[login-page] Extension login error:', {
            errorMessage: signInError.message,
            errorCode: signInError.code,
            errorStatus: signInError.status,
            fullError: isDevMode ? signInError : undefined
          });
          
          // Use the same error message mapping as normal login
          const errorCode = signInError.code || '';
          const errorMessage = signInError.message || '';
          
          let friendlyMessage = 'Login failed. Please check your credentials and try again.';
          
          if (errorCode === 'email_provider_disabled' || errorMessage.includes('Email logins are disabled')) {
            friendlyMessage = 'Email authentication is currently disabled. Please contact support or use a different login method.';
          } else if (errorCode === 'invalid_credentials' || errorCode === 'invalid_grant' ||
              errorMessage.toLowerCase().includes('invalid login credentials') ||
              (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('password'))) {
            friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (errorCode === 'email_not_confirmed' || errorMessage.includes('Email not confirmed') || errorMessage.includes('email not confirmed')) {
            friendlyMessage = 'Please verify your email address before logging in.';
          } else if (errorCode === 'too_many_requests' || errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
            friendlyMessage = 'Too many login attempts. Please wait a moment and try again.';
          } else if (errorCode === 'user_not_found' || errorMessage.includes('User not found')) {
            friendlyMessage = 'No account found with this email address. Please sign up instead.';
          }
          
          setError(isDevMode ? `[DEV] ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}` : friendlyMessage);
          setErrorDetails({
            code: errorCode,
            status: signInError.status,
            original: isDevMode ? signInError : undefined
          });
          setIsLoading(false);
          return;
        }
        
        // Get session from sign-in response
        const session = signInData?.session;
        if (!session) {
          setError('Login succeeded but session was not created. Please try again.');
          setIsLoading(false);
          return;
        }
        
        // Also call onLogin to update app state
        try {
          await onLogin(email, password);
        } catch (err) {
          // Ignore errors from onLogin - we already have the session
          console.warn('[login-page] onLogin had error but continuing with extension redirect:', err);
        }
        
        // Redirect to extension callback with tokens
        console.log('[login-page] Redirecting to extension callback', { 
          hasAccessToken: !!session.access_token,
          hasRefreshToken: !!session.refresh_token,
          accessTokenLength: session.access_token?.length || 0,
          refreshTokenLength: session.refresh_token?.length || 0,
          redirectUrl 
        });
        
        try {
          // Manually construct URL for chrome-extension:// protocol
          // Use hash fragments instead of query params for better compatibility
          let finalUrl = redirectUrl;
          const hashParams = new URLSearchParams();
          hashParams.set('access_token', session.access_token);
          hashParams.set('refresh_token', session.refresh_token);
          if (stateToken) {
            hashParams.set('state', stateToken);
          }

          // Append hash fragment
          const hashString = hashParams.toString();
          if (redirectUrl.includes('#')) {
            finalUrl += `&${hashString}`;
          } else {
            finalUrl += `#${hashString}`;
          }

          console.log('[login-page] Final callback URL', {
            finalUrl: finalUrl.substring(0, 150) + '...',
            urlLength: finalUrl.length,
            hasAccessToken: hashParams.has('access_token'),
            hasRefreshToken: hashParams.has('refresh_token'),
            hasState: hashParams.has('state'),
            isChromeExtensionUrl: finalUrl.startsWith('chrome-extension://')
          });

          // For Chrome extension URLs, try opening in a new window/tab first
          // If that fails, fall back to direct location change
          if (finalUrl.startsWith('chrome-extension://')) {
            console.log('[login-page] Attempting Chrome extension redirect');

            try {
              // Try opening in new window (this might work better for extensions)
              const newWindow = window.open(finalUrl, '_blank');
              if (newWindow) {
                console.log('[login-page] Opened extension callback in new window');
                // Don't close current window - let user close the callback window manually
                setIsLoading(false);
                setError(null); // Clear any previous errors
                // The callback window will handle the success message
                return;
              } else {
                console.warn('[login-page] window.open failed, trying direct redirect');
              }
            } catch (windowErr) {
              console.warn('[login-page] window.open error:', windowErr);
            }
          }

          // Fallback: direct location change
          console.log('[login-page] Using direct location redirect');

          // Add a fallback timeout in case redirect fails
          const redirectTimeout = setTimeout(() => {
            console.error('[login-page] Redirect timeout - redirect may have failed');
            setError('Redirect to extension failed. Please try refreshing the extension popup.');
            setIsLoading(false);
          }, 5000); // Increased timeout for extension redirects

          // Attempt redirect
          window.location.href = finalUrl;

          // Clear timeout if redirect starts (this won't execute if redirect succeeds)
          setTimeout(() => clearTimeout(redirectTimeout), 100);
        } catch (urlErr) {
          console.error('[login-page] Error constructing callback URL:', urlErr);
          setError('Failed to construct callback URL. Please try again.');
          setIsLoading(false);
        }
        return;
      }
      
      // Normal login flow (not extension)
      await onLogin(email, password);
      navigate('/account');
    } catch (err: any) {
      // Error messages are now user-friendly from auth.ts
      const errorMessage = err?.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      
      // Store error details for debugging
      setErrorDetails({
        code: err?.errorCode || err?.code,
        status: err?.status || err?.errorStatus,
        original: isDevMode ? err?.originalError : undefined
      });
      
      // Log full error details for debugging
      console.error('[login-page] Login error:', {
        message: errorMessage,
        errorCode: err?.errorCode || err?.code,
        errorStatus: err?.status || err?.errorStatus,
        errorType: err?.errorType,
        originalError: err?.originalError,
        fullError: err
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session (with timeout fallback)
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#556B2F]/5 via-white to-[#D6C9A2]/10 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556B2F] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-gray-400 text-sm mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#556B2F]/5 via-white to-[#D6C9A2]/10 flex items-center justify-center p-6">
      <div className="max-w-md w-full relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-2">
            <img 
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
              alt="Rover" 
              className="w-12 h-12"
            />
            <span className="text-gray-900 text-2xl">NestRecon</span>
          </Link>
          <p className="text-gray-600">
            {isExtension ? 'Sign in to unlock your NestRecon extension' : 'Welcome back, Commander'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 relative">
          <h1 className="text-gray-900 mb-2">Log In</h1>
          <p className="text-gray-600 text-sm mb-8">
            Enter Mission Control
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/20 focus:border-[#556B2F]"
                placeholder="alex@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/20 focus:border-[#556B2F] pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <a href="#" className="text-sm text-[#556B2F] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#556B2F] text-white px-6 py-4 rounded-lg hover:bg-[#4a5e28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Enter Mission Control'}
            </button>
            {error && (
              <div className="space-y-2">
                <p className="text-sm text-red-600 text-center">{error}</p>
                {isDevMode && errorDetails && (
                  <div className="text-xs text-gray-500 text-center space-y-1 p-2 bg-gray-50 rounded border border-gray-200">
                    <p><strong>Debug Info:</strong></p>
                    {errorDetails.code && <p>Error Code: {errorDetails.code}</p>}
                    {errorDetails.status && <p>Status: {errorDetails.status}</p>}
                    {errorDetails.original && (
                      <details className="mt-2 text-left">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Show original error</summary>
                        <pre className="mt-1 text-xs overflow-auto max-h-32 p-2 bg-gray-100 rounded">
                          {JSON.stringify(errorDetails.original, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-[#556B2F] hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Tactical Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#556B2F]/20" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#556B2F]/20" />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}