import { supabase } from '../lib/supabaseClient';

export type PlanType = 'none' | 'trial' | 'trial_expired' | 'pro';

export type AuthProfile = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  plan?: PlanType | null;
  trial_ends_at?: string | null;
};

type SignUpPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

const TRIAL_DAYS = 7;

// Helper function to get user-friendly error messages
function getSignUpErrorMessage(error: any): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  // Check for specific Supabase error codes
  if (errorCode === '23505' || errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  
  if (errorMessage.includes('Password') && (errorMessage.includes('weak') || errorMessage.includes('too short'))) {
    return 'Password is too weak. Please use a stronger password (at least 6 characters).';
  }
  
  if (errorMessage.includes('Invalid email') || errorMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
    return 'Unable to create account. Please try again or contact support.';
  }
  
  // Default error message
  return errorMessage || 'Unable to create account. Please try again.';
}

export async function signUpWithProfile(payload: SignUpPayload): Promise<AuthProfile> {
  const { email, password, firstName, lastName } = payload;

  // Check if email exists in users table before attempting signup
  const { data: existingProfile } = await supabase
    .from('users')
    .select('email, auth_user_id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    throw new Error('An account with this email already exists. Please log in instead.');
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (signUpError) {
    const friendlyMessage = getSignUpErrorMessage(signUpError);
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).originalError = signUpError;
    throw enhancedError;
  }
  
  const user = signUpData.user;
  if (!user) throw new Error('No user returned from sign up.');

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Try to upsert profile, but handle RLS errors gracefully
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: user.id,
      email,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
    }, { onConflict: 'auth_user_id' });

  // If RLS error, try to fetch existing profile
  if (profileError) {
    if (profileError.message?.includes('row-level security') || profileError.message?.includes('policy')) {
      // Profile might already exist, try to fetch it
      const { data: existingProfileData } = await supabase
        .from('users')
        .select('first_name, last_name, email, plan, trial_ends_at')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (existingProfileData) {
        return existingProfileData;
      }
    }
    
    // If we can't recover, throw a friendly error
    const friendlyMessage = getSignUpErrorMessage(profileError);
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).originalError = profileError;
    throw enhancedError;
  }

  return {
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    email,
    plan: 'trial',
    trial_ends_at: trialEndsAt,
  };
}

export async function ensureUserProfile(userId: string, email?: string | null): Promise<AuthProfile | null> {
  const isDevMode = import.meta.env.DEV;
  
  console.log('[auth] ensureUserProfile: Starting', {
    userId,
    email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'none',
    queryingBy: 'auth_user_id'
  });
  
  // Step 1: Try querying by auth_user_id
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[auth] ensureUserProfile: Query by auth_user_id failed', {
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      userId,
      isRLSError: error.message?.includes('row-level security') || error.message?.includes('policy')
    });
    
    // If RLS error and we have email, try fallback query by email
    if ((error.message?.includes('row-level security') || error.message?.includes('policy')) && email) {
      console.log('[auth] ensureUserProfile: RLS error detected, trying fallback query by email');
      return await ensureUserProfileByEmail(userId, email);
    }
    
    throw error;
  }
  
  if (data) {
    console.log('[auth] ensureUserProfile: Profile found by auth_user_id', {
      profileId: data.id,
      email: data.email,
      plan: data.plan,
      authUserIdMatches: data.auth_user_id === userId
    });
    return data;
  }

  // Step 2: No profile found by auth_user_id, try querying by email as fallback
  if (email) {
    console.log('[auth] ensureUserProfile: No profile by auth_user_id, trying email fallback', {
      email: `${email.substring(0, 3)}***@${email.split('@')[1]}`
    });
    const profileByEmail = await ensureUserProfileByEmail(userId, email);
    if (profileByEmail) {
      return profileByEmail;
    }
  }

  // Step 3: No profile exists, create a default trial profile
  console.log('[auth] ensureUserProfile: No profile found, creating new trial profile', {
    userId,
    email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'none'
  });
  
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: createdData, error: upsertError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: userId,
      email: email ?? null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
    }, { onConflict: 'auth_user_id' })
    .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
    .maybeSingle();

  if (upsertError) {
    // Handle duplicate key error - profile might exist with different auth_user_id
    if (upsertError.code === '23505' || upsertError.message?.includes('duplicate key')) {
      console.log('[auth] ensureUserProfile: Duplicate key error, profile likely exists with different auth_user_id', {
        errorCode: upsertError.code,
        constraint: upsertError.message?.includes('email') ? 'email' : 'unknown'
      });
      
      // If it's an email constraint violation, try to fetch by email and update auth_user_id
      if (email && (upsertError.message?.includes('email') || upsertError.message?.includes('users_email_key'))) {
        console.log('[auth] ensureUserProfile: Email constraint violation, fetching by email to update auth_user_id');
        const emailProfile = await ensureUserProfileByEmail(userId, email);
        if (emailProfile) {
          return emailProfile;
        }
      }
      
      // Try one more time to fetch by auth_user_id (might have been created in the meantime)
      const { data: retryData } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (retryData) {
        console.log('[auth] ensureUserProfile: Found profile on retry after duplicate key error');
        return retryData;
      }
      
      // If still not found, try by email one more time
      if (email) {
        const { data: emailRetryData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
          .eq('email', email)
          .maybeSingle();
        
        if (emailRetryData) {
          console.log('[auth] ensureUserProfile: Found profile by email after duplicate key error, updating auth_user_id');
          // Update auth_user_id to match
          await supabase
            .from('users')
            .update({ auth_user_id: userId })
            .eq('id', emailRetryData.id);
          emailRetryData.auth_user_id = userId;
          return emailRetryData;
        }
      }
    }
    
    console.error('[auth] ensureUserProfile: Failed to create profile', {
      errorMessage: upsertError.message,
      errorCode: upsertError.code,
      errorDetails: upsertError.details,
      userId,
      isRLSError: upsertError.message?.includes('row-level security') || upsertError.message?.includes('policy')
    });
    throw upsertError;
  }

  if (createdData) {
    console.log('[auth] ensureUserProfile: Profile created successfully', {
      profileId: createdData.id,
      email: createdData.email,
      plan: createdData.plan
    });
    return createdData;
  }

  console.warn('[auth] ensureUserProfile: Profile creation returned no data');
  return {
    email: email ?? null,
    plan: 'trial',
    trial_ends_at: trialEndsAt,
  };
}

