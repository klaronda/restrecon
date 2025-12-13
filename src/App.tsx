import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { LandingPage } from './components/website/landing-page';
import { SignUpPage } from './components/website/signup-page';
import { LoginPage } from './components/website/login-page';
import { AccountPortal } from './components/website/account-portal';
import { BillingPlanPage } from './components/website/billing-plan-page';
import { TrialEndedScreen } from './components/website/trial-ended-screen';
import { SuccessPage } from './components/success-page';
import { PricingPage } from './components/website/pricing-page';
import { FAQPage } from './components/website/faq-page';
import { PrivacyPolicyPage } from './components/website/privacy-policy-page';
import { TermsOfServicePage } from './components/website/terms-of-service-page';
import { supabase } from './lib/supabaseClient';
import { AuthProfile, signInWithProfile, signOut, signUpWithProfile, fetchProfile } from './services/auth';
import { openCustomerPortal } from './services/payments';
import { fetchPreferences, savePreferences, generateRecap, UserPreferences } from './services/preferences';
import { OnboardingChat } from './components/onboarding-chat';

type SubscriptionStatus = 'none' | 'trial' | 'trial_expired' | 'active' | 'cancelled';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('none');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showPrefsWizard, setShowPrefsWizard] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const profileLoadedRef = useRef(false);
  const prefsLoadedRef = useRef(false);
  const profileLoadingRef = useRef(false);
  const prefsLoadingRef = useRef(false);

  const normalizePlan = (plan?: string | null): SubscriptionStatus => {
    if (!plan) return 'none';
    const planLower = plan.toLowerCase();
    if (planLower === 'pro' || planLower === 'active') {
      console.log('[App] Normalized plan to active:', plan);
      return 'active';
    }
    if (planLower === 'trial') return 'trial';
    if (planLower === 'trial_expired' || planLower === 'trialexpired') return 'trial_expired';
    console.log('[App] Unknown plan value, defaulting to none:', plan);
    return 'none';
  };

  const computeTrialDaysRemaining = (trialEndsAt?: string | null) => {
    if (!trialEndsAt) return 0;
    const diffMs = new Date(trialEndsAt).getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const resetAuthState = () => {
    setIsLoggedIn(false);
    setSubscriptionStatus('none');
    setUserName('');
    setUserEmail('');
    setTrialDaysRemaining(0);
  };

  const applyProfile = (profile: AuthProfile | null, emailFromSession?: string | null) => {
    const email = profile?.email ?? emailFromSession ?? '';
    const emailName = email ? email.split('@')[0] : '';
    const parts = [profile?.first_name, profile?.last_name].filter(Boolean);
    const name = parts.join(' ').trim() || emailName || 'Recon teammate';
    setUserName(name);
    setUserEmail(email);
    setSubscriptionStatus(normalizePlan(profile?.plan));
    setTrialDaysRemaining(computeTrialDaysRemaining(profile?.trial_ends_at));
    setIsLoggedIn(true);
  };

  const handleLogin = async (email: string, password: string) => {
    const profile = await signInWithProfile(email, password);
    applyProfile(profile, email);
    
    // Refresh profile from database to ensure we have the latest plan status
    // This is important in case the plan was updated (e.g., upgraded to pro)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const freshProfile = await fetchProfile(sessionData.session.user.id);
        if (freshProfile) {
          console.log('[App] Refreshed profile after login', { plan: freshProfile.plan });
          applyProfile(freshProfile, sessionData.session.user.email);
        }
      }
    } catch (err) {
      console.warn('[App] Failed to refresh profile after login:', err);
      // Continue with the profile from signInWithProfile
    }
  };

  const handleLogout = async () => {
    try {
      console.log('[App] Starting logout...');
      await signOut();
      console.log('[App] SignOut completed');
    } catch (err) {
      console.error('[App] Logout failed', err);
      // Continue with logout even if signOut fails
    }
    
    // Always reset state and redirect, even if signOut had errors
    resetAuthState();
    
    // Clear any stored session data
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.warn('[App] Additional signOut attempt failed:', err);
    }
    
    if (typeof window !== 'undefined') {
      // Use replace to prevent back button from going back to logged-in state
      window.location.replace('/');
    }
  };

  const handleSignUp = async (params: { firstName: string; lastName: string; email: string; password: string }) => {
    const profile = await signUpWithProfile({
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
    });
    applyProfile(profile, params.email);
  };

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    setSubscriptionStatus('active');
  };

  const handleManageBilling = () => {
    try {
      openCustomerPortal();
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined') {
        window.alert('Set VITE_STRIPE_PORTAL_URL to enable billing management.');
      }
    }
  };

  const refreshProfile = async (): Promise<SubscriptionStatus> => {
    if (profileLoadingRef.current) return subscriptionStatus;
    profileLoadingRef.current = true;
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.user) {
      const profile = await supabase
        .from('users')
        .select('first_name, last_name, email, plan, trial_ends_at')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (profile.error) {
        console.error('Profile fetch error', profile.error);
        profileLoadingRef.current = false;
        return subscriptionStatus;
      }

      if (!profile.data) {
        // Fallback: try matching by email in case the auth_user_id differs
        const email = session.user.email ?? '';
        if (email) {
          const byEmail = await supabase
            .from('users')
            .select('first_name, last_name, email, plan, trial_ends_at')
            .eq('email', email)
            .maybeSingle();
          if (byEmail.error) {
            console.error('Profile fetch by email error', byEmail.error);
            profileLoadingRef.current = false;
            return subscriptionStatus;
          }
          if (byEmail.data) {
            applyProfile(byEmail.data, session.user.email);
            profileLoadedRef.current = true;
            profileLoadingRef.current = false;
            return normalizePlan(byEmail.data.plan);
          }
        }
        console.warn('No profile row for user', session.user.id);
        profileLoadingRef.current = false;
        return subscriptionStatus;
      }

      applyProfile(profile.data, session.user.email);
      void loadPreferences(); // keep prefs current
      profileLoadedRef.current = true;
      profileLoadingRef.current = false;
      return normalizePlan(profile.data.plan);
    }
    resetAuthState();
    profileLoadingRef.current = false;
    return 'none';
  };

  const loadPreferences = async () => {
    if (prefsLoadingRef.current || prefsLoadedRef.current) return;
    prefsLoadingRef.current = true;
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.user) {
      const prefs = await fetchPreferences(session.user.id, session.user.email ?? undefined);
      if (prefs) {
        setPreferences(prefs);
        prefsLoadedRef.current = true;
      }
      prefsLoadingRef.current = false;
      return;
    }
    prefsLoadingRef.current = false;
  };

  const handlePreferencesComplete = async (prefs: UserPreferences) => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) return;
    setIsSavingPrefs(true);

    const ensureUser = async () => {
      const authId = session.user.id;
      // Try by auth_user_id
      const byAuth = await supabase
        .from('users')
        .select('id, auth_user_id')
        .eq('auth_user_id', authId)
        .maybeSingle();
      if (byAuth.data?.id) return byAuth.data.id as string;

      // Try by email
      const byEmail = await supabase
        .from('users')
        .select('id, auth_user_id')
        .eq('email', session.user.email ?? '')
        .maybeSingle();
      if (byEmail.data?.id) return byEmail.data.id as string;

      // Upsert with id and auth_user_id the same to satisfy FK
      const insert = await supabase
        .from('users')
        .upsert(
          {
            id: authId,
            auth_user_id: authId,
            email: session.user.email ?? null,
            plan: 'none',
            trial_ends_at: null,
          },
          { onConflict: 'id' }
        )
        .select('id')
        .maybeSingle();

      if (insert.data?.id) return insert.data.id as string;
      return authId;
    };

    const targetUserId = await ensureUser();

    let recap: string | null = null;
    try {
      recap = await generateRecap(targetUserId, prefs);
    } catch (err) {
      console.error('Recap failed, saving prefs without recap', err);
    }
    try {
      await savePreferences(targetUserId, session.user.email ?? null, prefs, recap ?? undefined);
      setPreferences({ ...prefs, recapText: recap ?? prefs.recapText });
    } catch (err) {
      console.error('Save preferences failed', err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const AccountRoute = () => {
    useEffect(() => {
      // Refresh profile on mount to ensure we have the latest plan status
      console.log('[App] AccountRoute: Component mounted, refreshing profile');
      console.log('[App] AccountRoute: Current state', { 
        isLoggedIn, 
        userName, 
        subscriptionStatus,
        authReady 
      });
      
      const refresh = async () => {
        try {
          const status = await refreshProfile();
          console.log('[App] AccountRoute: Profile refreshed, status:', status);
        } catch (err) {
          console.error('[App] AccountRoute: Error refreshing profile:', err);
        }
      };
      
      void refresh();
      void loadPreferences();
    }, []);

    // Show account page even if some data is missing
    return (
      <AccountPortal 
        userName={userName || 'User'}
        userEmail={userEmail || ''}
        subscriptionStatus={subscriptionStatus}
        trialDaysRemaining={trialDaysRemaining}
        onLogout={handleLogout}
        onManageBilling={handleManageBilling}
        onRefreshStatus={async () => {
          console.log('[App] AccountRoute: Manual profile refresh triggered');
          try {
            const status = await refreshProfile();
            console.log('[App] AccountRoute: Manual refresh complete, status:', status);
            return status;
          } catch (err) {
            console.error('[App] AccountRoute: Error in manual refresh:', err);
            return subscriptionStatus;
          }
        }}
        preferences={preferences}
        onStartPreferences={() => setShowPrefsWizard(true)}
      />
    );
  };

  const SuccessRoute = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'checking' | 'pro' | 'notpro' | 'error' | 'login'>('checking');

    useEffect(() => {
      void (async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const session = data.session;
          if (!session?.user) {
            setStatus('login');
            return;
          }

          // Poll for plan flip for up to ~20s
          let attempts = 0;
          let plan: SubscriptionStatus = 'none';
          while (attempts < 10) {
            plan = await refreshProfile();
            if (plan === 'active') break;
            attempts += 1;
            await new Promise((res) => setTimeout(res, 2000));
          }

          if (plan === 'active') {
            setStatus('pro');
          } else {
            setStatus('notpro');
          }
        } catch (err) {
          console.error(err);
          setStatus('error');
        }
      })();
    }, []);

    if (status === 'pro') {
      return (
        <SuccessPage
          onOpenApp={() => navigate('/account')}
          onManageBilling={handleManageBilling}
        />
      );
    }

    if (status === 'login') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center max-w-md">
            <p className="text-gray-900 mb-3">Please log in to finalize your upgrade.</p>
            <p className="text-sm text-gray-600 mb-4">
              After logging in, we&apos;ll confirm your Pro status automatically.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
              Log in
            </button>
          </div>
        </div>
      );
    }

    const message =
      status === 'checking'
        ? 'Verifying your upgrade…'
        : 'Payment received. Finalizing your upgrade—please refresh if this persists.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center max-w-md">
          <p className="text-gray-900 mb-3">{message}</p>
          <p className="text-sm text-gray-600 mb-4">
            If this takes more than a minute, contact support with your checkout email.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
          >
            Refresh
          </button>
          <div className="mt-3">
            <button
              onClick={() => navigate('/account')}
              className="text-sm text-[#556B2F] hover:underline"
            >
              Go to Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    let isMounted = true;
    let authSub: { unsubscribe: () => void } | null = null;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user && isMounted) {
        const profile = await supabase
          .from('users')
          .select('first_name, last_name, email, plan, trial_ends_at')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        if (profile.error) {
          console.error(profile.error);
        } else {
          applyProfile(profile.data, session.user.email);
        }
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        console.log('[App] Auth state changed:', event, { hasSession: !!session, userId: session?.user?.id });
        if (session?.user) {
          const profile = await supabase
            .from('users')
            .select('first_name, last_name, email, plan, trial_ends_at')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();
          if (profile.error) {
            console.error('[App] Profile fetch error on auth state change:', profile.error);
            resetAuthState();
          } else {
            console.log('[App] Applying profile from auth state change:', { plan: profile.data?.plan, email: profile.data?.email });
            applyProfile(profile.data, session.user.email);
          }
        } else {
          console.log('[App] No session, resetting auth state');
          resetAuthState();
        }
      });
      authSub = listener.subscription;
      setAuthReady(true);
    };

    void initSession();

    return () => {
      isMounted = false;
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  return (
    <Router>
      {isSavingPrefs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg px-6 py-4 border border-gray-200">
            <p className="text-gray-900 font-medium">Saving your mission-critical preferences…</p>
            <p className="text-gray-600 text-sm mt-1">This should only take a moment.</p>
          </div>
        </div>
      )}
      {authReady ? (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
        <Route 
          path="/signup" 
          element={
            isLoggedIn ? (
              <Navigate to="/account" replace />
            ) : (
              <SignUpPage onSignUp={handleSignUp} />
            )
          } 
        />
        <Route 
          path="/login" 
          element={<LoginPage onLogin={handleLogin} />}
        />

        {/* Protected Routes */}
        <Route 
          path="/account" 
          element={
            (() => {
              console.log('[App] Account route check:', { isLoggedIn, authReady, showPrefsWizard });
              if (!authReady) {
                return (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556B2F] mx-auto mb-4"></div>
                      <p className="text-gray-600">Initializing...</p>
                    </div>
                  </div>
                );
              }
              if (!isLoggedIn) {
                console.log('[App] Not logged in, redirecting to login');
                return <Navigate to="/login" replace />;
              }
              if (showPrefsWizard) {
                return (
                  <OnboardingChat
                    userName={userName}
                    initialPreferences={preferences}
                    onComplete={(p) => {
                      void handlePreferencesComplete(p);
                      setShowPrefsWizard(false);
                    }}
                    onExit={() => setShowPrefsWizard(false)}
                  />
                );
              }
              return <AccountRoute />;
            })()
          } 
        />
        <Route 
          path="/billing" 
          element={
            isLoggedIn ? (
              <BillingPlanPage 
                currentPlan={subscriptionStatus}
                onUpgrade={handleUpgrade}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/trial-ended" 
          element={
            isLoggedIn && subscriptionStatus === 'trial_expired' ? (
              <TrialEndedScreen onUpgrade={() => setSubscriptionStatus('active')} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/success" 
          element={<SuccessRoute />} 
        />
        <Route 
          path="/pricing" 
          element={<PricingPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} 
        />
        <Route 
          path="/faq" 
          element={<FAQPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} 
        />
        <Route 
          path="/privacy" 
          element={<PrivacyPolicyPage isLoggedIn={isLoggedIn} />} 
        />
        <Route 
          path="/terms" 
          element={<TermsOfServicePage isLoggedIn={isLoggedIn} />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556B2F] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
