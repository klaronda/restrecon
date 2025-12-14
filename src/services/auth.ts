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
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name, email, plan, trial_ends_at')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  // Create a default trial profile if missing (plan constraint doesn't allow 'none')
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: userId,
      email: email ?? null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
    }, { onConflict: 'auth_user_id' });

  if (upsertError) throw upsertError;

  return {
    email: email ?? null,
    plan: 'trial',
    trial_ends_at: trialEndsAt,
  };
}

// Helper function to get user-friendly login error messages
function getSignInErrorMessage(error: any): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  // Check for specific Supabase error codes
  if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid') && errorMessage.includes('password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  
  if (errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  
  if (errorMessage.includes('User not found')) {
    return 'No account found with this email address. Please sign up instead.';
  }
  
  // Default error message
  return 'Login failed. Please check your credentials and try again.';
}

export async function signInWithProfile(email: string, password: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    const friendlyMessage = getSignInErrorMessage(error);
    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }

  const user = data.user;
  if (!user) return null;

  const profile = await ensureUserProfile(user.id, user.email);
  return profile;
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