// Helper function to query profile by email and update auth_user_id if needed
async function ensureUserProfileByEmail(userId: string, email: string): Promise<AuthProfile | null> {
  const isDevMode = import.meta.env.DEV;
  
  console.log('[auth] ensureUserProfileByEmail: Querying by email', {
    email: `${email.substring(0, 3)}***@${email.split('@')[1]}`,
    userId
  });
  
  // Try exact email match first
  let { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
    .eq('email', email)
    .maybeSingle();

  // If no exact match, try case-insensitive
  if (!data && !error) {
    console.log('[auth] ensureUserProfileByEmail: No exact match, trying case-insensitive');
    const caseInsensitiveQuery = await supabase
      .from('users')
      .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
      .ilike('email', email)
      .maybeSingle();
    
    data = caseInsensitiveQuery.data;
    error = caseInsensitiveQuery.error;
  }

  if (error) {
    console.error('[auth] ensureUserProfileByEmail: Query by email failed', {
      errorMessage: error.message,
      errorCode: error.code,
      email: `${email.substring(0, 3)}***@${email.split('@')[1]}`
    });
    return null;
  }

  if (data) {
    console.log('[auth] ensureUserProfileByEmail: Profile found by email', {
      profileId: data.id,
      email: data.email,
      currentAuthUserId: data.auth_user_id,
      expectedAuthUserId: userId,
      needsUpdate: data.auth_user_id !== userId
    });
    
    // If auth_user_id doesn't match, update it
    if (data.auth_user_id !== userId) {
      console.log('[auth] ensureUserProfileByEmail: Updating auth_user_id to match session', {
        oldAuthUserId: data.auth_user_id,
        newAuthUserId: userId
      });
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_user_id: userId })
        .eq('id', data.id);
      
      if (updateError) {
        console.error('[auth] ensureUserProfileByEmail: Failed to update auth_user_id', {
          errorMessage: updateError.message,
          errorCode: updateError.code,
          profileId: data.id
        });
        // Continue anyway - return the profile even if update failed
      } else {
        console.log('[auth] ensureUserProfileByEmail: Successfully updated auth_user_id');
        // Update the returned data with the new auth_user_id
        data.auth_user_id = userId;
      }
    }
    
    return data;
  }

  console.log('[auth] ensureUserProfileByEmail: No profile found by email');
  return null;
}

