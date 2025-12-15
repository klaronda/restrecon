import { supabase } from '../lib/supabaseClient';

export type PreferenceTag = {
  label: string;
};

export type PreferenceToggles = {
  walkScore?: boolean;
  bikeScore?: boolean;
  transitScore?: boolean;
  airQuality?: boolean;
  soundScore?: boolean;
  stargazeScore?: boolean;
};

export type UserPreferences = {
  tags: PreferenceTag[];           // user-defined points of interest
  toggles: PreferenceToggles;      // importance of mobility signals
  freeformInput?: string;          // initial freeform description
  otherPreferences?: string;       // catch-all notes
  recapText?: string;              // mission-grade recap (cached)
  updatedAt?: string;
};

export async function fetchPreferences(userId: string, email?: string): Promise<UserPreferences | null> {
  console.log('[fetchPreferences] Starting fetch:', { userId, email, hasEmail: !!email });
  
  const selectCols = 'id, user_id, preferences, summary_text, updated_at, email';

  const mapRow = (row: any): UserPreferences | null => {
    if (!row) return null;
    const prefs = (row as any).preferences ?? (row as any).preferences_json ?? {};
    return {
      ...(prefs as UserPreferences),
      recapText: row.summary_text ?? (prefs as any).recapText,
      updatedAt: row.updated_at,
    };
  };

  // First, try to get the actual user ID from the users table
  let actualUserId = userId;
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, auth_user_id, email')
      .eq('auth_user_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('[fetchPreferences] Error fetching user:', userError);
    } else if (userData?.id) {
      actualUserId = userData.id;
      console.log('[fetchPreferences] Found user ID:', { authUserId: userId, actualUserId: userData.id });
    } else {
      console.warn('[fetchPreferences] No user found for auth_user_id:', userId);
    }
  } catch (err) {
    console.error('[fetchPreferences] Exception fetching user:', err);
  }

  // Try querying by user_id (the actual users.id, not auth_user_id)
  let { data, error } = await supabase
    .from('preference_profiles')
    .select(selectCols)
    .eq('user_id', actualUserId)
    .maybeSingle();

  console.log('[fetchPreferences] Query by user_id result:', {
    userId: actualUserId,
    hasData: !!data,
    hasError: !!error,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    } : null
  });

  // If no data and no error, might be RLS blocking - try with auth_user_id as fallback
  if (!data && !error) {
    console.log('[fetchPreferences] No data and no error - trying with auth_user_id as fallback');
    const fallbackQuery = await supabase
      .from('preference_profiles')
      .select(selectCols)
      .eq('user_id', userId) // Try original userId
      .maybeSingle();
    
    if (fallbackQuery.data) {
      data = fallbackQuery.data;
      console.log('[fetchPreferences] Found data with fallback query');
    } else if (fallbackQuery.error) {
      error = fallbackQuery.error;
      console.error('[fetchPreferences] Fallback query error:', fallbackQuery.error);
    }
  }

  // Try by email if still no data
  if ((!data || error) && email) {
    console.log('[fetchPreferences] Trying query by email:', email);
    const byEmail = await supabase
      .from('preference_profiles')
      .select(selectCols)
      .eq('email', email)
      .maybeSingle();
    
    console.log('[fetchPreferences] Query by email result:', {
      hasData: !!byEmail.data,
      hasError: !!byEmail.error,
      error: byEmail.error ? {
        message: byEmail.error.message,
        code: byEmail.error.code
      } : null
    });
    
    if (!byEmail.error && byEmail.data) {
      data = byEmail.data;
      error = null;
      console.log('[fetchPreferences] Found preferences by email');
    } else if (byEmail.error) {
      console.error('[fetchPreferences] Email query error:', byEmail.error);
    }
  }

  if (error) {
    console.error('[fetchPreferences] Final error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }

  if (!data) {
    console.log('[fetchPreferences] No preferences found for user');
    return null;
  }

  console.log('[fetchPreferences] Successfully fetched preferences:', {
    hasPreferences: !!data.preferences,
    hasSummaryText: !!data.summary_text,
    updatedAt: data.updated_at
  });

  return mapRow(data);
}

export async function savePreferences(userId: string, email: string | null, prefs: UserPreferences, recapText?: string) {
  console.log('[savePreferences] Starting save:', {
    userId,
    email,
    prefsKeys: Object.keys(prefs),
    tagsCount: prefs.tags?.length || 0,
    recapText: !!recapText
  });
  
  // Log the preferences structure
  if (prefs.tags && prefs.tags.length > 0) {
    console.log('[savePreferences] Tags:', prefs.tags.map(t => ({
      label: t.label
    })));
  }
  
  const { data, error } = await supabase
    .from('preference_profiles')
    .upsert(
      {
        id: userId,
        user_id: userId,
        preferences: prefs,
        summary_text: recapText ?? prefs.recapText ?? null,
        email: email,
      },
      { onConflict: 'id' }
    )
    .select();

  if (error) {
    console.error('[savePreferences] Error saving preferences:', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      userId,
      email
    });
    throw error;
  }
  
  console.log('[savePreferences] Successfully saved preferences:', {
    saved: !!data,
    dataLength: data?.length || 0
  });
  
  return data;
}

export async function generateRecap(userId: string, prefs: UserPreferences): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ recap: string }>('preferences-recap', {
    body: {
      userId,
      preferences: prefs,
    },
  });

  if (error) {
    console.error('generateRecap error', error);
    return null;
  }
  return data?.recap ?? null;
}

