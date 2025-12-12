import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOWLOUD_API_KEY = Deno.env.get('HOWLOUD_API_KEY');
const HOWLOUD_CLIENT_ID = Deno.env.get('HOWLOUD_CLIENT_ID');
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
const LPM_BASE = 'https://lightpollutionmap.app/';

type MobilitySignal = 'walk' | 'bike' | 'transit';

interface PlaceTarget {
  label: string;
  maxDistanceMiles: number;
}

interface EvaluatedTarget {
  label: string;
  maxDistanceMiles: number;
  distanceMiles: number | null;
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
  environment?: { sound?: string; air?: string; sky?: string };
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
  if (!address || !HOWLOUD_API_KEY || !HOWLOUD_CLIENT_ID) return null;
  try {
    const url = new URL('https://api.howloud.com/v1/soundscore');
    url.searchParams.set('address', address);
    url.searchParams.set('client_id', HOWLOUD_CLIENT_ID);
    const resp = await fetch(url.toString(), {
      headers: { 'x-api-key': HOWLOUD_API_KEY },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    // Expecting shape: { score: number, ... } — tolerate variants
    const score = typeof data?.score === 'number' ? data.score : Number(data?.Soundscore ?? data?.soundscore);
    return { score, label: soundLabel(score) };
  } catch (_err) {
    return null;
  }
}

async function geocodeOpenWeather(address?: string): Promise<{ lat: number; lon: number } | null> {
  if (!address || !OPENWEATHER_API_KEY) return null;
  try {
    const url = new URL('https://api.openweathermap.org/geo/1.0/direct');
    url.searchParams.set('q', address);
    url.searchParams.set('limit', '1');
    url.searchParams.set('appid', OPENWEATHER_API_KEY);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    if (Array.isArray(data) && data.length && data[0]?.lat != null && data[0]?.lon != null) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
    return null;
  } catch (_err) {
    return null;
  }
}

async function fetchAirQuality(lat?: number, lon?: number): Promise<{ score?: number; label: string } | null> {
  if (lat == null || lon == null || !OPENWEATHER_API_KEY) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 365 * 24 * 60 * 60;
    const url = new URL('https://api.openweathermap.org/data/2.5/air_pollution/history');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('start', String(oneYearAgo));
    url.searchParams.set('end', String(now));
    url.searchParams.set('appid', OPENWEATHER_API_KEY);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    const list = Array.isArray(data?.list) ? data.list : [];
    if (!list.length) return null;
    const aqiValues = list
      .map((e: any) => e?.main?.aqi)
      .filter((n: any) => Number.isFinite(n));
    if (!aqiValues.length) return null;
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
    return { score, label };
  } catch (_err) {
    return null;
  }
}

function lightScoreFromBortle(b?: number) {
  if (b == null || !Number.isFinite(b)) return undefined;
  if (b <= 1) return 98;
  if (b <= 2) return 94;
  if (b <= 3) return 88;
  if (b <= 4) return 72;
  if (b <= 5) return 56;
  if (b <= 6) return 40;
  if (b <= 7) return 25;
  if (b <= 8) return 15;
  return 8;
}

async function fetchLightPollution(lat?: number, lon?: number): Promise<{ score?: number; label: string } | null> {
  if (lat == null || lon == null) return null;
  try {
    const url = `${LPM_BASE}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lon)}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'NestRecon/1.0' } });
    if (!resp.ok) return null;
    const html = await resp.text();
    const bortleMatch = html.match(/Bortle[^0-9]*([1-9])/i);
    // e.g., "20.8 mag/arcsec²" or "21 mag/arcsec"
    const sqmMatch = html.match(/([0-9]{2}\.?[0-9]?)\s*mag\/arcsec/i);
    const bortle = bortleMatch ? Number(bortleMatch[1]) : undefined;
    const sqm = sqmMatch ? sqmMatch[1] : undefined;
    const parts: string[] = [];
    if (bortle) parts.push(`Bortle ${bortle}`);
    if (sqm) parts.push(`${sqm} mag/arcsec²`);
    const label = parts.length ? parts.join(' · ') : 'Unknown';
    const score = lightScoreFromBortle(bortle);
    return { score, label };
  } catch (_err) {
    return null;
  }
}

function scoreTarget(t: EvaluatedTarget): number {
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

function buildRecap(listing: ListingPayload, prefs: UserPrefs, targetScores: EvaluatedTarget[]): string {
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

function scorePro(listing: ListingPayload, prefs: UserPrefs): ProResult {
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

  const recap = buildRecap(listing, prefs, listing.targets || []);

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

    // Geocode if coords missing
    if ((listing.lat == null || listing.lon == null) && listing.address) {
      const geo = await geocodeOpenWeather(listing.address);
      if (geo) {
        listing.lat = geo.lat;
        listing.lon = geo.lon;
      }
    }

    // Fetch Howloud sound if address present
    const hl = await fetchHowloud(listing.address);
    if (hl) {
      listing.environment = {
        ...(listing.environment || {}),
        sound: hl.label,
        // keep numeric for scoring
        soundScore: hl.score,
      } as any;
    }

    // Fetch OpenWeather air quality if coords known
    const air = await fetchAirQuality(listing.lat, listing.lon);
    if (air) {
      listing.environment = {
        ...(listing.environment || {}),
        airScore: air.score,
        air: air.label,
      } as any;
    }

    // Fetch light pollution map label if coords known
    const lpm = await fetchLightPollution(listing.lat, listing.lon);
    if (lpm) {
      listing.environment = {
        ...(listing.environment || {}),
        lightScore: lpm.score,
        light: lpm.label,
      } as any;
    }

    const result = scorePro(listing, prefs);
    if (hl) {
      result.environment = { soundScore: hl.score, soundLabel: hl.label };
    }
    if (air) {
      result.environment = {
        ...(result.environment || {}),
        airScore: air.score,
        airLabel: air.label,
      };
    }
    if (lpm) {
      result.environment = {
        ...(result.environment || {}),
        lightScore: lpm.score,
        lightLabel: lpm.label,
      };
    }
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});

