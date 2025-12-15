import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOWLOUD_API_KEY = Deno.env.get('HOWLOUD_API_KEY');
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
  environmentalPrefs?: ('airQuality' | 'soundScore' | 'stargazeScore')[];
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
  environment?: { sound?: string; air?: string; sky?: string; soundScore?: number; airScore?: number };
  commuteScore?: number; // 0–100
  targets?: EvaluatedTarget[];
}

interface ProResult {
  basicReconScore: number; // 0–100 (Free score - generic, same for all users)
  missionFitScore: number; // 0–100 (Pro score - personalized based on targets/mobility)
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
  isProMode?: boolean; // True if user has preferences (Pro mode), false if no preferences (Free mode)
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

/**
 * Fetches sound score from Howloud API v2.
 * Uses lat/lng coordinates (not address) and only requires x-api-key header.
 * 
 * API docs: https://api.howloud.com/docs/
 * Endpoint: GET /v2/score
 * Response: { "status": "OK", "result": { "score": 80, ... } }
 */
async function fetchHowloud(lat?: number, lon?: number): Promise<{ score?: number; label: string } | null> {
  if (!lat || !lon || !HOWLOUD_API_KEY) {
    console.warn('[pro-recap] Howloud: missing coordinates or API key', { 
      hasLat: lat != null && Number.isFinite(lat), 
      hasLon: lon != null && Number.isFinite(lon),
      hasApiKey: !!HOWLOUD_API_KEY 
    });
    return null;
  }
  
  try {
    const url = new URL('https://api.howloud.com/v2/score');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lng', lon.toString());
    
    console.log('[pro-recap] Howloud: fetching', { 
      lat, 
      lon,
      url: url.toString(), 
      hasApiKey: !!HOWLOUD_API_KEY,
      apiKeyLength: HOWLOUD_API_KEY?.length || 0
    });
    
    const resp = await fetch(url.toString(), {
      headers: { 
        'x-api-key': HOWLOUD_API_KEY,
        'Content-Type': 'application/json'
      },
    });
    
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
    console.log('[pro-recap] Howloud: response', { 
      status: data?.status,
      hasResult: !!data?.result,
      isResultArray: Array.isArray(data?.result),
      resultLength: Array.isArray(data?.result) ? data.result.length : 0,
      dataKeys: Object.keys(data || {}),
      resultKeys: Array.isArray(data?.result) && data.result[0] ? Object.keys(data.result[0]) : []
    });
    
    // Response format: { "status": "OK", "result": [ { "score": 80, ... } ] }
    // Note: result is an array with one element
    const resultItem = Array.isArray(data?.result) && data.result.length > 0 ? data.result[0] : data?.result;
    const score = resultItem?.score;
    
    if (!Number.isFinite(score)) {
      console.warn('[pro-recap] Howloud: invalid score', { 
        data, 
        extractedScore: score,
        resultItem,
        resultItemKeys: resultItem ? Object.keys(resultItem) : []
      });
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

// Returns stargazing score based on Bortle scale
// New mapping:
// 1–2.99: Excellent (98)
// 3-3.99: Good (85)
// 4-4.99: Okay (70)
// 5–6.99: Not Great (45)
// 7–9: Not Good (20)
function stargazingScoreFromBortle(b?: number) {
  if (b == null || !Number.isFinite(b)) return undefined;
  if (b <= 2.99) return 98; // Excellent
  if (b <= 3.99) return 85; // Good
  if (b <= 4.99) return 70; // Okay
  if (b <= 6.99) return 45; // Not Great
  return 20; // Not Good (7-9)
}

// Map Bortle value to stargazing label
function bortleToStargazingLabel(b?: number): string {
  if (b == null || !Number.isFinite(b)) return 'Unknown';
  if (b <= 2.99) return 'Excellent';
  if (b <= 3.99) return 'Good';
  if (b <= 4.99) return 'Okay';
  if (b <= 6.99) return 'Not Great';
  return 'Not Good'; // 7-9
}

async function fetchLightPollution(lat?: number, lon?: number): Promise<{ stargazingScore?: number; stargazingLabel?: string } | null> {
  if (lat == null || lon == null) {
    console.warn('[pro-recap] LightPollutionMap: missing coords', { lat, lon });
    return null;
  }
  try {
    // Use the API endpoint directly instead of scraping HTML
    // The site calls this API when loading: /api/lightpollution?lat={lat}&lon={lon}
    const apiUrl = `https://lightpollutionmap.app/api/lightpollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    console.log('[pro-recap] LightPollutionMap: fetching API', { lat, lon, url: apiUrl });
    
    const resp = await fetch(apiUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://lightpollutionmap.app/',
        'Origin': 'https://lightpollutionmap.app'
      } 
    });
    
    // Try to parse response as JSON first, even if status is not ok
    let data: any;
    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    if (isJson) {
      try {
        data = await resp.json();
      } catch (e) {
        const errorText = await resp.text().catch(() => 'Unable to read error response');
        console.warn('[pro-recap] LightPollutionMap: Failed to parse JSON response', { 
          status: resp.status, 
          statusText: resp.statusText,
          errorBody: errorText.substring(0, 500),
          parseError: (e as Error)?.message
        });
        return fetchLightPollutionFallback(lat, lon);
      }
    } else {
      const errorText = await resp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] LightPollutionMap: API returned non-JSON response', { 
        status: resp.status, 
        statusText: resp.statusText,
        contentType,
        errorBody: errorText.substring(0, 500)
      });
      return fetchLightPollutionFallback(lat, lon);
    }
    
    // Check if response indicates an error
    if (!resp.ok || data?.error) {
      console.warn('[pro-recap] LightPollutionMap: API error response', { 
        status: resp.status, 
        statusText: resp.statusText,
        error: data?.error,
        message: data?.message,
        code: data?.code,
        fullResponse: JSON.stringify(data).substring(0, 500)
      });
      
      // If it's an access denied error, try HTML scraping
      if (data?.code === 'CORS_BLOCKED' || data?.error === 'Access denied' || resp.status === 403) {
        console.log('[pro-recap] LightPollutionMap: API access denied, falling back to HTML scraping');
        return fetchLightPollutionFallback(lat, lon);
      }
      
      // For other errors, still try to extract data if present
      if (!data?.bortle && !data?.bortleScale) {
        return fetchLightPollutionFallback(lat, lon);
      }
    }
    console.log('[pro-recap] LightPollutionMap: API response received', { 
      status: resp.status,
      statusOk: resp.ok,
      dataKeys: Object.keys(data || {}),
      dataType: typeof data,
      hasBortle: 'bortle' in (data || {}),
      fullResponse: JSON.stringify(data).substring(0, 1000)
    });
    
    // Extract Bortle value from JSON response
    // Try various possible field names (bortle, bortleScale, pollution, etc.)
    let bortle: number | undefined;
    let category: string | undefined;
    
    // Direct bortle field
    if (typeof data?.bortle === 'number') {
      bortle = data.bortle;
    } else if (typeof data?.bortleScale === 'number') {
      bortle = data.bortleScale;
    } else if (typeof data?.pollution?.bortle === 'number') {
      bortle = data.pollution.bortle;
    } else if (typeof data?.data?.bortle === 'number') {
      bortle = data.data.bortle;
    } else if (typeof data?.result?.bortle === 'number') {
      bortle = data.result.bortle;
    }
    
    // Extract category/label if available
    if (typeof data?.category === 'string') {
      category = data.category;
    } else if (typeof data?.label === 'string') {
      category = data.label;
    } else if (typeof data?.pollution?.category === 'string') {
      category = data.pollution.category;
    } else if (typeof data?.data?.category === 'string') {
      category = data.data.category;
    }
    
    // Validate Bortle is in reasonable range (1-9) and round to 2 decimal places
    let finalBortle: number | undefined;
    if (bortle != null && Number.isFinite(bortle)) {
      if (bortle >= 1 && bortle <= 9) {
        // Round to 2 decimal places for display
        finalBortle = Math.round(bortle * 100) / 100;
      } else {
        console.warn('[pro-recap] LightPollutionMap: Bortle value out of range', { 
          bortle, 
          expectedRange: '1-9',
          data
        });
      }
    }
    
    // If no valid Bortle found in API response
    if (!finalBortle) {
      console.warn('[pro-recap] LightPollutionMap: Could not extract valid Bortle from API response', {
        data,
        dataKeys: Object.keys(data || {}),
        hasBortle: 'bortle' in (data || {}),
        note: 'API response structure may be different than expected. Falling back to HTML scraping.'
      });
      // Fall back to HTML scraping
      return fetchLightPollutionFallback(lat, lon);
    }
    
    console.log('[pro-recap] LightPollutionMap: parsed from API', { 
      bortle: finalBortle, 
      category,
      isValid: finalBortle != null && finalBortle >= 1 && finalBortle <= 9
    });
    
    // Calculate stargazing score and label from Bortle value
    const stargazingScore = stargazingScoreFromBortle(finalBortle);
    const stargazingLabel = bortleToStargazingLabel(finalBortle);
    
    console.log('[pro-recap] LightPollutionMap: success', { 
      stargazingLabel,
      stargazingScore, 
      bortle: finalBortle,
      category
    });
    
    return { 
      stargazingScore,
      stargazingLabel
    };
  } catch (err) {
    console.error('[pro-recap] LightPollutionMap: fetch error', { error: err, message: (err as Error)?.message });
    // Fall back to HTML scraping if API call fails
    return fetchLightPollutionFallback(lat, lon);
  }
}

/**
 * Fallback function to scrape HTML from lightpollutionmap.app
 * Used when API endpoint is unavailable or returns unexpected structure
 */
async function fetchLightPollutionFallback(lat?: number, lon?: number): Promise<{ stargazingScore?: number; stargazingLabel?: string } | null> {
  if (lat == null || lon == null) {
    return null;
  }
  try {
    const url = `${LPM_BASE}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lon)}`;
    console.log('[pro-recap] LightPollutionMap: fallback HTML scraping', { lat, lon, url });
    const resp = await fetch(url, { headers: { 'User-Agent': 'NestRecon/1.0' } });
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] LightPollutionMap: HTML fallback error', { 
        status: resp.status, 
        statusText: resp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return null;
    }
    const html = await resp.text();
    console.log('[pro-recap] LightPollutionMap: HTML response received', { htmlLength: html.length });
    
    // Parse category text from id="pollution-category" (e.g., "High")
    const pollutionCategoryMatch = html.match(/id=["']pollution-category["'][^>]*>([^<]+)</i);
    const category = pollutionCategoryMatch ? pollutionCategoryMatch[1].trim() : undefined;
    
    // Parse Bortle value using multiple methods
    let bortle: number | undefined;
    let bortleValue: string | undefined;
    
    // Method 1: Try id="pollution-value" element (e.g., "7.4" or "6.2")
    const pollutionValueMatch = html.match(/id=["']pollution-value["'][^>]*>([^<]+)</i);
    if (pollutionValueMatch) {
      bortleValue = pollutionValueMatch[1].trim();
      // Skip if value is "--" (data not loaded yet) or empty
      if (bortleValue && bortleValue !== '--' && bortleValue !== '') {
        // Extract number from the value (handles "7.4", "6.2", etc.)
        const numMatch = bortleValue.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (numMatch) {
          bortle = Number(numMatch[1]);
        }
      }
    }
    
    // Method 2: Look for embedded JSON data in script tags (more comprehensive search)
    if (!bortle || !Number.isFinite(bortle)) {
      // Look for any script tag containing JSON with bortle data
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          // Try to find JSON objects with bortle
          const jsonMatches = script.match(/{[^{}]*bortle[^{}]*}/i);
          if (jsonMatches) {
            try {
              const jsonData = JSON.parse(jsonMatches[0]);
              if (typeof jsonData.bortle === 'number') {
                bortle = jsonData.bortle;
                bortleValue = String(jsonData.bortle);
                break;
              }
            } catch (e) {
              // Try to extract bortle value directly from the script
              const bortleNumMatch = script.match(/bortle["\s:]*([0-9]+(?:\.[0-9]+)?)/i);
              if (bortleNumMatch) {
                const matchedValue = Number(bortleNumMatch[1]);
                if (matchedValue >= 1 && matchedValue <= 9) {
                  bortle = matchedValue;
                  bortleValue = bortleNumMatch[1];
                  break;
                }
              }
            }
          }
          
          // Also look for lat/lon coordinates and bortle in the same context
          const coordBortleMatch = script.match(new RegExp(`${lat}[^}]*bortle[^}]*([0-9]+(?:\\.[0-9]+)?)`, 'i'));
          if (coordBortleMatch && !bortle) {
            const matchedValue = Number(coordBortleMatch[1]);
            if (matchedValue >= 1 && matchedValue <= 9) {
              bortle = matchedValue;
              bortleValue = coordBortleMatch[1];
              break;
            }
          }
        }
      }
    }
    
    // Method 3: Look for window.__INITIAL_STATE__ or similar patterns with full object parsing
    if (!bortle || !Number.isFinite(bortle)) {
      const statePatterns = [
        /window\.__[A-Z_]+__\s*=\s*({[\s\S]*?});/i,
        /const\s+\w+\s*=\s*({[\s\S]*?});/i,
        /let\s+\w+\s*=\s*({[\s\S]*?});/i,
        /var\s+\w+\s*=\s*({[\s\S]*?});/i
      ];
      
      for (const pattern of statePatterns) {
        const stateMatch = html.match(pattern);
        if (stateMatch) {
          try {
            const state = JSON.parse(stateMatch[1]);
            // Recursively search for bortle in the state object
            const findBortle = (obj: any, depth = 0): number | undefined => {
              if (depth > 10) return undefined; // Prevent infinite recursion
              if (typeof obj !== 'object' || obj === null) return undefined;
              if (typeof obj.bortle === 'number' && obj.bortle >= 1 && obj.bortle <= 9) return obj.bortle;
              if (typeof obj.bortleScale === 'number' && obj.bortleScale >= 1 && obj.bortleScale <= 9) return obj.bortleScale;
              if (typeof obj.pollution?.bortle === 'number') return obj.pollution.bortle;
              for (const key in obj) {
                const found = findBortle(obj[key], depth + 1);
                if (found != null) return found;
              }
              return undefined;
            };
            const foundBortle = findBortle(state);
            if (foundBortle != null) {
              bortle = foundBortle;
              bortleValue = String(foundBortle);
              break;
            }
          } catch (e) {
            // JSON parse failed, continue
          }
        }
      }
    }
    
    // Method 4: Look for "Bortle" followed by number in content (avoid meta tags)
    if (!bortle || !Number.isFinite(bortle)) {
      const contentSections = html.split(/<meta[^>]*>/i);
      for (const section of contentSections) {
        const bortleMatch = section.match(/Bortle[^0-9]*([0-9]+(?:\.[0-9]+)?)/i);
        if (bortleMatch) {
          const matchedValue = Number(bortleMatch[1]);
          if (matchedValue >= 1 && matchedValue <= 9) {
            bortle = matchedValue;
            bortleValue = bortleMatch[1];
            break;
          }
        }
      }
    }
    
    // Validate Bortle is in reasonable range (1-9) and round to 2 decimal places
    let finalBortle: number | undefined;
    if (bortle != null && Number.isFinite(bortle)) {
      if (bortle >= 1 && bortle <= 9) {
        // Round to 2 decimal places for display
        finalBortle = Math.round(bortle * 100) / 100;
      }
    }
    
    // If still no valid Bortle, check if data wasn't loaded yet (shows "--")
    if (!finalBortle) {
      const hasPlaceholder = bortleValue === '--' || category === '--';
      if (hasPlaceholder) {
        console.log('[pro-recap] LightPollutionMap: Data not loaded yet (shows "--"), page uses JavaScript to load data', {
          bortleValue,
          category,
          note: 'Light pollution data loads dynamically via JavaScript. The initial HTML does not contain the actual values.'
        });
        return null;
      }
    }
    
    if (!finalBortle) {
      console.warn('[pro-recap] LightPollutionMap: Could not parse valid Bortle from HTML', {
        bortleValue,
        category
      });
      return null;
    }
    
    // Calculate stargazing score and label from Bortle value
    const stargazingScore = stargazingScoreFromBortle(finalBortle);
    const stargazingLabel = bortleToStargazingLabel(finalBortle);
    
    console.log('[pro-recap] LightPollutionMap: fallback success', { 
      stargazingLabel,
      stargazingScore, 
      bortle: finalBortle
    });
    
    return { 
      stargazingScore,
      stargazingLabel
    };
  } catch (err) {
    console.error('[pro-recap] LightPollutionMap: fallback error', { error: err, message: (err as Error)?.message });
    return null;
  }
}

/**
 * Maps distance to nearest POI to a 0-10 score using a sweet spot curve.
 * Uses the closest result for each target to define the score.
 * 
 * Scoring curve:
 * - d ≤ 0.1 mi: 7 (Very close, possible nuisance)
 * - 0.1 < d ≤ 0.5 mi: 9 (Close and convenient)
 * - 0.5 < d ≤ 2 mi: 10 (Sweet spot - ideal)
 * - 2 < d ≤ 5 mi: 8 (Convenient)
 * - 5 < d ≤ 10 mi: 6 (Somewhat far)
 * - 10 < d ≤ 15 mi: 4 (Far)
 * - d > 15 mi: 2 (Very far)
 */
function distanceToTargetScore(distanceMiles: number | null): number {
  if (distanceMiles == null || !Number.isFinite(distanceMiles)) {
    return 2; // Default to poor score if distance unknown
  }
  
  const d = distanceMiles;
  if (d <= 0.1) return 7;      // Very close (possible nuisance)
  if (d <= 0.5) return 9;      // Close and convenient
  if (d <= 2) return 10;       // Sweet spot
  if (d <= 5) return 8;        // Convenient
  if (d <= 10) return 6;       // Somewhat far
  if (d <= 15) return 4;       // Far
  return 2;                    // Very far
}

function scoreTarget(t: EvaluatedTarget): number {
  // If no places found, significantly hurt the score
  if (!t.places || t.places.length === 0) {
    return 2; // Low score for no results
  }
  
  // Use the closest POI's distance (first result is already sorted by distance)
  // Apply the new distance-based scoring curve
  return distanceToTargetScore(t.distanceMiles);
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

/**
 * Scores mobility for Free users - uses ALL available mobility signals.
 * This gives a generic score that doesn't depend on user preferences.
 */
function scoreMobilityFree(mob?: ListingPayload['mobility']) {
  const scores: number[] = [];
  if (mob?.walk != null) scores.push(to0to10(mob.walk)!);
  if (mob?.bike != null) scores.push(to0to10(mob.bike)!);
  if (mob?.transit != null) scores.push(to0to10(mob.transit)!);
  return scores.length ? avg(scores) : 5;
}

/**
 * Scores mobility for Pro users - only uses signals the user selected.
 * If user checked Walk + Bike, only those are scored. Transit is ignored if not selected.
 */
function scoreEnvironmentFit(env?: ListingPayload['environment'], prefs?: ('airQuality' | 'soundScore' | 'stargazeScore')[]) {
  // Environmental scoring: penalize poor scores when user cares about these factors
  const scores: number[] = [];
  const include = new Set(prefs || []);

  if (include.has('soundScore') && env?.soundScore != null) {
    // Sound scores: higher = quieter (better). Penalize noisy areas
    const soundNormalized = Math.min(env.soundScore / 10, 10); // 0-100 → 0-10 scale
    scores.push(soundNormalized);
  }

  if (include.has('airQuality') && env?.airScore != null) {
    // Air quality scores: higher = better air. Penalize poor air quality
    scores.push(env.airScore / 10); // 0-100 → 0-10 scale
  }

  if (include.has('stargazeScore') && env?.stargazingScore != null) {
    // Stargazing scores: higher = better conditions. Penalize light pollution
    scores.push(env.stargazingScore / 10); // 0-100 → 0-10 scale
  }

  return scores.length ? avg(scores) : null; // Return null if no environmental prefs selected
}

function scoreMobilityFit(mob?: ListingPayload['mobility'], signals?: MobilitySignal[]) {
  const sel: number[] = [];
  const include = new Set(signals || []);
  if (include.has('walk') && mob?.walk != null) sel.push(to0to10(mob.walk)!);
  if (include.has('bike') && mob?.bike != null) sel.push(to0to10(mob.bike)!);
  if (include.has('transit') && mob?.transit != null) sel.push(to0to10(mob.transit)!);
  return sel.length ? avg(sel) : 5;
}

/**
 * Scores environment fit for Pro users - only uses environmental factors the user selected.
 * If user checked Air Quality + Sound Score, only those are scored. Stargazing is ignored if not selected.
 */

/**
 * Scores targets fit for Pro users with coverage modifier.
 * Applies a penalty when targets are not found (makes Pro score feel more personalized).
 * 
 * Coverage modifier:
 * - coverage = foundTargets / totalTargets (0-1)
 * - coverageBoost = 0.85 + 0.15 * coverage (0.85-1.0)
 * - targetsFitScore *= coverageBoost
 * 
 * So if Mapbox fails to find a category, the Pro score visibly drops.
 */
function scoreTargetsFit(targets?: EvaluatedTarget[]): number {
  if (!targets || !targets.length) return 3; // Unknown/no result
  
  const scores = targets.map(scoreTarget);
  const meanScore = avg(scores);
  
  // Calculate coverage: how many targets were found (have places)
  const foundTargets = targets.filter(t => t.places && t.places.length > 0).length;
  const totalTargets = targets.length;
  const coverage = totalTargets > 0 ? foundTargets / totalTargets : 0;
  
  // Apply coverage modifier: 0.85-1.0 boost based on how many targets were found
  const coverageBoost = 0.85 + 0.15 * coverage;
  const targetsFitScore = meanScore * coverageBoost;
  
  return clamp(targetsFitScore, 0, 10);
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
    // Use Mapbox Search Box API to find POIs (Points of Interest)
    // Note: Mapbox uses lon,lat order (opposite of Google Maps)
    // Use customer's exact query text - no conversion needed
    const searchUrl = new URL('https://api.mapbox.com/search/searchbox/v1/forward');
    searchUrl.searchParams.set('q', query); // Customer's exact search terms
    searchUrl.searchParams.set('types', 'poi'); // Only return POIs, not addresses
    searchUrl.searchParams.set('proximity', `${origin.lon},${origin.lat}`); // lon,lat order
    searchUrl.searchParams.set('limit', Math.max(maxResults, 5).toString()); // Get enough results for top matches
    searchUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
    
    console.log('[pro-recap] Mapbox Search Box: fetching POIs', { query, origin, maxResults, hasToken: !!MAPBOX_ACCESS_TOKEN });
    const searchResp = await fetch(searchUrl.toString());
    if (!searchResp.ok) {
      const errorText = await searchResp.text().catch(() => 'Unable to read error response');
      console.warn('[pro-recap] Mapbox Search Box: API error', { 
        status: searchResp.status, 
        statusText: searchResp.statusText,
        errorBody: errorText.substring(0, 500)
      });
      return [];
    }
    
    const searchData = await searchResp.json();
    console.log('[pro-recap] Mapbox Search Box: response', { 
      resultsCount: searchData.features?.length || 0,
      hasFeatures: !!searchData.features,
      responseKeys: Object.keys(searchData),
      firstFeatureKeys: searchData.features?.[0] ? Object.keys(searchData.features[0]) : [],
      firstFeatureStructure: searchData.features?.[0] ? {
        hasGeometry: !!searchData.features[0].geometry,
        geometryType: searchData.features[0].geometry?.type,
        hasCoordinates: !!searchData.features[0].geometry?.coordinates,
        coordinates: searchData.features[0].geometry?.coordinates,
        hasCenter: !!searchData.features[0].center,
        center: searchData.features[0].center,
        hasProperties: !!searchData.features[0].properties,
        propertiesKeys: searchData.features[0].properties ? Object.keys(searchData.features[0].properties) : []
      } : null
    });
    
    if (!searchData.features || searchData.features.length === 0) {
      console.warn('[pro-recap] Mapbox Search Box: no results', { query, responseData: searchData });
      return [];
    }
    
    // Take all results for distance filtering (we'll filter by distance later)
    const places = searchData.features;
    
    // Extract coordinates (Mapbox uses [lon, lat] in coordinates array)
    const placeCoords = places.map((p, idx) => {
      const coords = p.geometry?.coordinates || p.center || [];
      const extracted = { lon: coords[0], lat: coords[1] };
      console.log(`[pro-recap] Mapbox Search Box: place ${idx} coordinates`, {
        hasGeometry: !!p.geometry,
        hasCoordinates: !!p.geometry?.coordinates,
        coordinates: p.geometry?.coordinates,
        hasCenter: !!p.center,
        center: p.center,
        extracted: extracted,
        isValid: Number.isFinite(extracted.lon) && Number.isFinite(extracted.lat)
      });
      return extracted;
    });
    
    // Filter out invalid coordinates
    const validCoords = placeCoords.filter(c => Number.isFinite(c.lon) && Number.isFinite(c.lat));
    console.log('[pro-recap] Mapbox Search Box: coordinate extraction', {
      totalPlaces: places.length,
      validCoords: validCoords.length,
      invalidCoords: placeCoords.length - validCoords.length
    });
    
    if (validCoords.length === 0) {
      console.warn('[pro-recap] Mapbox Search Box: no valid coordinates extracted', {
        places: places.map(p => ({
          hasGeometry: !!p.geometry,
          geometry: p.geometry,
          hasCenter: !!p.center,
          center: p.center
        }))
      });
      return [];
    }
    
    // Calculate distances using Mapbox Matrix API
    // Format: {lon1},{lat1};{lon2},{lat2};...
    // Only use places with valid coordinates
    const validPlaces = places.filter((p, idx) => {
      const coords = p.geometry?.coordinates || p.center || [];
      return Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
    });
    
    // Matrix API format: origin;dest1;dest2;...
    // distances[0] will be [0, dist1, dist2, ...] where 0 is origin-to-origin
    // So we need to skip the first element (index 0) when matching to places
    const coordinates = `${origin.lon},${origin.lat};${validCoords.map(c => `${c.lon},${c.lat}`).join(';')}`;
    const matrixUrl = new URL(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/${coordinates}`);
    matrixUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
    matrixUrl.searchParams.set('annotations', 'distance,duration'); // Request distances and durations for complete routing data
    
