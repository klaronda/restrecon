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
    console.log('[App] applyProfile called with:', {
      profile,
      emailFromSession,
      hasFirstName: !!profile?.first_name,
      hasLastName: !!profile?.last_name,
      plan: profile?.plan,
      planType: typeof profile?.plan
    });
    
    const email = profile?.email ?? emailFromSession ?? '';
    const emailName = email ? email.split('@')[0] : '';
    const parts = [profile?.first_name, profile?.last_name].filter(Boolean);
    const name = parts.join(' ').trim() || emailName || 'Recon teammate';
    
    console.log('[App] Setting user data:', {
      name,
      email,
      plan: profile?.plan,
      normalizedPlan: normalizePlan(profile?.plan),
      firstName: profile?.first_name,
      lastName: profile?.last_name
    });
    
    setUserName(name);
    setUserEmail(email);
    setSubscriptionStatus(normalizePlan(profile?.plan));
    setTrialDaysRemaining(computeTrialDaysRemaining(profile?.trial_ends_at));
    setIsLoggedIn(true);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('[App] handleLogin: Starting login for', email);
      
      // Sign in and get profile
      const profile = await signInWithProfile(email, password);
      if (!profile) {
        throw new Error('Login failed: No profile returned');
      }
      
      console.log('[App] handleLogin: Profile received', { 
        hasProfile: !!profile,
        plan: profile?.plan,
        email: profile?.email 
      });
      
      // Verify session exists
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.error('[App] handleLogin: No session after sign in', sessionError);
        throw new Error('Login failed: Session not established');
      }
      
      console.log('[App] handleLogin: Session verified', { 
        userId: sessionData.session.user.id,
        email: sessionData.session.user.email 
      });
      
      // Apply profile
      applyProfile(profile, email);
      
      // Refresh profile from database to ensure we have the latest plan status
      // This is important in case the plan was updated (e.g., upgraded to pro)
      try {
        if (sessionData?.session?.user) {
          const freshProfile = await fetchProfile(sessionData.session.user.id);
          if (freshProfile) {
            console.log('[App] handleLogin: Refreshed profile after login', { plan: freshProfile.plan });
            applyProfile(freshProfile, sessionData.session.user.email);
          }
        }
      } catch (err) {
        console.warn('[App] handleLogin: Failed to refresh profile after login:', err);
        // Continue with the profile from signInWithProfile
      }
      
      console.log('[App] handleLogin: Login completed successfully');
    } catch (err) {
      console.error('[App] handleLogin: Error during login', err);
      throw err; // Re-throw to let caller handle
    }
  };

  const handleLogout = async () => {
    console.log('[App] handleLogout called');
    
    // Always reset state first
    resetAuthState();
    console.log('[App] Auth state reset');
    
    // Try to sign out (but don't block on errors)
    try {
      await signOut();
      console.log('[App] SignOut completed');
    } catch (err) {
      console.error('[App] SignOut error (continuing anyway):', err);
    }
    
    // Always redirect, even if signOut failed
    if (typeof window !== 'undefined') {
      console.log('[App] Redirecting to home page...');
      window.location.href = '/';
    } else {
      console.error('[App] window is undefined, cannot redirect');
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
    if (profileLoadingRef.current) {
      console.log('[App] refreshProfile: Already loading, skipping');
      return subscriptionStatus;
    }
    profileLoadingRef.current = true;
    
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[App] refreshProfile: Session error', sessionError);
        profileLoadingRef.current = false;
        return subscriptionStatus;
      }
      
      const session = data.session;
      if (!session?.user) {
        console.log('[App] refreshProfile: No session or user');
        resetAuthState();
        profileLoadingRef.current = false;
        return 'none';
      }

      console.log('[App] refreshProfile: Fetching profile for user:', {
        userId: session.user.id,
        email: session.user.email
      });
      
      // Try by auth_user_id first
      let profile = await supabase
        .from('users')
        .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      console.log('[App] refreshProfile: Query by auth_user_id result:', {
        error: profile.error,
        errorMessage: profile.error?.message,
        errorCode: profile.error?.code,
        hasData: !!profile.data,
        data: profile.data
      });
      
      // Debug: Try to see if there are any users at all (for debugging)
      if (!profile.data && !profile.error) {
        const allUsers = await supabase
          .from('users')
          .select('id, auth_user_id, email, plan, first_name, last_name')
          .limit(5);
        console.log('[App] refreshProfile: Sample users in database (for debugging):', {
          count: allUsers.data?.length || 0,
          users: allUsers.data,
          error: allUsers.error
        });
      }

      // If no result, try by email (case-insensitive)
      if (profile.error || !profile.data) {
        const email = session.user.email ?? '';
        if (email) {
          console.log('[App] refreshProfile: Trying fallback query by email:', email);
          
          // Try exact match first
          let emailQuery = await supabase
            .from('users')
            .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
            .eq('email', email)
            .maybeSingle();
          
          console.log('[App] refreshProfile: Exact email query result:', {
            error: emailQuery.error,
            errorMessage: emailQuery.error?.message,
            errorCode: emailQuery.error?.code,
            hasData: !!emailQuery.data,
            data: emailQuery.data
          });
          
          // If still no result, try case-insensitive (PostgreSQL ilike)
          if (!emailQuery.data && !emailQuery.error) {
            console.log('[App] refreshProfile: Trying case-insensitive email query');
            emailQuery = await supabase
              .from('users')
              .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
              .ilike('email', email)
              .maybeSingle();
            
            console.log('[App] refreshProfile: Case-insensitive email query result:', {
              error: emailQuery.error,
              hasData: !!emailQuery.data,
              data: emailQuery.data
            });
          }
          
          // If we got data from email query, use it
          if (emailQuery.data) {
            profile = emailQuery;
            console.log('[App] refreshProfile: Found profile by email!', profile.data);
            
            // If auth_user_id doesn't match, update it
            if (profile.data.auth_user_id !== session.user.id) {
              console.log('[App] refreshProfile: Found profile by email but auth_user_id mismatch. Updating auth_user_id...', {
                currentAuthUserId: profile.data.auth_user_id,
                newAuthUserId: session.user.id,
                profileId: profile.data.id
              });
              
              const updateResult = await supabase
                .from('users')
                .update({ auth_user_id: session.user.id })
                .eq('id', profile.data.id)
                .select()
                .maybeSingle();
              
              if (updateResult.data) {
                console.log('[App] refreshProfile: Successfully updated auth_user_id');
                profile = { data: updateResult.data, error: null };
              } else if (updateResult.error) {
                console.error('[App] refreshProfile: Error updating auth_user_id:', updateResult.error);
                // Continue with the profile data we have, even if update failed
              }
            }
          } else if (emailQuery.error) {
            console.error('[App] refreshProfile: Email query had error:', emailQuery.error);
            profile = emailQuery;
          }
        }
      }

      // If still no result, try by id matching user.id
      if (profile.error || !profile.data) {
        console.log('[App] refreshProfile: Trying fallback query by id:', session.user.id);
        profile = await supabase
          .from('users')
          .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        console.log('[App] refreshProfile: Query by id result:', {
          error: profile.error,
          hasData: !!profile.data,
          data: profile.data
        });
      }

      if (profile.error) {
        console.error('[App] refreshProfile: All profile queries failed', profile.error);
        profileLoadingRef.current = false;
        return subscriptionStatus;
      }

      if (!profile.data) {
        console.warn('[App] refreshProfile: No profile found in database for user:', {
          userId: session.user.id,
          email: session.user.email
        });
        
        // Try to create a profile if it doesn't exist
        // But first, let's try one more time to find by email with more logging
        console.log('[App] refreshProfile: No profile found, attempting final email search...');
        
        // Try multiple query approaches
        let finalEmailSearch = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email ?? '')
          .maybeSingle();
        
        // If that didn't work, try with RPC or different approach
        if (!finalEmailSearch.data && !finalEmailSearch.error) {
          // Try selecting all columns explicitly
          finalEmailSearch = await supabase
            .from('users')
            .select('id, auth_user_id, email, first_name, last_name, plan, trial_ends_at, created_at, updated_at')
            .eq('email', session.user.email ?? '')
            .maybeSingle();
        }
        
        console.log('[App] refreshProfile: Final email search result:', {
          error: finalEmailSearch.error,
          errorDetails: finalEmailSearch.error ? {
            message: finalEmailSearch.error.message,
            code: finalEmailSearch.error.code,
            details: finalEmailSearch.error.details,
            hint: finalEmailSearch.error.hint
          } : null,
          hasData: !!finalEmailSearch.data,
          data: finalEmailSearch.data
        });
        
        // Check if RLS might be blocking - log a warning
        if (!finalEmailSearch.data && !finalEmailSearch.error) {
          console.warn('[App] refreshProfile: Email query returned no data and no error. This might indicate RLS policies are blocking the query.');
          console.warn('[App] refreshProfile: Profile exists in database but cannot be queried. Check RLS policies for users table.');
        }
        
        if (finalEmailSearch.data) {
          console.log('[App] refreshProfile: Found profile in final search!', finalEmailSearch.data);
          profile = finalEmailSearch;
          
          // Update auth_user_id if needed
          if (profile.data.auth_user_id !== session.user.id) {
            console.log('[App] refreshProfile: Updating auth_user_id to match current session...');
            const updateResult = await supabase
              .from('users')
              .update({ auth_user_id: session.user.id })
              .eq('id', profile.data.id)
              .select()
              .maybeSingle();
            
            if (updateResult.data) {
              console.log('[App] refreshProfile: Successfully updated auth_user_id');
              profile = { data: updateResult.data, error: null };
            } else if (updateResult.error) {
              console.error('[App] refreshProfile: Error updating auth_user_id:', updateResult.error);
              // Continue with existing profile data even if update fails
            }
          }
        } else {
          // Only create if we truly don't have a profile
          console.log('[App] refreshProfile: No profile found, attempting to create...');
          try {
            // Try 'trial' instead of 'none' as it might be a valid plan value
            // Don't set 'id' - let the database auto-generate it
            const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const createResult = await supabase
              .from('users')
              .insert({
                auth_user_id: session.user.id,
                email: session.user.email ?? null,
                plan: 'trial',
                trial_ends_at: trialEndsAt,
                first_name: null,
                last_name: null,
              })
              .select()
              .maybeSingle();
            
            if (createResult.error) {
              console.error('[App] refreshProfile: Error creating profile:', createResult.error);
              // If it's a duplicate key error, try fetching again by auth_user_id
              if (createResult.error.code === '23505') {
                console.log('[App] refreshProfile: Profile already exists (duplicate key), fetching again...');
                profile = await supabase
                  .from('users')
                  .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
                  .eq('auth_user_id', session.user.id)
                  .maybeSingle();
                
                if (profile.data) {
                  console.log('[App] refreshProfile: Successfully fetched after duplicate key error:', profile.data);
                } else if (profile.error) {
                  console.error('[App] refreshProfile: Error fetching after duplicate key:', profile.error);
                } else {
                  console.warn('[App] refreshProfile: No profile found after duplicate key error - RLS may be blocking query');
                }
              } else {
                profileLoadingRef.current = false;
                return subscriptionStatus;
              }
            } else if (createResult.data) {
              console.log('[App] refreshProfile: Successfully created new profile:', createResult.data);
              profile = { data: createResult.data, error: null };
            } else {
              profileLoadingRef.current = false;
              return subscriptionStatus;
            }
          } catch (createErr) {
            console.error('[App] refreshProfile: Error in create profile attempt:', createErr);
            profileLoadingRef.current = false;
            return subscriptionStatus;
          }
        }
      }

      // Check if we have valid profile data before accessing properties
      if (!profile.data) {
        console.error('[App] refreshProfile: No profile data available after all queries');
        profileLoadingRef.current = false;
        return subscriptionStatus;
      }

      console.log('[App] refreshProfile: Successfully fetched profile:', {
        id: profile.data.id,
        auth_user_id: profile.data.auth_user_id,
        plan: profile.data.plan,
        planType: typeof profile.data.plan,
        firstName: profile.data.first_name,
        lastName: profile.data.last_name,
        email: profile.data.email,
        trial_ends_at: profile.data.trial_ends_at
      });

      // Ensure we have the full profile data before applying
      if (!profile.data.first_name && !profile.data.last_name) {
        console.warn('[App] refreshProfile: Profile missing first_name and last_name, but continuing...');
      }
      
      applyProfile(profile.data, session.user.email);
      void loadPreferences(); // keep prefs current
      profileLoadedRef.current = true;
      profileLoadingRef.current = false;
      
      const normalizedPlan = normalizePlan(profile.data.plan);
      console.log('[App] refreshProfile: Normalized plan:', {
        raw: profile.data.plan,
        normalized: normalizedPlan,
        willShowAs: normalizedPlan === 'active' ? 'pro' : normalizedPlan
      });
      
      return normalizedPlan;
    } catch (err) {
      console.error('[App] refreshProfile: Unexpected error', err);
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
    console.log('[App] handlePreferencesComplete: Saving preferences for userId:', targetUserId);

    let recap: string | null = null;
    try {
      recap = await generateRecap(targetUserId, prefs);
      console.log('[App] handlePreferencesComplete: Generated recap:', !!recap);
    } catch (err) {
      console.error('Recap failed, saving prefs without recap', err);
    }
    try {
      const result = await savePreferences(targetUserId, session.user.email ?? null, prefs, recap ?? undefined);
      console.log('[App] handlePreferencesComplete: Preferences saved successfully:', !!result);
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
          // Force refresh by resetting the loading flag
          profileLoadingRef.current = false;
          const status = await refreshProfile();
          console.log('[App] AccountRoute: Profile refreshed, status:', status);
          
          // If still showing wrong data, try one more time after a short delay
          if (userName === 'klaronda' || subscriptionStatus === 'none') {
            console.log('[App] AccountRoute: Data still incorrect, retrying after delay...');
            setTimeout(async () => {
              profileLoadingRef.current = false;
              await refreshProfile();
            }, 1000);
          }
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
    let timeoutId: NodeJS.Timeout | null = null;

    const initSession = async () => {
      try {
        console.log('[App] Initializing session...');
        
        // Set a timeout to ensure authReady is set even if something hangs
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('[App] Auth initialization timeout - setting authReady to true anyway');
            setAuthReady(true);
          }
        }, 5000); // 5 second timeout
        
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[App] Error getting session:', sessionError);
          if (timeoutId) clearTimeout(timeoutId);
          setAuthReady(true); // Still set ready so app can render
          return;
        }
        
        const session = data.session;
        console.log('[App] Initial session check:', { hasSession: !!session, userId: session?.user?.id });
        
        if (session?.user && isMounted) {
          try {
            console.log('[App] Ensuring profile exists for user:', session.user.id);
            // Use ensureUserProfile which will create a profile if it doesn't exist
            const profileTimeout = new Promise<AuthProfile | null>((_, reject) => 
              setTimeout(() => reject(new Error('Profile ensure timeout')), 3000)
            );
            
            const profile = await Promise.race([
              ensureUserProfile(session.user.id, session.user.email),
              profileTimeout
            ]);
            
            if (profile) {
              console.log('[App] Profile ensured/loaded:', {
                hasData: !!profile,
                plan: profile?.plan,
                firstName: profile?.first_name,
                lastName: profile?.last_name,
                email: profile?.email
              });
              applyProfile(profile, session.user.email);
            } else {
              console.warn('[App] Profile ensure returned null');
            }
          } catch (profileErr) {
            console.error('[App] Error ensuring profile on init:', profileErr);
            // Continue anyway - don't block the app
          }
        } else if (!session && isMounted) {
          console.log('[App] No initial session found');
          resetAuthState();
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          console.log('[App] Auth state changed:', event, { hasSession: !!session, userId: session?.user?.id });
          if (session?.user) {
            try {
              console.log('[App] Auth state change - ensuring profile for user:', session.user.id);
              // Use ensureUserProfile which will create a profile if it doesn't exist
              const profile = await ensureUserProfile(session.user.id, session.user.email);
              if (profile) {
                console.log('[App] Profile ensured on auth state change:', {
                  plan: profile.plan,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  email: profile.email
                });
                applyProfile(profile, session.user.email);
              } else {
                console.warn('[App] Profile ensure returned null on auth state change');
                resetAuthState();
              }
            } catch (profileErr) {
              console.error('[App] Error in auth state change handler:', profileErr);
              // Don't reset auth state on error - might be temporary
            }
          } else {
            console.log('[App] No session, resetting auth state');
            resetAuthState();
          }
        });
        authSub = listener.subscription;
        
        if (timeoutId) clearTimeout(timeoutId);
        setAuthReady(true);
        console.log('[App] Auth initialization complete, authReady set to true');
      } catch (err) {
        console.error('[App] Error in initSession:', err);
        if (timeoutId) clearTimeout(timeoutId);
        setAuthReady(true); // Still set ready so app can render
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
              console.log('[App] Account route check:', { 
                isLoggedIn, 
                authReady, 
                showPrefsWizard,
                userName,
                subscriptionStatus 
              });
              
              if (!authReady) {
                console.log('[App] Auth not ready, showing loading');
                return (
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#556B2F] mx-auto mb-4"></div>
                      <p className="text-gray-600">Initializing...</p>
                    </div>
                  </div>
                );
              }
              
              // Check if we have user data (profile was loaded) - this indicates a valid session
              // This prevents redirect loops when isLoggedIn state hasn't updated yet
              const hasUserData = userName || userEmail;
              
              if (!isLoggedIn && !hasUserData) {
                console.log('[App] Not logged in and no user data, redirecting to login');
                return <Navigate to="/login" replace />;
              }
              
              // If we have user data but isLoggedIn is false, it's likely a state sync issue
              // Set isLoggedIn to true to fix the state
              if (hasUserData && !isLoggedIn) {
                console.log('[App] User data exists but isLoggedIn is false, fixing state');
                setIsLoggedIn(true);
              }
              
              if (showPrefsWizard) {
                console.log('[App] Showing preferences wizard');
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
              
              console.log('[App] Rendering AccountRoute');
              try {
                return <AccountRoute />;
              } catch (err) {
                console.error('[App] Error rendering AccountRoute:', err);
                return (
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
                    <div className="text-center max-w-md">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Account</h1>
                      <p className="text-gray-600 mb-4">There was an error loading your account page.</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28]"
                      >
                        Reload Page
                      </button>
                    </div>
                  </div>
                );
              }
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
    </Router>
  );
}

export default App;
