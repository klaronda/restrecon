import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOWLOUD_API_KEY = Deno.env.get('HOWLOUD_API_KEY');
const HOWLOUD_CLIENT_ID = Deno.env.get('HOWLOUD_CLIENT_ID');
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');
const LPM_BASE = 'https://lightpollutionmap.app/';

type MobilitySignal = 'walk' | 'bike' | 'transit';

interface PlaceTarget {
  label: string;
  maxDistanceMiles: number;
}

interface PlaceResult {
  name: string;
  address: string;
  distanceMiles: number;
  googleMapsLink: string;
  placeId?: string;
}

interface EvaluatedTarget {
  label: string;
  maxDistanceMiles: number;
  distanceMiles: number | null;
  places?: PlaceResult[];
}

interface UserPrefs {
  placeTargets: PlaceTarget[];
  mobilitySignals: MobilitySignal[];
  extraFocusNotes?: string;
}

interface ListingPayload {
  address?: string;
  lat?: number;
  lon?: number;
  recap?: string;
  basics?: {
    beds?: number;
    baths?: number;
    sqft?: number;
    year?: number;
  };
  schools?: { label: string; score: number }[];
  mobility?: { walk?: number; bike?: number; transit?: number };
  environment?: { sound?: string; air?: string; sky?: string; light?: string; soundScore?: number; airScore?: number; lightScore?: number };
  commuteScore?: number; // 0–100
  targets?: EvaluatedTarget[];
}

