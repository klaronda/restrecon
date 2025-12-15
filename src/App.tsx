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
import { AuthProfile, signInWithProfile, signOut, signUpWithProfile, fetchProfile, ensureUserProfile } from './services/auth';
import { openCustomerPortal } from './services/payments';
import { fetchPreferences, savePreferences, generateRecap, UserPreferences } from './services/preferences';
import { OnboardingChat } from './components/onboarding-chat';
import { EditProfilePage } from './components/website/edit-profile-page';
import { EditPreferencesPage } from './components/website/edit-preferences-page';

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
    if (planLower === 'pro' || planLower === 'active') return 'active';
    if (planLower === 'trial') return 'trial';
    if (planLower === 'trial_expired' || planLower === 'trialexpired') return 'trial_expired';
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
    if (!profile) {
      throw new Error('Login failed: No profile returned');
    }

    applyProfile(profile, email);

    // Refresh to get latest plan status
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const freshProfile = await fetchProfile(sessionData.session.user.id);
      if (freshProfile) {
        applyProfile(freshProfile, sessionData.session.user.email);
      }
    }
  };

  const handleLogout = async () => {
    resetAuthState();
    try {
      await signOut();
    } catch (err) {
      // Continue anyway
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
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
    
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.user) {
        if (!data.session?.user) resetAuthState();
        profileLoadingRef.current = false;
        return data.session?.user ? subscriptionStatus : 'none';
      }
      
      const session = data.session;
      
      // Use ensureUserProfile which handles fetching, fallback by email, and creation
      const profile = await ensureUserProfile(session.user.id, session.user.email);
      
      if (!profile) {
        if (import.meta.env.DEV) console.warn('[App] refreshProfile: No profile returned');
        profileLoadingRef.current = false;
        return subscriptionStatus;
      }
      
      applyProfile(profile, session.user.email);
      void loadPreferences();
      profileLoadedRef.current = true;
      profileLoadingRef.current = false;
      
      return normalizePlan(profile.plan);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[App] refreshProfile error:', err);
      profileLoadingRef.current = false;
      return subscriptionStatus;
    }
  };

  const loadPreferences = async () => {
    if (prefsLoadingRef.current || prefsLoadedRef.current) {
      console.log('[App] loadPreferences: Already loading or loaded, skipping');
      return;
    }
    prefsLoadingRef.current = true;
    
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[App] loadPreferences: Session error', sessionError);
        prefsLoadingRef.current = false;
        return;
      }
      
      const session = data.session;
      if (!session?.user) {
        console.log('[App] loadPreferences: No session or user');
        prefsLoadingRef.current = false;
        return;
      }

      console.log('[App] loadPreferences: Fetching preferences for user:', {
        userId: session.user.id,
        email: session.user.email
      });

      // First, get the actual user ID from users table
      const { data: userData } = await supabase
        .from('users')
        .select('id, auth_user_id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      const actualUserId = userData?.id || session.user.id;
      console.log('[App] loadPreferences: Using user ID:', { authUserId: session.user.id, actualUserId });

      const prefs = await fetchPreferences(actualUserId, session.user.email ?? undefined);
      if (prefs) {
        console.log('[App] loadPreferences: Successfully loaded preferences');
        setPreferences(prefs);
        prefsLoadedRef.current = true;
      } else {
        console.log('[App] loadPreferences: No preferences found');
      }
    } catch (err) {
      console.error('[App] loadPreferences: Unexpected error', err);
    } finally {
      prefsLoadingRef.current = false;
    }
  };

  /**
   * Saves user preferences and regenerates the preference recap.
   * This should be called whenever user preferences are updated.
   */
  const savePreferencesWithRecap = async (prefs: UserPreferences) => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) return;

    setIsSavingPrefs(true);

    try {
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
      console.log('[App] savePreferencesWithRecap: Saving preferences for userId:', targetUserId);

      // Always regenerate the recap when preferences are updated
      let recap: string | null = null;
      try {
        recap = await generateRecap(targetUserId, prefs);
        console.log('[App] savePreferencesWithRecap: Generated recap:', !!recap);
      } catch (err) {
        console.error('Recap regeneration failed, saving prefs without recap', err);
      }

      // Save preferences with the new recap
      const result = await savePreferences(targetUserId, session.user.email ?? null, prefs, recap ?? undefined);
      console.log('[App] savePreferencesWithRecap: Preferences saved successfully:', !!result);

      // Update local state with new preferences and recap
      setPreferences({ ...prefs, recapText: recap ?? prefs.recapText });

    } catch (err) {
      console.error('Save preferences with recap failed', err);
      throw err; // Re-throw so callers can handle errors
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handlePreferencesComplete = async (prefs: UserPreferences) => {
    await savePreferencesWithRecap(prefs);
  };

  const AccountRoute = () => {
    useEffect(() => {
      const refresh = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) return;
          
          // Ensure profile exists if we have session but no data
          if (!userName && !userEmail && sessionData.session.user) {
            const profile = await ensureUserProfile(sessionData.session.user.id, sessionData.session.user.email);
            if (profile) {
              applyProfile(profile, sessionData.session.user.email);
              setIsLoggedIn(true);
              return;
            }
          }
          
          profileLoadingRef.current = false;
          await refreshProfile();
          
          if (sessionData.session && !isLoggedIn) {
            setIsLoggedIn(true);
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('[App] AccountRoute refresh error:', err);
        }
      };
      
      void refresh();
      void loadPreferences();
    }, []);

    return (
      <AccountPortal 
        userName={userName || 'User'}
        userEmail={userEmail || ''}
        subscriptionStatus={subscriptionStatus}
        trialDaysRemaining={trialDaysRemaining}
        onLogout={handleLogout}
        onManageBilling={handleManageBilling}
        onRefreshStatus={async () => {
          try {
            return await refreshProfile();
          } catch {
            return subscriptionStatus;
          }
        }}
        preferences={preferences}
        onStartPreferences={() => setShowPrefsWizard(true)}
        onProfileUpdated={async () => {
          await refreshProfile();
        }}
        onPreferencesComplete={async (prefs) => {
          await handlePreferencesComplete(prefs);
        }}
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
    let timeoutId: NodeJS.Timeout | null = null;

    const initSession = async () => {
      try {
        // Timeout fallback
        timeoutId = setTimeout(() => {
          if (isMounted) setAuthReady(true);
        }, 5000);
        
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (import.meta.env.DEV) console.error('[App] Session error:', sessionError.message);
          if (timeoutId) clearTimeout(timeoutId);
          setAuthReady(true);
          return;
        }
        
        const session = data.session;
        
        if (session?.user && isMounted) {
          try {
            const profile = await ensureUserProfile(session.user.id, session.user.email);
            if (profile) {
              applyProfile(profile, session.user.email);
            }
          } catch (err) {
            if (import.meta.env.DEV) console.error('[App] Profile error on init:', err);
          }
        } else if (!session && isMounted) {
          resetAuthState();
        }

        // Listen for auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          
          if (session?.user) {
            try {
              const profile = await ensureUserProfile(session.user.id, session.user.email);
              if (profile) {
                applyProfile(profile, session.user.email);
              }
            } catch (err) {
              if (import.meta.env.DEV) console.error('[App] Profile error on auth change:', err);
            }
          } else {
            resetAuthState();
          }
        });
        authSub = listener.subscription;
        
        if (timeoutId) clearTimeout(timeoutId);
        setAuthReady(true);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[App] initSession error:', err);
        if (timeoutId) clearTimeout(timeoutId);
        setAuthReady(true);
      }
    };

    void initSession();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
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
      <Routes>
        {/* Public Routes - Always accessible */}
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
              if (!authReady) {
                return (
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556B2F] mx-auto mb-4"></div>
                      <p className="text-gray-600">Initializing...</p>
                    </div>
                  </div>
                );
              }
              
              const hasUserData = userName || userEmail;
              
              if (!isLoggedIn && !hasUserData) {
                return <Navigate to="/login" replace />;
              }
              
              if (hasUserData && !isLoggedIn) {
                setIsLoggedIn(true);
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
        <Route
          path="/edit-profile"
          element={
            isLoggedIn ? (
              <EditProfilePage
                onLogout={handleLogout}
                currentPreferences={preferences}
                onPreferencesUpdated={savePreferencesWithRecap}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/edit-preferences"
          element={
            isLoggedIn ? (
              <EditPreferencesPage
                userName={userName || 'User'}
                initialPreferences={preferences}
                onComplete={handlePreferencesComplete}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
