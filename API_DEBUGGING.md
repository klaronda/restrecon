# API Debugging Guide

## How to Debug API Issues

### 1. Check Supabase Edge Function Logs

The edge function now includes extensive logging. To view logs:

```bash
# View real-time logs
supabase functions logs pro-recap --project-ref eqqbsiuqjnqpiiuumanu

# Or view in Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard/project/eqqbsiuqjnqpiiuumanu
# 2. Navigate to Edge Functions → pro-recap
# 3. Click on "Logs" tab
```

### 2. Check Environment Variables

The edge function logs which environment variables are present at the start of each request. Look for:

```
[pro-recap] Request received envVars: {
  hasHowloudKey: true/false,
  hasHowloudClientId: true/false,
  hasOpenWeatherKey: true/false,
  hasGoogleMapsKey: true/false,
  hasOpenAIKey: true/false
}
```

**To verify/update environment variables:**
1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Check "Secrets" section
3. Ensure these are set:
   - `HOWLOUD_API_KEY`
   - `HOWLOUD_CLIENT_ID`
   - `OPENWEATHER_API_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `OPENAI_API_KEY`

### 3. Check API Response Debug Info

The edge function now returns debug info in the response. Check the browser console for:

```javascript
// In content script console, after pro-recap fetch:
console.log('[nr/content] pro-recap fetch ok', json);
// Look for json.debug.apiStatus and json.debug.envVarsPresent
```

### 4. Common Issues

#### Howloud API Not Working
- **Check**: Logs will show `[pro-recap] Howloud: API error` with status code
- **Common causes**:
  - Missing or invalid `HOWLOUD_API_KEY`
  - Missing or invalid `HOWLOUD_CLIENT_ID`
  - Address format issues
- **Fix**: Verify API keys in Supabase secrets, check Howloud dashboard for API status

#### OpenWeather API Not Working
- **Check**: Logs will show `[pro-recap] OpenWeather geocode: API error` or `[pro-recap] OpenWeather air: API error`
- **Common causes**:
  - Missing or invalid `OPENWEATHER_API_KEY`
  - API key not activated (requires email verification)
  - Rate limit exceeded
- **Fix**: Verify API key in Supabase secrets, check OpenWeather account status

#### Google Maps API Not Working
- **Check**: Logs will show `[pro-recap] Google Maps Places: API error` or `[pro-recap] Google Maps Distance: API error`
- **Common causes**:
  - Missing or invalid `GOOGLE_MAPS_API_KEY`
  - API key restrictions (IP, referrer, etc.)
  - Billing not enabled
  - Required APIs not enabled (Places API, Distance Matrix API)
- **Fix**: 
  1. Verify API key in Supabase secrets
  2. Check Google Cloud Console → APIs & Services → Enabled APIs
  3. Ensure "Places API" and "Distance Matrix API" are enabled
  4. Check API key restrictions

#### LightPollutionMap Not Working
- **Check**: Logs will show `[pro-recap] LightPollutionMap: API error` or parsing issues
- **Common causes**:
  - Website structure changed (HTML parsing fails)
  - Network/CORS issues
  - Rate limiting
- **Fix**: Check logs for HTML parsing details, verify website is accessible

#### OpenAI Not Working
- **Check**: Logs will show `[pro-recap] OpenAI: API error` or `[pro-recap] OpenAI: missing API key`
- **Common causes**:
  - Missing or invalid `OPENAI_API_KEY`
  - Insufficient credits
  - Rate limit exceeded
- **Fix**: Verify API key in Supabase secrets, check OpenAI account billing

### 5. Testing Individual APIs

You can test each API manually:

```bash
# Test Howloud
curl -X GET "https://api.howloud.com/v1/soundscore?address=123 Main St, Austin, TX&client_id=YOUR_CLIENT_ID" \
  -H "x-api-key: YOUR_API_KEY"

# Test OpenWeather Geocoding
curl "https://api.openweathermap.org/geo/1.0/direct?q=123 Main St, Austin, TX&limit=1&appid=YOUR_API_KEY"

# Test Google Maps Places
curl "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=golf course&inputtype=textquery&fields=geometry&key=YOUR_API_KEY"
```

### 6. View Logs in Real-Time

After deploying the updated edge function, you can watch logs in real-time:

```bash
supabase functions logs pro-recap --project-ref eqqbsiuqjnqpiiuumanu --follow
```

Then trigger a request from the extension and watch the logs appear.