interface ProResult {
  proRawScore: number; // 0–100
  missionFitScore: number; // 0–100
  recap: string;
  notes?: string[];
  targets?: Array<EvaluatedTarget & { score: number }>;
  mobilitySignals?: MobilitySignal[];
  environment?: {
    soundScore?: number;
    soundLabel?: string;
    airScore?: number;
    airLabel?: string;
    lightScore?: number;
    lightLabel?: string;
    stargazingScore?: number;
    stargazingLabel?: string;
  };
  debug?: Record<string, unknown>;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function avg(nums: number[]) {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function soundLabel(score?: number) {
  if (score == null || !Number.isFinite(score)) return 'Unknown';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Okay';
  if (score >= 40) return 'Not Great';
  return 'Not Good';
}

async function fetchHowloud(address?: string): Promise<{ score?: number; label: string } | null> {
  if (!address || !HOWLOUD_API_KEY || !HOWLOUD_CLIENT_ID) {
    console.warn('[pro-recap] Howloud: missing API key or client ID', { 
      hasAddress: !!address, 
      hasApiKey: !!HOWLOUD_API_KEY, 
      hasClientId: !!HOWLOUD_CLIENT_ID 
    });
    return null;
  }
  try {
    const url = new URL('https://api.howloud.com/v1/soundscore');
    url.searchParams.set('address', address);
    url.searchParams.set('client_id', HOWLOUD_CLIENT_ID);
    console.log('[pro-recap] Howloud: fetching', { 
      address, 
      url: url.toString(), 
      hasApiKey: !!HOWLOUD_API_KEY, 
      hasClientId: !!HOWLOUD_CLIENT_ID,
      apiKeyLength: HOWLOUD_API_KEY?.length || 0,
      clientIdLength: HOWLOUD_CLIENT_ID?.length || 0
    });
    
    // Try with X-Api-Key header first (AWS API Gateway expects capitalized header)
    let resp = await fetch(url.toString(), {
      headers: { 
        'X-Api-Key': HOWLOUD_API_KEY,
        'Content-Type': 'application/json'
      },
    });
    
    // If 403, try alternative: Authorization header or client_id in header
    if (resp.status === 403) {
      console.warn('[pro-recap] Howloud: 403 with X-Api-Key, trying alternative auth methods');
      
      // Try with Authorization header
      resp = await fetch(url.toString(), {
        headers: { 
          'Authorization': `Bearer ${HOWLOUD_API_KEY}`,
          'X-Api-Key': HOWLOUD_API_KEY,
          'Content-Type': 'application/json'
        },
      });
      
      // If still 403, try with client_id in header instead of query
      if (resp.status === 403) {
        const altUrl = new URL('https://api.howloud.com/v1/soundscore');
        altUrl.searchParams.set('address', address);
        resp = await fetch(altUrl.toString(), {
          headers: { 
            'X-Api-Key': HOWLOUD_API_KEY,
            'X-Client-Id': HOWLOUD_CLIENT_ID,
            'Content-Type': 'application/json'
          },
        });
      }
      
      // If still 403 after all attempts, log detailed info and return null
      if (resp.status === 403) {
        const errorText = await resp.text().catch(() => 'Unable to read error response');
        console.warn('[pro-recap] Howloud: All authentication methods failed with 403', {
          note: 'Please verify HOWLOUD_API_KEY and HOWLOUD_CLIENT_ID are correct in Supabase Edge Function secrets',
          apiKeyPresent: !!HOWLOUD_API_KEY,
          clientIdPresent: !!HOWLOUD_CLIENT_ID,
          apiKeyLength: HOWLOUD_API_KEY?.length || 0,
          clientIdLength: HOWLOUD_CLIENT_ID?.length || 0,
          errorMessage: errorText.substring(0, 200)
        });
        return null;
      }
    }
    
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unable to read error response');
      const errorJson = (() => {
        try {
          return JSON.parse(errorText);
        } catch {
          return { raw: errorText };
        }
      })();
      console.warn('[pro-recap] Howloud: API error', { 
        status: resp.status, 
        statusText: resp.statusText,
        errorBody: errorText.substring(0, 500),
        errorJson,
        responseHeaders: Object.fromEntries(resp.headers.entries())
      });
      return null;
    }
    const data = await resp.json();
    console.log('[pro-recap] Howloud: response', { dataKeys: Object.keys(data || {}), dataType: typeof data });
    // Expecting shape: { score: number, ... } — tolerate variants
    const score = typeof data?.score === 'number' ? data.score : Number(data?.Soundscore ?? data?.soundscore);
    if (!Number.isFinite(score)) {
      console.warn('[pro-recap] Howloud: invalid score', { data, extractedScore: score });
      return null;
    }
    console.log('[pro-recap] Howloud: success', { score, label: soundLabel(score) });
    return { score, label: soundLabel(score) };
  } catch (err) {
    console.error('[pro-recap] Howloud: fetch error', { error: err, message: (err as Error)?.message, stack: (err as Error)?.stack });
    return null;
  }
}

async function geocodeOpenWeather(address?: string): Promise<{ lat: number; lon: number } | null> {
  if (!address || !OPENWEATHER_API_KEY) {
    console.warn('[pro-recap] OpenWeather geocode: missing address or API key', { 
      hasAddress: !!address, 
      hasApiKey: !!OPENWEATHER_API_KEY 
    });
    return null;
  }
  
  // Try multiple address formats
  const addressFormats: string[] = [];
  
  // 1. Full address as-is
  addressFormats.push(address);
  
  // 2. Remove zip code if present (e.g., "10601 Beckwood Dr, Austin, TX 78726" -> "10601 Beckwood Dr, Austin, TX")
  const withoutZip = address.replace(/,\s*\d{5}(-\d{4})?$/i, '');
  if (withoutZip !== address) {
    addressFormats.push(withoutZip);
  }
  
  // 3. Extract city and state (e.g., "Austin, TX")
  const cityStateMatch = address.match(/([A-Za-z\s]+),\s*([A-Z]{2})/);
  if (cityStateMatch) {
    addressFormats.push(`${cityStateMatch[1].trim()}, ${cityStateMatch[2]}`);
  }
  
  // 4. Try with Mapbox Geocoding API as fallback if we have the token
  const tryMapboxGeocode = async (addr: string): Promise<{ lat: number; lon: number } | null> => {
    if (!MAPBOX_ACCESS_TOKEN) return null;
    try {
      const encodedAddr = encodeURIComponent(addr);
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddr}.json`);
      url.searchParams.set('limit', '1');
      url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
      const resp = await fetch(url.toString());
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].geometry?.coordinates || data.features[0].center || [];
        // Mapbox uses [lon, lat] order
        const lon = coords[0];
        const lat = coords[1];
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          console.log('[pro-recap] Mapbox geocode: success (fallback)', { address: addr, lat, lon });
          return { lat, lon };
        }
      }
    } catch (err) {
      console.warn('[pro-recap] Mapbox geocode: fallback error', { error: (err as Error)?.message });
    }
    return null;
  };
  
  // Try each address format
  for (const addrFormat of addressFormats) {
    try {
      const url = new URL('https://api.openweathermap.org/geo/1.0/direct');
      url.searchParams.set('q', addrFormat);
      url.searchParams.set('limit', '1');
      url.searchParams.set('appid', OPENWEATHER_API_KEY);
      console.log('[pro-recap] OpenWeather geocode: trying format', { 
        address: addrFormat, 
        formatIndex: addressFormats.indexOf(addrFormat),
        hasApiKey: !!OPENWEATHER_API_KEY 
      });
      
      const resp = await fetch(url.toString());
      if (!resp.ok) {
        const errorText = await resp.text().catch(() => 'Unable to read error response');
        console.warn('[pro-recap] OpenWeather geocode: API error', { 
          address: addrFormat,
          status: resp.status, 
          statusText: resp.statusText,
          errorBody: errorText.substring(0, 500)
        });
        continue; // Try next format
      }
      
      const data = await resp.json();
      console.log('[pro-recap] OpenWeather geocode: response', { 
        address: addrFormat,
        isArray: Array.isArray(data), 
        length: Array.isArray(data) ? data.length : 0,
        firstResult: Array.isArray(data) && data[0] ? { lat: data[0].lat, lon: data[0].lon } : null
      });
      
      if (Array.isArray(data) && data.length && data[0]?.lat != null && data[0]?.lon != null) {
        console.log('[pro-recap] OpenWeather geocode: success', { 
          address: addrFormat, 
          lat: data[0].lat, 
          lon: data[0].lon 
        });
        return { lat: data[0].lat, lon: data[0].lon };
      }
    } catch (err) {
      console.warn('[pro-recap] OpenWeather geocode: fetch error for format', { 
        address: addrFormat, 
        error: (err as Error)?.message 
      });
      continue; // Try next format
    }
  }
  
  // If all OpenWeather attempts failed, try Mapbox Geocoding as fallback
  console.warn('[pro-recap] OpenWeather geocode: all formats failed, trying Mapbox fallback', { 
    originalAddress: address,
    triedFormats: addressFormats 
  });
  const mapboxResult = await tryMapboxGeocode(address);
  if (mapboxResult) {
    return mapboxResult;
  }
  
  console.warn('[pro-recap] OpenWeather geocode: all attempts failed', { 
    originalAddress: address, 
    triedFormats: addressFormats 
  });
  return null;
}

async function fetchAirQuality(lat?: number, lon?: number): Promise<{ score?: number; label: string } | null> {
  if (lat == null || lon == null || !OPENWEATHER_API_KEY) {
    console.warn('[pro-recap] OpenWeather air: missing coords or API key', { lat, lon, hasApiKey: !!OPENWEATHER_API_KEY });
    return null;
  }
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 365 * 24 * 60 * 60;
    const url = new URL('https://api.openweathermap.org/data/2.5/air_pollution/history');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('start', String(oneYearAgo));
    url.searchParams.set('end', String(now));
    url.searchParams.set('appid', OPENWEATHER_API_KEY);
    console.log('[pro-recap] OpenWeather air: fetching', { lat, lon, hasApiKey: !!OPENWEATHER_API_KEY });
    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] OpenWeather air: API error', { 
        status: resp.status, 
        statusText: resp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return null;
    }
    const data = await resp.json();
    const list = Array.isArray(data?.list) ? data.list : [];
    console.log('[pro-recap] OpenWeather air: response', { 
      hasList: !!data?.list, 
      listLength: list.length,
      dataKeys: Object.keys(data || {})
    });
    if (!list.length) {
      console.warn('[pro-recap] OpenWeather air: no data in response', { data });
      return null;
    }
    const aqiValues = list
      .map((e: any) => e?.main?.aqi)
      .filter((n: any) => Number.isFinite(n));
    if (!aqiValues.length) {
      console.warn('[pro-recap] OpenWeather air: no valid AQI values', { listSample: list.slice(0, 3) });
      return null;
    }
    const avgAqi = avg(aqiValues);
    // OpenWeather AQI: 1 Good, 2 Fair, 3 Moderate, 4 Poor, 5 Very Poor
    let score = 70;
    let label = 'Okay';
    if (avgAqi <= 1.5) {
      score = 90;
      label = 'Good';
    } else if (avgAqi <= 2.5) {
      score = 75;
      label = 'Okay';
    } else if (avgAqi <= 3.5) {
      score = 55;
      label = 'Not Great';
    } else {
      score = 30;
      label = 'Not Good';
    }
    console.log('[pro-recap] OpenWeather air: success', { avgAqi, score, label });
    return { score, label };
  } catch (err) {
    console.error('[pro-recap] OpenWeather air: fetch error', { error: err, message: (err as Error)?.message });
    return null;
  }
}

// Returns stargazing score (inverse of light pollution)
// High stargazing score = low light pollution
function stargazingScoreFromBortle(b?: number) {
  if (b == null || !Number.isFinite(b)) return undefined;
  if (b <= 1) return 98; // Excellent stargazing
  if (b <= 2) return 94;
  if (b <= 3) return 88;
  if (b <= 4) return 72;
  if (b <= 5) return 56;
  if (b <= 6) return 40;
  if (b <= 7) return 25;
  if (b <= 8) return 15;
  return 8; // Poor stargazing
}

// Returns light pollution score (inverse of stargazing)
// High light pollution = low stargazing
function lightPollutionScoreFromBortle(b?: number) {
  if (b == null || !Number.isFinite(b)) return undefined;
  const stargazing = stargazingScoreFromBortle(b);
  return stargazing != null ? 100 - stargazing : undefined;
}

// Map light pollution category to stargazing label (inverse relationship)
function categoryToStargazingLabel(category?: string): string {
  if (!category) return 'Unknown';
  const normalized = category.trim();
  const mapping: Record<string, string> = {
    'Excellent': 'Not Good',
    'Good': 'Not Great',
    'Okay': 'Okay',
    'High': 'Not Great',
    'Very High': 'Not Good',
    'Low': 'Good',
    'Very Low': 'Excellent',
  };
  return mapping[normalized] || 'Unknown';
}

async function fetchLightPollution(lat?: number, lon?: number): Promise<{ score?: number; label: string; stargazingScore?: number; stargazingLabel?: string } | null> {
  if (lat == null || lon == null) {
    console.warn('[pro-recap] LightPollutionMap: missing coords', { lat, lon });
    return null;
  }
  try {
    const url = `${LPM_BASE}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lon)}`;
    console.log('[pro-recap] LightPollutionMap: fetching', { lat, lon, url });
    const resp = await fetch(url, { headers: { 'User-Agent': 'NestRecon/1.0' } });
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] LightPollutionMap: API error', { 
        status: resp.status, 
        statusText: resp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return null;
    }
    const html = await resp.text();
    console.log('[pro-recap] LightPollutionMap: response received', { htmlLength: html.length });
    
    // Parse category text from id="pollution-category" (e.g., "High")
    const pollutionCategoryMatch = html.match(/id=["']pollution-category["'][^>]*>([^<]+)</i);
    const category = pollutionCategoryMatch ? pollutionCategoryMatch[1].trim() : undefined;
    
    // Parse Bortle value using multiple methods
    let bortle: number | undefined;
    let bortleValue: string | undefined;
    let matchedSnippet: string | undefined;
    
    // Method 1: Try id="pollution-value" element (e.g., "7.4" or "6.2")
    const pollutionValueMatch = html.match(/id=["']pollution-value["'][^>]*>([^<]+)</i);
    if (pollutionValueMatch) {
      bortleValue = pollutionValueMatch[1].trim();
      matchedSnippet = pollutionValueMatch[0];
      // Skip if value is "--" (data not loaded yet) or empty
      if (bortleValue && bortleValue !== '--' && bortleValue !== '') {
        // Extract number from the value (handles "7.4", "6.2", etc.)
        const numMatch = bortleValue.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (numMatch) {
          bortle = Number(numMatch[1]);
        }
      }
    }
    
    // Method 1b: Look for JSON data in script tags (page might embed data)
    if (!bortle || !Number.isFinite(bortle)) {
      // Look for JSON objects with bortle or pollution data
      const jsonMatches = html.match(/<script[^>]*>[\s\S]*?({[^}]*bortle[^}]*})[\s\S]*?<\/script>/i);
      if (jsonMatches) {
        try {
          const jsonData = JSON.parse(jsonMatches[1]);
          if (jsonData.bortle != null) {
            bortle = Number(jsonData.bortle);
            bortleValue = String(jsonData.bortle);
            matchedSnippet = jsonMatches[1];
          }
        } catch (e) {
          // JSON parse failed, continue
        }
      }
      
      // Also try looking for window.__INITIAL_STATE__ or similar patterns
      const stateMatch = html.match(/window\.__[A-Z_]+__\s*=\s*({[\s\S]*?});/i);
      if (stateMatch && !bortle) {
        try {
          const state = JSON.parse(stateMatch[1]);
          // Look for bortle in nested objects
          const findBortle = (obj: any): number | undefined => {
            if (typeof obj !== 'object' || obj === null) return undefined;
            if (typeof obj.bortle === 'number') return obj.bortle;
            if (typeof obj.pollution?.bortle === 'number') return obj.pollution.bortle;
            for (const key in obj) {
              const found = findBortle(obj[key]);
              if (found != null) return found;
            }
            return undefined;
          };
          const foundBortle = findBortle(state);
          if (foundBortle != null) {
            bortle = foundBortle;
            bortleValue = String(foundBortle);
            matchedSnippet = stateMatch[1].substring(0, 200);
          }
        } catch (e) {
          // JSON parse failed, continue
        }
      }
    }
    
    // Method 2: If Method 1 failed, try looking for "Bortle" followed by number (but avoid meta tags)
    if (!bortle || !Number.isFinite(bortle)) {
      // Look for Bortle in content, but exclude matches in meta tags
      // Split by potential meta tag boundaries and search in content sections
      const contentSections = html.split(/<meta[^>]*>/i);
      for (const section of contentSections) {
        const bortleMatch = section.match(/Bortle[^0-9]*([0-9]+(?:\.[0-9]+)?)/i);
        if (bortleMatch) {
          const matchedValue = Number(bortleMatch[1]);
          // Only use if in valid range (1-9) to avoid matching years like "2024"
          if (matchedValue >= 1 && matchedValue <= 9) {
            bortle = matchedValue;
            matchedSnippet = bortleMatch[0];
            bortleValue = bortleMatch[1];
            break;
          }
        }
      }
    }
    
    // Method 3: Try looking for number in the pollution section context (avoid meta tags)
    if (!bortle || !Number.isFinite(bortle)) {
      // Look for pattern like "7.4 BORTLE" but only in pollution-related sections
      const pollutionSection = html.match(/pollution[^>]*>[\s\S]{0,500}([0-9]+(?:\.[0-9]+)?)\s*BORTLE/i);
      if (pollutionSection) {
        const matchedValue = Number(pollutionSection[1]);
        if (matchedValue >= 1 && matchedValue <= 9) {
          bortle = matchedValue;
          matchedSnippet = pollutionSection[0];
          bortleValue = pollutionSection[1];
        }
      }
    }
    
    // Validate Bortle is in reasonable range (1-9)
    let finalBortle: number | undefined;
    if (bortle != null && Number.isFinite(bortle)) {
      if (bortle >= 1 && bortle <= 9) {
        finalBortle = bortle;
      } else {
        console.warn('[pro-recap] LightPollutionMap: Bortle value out of range', { 
          bortle, 
          bortleValue,
          matchedSnippet,
          expectedRange: '1-9'
        });
      }
    }
    
    // If still no valid Bortle, check if data wasn't loaded yet (shows "--")
    if (!finalBortle) {
      const hasPlaceholder = bortleValue === '--' || category === '--';
      if (hasPlaceholder) {
        // This is expected - the page loads data dynamically via JavaScript
        // We can't wait for it in a server-side fetch, so we'll skip scoring
        console.log('[pro-recap] LightPollutionMap: Data not loaded yet (shows "--"), page uses JavaScript to load data', {
          bortleValue,
          category,
          note: 'Light pollution data loads dynamically via JavaScript. The initial HTML does not contain the actual values. This is expected behavior.'
        });
        // Return null gracefully - this is not an error, just unavailable data
        return null;
      } else {
        console.warn('[pro-recap] LightPollutionMap: Could not parse valid Bortle value', {
          bortleValue,
          matchedSnippet,
          category,
          pollutionValueMatch: pollutionValueMatch?.[0],
          pollutionCategoryMatch: pollutionCategoryMatch?.[0],
          htmlSnippet: html.substring(Math.max(0, html.indexOf('pollution-value') - 200), Math.min(html.length, html.indexOf('pollution-value') + 400))
        });
      }
    }
    
    console.log('[pro-recap] LightPollutionMap: parsed', { 
      bortleValue, 
      bortle: finalBortle, 
      category,
      matchedSnippet,
      pollutionValueMatch: pollutionValueMatch?.[0],
      pollutionCategoryMatch: pollutionCategoryMatch?.[0],
      isValid: finalBortle != null && finalBortle >= 1 && finalBortle <= 9
    });
    
    // Use category text directly for light pollution label, or fallback to Bortle value
    const lightLabel = category || (finalBortle ? `Bortle ${finalBortle}` : 'Unknown');
    
    // Calculate scores only if we have a valid Bortle value
    let stargazingScore: number | undefined;
    let lightPollutionScore: number | undefined;
    
    if (finalBortle != null && finalBortle >= 1 && finalBortle <= 9) {
      stargazingScore = stargazingScoreFromBortle(finalBortle);
      lightPollutionScore = lightPollutionScoreFromBortle(finalBortle);
    } else {
      console.warn('[pro-recap] LightPollutionMap: Skipping score calculation due to invalid Bortle', {
        finalBortle,
        category,
        lightLabel
      });
    }
    
    // Get inverse stargazing label from category
    const stargazingLabel = categoryToStargazingLabel(category);
    
    console.log('[pro-recap] LightPollutionMap: success', { 
      lightLabel, 
      stargazingLabel,
      stargazingScore, 
      lightPollutionScore,
      bortle: finalBortle,
      category,
      hasValidBortle: finalBortle != null && finalBortle >= 1 && finalBortle <= 9
    });
    
    return { 
      score: lightPollutionScore, 
      label: lightLabel, 
      stargazingScore,
      stargazingLabel
    };
  } catch (err) {
    console.error('[pro-recap] LightPollutionMap: fetch error', { error: err, message: (err as Error)?.message });
    return null;
  }
}

function scoreTarget(t: EvaluatedTarget): number {
  // If no places found, significantly hurt the score
  if (!t.places || t.places.length === 0) {
    return 2; // Low score for no results
  }
  
  if (t.distanceMiles == null) return 3;
  const d = t.distanceMiles;
  const max = t.maxDistanceMiles;
  if (d <= max) return 10;
  if (d <= max * 1.5) return 7;
  if (d <= max * 2) return 5;
  return 2;
}

function to0to10(value0to100?: number) {
  if (value0to100 == null) return undefined;
  return clamp(value0to100 / 10, 0, 10);
}

function scoreBasics(b?: ListingPayload['basics']) {
  const beds = b?.beds;
  const baths = b?.baths;
  const sqft = b?.sqft;
  const year = b?.year;
  const scores: number[] = [];
  if (beds != null) {
    if (beds >= 4) scores.push(10);
    else if (beds === 3) scores.push(9);
    else if (beds === 2) scores.push(7);
    else scores.push(4);
  }
  if (baths != null) {
    if (baths >= 2) scores.push(10);
    else if (baths >= 1.5) scores.push(8);
    else if (baths >= 1) scores.push(6);
    else scores.push(4);
  }
  if (sqft != null) {
    if (sqft >= 2200) scores.push(10);
    else if (sqft >= 1400) scores.push(8);
    else if (sqft >= 1000) scores.push(6);
    else scores.push(4);
  }
  if (year != null) {
    if (year >= 2010) scores.push(10);
    else if (year >= 1990) scores.push(8);
    else if (year >= 1970) scores.push(6);
    else scores.push(4);
  }
  return scores.length ? avg(scores) : 5;
}

function scoreSchools(schools?: { score: number }[]) {
  const vals = (schools || []).map((s) => s.score).filter((n) => Number.isFinite(n));
  return vals.length ? avg(vals) : 5;
}

function scoreMobilityPro(mob?: ListingPayload['mobility'], signals?: MobilitySignal[]) {
  const sel: number[] = [];
  const include = new Set(signals || []);
  if (include.has('walk') && mob?.walk != null) sel.push(to0to10(mob.walk)!);
  if (include.has('bike') && mob?.bike != null) sel.push(to0to10(mob.bike)!);
  if (include.has('transit') && mob?.transit != null) sel.push(to0to10(mob.transit)!);
  return sel.length ? avg(sel) : 5;
}

function scoreAmenities(targets?: EvaluatedTarget[]) {
  if (!targets || !targets.length) return { amenitiesScore: 5, targetScores: [] as number[] };
  const scores = targets.map(scoreTarget);
  return { amenitiesScore: avg(scores), targetScores: scores };
}

function alignFromScore(score0to10: number) {
  const x = clamp(score0to10, 0, 10) / 10;
  return 0.5 + 0.5 * x; // 0.5 (bad) -> 1.0 (perfect)
}

async function findPlacesNearby(
  origin: { lat: number; lon: number },
  query: string,
  maxResults: number = 3
): Promise<PlaceResult[]> {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn('[pro-recap] Mapbox: missing access token for findPlacesNearby', { hasToken: !!MAPBOX_ACCESS_TOKEN });
    return [];
  }
  
  try {
    // Use Mapbox Geocoding API to find places
    // Note: Mapbox uses lon,lat order (opposite of Google Maps)
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
    searchUrl.searchParams.set('proximity', `${origin.lon},${origin.lat}`); // lon,lat order
    searchUrl.searchParams.set('limit', maxResults.toString());
    searchUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
    
    console.log('[pro-recap] Mapbox Geocoding: fetching', { query, origin, maxResults, hasToken: !!MAPBOX_ACCESS_TOKEN });
    const searchResp = await fetch(searchUrl.toString());
    if (!searchResp.ok) {
      const errorText = await searchResp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] Mapbox Geocoding: API error', { 
        status: searchResp.status, 
        statusText: searchResp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return [];
    }
    
    const searchData = await searchResp.json();
    console.log('[pro-recap] Mapbox Geocoding: response', { 
      resultsCount: searchData.features?.length || 0 
    });
    
    if (!searchData.features || searchData.features.length === 0) {
      console.warn('[pro-recap] Mapbox Geocoding: no results', { query });
      return [];
    }
    
    // Take up to maxResults places
    const places = searchData.features.slice(0, maxResults);
    
    // Extract coordinates (Mapbox uses [lon, lat] in coordinates array)
    const placeCoords = places.map(p => {
      const coords = p.geometry?.coordinates || p.center || [];
      return { lon: coords[0], lat: coords[1] };
    });
    
    // Calculate distances using Mapbox Matrix API
    // Format: {lon1},{lat1};{lon2},{lat2};...
    const coordinates = `${origin.lon},${origin.lat};${placeCoords.map(c => `${c.lon},${c.lat}`).join(';')}`;
    const matrixUrl = new URL(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}`);
    matrixUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
    
    console.log('[pro-recap] Mapbox Matrix: fetching', { 
      origin: `${origin.lon},${origin.lat}`, 
      destinationsCount: places.length 
    });
    const matrixResp = await fetch(matrixUrl.toString());
    if (!matrixResp.ok) {
      const errorText = await matrixResp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] Mapbox Matrix: API error', { 
        status: matrixResp.status, 
        statusText: matrixResp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      // Return places without distances if distance calculation fails
      return places.map((p) => {
        const coords = p.geometry?.coordinates || p.center || [];
        const lat = coords[1] || 0;
        const lon = coords[0] || 0;
        return {
          name: p.place_name || p.text || 'Unknown',
          address: p.place_name || p.properties?.address || 'Address not available',
          distanceMiles: 0, // Will be marked as unknown
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
          placeId: p.id
        };
      });
    }
    
    const matrixData = await matrixResp.json();
    console.log('[pro-recap] Mapbox Matrix: response', { 
      distancesCount: matrixData.distances?.[0]?.length || 0
    });
    
    // Build results with distances
    // Mapbox Matrix returns distances[0] as array of distances from origin to each destination
    const results: PlaceResult[] = [];
    const distances = matrixData.distances?.[0] || [];
    
    for (let i = 0; i < places.length && i < distances.length; i++) {
      const place = places[i];
      const distanceMeters = distances[i];
      
      if (distanceMeters != null && Number.isFinite(distanceMeters)) {
        const miles = distanceMeters / 1609.34; // Convert meters to miles
        const coords = place.geometry?.coordinates || place.center || [];
        const lat = coords[1] || 0;
        const lon = coords[0] || 0;
        
        results.push({
          name: place.place_name || place.text || 'Unknown',
          address: place.place_name || place.properties?.address || 'Address not available',
          distanceMiles: miles,
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
          placeId: place.id
        });
      }
    }
    
    // Sort by distance (closest first)
    results.sort((a, b) => a.distanceMiles - b.distanceMiles);
    
    console.log('[pro-recap] Mapbox findPlacesNearby: success', { 
      query, 
      foundCount: results.length,
      places: results.map(p => ({ name: p.name, distance: p.distanceMiles }))
    });
    
    return results;
  } catch (err) {
    console.error('[pro-recap] Mapbox findPlacesNearby: fetch error', { error: err, message: (err as Error)?.message });
    return [];
  }
}

