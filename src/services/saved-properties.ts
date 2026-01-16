import { supabase } from '../lib/supabaseClient';

export interface SavedProperty {
  id: string;
  address: string;
  zillowUrl: string;
  nestreconScore: number;
  matchLabel: string | null;
  summaryMetrics: {
    schoolAvg?: number;
    noise?: string;
    walkability?: number;
    bikeScore?: number;
    transitScore?: number;
    airQuality?: string;
    stargazeScore?: string;
    recap?: string;
    summary?: string;
    [key: string]: any; // Allow flexible metrics
  };
  createdAt: string;
  lastScannedAt: string;
}

/**
 * Fetches saved properties for the authenticated user
 * @param userId - The auth.uid() from Supabase auth
 * @param limit - Optional limit for number of properties to fetch (default: no limit)
 * @returns Array of saved properties, ordered by most recent first
 */
export async function fetchSavedProperties(
  userId: string,
  limit?: number
): Promise<SavedProperty[]> {
  // First, resolve auth.uid() to users.id
  let actualUserId = userId;
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (userError) {
      if (import.meta.env.DEV) {
        console.error('[fetchSavedProperties] Error fetching user:', userError);
      }
    } else if (userData?.id) {
      actualUserId = userData.id;
      if (import.meta.env.DEV) {
        console.log('[fetchSavedProperties] Found user ID:', {
          authUserId: userId,
          actualUserId: userData.id,
        });
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[fetchSavedProperties] No user found for auth_user_id:', userId);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[fetchSavedProperties] Exception fetching user:', err);
    }
  }

  // Query saved_properties table
  let query = supabase
    .from('saved_properties')
    .select('*')
    .eq('user_id', actualUserId)
    .order('last_scanned_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[fetchSavedProperties] Error fetching properties:', error);
    }
    return [];
  }

  if (!data) {
    return [];
  }

  // Map database rows to SavedProperty interface
  return data.map((row: any) => ({
    id: row.id,
    address: row.address,
    zillowUrl: row.zillow_url,
    nestreconScore: row.nestrecon_score,
    matchLabel: row.match_label,
    summaryMetrics: row.summary_metrics || {},
    createdAt: row.created_at,
    lastScannedAt: row.last_scanned_at,
  }));
}

/**
 * Deletes a saved property for the authenticated user
 * @param propertyId - The UUID of the saved property to delete
 * @throws Error if deletion fails
 */
export async function deleteSavedProperty(propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[deleteSavedProperty] Error deleting property:', error);
    }
    throw new Error(`Failed to delete property: ${error.message}`);
  }
}
