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

export async function signUpWithProfile(payload: SignUpPayload): Promise<AuthProfile> {
  const { email, password, firstName, lastName } = payload;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) throw signUpError;
  const user = signUpData.user;
  if (!user) throw new Error('No user returned from sign up.');

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: user.id,
      email,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
    }, { onConflict: 'auth_user_id' });

  if (profileError) throw profileError;

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

  // Create a default free profile if missing
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      auth_user_id: userId,
      email: email ?? null,
      plan: 'none',
      trial_ends_at: null,
    }, { onConflict: 'auth_user_id' });

  if (upsertError) throw upsertError;

  return {
    email: email ?? null,
    plan: 'none',
    trial_ends_at: null,
  };
}

export async function signInWithProfile(email: string, password: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

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
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
}