async function calculateDistance(
  origin: { lat: number; lon: number },
  destination: string
): Promise<number | null> {
  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn('[pro-recap] Mapbox: missing access token', { hasToken: !!MAPBOX_ACCESS_TOKEN });
    return null;
  }
  try {
    // First, find the place using Mapbox Geocoding API
    const encodedQuery = encodeURIComponent(destination);
    const geocodeUrl = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
    geocodeUrl.searchParams.set('proximity', `${origin.lon},${origin.lat}`); // lon,lat order
    geocodeUrl.searchParams.set('limit', '1');
    geocodeUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
    
    console.log('[pro-recap] Mapbox Geocoding: fetching', { destination, origin, hasToken: !!MAPBOX_ACCESS_TOKEN });
    const geocodeResp = await fetch(geocodeUrl.toString());
    if (!geocodeResp.ok) {
      const errorText = await geocodeResp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] Mapbox Geocoding: API error', { 
        status: geocodeResp.status, 
        statusText: geocodeResp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return null;
    }
    const geocodeData = await geocodeResp.json();
    console.log('[pro-recap] Mapbox Geocoding: response', { 
      featuresCount: geocodeData.features?.length || 0 
    });
    if (!geocodeData.features || geocodeData.features.length === 0) {
      console.warn('[pro-recap] Mapbox Geocoding: no results', { destination });
      return null;
    }
    const destFeature = geocodeData.features[0];
    const destCoords = destFeature.geometry?.coordinates || destFeature.center || [];
    const destLon = destCoords[0];
    const destLat = destCoords[1];
    console.log('[pro-recap] Mapbox Geocoding: found location', { destLat, destLon });
    
    // Calculate distance using Mapbox Matrix API
    // Format: {lon1},{lat1};{lon2},{lat2}
    const coordinates = `${origin.lon},${origin.lat};${destLon},${destLat}`;
    const matrixUrl = new URL(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}`);
    matrixUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
    
    console.log('[pro-recap] Mapbox Matrix: fetching', { 
      origin: `${origin.lon},${origin.lat}`, 
      destination: `${destLon},${destLat}` 
    });
    const matrixResp = await fetch(matrixUrl.toString());
    if (!matrixResp.ok) {
      const errorText = await matrixResp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] Mapbox Matrix: API error', { 
        status: matrixResp.status, 
        statusText: matrixResp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return null;
    }
    const matrixData = await matrixResp.json();
    console.log('[pro-recap] Mapbox Matrix: response', { 
      distancesCount: matrixData.distances?.[0]?.length || 0
    });
    if (!matrixData.distances || !matrixData.distances[0] || matrixData.distances[0].length < 2) {
      console.warn('[pro-recap] Mapbox Matrix: no results', { 
        distances: matrixData.distances 
      });
      return null;
    }
    // Convert meters to miles
    // distances[0][1] is distance from origin (index 0) to destination (index 1)
    const meters = matrixData.distances[0][1];
    if (!Number.isFinite(meters)) {
      console.warn('[pro-recap] Mapbox Matrix: invalid distance', { meters });
      return null;
    }
    const miles = meters / 1609.34;
    console.log('[pro-recap] Mapbox Matrix: success', { meters, miles });
    return miles;
  } catch (err) {
    console.error('[pro-recap] Mapbox: fetch error', { error: err, message: (err as Error)?.message });
    return null;
  }
}

async function generateAIRecap(
  listing: ListingPayload,
  prefs: UserPrefs,
  targetScores: EvaluatedTarget[],
  scores: { proRawScore: number; missionFitScore: number }
): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('[pro-recap] OpenAI: missing API key, using fallback');
    return buildRecapFallback(listing, prefs, targetScores);
  }
  
  try {
    // Build priorities list with places or "No results found"
    const prioritiesList = targetScores.length 
      ? targetScores.map(t => {
          if (!t.places || t.places.length === 0) {
            return `${t.label}: No results found`;
          }
          const placesInfo = t.places.slice(0, 3).map(p => 
            `${p.name} (${p.distanceMiles.toFixed(1)} mi)`
          ).join(', ');
          return `${t.label}: ${placesInfo}`;
        }).join('; ')
      : 'None set';

    const prompt = `Property: ${listing.address || 'Unknown address'}