    console.log('[pro-recap] Mapbox Matrix: fetching', { 
      origin: `${origin.lon},${origin.lat}`, 
      destinationsCount: validCoords.length,
      coordinatesString: coordinates.substring(0, 200) + '...',
      matrixUrl: matrixUrl.toString().substring(0, 200) + '...'
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
      return validPlaces.map((p) => {
        const coords = p.geometry?.coordinates || p.center || [];
        const lat = coords[1] || 0;
        const lon = coords[0] || 0;
        const placeName = p.properties?.name || p.place_name || p.text || 'Unknown';
        const placeAddress = p.properties?.full_address || p.properties?.address || p.place_name || 'Address not available';
        return {
          name: placeName,
          address: placeAddress,
          distanceMiles: 0, // Will be marked as unknown
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`,
          placeId: p.id || p.properties?.mapbox_id
        };
      });
    }
    
    const matrixData = await matrixResp.json();
    console.log('[pro-recap] Mapbox Matrix: response', { 
      hasDistances: !!matrixData.distances,
      hasDurations: !!matrixData.durations,
      distancesCount: matrixData.distances?.[0]?.length || 0,
      durationsCount: matrixData.durations?.[0]?.length || 0,
      distancesStructure: matrixData.distances ? {
        isArray: Array.isArray(matrixData.distances),
        length: matrixData.distances.length,
        firstElementIsArray: Array.isArray(matrixData.distances[0]),
        firstElementLength: matrixData.distances[0]?.length,
        sampleDistances: matrixData.distances[0]?.slice(0, 3)
      } : null,
      durationsStructure: matrixData.durations ? {
        isArray: Array.isArray(matrixData.durations),
        length: matrixData.durations.length,
        firstElementIsArray: Array.isArray(matrixData.durations[0]),
        firstElementLength: matrixData.durations[0]?.length,
        sampleDurations: matrixData.durations[0]?.slice(0, 3)
      } : null,
      fullResponseKeys: Object.keys(matrixData),
      code: matrixData.code
    });
    
    // Build results with distances
    // Mapbox Matrix API returns distances[0] as array: [0, dist1, dist2, ...]
    // The first element (0) is origin-to-origin distance, so we skip it
    // distances[0][0] = 0 (origin to origin)
    // distances[0][1] = distance from origin to first destination
    // distances[0][2] = distance from origin to second destination, etc.
    const results: PlaceResult[] = [];
    const distances = matrixData.distances?.[0] || [];
    
    console.log('[pro-recap] Mapbox Matrix: processing results', {
      validPlacesCount: validPlaces.length,
      distancesCount: distances.length,
      expectedCount: validPlaces.length + 1, // +1 for origin-to-origin
      firstDistance: distances[0], // Should be 0 (origin-to-origin)
      hasDistances: distances.length > 0
    });
    
    if (distances.length === 0) {
      console.warn('[pro-recap] Mapbox Matrix: No distances in response, cannot calculate distances. Response structure:', {
        code: matrixData.code,
        hasDurations: !!matrixData.durations,
        responseKeys: Object.keys(matrixData)
      });
      // Return places without distances as fallback
      return validPlaces.map((p) => {
        const coords = p.geometry?.coordinates || p.center || [];
        const lat = coords[1] || 0;
        const lon = coords[0] || 0;
        const placeName = p.properties?.name || p.place_name || p.text || 'Unknown';
        const placeAddress = p.properties?.full_address || p.properties?.address || p.place_name || 'Address not available';
        return {
          name: placeName,
          address: placeAddress,
          distanceMiles: 0, // Will be marked as unknown
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`,
          placeId: p.id || p.properties?.mapbox_id
        };
      });
    }
    
    // Skip first distance (index 0) which is origin-to-origin (0 meters)
    // Match places[i] with distances[i+1]
    for (let i = 0; i < validPlaces.length; i++) {
      const place = validPlaces[i];
      const distanceIndex = i + 1; // Skip first element (origin-to-origin)
      const distanceMeters = distances[distanceIndex];
      
      // Get coordinates for logging
      const coords = place.geometry?.coordinates || place.center || [];
      const placeLat = coords[1] || 0;
      const placeLon = coords[0] || 0;
      const placeName = place.properties?.name || place.place_name || place.text || 'Unknown';
      
      console.log(`[pro-recap] Mapbox Matrix: processing place ${i}`, {
        placeName,
        placeCoordinates: `${placeLat},${placeLon}`,
        originCoordinates: `${origin.lat},${origin.lon}`,
        distanceIndex,
        distanceMeters,
        distanceMiles: distanceMeters ? (distanceMeters / 1609.34).toFixed(2) : null,
        isValid: distanceMeters != null && Number.isFinite(distanceMeters),
        allDistances: distances.slice(0, Math.min(6, distances.length)) // Log first few for debugging
      });
      
      if (distanceMeters != null && Number.isFinite(distanceMeters) && distanceMeters > 0) {
        const miles = distanceMeters / 1609.34; // Convert meters to miles
        const coords = place.geometry?.coordinates || place.center || [];
        const lat = coords[1] || 0;
        const lon = coords[0] || 0;
        
        // Search Box API response format: features have properties.name, properties.full_address, etc.
        const placeName = place.properties?.name || place.place_name || place.text || 'Unknown';
        const placeAddress = place.properties?.full_address || place.properties?.address || place.place_name || 'Address not available';
        
        results.push({
          name: placeName,
          address: placeAddress,
          distanceMiles: miles,
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`,
          placeId: place.id || place.properties?.mapbox_id
        });
        
        console.log(`[pro-recap] Mapbox Matrix: added result ${i}`, {
          placeName,
          distanceMiles: miles.toFixed(2),
          distanceMeters: distanceMeters.toFixed(0)
        });
      }
    }
    
    // Sort by distance (closest first)
    results.sort((a, b) => a.distanceMiles - b.distanceMiles);
    
    // Helper function to calculate straight-line (haversine) distance in miles
    function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    
    // For the closest result, conditionally use Directions API for more accurate routing distance
    // Only use Directions API when:
    // 1. Distance > 5 miles (Matrix API may be less accurate for longer distances)
    // 2. Matrix distance is > 2x straight-line distance (suggests routing inaccuracy)
    if (results.length > 0 && results[0].distanceMiles > 0) {
      const closestResult = results[0];
      const closestPlace = validPlaces.find(p => {
        const name = p.properties?.name || p.place_name || p.text || 'Unknown';
        return name === closestResult.name;
      });
      
      if (closestPlace) {
        const coords = closestPlace.geometry?.coordinates || closestPlace.center || [];
        const destLon = coords[0];
        const destLat = coords[1];
        
        // Calculate straight-line distance for validation
        const straightLineMiles = haversineDistance(origin.lat, origin.lon, destLat, destLon);
        const matrixMiles = closestResult.distanceMiles;
        
        // Determine if we should use Directions API for more accuracy
        const isLongDistance = matrixMiles > 5;
        const isPotentiallyInaccurate = matrixMiles > (straightLineMiles * 2);
        const shouldUseDirections = isLongDistance || isPotentiallyInaccurate;
        
        console.log('[pro-recap] Mapbox Matrix: distance validation', {
          placeName: closestResult.name,
          matrixDistanceMiles: matrixMiles.toFixed(2),
          straightLineMiles: straightLineMiles.toFixed(2),
          ratio: (matrixMiles / straightLineMiles).toFixed(2),
          isLongDistance,
          isPotentiallyInaccurate,
          shouldUseDirections
        });
        
        if (shouldUseDirections) {
          try {
            // Use Directions API with driving-traffic profile for more accurate routing
            const directionsUrl = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin.lon},${origin.lat};${destLon},${destLat}`);
            directionsUrl.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
            directionsUrl.searchParams.set('geometries', 'geojson');
            
            console.log('[pro-recap] Mapbox Directions: fetching accurate distance for closest result', {
              placeName: closestResult.name,
              origin: `${origin.lat},${origin.lon}`,
              destination: `${destLat},${destLon}`,
              reason: isLongDistance ? 'long distance (>5mi)' : 'potentially inaccurate (>2x straight-line)'
            });
            
            const directionsResp = await fetch(directionsUrl.toString());
            if (directionsResp.ok) {
              const directionsData = await directionsResp.json();
              if (directionsData.routes && directionsData.routes.length > 0) {
                const route = directionsData.routes[0];
                const accurateDistanceMeters = route.distance;
                const accurateDistanceMiles = accurateDistanceMeters / 1609.34;
                
                const difference = accurateDistanceMiles - matrixMiles;
                const percentDiff = ((difference / matrixMiles) * 100).toFixed(1);
                
                console.log('[pro-recap] Mapbox Directions: distance comparison', {
                  placeName: closestResult.name,
                  matrixDistanceMiles: matrixMiles.toFixed(2),
                  directionsDistanceMiles: accurateDistanceMiles.toFixed(2),
                  straightLineMiles: straightLineMiles.toFixed(2),
                  differenceMiles: difference.toFixed(2),
                  percentDifference: `${percentDiff}%`,
                  improvement: Math.abs(difference) > 0.5 ? 'significant' : 'minor'
                });
                
                // Update the closest result with more accurate distance
                closestResult.distanceMiles = accurateDistanceMiles;
              }
            } else {
              console.warn('[pro-recap] Mapbox Directions: API error, using Matrix distance', {
                status: directionsResp.status,
                statusText: directionsResp.statusText
              });
            }
          } catch (err) {
            console.warn('[pro-recap] Mapbox Directions: error fetching accurate distance', {
              error: err instanceof Error ? err.message : String(err)
            });
            // Continue with Matrix API distance if Directions API fails
          }
        } else {
          console.log('[pro-recap] Mapbox Matrix: using Matrix distance (no Directions API needed)', {
            placeName: closestResult.name,
            matrixDistanceMiles: matrixMiles.toFixed(2),
            reason: 'distance ≤ 5mi and ratio ≤ 2x straight-line'
          });
        }
      }
    }
    
