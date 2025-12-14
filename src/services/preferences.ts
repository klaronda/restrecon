import { supabase } from '../lib/supabaseClient';

export type PreferenceTag = {
  label: string;
  distanceMiles: number;
};

export type PreferenceToggles = {
  walkScore?: boolean;
  bikeScore?: boolean;
  transitScore?: boolean;
};

export type UserPreferences = {
  tags: PreferenceTag[];           // user-defined points of interest
  toggles: PreferenceToggles;      // importance of mobility signals
  freeformInput?: string;          // initial freeform description
  otherPreferences?: string;       // catch-all notes
  recapText?: string;              // mission-grade recap (cached)
  updatedAt?: string;
};

type PreferenceRow = {
  id: string;
  user_id: string;
  preferences_json: UserPreferences;
  summary_text: string | null;
  updated_at: string;
};

export async function fetchPreferences(userId: string, email?: string): Promise<UserPreferences | null> {
  const selectCols = 'preferences, summary_text, updated_at';

  const mapRow = (row: any): UserPreferences | null => {
    if (!row) return null;
    const prefs = (row as any).preferences ?? (row as any).preferences_json ?? {};
    return {
      ...(prefs as UserPreferences),
      recapText: row.summary_text ?? (prefs as any).recapText,
      updatedAt: row.updated_at,
    };
  };

  let { data, error } = await supabase
    .from('preference_profiles')
    .select(selectCols)
    .eq('user_id', userId)
    .maybeSingle();

  if ((!data || error) && email) {
    const byEmail = await supabase
      .from('preference_profiles')
      .select(selectCols)
      .eq('email', email as any)
      .maybeSingle();
    if (!byEmail.error && byEmail.data) {
      data = byEmail.data;
      error = null;
    }
  }

  if (error) {
    console.error('fetchPreferences error', error);
    return null;
  }

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
  
  // Log the preferences structure to debug distance updates
  if (prefs.tags && prefs.tags.length > 0) {
    console.log('[savePreferences] Tags with distances:', prefs.tags.map(t => ({
      label: t.label,
      distanceMiles: t.distanceMiles
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