${listing.basics?.beds ? `${listing.basics.beds} bed, ${listing.basics.baths} bath, ${listing.basics.sqft?.toLocaleString()} sqft` : ''}
${listing.basics?.year ? `Built ${listing.basics.year}` : ''}

Priorities: ${prioritiesList}

Mobility focus: ${prefs.mobilitySignals?.join(', ') || 'None'}

Environment: ${listing.environment?.sound ? `Sound: ${listing.environment.sound}` : ''} ${listing.environment?.air ? `Air: ${listing.environment.air}` : ''} ${listing.environment?.light ? `Light: ${listing.environment.light}` : ''}

${prefs.extraFocusNotes ? `Additional notes: ${prefs.extraFocusNotes}` : ''}

Provide a brief, honest assessment (1-2 sentences max): Is this property a good fit? What are the main strengths and concerns? Be specific and actionable. Do not mention any scores or numbers. Use "we" instead of "I" when referring to recommendations.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful real estate advisor providing concise, actionable property recommendations. Use "we" instead of "I" when making recommendations. Keep responses brief (1-2 sentences maximum).' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });
    
    if (!resp.ok) {
      console.warn('[pro-recap] OpenAI: API error', { status: resp.status });
      return buildRecapFallback(listing, prefs, targetScores);
    }
    
    const data = await resp.json();
    const recap = data.choices?.[0]?.message?.content?.trim();
    if (recap) {
      return recap;
    }
    return buildRecapFallback(listing, prefs, targetScores);
  } catch (err) {
    console.error('[pro-recap] OpenAI: fetch error', err);
    return buildRecapFallback(listing, prefs, targetScores);
  }
}