    // Limit to maxResults (just return the closest ones)
    const finalResults = results.slice(0, maxResults);
    
    console.log('[pro-recap] Mapbox findPlacesNearby: success', { 
      query, 
      foundCount: finalResults.length,
      places: finalResults.map(p => ({ name: p.name, distance: p.distanceMiles.toFixed(2) }))
    });
    
    return finalResults;
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
  scores: { basicReconScore: number; missionFitScore: number }
): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('[pro-recap] OpenAI: missing API key, using fallback');
    return buildRecapFallback(listing, prefs, targetScores);
  }

  try {
    // Build priorities list with contextual distance information
    const prioritiesList = targetScores.length
      ? targetScores.map(t => {
          if (!t.places || t.places.length === 0) {
            return `${t.label}: No nearby options found`;
          }

          const closest = t.places[0];
          let distanceContext = '';

          if (closest.distanceMiles < 0.5) {
            distanceContext = 'walking distance';
          } else if (closest.distanceMiles < 2) {
            distanceContext = 'short drive';
          } else if (closest.distanceMiles < 5) {
            distanceContext = 'convenient drive';
          } else if (closest.distanceMiles < 10) {
            distanceContext = 'reasonable drive';
          } else {
            distanceContext = 'longer drive';
          }

          return `${t.label}: ${closest.name} (${distanceContext}, ${closest.distanceMiles.toFixed(1)} mi)`;
        }).join('; ')
      : 'None specified';

    // Build environmental context
    const envParts: string[] = [];
    if (prefs.environmentalPrefs?.includes('soundScore') && listing.environment?.soundScore != null) {
      const soundLabel = listing.environment.soundScore > 75 ? 'quiet' :
                        listing.environment.soundScore > 50 ? 'moderate' : 'noisy';
      envParts.push(`${soundLabel} sound levels`);
    }
    if (prefs.environmentalPrefs?.includes('airQuality') && listing.environment?.airScore != null) {
      const airLabel = listing.environment.airScore > 75 ? 'excellent' :
                      listing.environment.airScore > 50 ? 'good' :
                      listing.environment.airScore > 25 ? 'fair' : 'poor';
      envParts.push(`${airLabel} air quality`);
    }
    if (prefs.environmentalPrefs?.includes('stargazeScore') && listing.environment?.stargazingScore != null) {
      const skyLabel = listing.environment.stargazingScore > 75 ? 'excellent' :
                      listing.environment.stargazingScore > 50 ? 'good' :
                      listing.environment.stargazingScore > 25 ? 'fair' : 'poor';
      envParts.push(`${skyLabel} stargazing conditions`);
    }
    const envSummary = envParts.length ? envParts.join(', ') : 'Not evaluated';

    // Build school quality context
    const schoolParts: string[] = [];
    if (listing.schools && listing.schools.length > 0) {
      const avgSchoolScore = listing.schools.reduce((sum, s) => sum + s.score, 0) / listing.schools.length;
      const schoolQuality = avgSchoolScore > 8 ? 'excellent' :
                           avgSchoolScore > 6 ? 'good' :
                           avgSchoolScore > 4 ? 'average' : 'poor';
      schoolParts.push(`${schoolQuality} schools`);
    }
    const schoolSummary = schoolParts.length ? schoolParts.join(', ') : 'School data not available';

    // Summarize what's actually available nearby
    const availabilitySummary = targetScores.map(t => {
      if (!t.places || t.places.length === 0) {
        return `${t.label}: not available nearby`;
      }
      const closest = t.places[0];
      const access = closest.distanceMiles < 0.5 ? 'very close' :
                    closest.distanceMiles < 2 ? 'close' :
                    closest.distanceMiles < 5 ? 'convenient' : 'far';
      return `${t.label}: ${access}`;
    }).join(', ');

    const prompt = `Property: ${listing.address || 'Unknown address'}
${listing.basics?.beds ? `${listing.basics.beds} bed, ${listing.basics.baths} bath, ${listing.basics.sqft?.toLocaleString()} sqft` : ''}
${listing.basics?.year ? `Built ${listing.basics.year}` : ''}

What's nearby: ${availabilitySummary || 'Limited amenities nearby'}

School quality: ${schoolSummary}

Environmental factors: ${envSummary}

${prefs.extraFocusNotes ? `Additional context: ${prefs.extraFocusNotes}` : ''}

You are a friendly, direct real estate advisor. Give a clear recommendation (1-2 sentences): should this buyer pursue this property or look elsewhere? Be honest about drawbacks but keep it conversational. Consider lifestyle fit and long-term needs. Keep it simple and friendly.`;

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

  // Provide more tangible distance feedback
  if (targetScores.length) {
    const excellent = targetScores.filter((t) => t.distanceMiles != null && t.distanceMiles <= 2);
    const good = targetScores.filter((t) => t.distanceMiles != null && t.distanceMiles > 2 && t.distanceMiles <= 5);
    const fair = targetScores.filter((t) => t.distanceMiles != null && t.distanceMiles > 5);

    if (excellent.length > 0) {
      parts.push(`Excellent proximity: ${excellent.map(t => t.label).join(', ')}`);
    }
    if (good.length > 0) {
      parts.push(`Convenient access: ${good.map(t => t.label).join(', ')}`);
    }
    if (fair.length > 0) {
      parts.push(`Longer distance: ${fair.map(t => t.label).join(', ')}`);
    }

    const noResults = targetScores.filter((t) => !t.places || t.places.length === 0);
    if (noResults.length > 0) {
      parts.push(`No nearby ${noResults.map(t => t.label).join(', ')} found`);
    }
  }


  if (prefs.extraFocusNotes) {
    parts.push(`Notes: ${prefs.extraFocusNotes}`);
  }

  return parts.length ? parts.join(' · ') : 'Property evaluation in progress';
}

