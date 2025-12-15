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

// Helper function to get user-friendly signup error messages
function getSignUpErrorMessage(error: any): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
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
  
  return errorMessage || 'Unable to create account. Please try again.';
}

// Helper function to get user-friendly login error messages
function getSignInErrorMessage(error: any): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  if (errorCode === 'email_provider_disabled' || errorMessage.includes('Email logins are disabled')) {
    return 'Email authentication is currently disabled. Please contact support.';
  }
  
  if (errorCode === 'invalid_credentials' || errorCode === 'invalid_grant' || 
      errorMessage.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorCode === 'email_not_confirmed' || errorMessage.includes('Email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  
  if (errorCode === 'too_many_requests' || errorMessage.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  
  if (errorCode === 'user_not_found' || errorMessage.includes('User not found')) {
    return 'No account found with this email address. Please sign up instead.';
  }
  
  if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
    return 'Access denied. Please contact support if this issue persists.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return 'Connection error. Please check your internet connection and try again.';
  }
  
  return 'Login failed. Please check your credentials and try again.';
}

export async function signUpWithProfile(payload: SignUpPayload): Promise<AuthProfile> {
  const { email, password, firstName, lastName } = payload;

  // Check if email already exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('email')
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
    throw new Error(getSignUpErrorMessage(signUpError));
  }
  
  const user = signUpData.user;
  if (!user) throw new Error('No user returned from sign up.');

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Create profile
  await supabase.from('users').upsert({
    auth_user_id: user.id,
    email,
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    plan: 'trial',
    trial_ends_at: trialEndsAt,
  }, { onConflict: 'auth_user_id' });

  return {
    first_name: firstName ?? null,
    last_name: lastName ?? null,
    email,
    plan: 'trial',
    trial_ends_at: trialEndsAt,
  };
}

/**
 * Ensures a user profile exists. Fetches by auth_user_id first, then email, creates if missing.
 */
export async function ensureUserProfile(userId: string, email?: string | null): Promise<AuthProfile | null> {
  console.log('[auth] ensureUserProfile called', { userId, hasEmail: !!email });

  // Step 1: Try by auth_user_id
  console.log('[auth] Step 1: Querying by auth_user_id');
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  console.log('[auth] Step 1 result', { hasData: !!data, hasError: !!error });

  if (data) {
    console.log('[auth] Found profile by auth_user_id');
    return data;
  }

  if (error) {
    console.error('[auth] ensureUserProfile: Query error', error);
  }

  // Step 2: Fallback - try by email
  if (email) {
    console.log('[auth] Step 2: Querying by email');
    const { data: emailData, error: emailError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
      .eq('email', email)
      .maybeSingle();

    console.log('[auth] Step 2 result', { hasEmailData: !!emailData, hasEmailError: !!emailError });

    if (emailData) {
      console.log('[auth] Found profile by email, updating auth_user_id if needed');
      // Update auth_user_id if it doesn't match
      if (emailData.auth_user_id !== userId) {
        console.log('[auth] Updating auth_user_id');
        await supabase.from('users').update({ auth_user_id: userId }).eq('id', emailData.id);
        emailData.auth_user_id = userId;
      }
      return emailData;
    }
  }

  // Step 3: Create new profile
  console.log('[auth] Step 3: Creating new profile');
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  console.log('[auth] Trial ends at:', trialEndsAt);

  const { data: created, error: createError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: userId,
      email: email ?? null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
    }, { onConflict: 'auth_user_id' })
    .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
    .maybeSingle();

  console.log('[auth] Step 3 result', { hasCreated: !!created, hasCreateError: !!createError });

  if (created) {
    console.log('[auth] Profile created successfully');
    return created;
  }

  // Handle duplicate key - profile was created by another request
  console.log('[auth] Handling create error', { code: createError?.code, message: createError?.message });
  if (createError?.code === '23505') {
    console.log('[auth] Duplicate key error, retrying fetch');
    const { data: retry } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, plan, trial_ends_at, auth_user_id')
      .eq('email', email ?? '')
      .maybeSingle();
    
    if (retry) {
      if (retry.auth_user_id !== userId) {
        await supabase.from('users').update({ auth_user_id: userId }).eq('id', retry.id);
      }
      return retry;
    }
  }

  if (createError && import.meta.env.DEV) {
    console.error('[auth] ensureUserProfile: Create error', createError.message);
  }

  // Return minimal profile if all else fails
  return { email: email ?? null, plan: 'trial', trial_ends_at: trialEndsAt };
}

export async function signInWithProfile(email: string, password: string): Promise<AuthProfile | null> {
  console.log('[auth] signInWithProfile called');
  // Authenticate
  console.log('[auth] Calling supabase.auth.signInWithPassword');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log('[auth] Supabase auth result', { hasData: !!data, hasError: !!error, hasUser: !!data?.user });

  if (error) {
    console.error('[auth] Supabase auth error:', error);
    const friendlyMessage = getSignInErrorMessage(error);
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).errorCode = error.code;
    (enhancedError as any).errorStatus = error.status;
    throw enhancedError;
  }

  const user = data.user;
  if (!user) return null;

  console.log('[auth] User authenticated, calling ensureUserProfile');
  // Fetch or create profile
  try {
    const profile = await ensureUserProfile(user.id, user.email);
    console.log('[auth] ensureUserProfile completed', { hasProfile: !!profile });
    return profile;
  } catch (profileError: any) {
    console.error('[auth] signInWithProfile: Profile error', profileError.message);
    if (import.meta.env.DEV) {
      console.error('[auth] Full profile error:', profileError);
    }
    throw new Error('Unable to load your profile. Please try again or contact support.');
  }
}

export async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name, email, plan, trial_ends_at')
    .eq('auth_user_id', userId)
    .maybeSingle();
    
  if (error && import.meta.env.DEV) {
    console.error('[auth] fetchProfile error:', error.message);
  }
  
  return data;
}

export async function updateProfile(firstName: string | null, lastName: string | null): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('users')
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
    })
    .eq('auth_user_id', user.id);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[auth] updateProfile error:', error.message);
    }
    throw new Error('Failed to update profile. Please try again.');
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[auth] updatePassword error:', error.message);
    }
    
    // Provide user-friendly error messages
    if (error.message.includes('same') || error.message.includes('identical')) {
      throw new Error('New password must be different from your current password.');
    }
    if (error.message.includes('weak') || error.message.includes('too short')) {
      throw new Error('Password is too weak. Please use a stronger password.');
    }
    
    throw new Error('Failed to update password. Please try again.');
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[auth] signOut error:', err);
    }
  }
}