function buildRecapFallback(listing: ListingPayload, prefs: UserPrefs, targetScores: EvaluatedTarget[]): string {
  const parts: string[] = [];
  if (listing.address) parts.push(listing.address);

  if (targetScores.length) {
    const hits = targetScores.filter((t) => scoreTarget(t) >= 7);
    const misses = targetScores.filter((t) => scoreTarget(t) < 7);
    parts.push(`Priorities: ${hits.length}/${targetScores.length} met`);
    hits.slice(0, 3).forEach((t) => parts.push(`✔ ${t.label}: ${t.distanceMiles?.toFixed(1) ?? '?'} mi`));
    misses.slice(0, 3).forEach((t) => parts.push(`⚠ ${t.label}: ${t.distanceMiles?.toFixed(1) ?? '?'} mi`));
  } else {
    parts.push('Priorities: no distance data yet');
  }

  if (prefs.mobilitySignals?.length) {
    parts.push(`Mobility focus: ${prefs.mobilitySignals.join(', ')}`);
  }

  if (listing.environment && 'sound' in listing.environment) {
    const lbl = (listing.environment as any).sound;
    parts.push(`Sound: ${lbl}`);
  }
  if (listing.environment && 'air' in listing.environment) {
    const lbl = (listing.environment as any).air;
    parts.push(`Air: ${lbl}`);
  }
  if (listing.environment && 'light' in listing.environment) {
    const lbl = (listing.environment as any).light;
    parts.push(`Sky brightness: ${lbl}`);
  }

  if (prefs.extraFocusNotes) {
    parts.push(`Notes: ${prefs.extraFocusNotes}`);
  }

  return parts.join(' · ');
}