async function scorePro(listing: ListingPayload, prefs: UserPrefs): Promise<ProResult> {
  // Calculate component scores (used by both Free and Pro)
  const basicsScore = scoreBasics(listing.basics);
  const schoolsScore = scoreSchools(listing.schools);
  
  // ===== FREE SCORE: Basic Recon Score (Generic, preference-agnostic) =====
  // Formula: Home Basics 40% + Schools 30% + Mobility 20% + Environment 10%
  // Same score for every user viewing the same listing
  const mobilityFreeScore = scoreMobilityFree(listing.mobility);
  const envScore = 5; // Neutral constant for Free score
  
  const free0to10 =
    basicsScore * 0.40 +
    schoolsScore * 0.30 +
    mobilityFreeScore * 0.20 +
    envScore * 0.10;
  
  const basicReconScore = Math.round(free0to10 * 10);
  
  // ===== PRO SCORE: Mission Fit Score (Personalized) =====
  // Detect Free vs Pro mode
  const hasTargets = (prefs.placeTargets?.length ?? 0) > 0;
  const hasMobility = (prefs.mobilitySignals?.length ?? 0) > 0;
  const hasEnvironment = (prefs.environmentalPrefs?.length ?? 0) > 0;
  const isProMode = hasTargets || hasMobility || hasEnvironment;

  let missionFitScore: number;
  let targetsFitScore: number | undefined;
  let mobilityFitScore: number | undefined;
  let environmentFitScore: number | undefined;
  const targetScores: number[] = [];

  if (isProMode) {
    // Pro mode: Personalized score based on user's preferences
    // Dynamic formula based on what user cares about

    let totalWeight = 0;
    let pro0to10 = 0;

    // Calculate targets fit (with coverage modifier) - 40% if user has targets
    if (hasTargets) {
      targetsFitScore = scoreTargetsFit(listing.targets);
      pro0to10 += targetsFitScore * 0.40;
      totalWeight += 0.40;

      // Get target scores for debug/display
      if (listing.targets && listing.targets.length > 0) {
        listing.targets.forEach(t => targetScores.push(scoreTarget(t)));
      }
    }

    // Calculate mobility fit - 25% if user has mobility prefs
    if (hasMobility) {
      mobilityFitScore = scoreMobilityFit(listing.mobility, prefs.mobilitySignals);
      pro0to10 += mobilityFitScore * 0.25;
      totalWeight += 0.25;
    }

    // Calculate environment fit - 25% if user has environmental prefs
    if (hasEnvironment) {
      environmentFitScore = scoreEnvironmentFit(listing.environment, prefs.environmentalPrefs);
      if (environmentFitScore !== null) {
        pro0to10 += environmentFitScore * 0.25;
        totalWeight += 0.25;
      }
    }

    // Distribute remaining weight to schools (20%) and basics (10%)
    if (totalWeight < 1.0) {
      const remainingWeight = 1.0 - totalWeight;
      pro0to10 += schoolsScore * 0.20;
      pro0to10 += basicsScore * 0.10;
    }

    missionFitScore = Math.round(pro0to10 * 10);

    console.log('[pro-recap] Pro mode scoring', {
      isProMode,
      basicReconScore,
      missionFitScore,
      targetsFitScore,
      mobilityFitScore,
      environmentFitScore,
      basicsScore,
      schoolsScore,
      targetsCount: listing.targets?.length || 0,
      mobilitySignals: prefs.mobilitySignals,
      environmentalPrefs: prefs.environmentalPrefs,
      hasTargets,
      hasMobility,
      hasEnvironment
    });
  } else {
    // Free mode: Pro score = Free score (no personalization)
    missionFitScore = basicReconScore;

    console.log('[pro-recap] Free mode scoring', {
      isProMode,
      basicReconScore,
      missionFitScore,
      hasTargets,
      hasMobility,
      hasEnvironment
    });
  }

  const scores = { basicReconScore, missionFitScore };
  const recap = await generateAIRecap(listing, prefs, listing.targets || [], scores);

  return {
    basicReconScore,
    missionFitScore,
    recap,
    targets: (listing.targets || []).map((t) => ({ ...t, score: scoreTarget(t) })),
    mobilitySignals: prefs.mobilitySignals,
    environment: listing.environment,
    isProMode,
    debug: {
      basicsScore,
      schoolsScore,
      mobilityFreeScore,
      targetsFitScore,
      mobilityFitScore,
      environmentFitScore,
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
        
        // Search for places near the property using customer's exact query
        // Use just the target label - Search Box API will use proximity parameter for location biasing
        const places = await findPlacesNearby(
          { lat: listing.lat!, lon: listing.lon! },
          target.label, // Customer's exact search terms (e.g., "preschool", "golf course", "skatepark")
          3 // Just get top 3 closest POIs
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

    // Fetch all environment APIs in parallel - only if we have coordinates
    const [hl, air, lpm] = await Promise.all([
      listing.lat != null && listing.lon != null ? fetchHowloud(listing.lat, listing.lon) : Promise.resolve(null),
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
        sky: lpm.stargazingLabel || 'Unknown',
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