// Helper function to get user-friendly login error messages
function getSignInErrorMessage(error: any, isDevMode: boolean = false): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  const errorStatus = error?.status || '';
  
  // In development mode, show actual error for debugging
  if (isDevMode && errorMessage) {
    return `[DEV] ${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}${errorStatus ? ` (Status: ${errorStatus})` : ''}`;
  }
  
  // Check for exact Supabase error codes
  if (errorCode === 'email_provider_disabled' || errorMessage.includes('Email logins are disabled')) {
    return 'Email authentication is currently disabled. Please contact support or use a different login method.';
  }
  
  if (errorCode === 'invalid_credentials' || errorCode === 'invalid_grant') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorCode === 'email_not_confirmed' || errorMessage.includes('Email not confirmed') || errorMessage.includes('email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  
  if (errorCode === 'too_many_requests' || errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  
  if (errorCode === 'user_not_found' || errorMessage.includes('User not found')) {
    return 'No account found with this email address. Please sign up instead.';
  }
  
  // Check for RLS policy errors
  if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
    return 'Access denied. Please contact support if this issue persists.';
  }
  
  // Check for database connection errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return 'Connection error. Please check your internet connection and try again.';
  }
  
  // Check for invalid credentials (case-insensitive)
  if (errorMessage.toLowerCase().includes('invalid login credentials') || 
      (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('password'))) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  // Default error message
  return 'Login failed. Please check your credentials and try again.';
}

export async function signInWithProfile(email: string, password: string): Promise<AuthProfile | null> {
  const isDevMode = import.meta.env.DEV;
  const maskedEmail = email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'unknown';
  
  console.log('[auth] signInWithProfile: Starting login attempt', {
    email: maskedEmail,
    hasPassword: !!password,
    passwordLength: password.length
  });
  
  // Step 1: Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    // Log detailed error information
    console.error('[auth] signInWithProfile: Authentication failed', {
      errorMessage: error.message,
      errorCode: error.code,
      errorStatus: error.status,
      email: maskedEmail,
      fullError: isDevMode ? error : undefined
    });
    
    const friendlyMessage = getSignInErrorMessage(error, isDevMode);
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).errorCode = error.code;
    (enhancedError as any).errorStatus = error.status;
    throw enhancedError;
  }

  const user = data.user;
  if (!user) {
    console.error('[auth] signInWithProfile: Auth succeeded but no user returned', {
      hasData: !!data,
      hasSession: !!data.session,
      email: maskedEmail
    });
    return null;
  }

  console.log('[auth] signInWithProfile: Authentication succeeded', {
    userId: user.id,
    email: user.email,
    emailConfirmed: user.email_confirmed_at ? 'yes' : 'no'
  });

  // Step 2: Fetch or create user profile
  try {
    const profile = await ensureUserProfile(user.id, user.email);
    
    if (profile) {
      console.log('[auth] signInWithProfile: Profile lookup succeeded', {
        userId: user.id,
        hasProfile: !!profile,
        plan: profile.plan,
        email: profile.email
      });
    } else {
      console.warn('[auth] signInWithProfile: Profile lookup returned null', {
        userId: user.id
      });
    }
    
    return profile;
  } catch (profileError: any) {
    // Log detailed profile error information
    console.error('[auth] signInWithProfile: Profile lookup failed', {
      userId: user.id,
      email: user.email,
      errorMessage: profileError?.message,
      errorCode: profileError?.code,
      errorStatus: profileError?.status,
      fullError: isDevMode ? profileError : undefined
    });
    
    // If auth succeeded but profile lookup failed, provide specific error
    const profileErrorMessage = profileError?.message || 'Unknown profile error';
    const isRLSError = profileErrorMessage.includes('row-level security') || 
                       profileErrorMessage.includes('RLS') || 
                       profileErrorMessage.includes('policy');
    
    if (isRLSError) {
      const enhancedError = new Error('Profile access denied. Please contact support.');
      (enhancedError as any).originalError = profileError;
      (enhancedError as any).errorCode = profileError?.code;
      (enhancedError as any).errorType = 'profile_lookup';
      throw enhancedError;
    }
    
    // Re-throw with enhanced error info
    const friendlyMessage = isDevMode 
      ? `[DEV] Profile lookup failed: ${profileErrorMessage}`
      : 'Unable to load your profile. Please try again or contact support.';
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).originalError = profileError;
    (enhancedError as any).errorCode = profileError?.code;
    (enhancedError as any).errorType = 'profile_lookup';
    throw enhancedError;
  }
}

export async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name, email, plan, trial_ends_at')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[auth] Error fetching profile:', error);
    throw error;
  }
  if (data) {
    console.log('[auth] Fetched profile:', { userId, plan: data.plan, email: data.email });
  }
  return data;
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      console.error('[auth] signOut error:', error);
      // Don't throw - let the caller handle redirect
    } else {
      console.log('[auth] signOut successful');
    }
  } catch (err) {
    console.error('[auth] signOut exception:', err);
    // Don't throw - let the caller handle redirect
  }
}