async function scorePro(listing: ListingPayload, prefs: UserPrefs): Promise<ProResult> {
  const basicsScore = scoreBasics(listing.basics);
  const schoolsScore = scoreSchools(listing.schools);
  const { amenitiesScore, targetScores } = scoreAmenities(listing.targets);
  const mobilityScore = scoreMobilityPro(listing.mobility, prefs.mobilitySignals);
  const envSoundScore = listing.environment && 'soundScore' in listing.environment ? to0to10((listing.environment as any).soundScore) : undefined;
  const envAirScore = listing.environment && 'airScore' in listing.environment ? to0to10((listing.environment as any).airScore) : undefined;
  const envLightScore = listing.environment && 'lightScore' in listing.environment ? to0to10((listing.environment as any).lightScore) : undefined;
  const envScore = envSoundScore ?? envAirScore ?? envLightScore ?? 5;
  const commuteScore = to0to10(listing.commuteScore) ?? 5;

  const pro0to10 =
    basicsScore * 0.25 +
    schoolsScore * 0.25 +
    mobilityScore * 0.15 +
    envScore * 0.15 +
    commuteScore * 0.10 +
    amenitiesScore * 0.10;

  const proRawScore = Math.round(pro0to10 * 10);

  // Alignment factors for mobility/targets
  const mobilityAlign = prefs.mobilitySignals?.length ? alignFromScore(mobilityScore) : 1.0;
  const targetAlign = targetScores.length ? alignFromScore(amenitiesScore) : 1.0;

  const mission0to10 =
    basicsScore * 0.25 +
    schoolsScore * 0.25 +
    mobilityScore * 0.15 * mobilityAlign +
    envScore * 0.15 +
    commuteScore * 0.10 +
    amenitiesScore * 0.10 * targetAlign;

  const missionFitScore = Math.round(mission0to10 * 10);

  const scores = { proRawScore, missionFitScore };
  const recap = await generateAIRecap(listing, prefs, listing.targets || [], scores);

  return {
    proRawScore,
    missionFitScore,
    recap,
    targets: (listing.targets || []).map((t, i) => ({ ...t, score: targetScores[i] ?? scoreTarget(t) })),
    mobilitySignals: prefs.mobilitySignals,
    environment: listing.environment,
    debug: {
      basicsScore,
      schoolsScore,
      mobilityScore,
      envScore,
      commuteScore,
      amenitiesScore,
      mobilityAlign,
      targetAlign,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const prefs = (body?.prefs || {}) as UserPrefs;
    const listing = (body?.listing || {}) as ListingPayload;
    
    console.log('[pro-recap] Request received', {
      hasAddress: !!listing.address,
      hasCoords: listing.lat != null && listing.lon != null,
      hasTargets: !!listing.targets?.length,
      hasPrefs: !!prefs.placeTargets?.length,
      envVars: {
        hasHowloudKey: !!HOWLOUD_API_KEY,
        hasHowloudClientId: !!HOWLOUD_CLIENT_ID,
        hasOpenWeatherKey: !!OPENWEATHER_API_KEY,
        hasMapboxToken: !!MAPBOX_ACCESS_TOKEN,
        hasOpenAIKey: !!OPENAI_API_KEY,
      }
    });

    // Geocode if coords missing - this must happen before environment API calls
    if ((listing.lat == null || listing.lon == null) && listing.address) {
      console.log('[pro-recap] Geocoding address for coordinates', { address: listing.address });
      const geo = await geocodeOpenWeather(listing.address);
      if (geo) {
        listing.lat = geo.lat;
        listing.lon = geo.lon;
        console.log('[pro-recap] Geocoding successful', { lat: listing.lat, lon: listing.lon });
      } else {
        console.warn('[pro-recap] Geocoding failed, environment APIs may not work', { address: listing.address });
      }
    }

    // Log coordinate status before API calls
    console.log('[pro-recap] Coordinate status before API calls', {
      hasCoords: listing.lat != null && listing.lon != null,
      lat: listing.lat,
      lon: listing.lon,
      address: listing.address
    });

    // Find places for priorities using Mapbox if coords available
    if (listing.lat != null && listing.lon != null && listing.targets && prefs.placeTargets) {
      const targetPromises = listing.targets.map(async (target) => {
        // If already has places, keep them
        if (target.places && target.places.length > 0) return target;
        
        const placeTarget = prefs.placeTargets.find(pt => pt.label.toLowerCase() === target.label.toLowerCase());
        if (!placeTarget) return target;
        
        // Search for places near the property
        const searchQuery = `${target.label} near ${listing.address || listing.lat + ',' + listing.lon}`;
        const places = await findPlacesNearby(
          { lat: listing.lat!, lon: listing.lon! },
          searchQuery,
          3 // Find up to 3 places
        );
        
        // Set distanceMiles to closest place's distance (or null if no results)
        const closestDistance = places.length > 0 ? places[0].distanceMiles : null;
        
        return { 
          ...target, 
          distanceMiles: closestDistance,
          places: places.length > 0 ? places : undefined
        };
      });
      listing.targets = await Promise.all(targetPromises);
    }

    // Fetch all environment APIs in parallel - only if we have coordinates (or address for Howloud)
    const [hl, air, lpm] = await Promise.all([
      listing.address ? fetchHowloud(listing.address) : Promise.resolve(null),
      listing.lat != null && listing.lon != null ? fetchAirQuality(listing.lat, listing.lon) : Promise.resolve(null),
      listing.lat != null && listing.lon != null ? fetchLightPollution(listing.lat, listing.lon) : Promise.resolve(null),
    ]);

    // Update environment data
    if (hl) {
      listing.environment = {
        ...(listing.environment || {}),
        sound: hl.label,
        soundScore: hl.score,
      } as any;
    }
    if (air) {
      listing.environment = {
        ...(listing.environment || {}),
        airScore: air.score,
        air: air.label,
      } as any;
    }
    if (lpm) {
      listing.environment = {
        ...(listing.environment || {}),
        lightScore: lpm.score,
        light: lpm.label,
      } as any;
    }

    const result = await scorePro(listing, prefs);
    
    // Set environment labels in result
    result.environment = {};
    if (hl) {
      result.environment.soundScore = hl.score;
      result.environment.soundLabel = hl.label;
    }
    if (air) {
      result.environment.airScore = air.score;
      result.environment.airLabel = air.label;
    }
    if (lpm) {
      result.environment.lightScore = lpm.score;
      result.environment.lightLabel = lpm.label;
      if (lpm.stargazingScore != null) {
        result.environment.stargazingScore = lpm.stargazingScore;
      }
      if (lpm.stargazingLabel) {
        result.environment.stargazingLabel = lpm.stargazingLabel;
      }
    }
    
    // Add debug info to help investigate API issues
    result.debug = {
      ...(result.debug || {}),
      apiStatus: {
        howloud: hl ? 'success' : 'failed',
        openWeather: air ? 'success' : 'failed',
        lightPollution: lpm ? 'success' : 'failed',
        mapbox: listing.targets?.some(t => t.distanceMiles != null) ? 'success' : 'failed',
      },
      envVarsPresent: {
        howloudKey: !!HOWLOUD_API_KEY,
        howloudClientId: !!HOWLOUD_CLIENT_ID,
        openWeatherKey: !!OPENWEATHER_API_KEY,
        mapboxToken: !!MAPBOX_ACCESS_TOKEN,
        openAIKey: !!OPENAI_API_KEY,
      },
      coords: listing.lat != null && listing.lon != null ? { lat: listing.lat, lon: listing.lon } : null,
      address: listing.address,
    };
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[pro-recap] serve error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});

