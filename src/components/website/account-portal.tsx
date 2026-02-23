import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { User, Settings, CreditCard, Shield, Calendar, ChevronRight, MapPin, Clock, AlertTriangle, CheckCircle, X, Heart, ExternalLink } from 'lucide-react';
import { SharedNav } from './shared-nav';
import { UserPreferences } from '../../services/preferences';
import { fetchSavedProperties, SavedProperty } from '../../services/saved-properties';
import { supabase } from '../../lib/supabaseClient';

interface AccountPortalProps {
  userName: string;
  userEmail: string;
  subscriptionStatus: 'none' | 'trial' | 'trial_expired' | 'active' | 'cancelled';
  trialDaysRemaining: number;
  subscriptionRenewsAt?: string | null;
  onLogout: () => void;
  onManageBilling: () => void;
  preferences?: UserPreferences | null;
}

// Latest extension version from Chrome Web Store
const LATEST_EXTENSION_VERSION = '0.1.3';
const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/nestrecon-%E2%80%93-tactical-reco/jijciobakjhkkkohjfjlcgcppcfkpgep';

export function AccountPortal({
  userName,
  userEmail,
  subscriptionStatus,
  trialDaysRemaining,
  subscriptionRenewsAt,
  onLogout,
  onManageBilling,
  preferences,
}: AccountPortalProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTrialActive = subscriptionStatus === 'trial';
  const isFree = subscriptionStatus === 'none';
  
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const [deviceInfo, setDeviceInfo] = useState<{
    browser: string;
    os: string;
    timezone: string;
    language: string;
    lastChecked: string;
  }>({
    browser: 'Detecting…',
    os: 'Detecting…',
    timezone: 'Detecting…',
    language: 'Detecting…',
    lastChecked: new Date().toLocaleString(),
  });

  const [extensionInfo, setExtensionInfo] = useState<{
    version: string | null;
    isInstalled: boolean;
    needsUpdate: boolean;
  }>({
    version: null,
    isInstalled: false,
    needsUpdate: false,
  });

  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [savedPropertiesLoading, setSavedPropertiesLoading] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const language = navigator.language || 'Unknown';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

    const detectBrowser = () => {
      if (/Chrome\/\d+/.test(ua) && !/Edge\/\d+/.test(ua)) return 'Chrome';
      if (/Safari\/\d+/.test(ua) && !/Chrome\/\d+/.test(ua)) return 'Safari';
      if (/Firefox\/\d+/.test(ua)) return 'Firefox';
      if (/Edg\/\d+/.test(ua)) return 'Edge';
      return 'Unknown';
    };

    const detectOS = () => {
      if (/Windows NT/.test(ua)) return 'Windows';
      if (/Mac OS X/.test(ua)) return 'macOS';
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      if (/Android/.test(ua)) return 'Android';
      return 'Unknown';
    };

    setDeviceInfo({
      browser: detectBrowser(),
      os: detectOS(),
      timezone,
      language,
      lastChecked: new Date().toLocaleString(),
    });
  }, []);

  // Detect extension version
  useEffect(() => {
    const detectExtensionVersion = async () => {
      try {
        // Try to get version from extension via postMessage
        // The extension can expose its version by listening for this message
        // Check if extension is installed by trying to communicate
        // Note: This requires the extension to have a message listener that responds with version
        // For now, we'll show the latest version and check if update is needed
        
        // Try to detect if extension is installed by checking for chrome.runtime
        // Websites can't directly access chrome.runtime, so we'll use a different approach
        // We'll show the latest version and provide an update link if needed
        
        // Since we can't directly detect the installed version from the website,
        // we'll show the latest version and always provide an update option
        setExtensionInfo({
          version: LATEST_EXTENSION_VERSION,
          isInstalled: true, // Assume installed if user is on account page
          needsUpdate: false, // Can't determine without extension communication
        });
      } catch {
        // Extension not detected or error
        setExtensionInfo({
          version: null,
          isInstalled: false,
          needsUpdate: false,
        });
      }
    };

    detectExtensionVersion();
  }, []);

  // Fetch saved properties
  useEffect(() => {
    const loadSavedProperties = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          setSavedPropertiesLoading(false);
          return;
        }

        const properties = await fetchSavedProperties(sessionData.session.user.id, 5);
        setSavedProperties(properties);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AccountPortal] Error loading saved properties:', err);
        }
      } finally {
        setSavedPropertiesLoading(false);
      }
    };

    loadSavedProperties();
  }, []);

  // Check for payment success query parameter
  useEffect(() => {
    const paymentParam = searchParams.get('payment');
    if (paymentParam === 'success') {
      setShowPaymentSuccess(true);
      // Clear the query parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('payment');
      navigate(`/account?${newSearchParams.toString()}`, { replace: true });
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setShowPaymentSuccess(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
      {/* Navigation */}
      <SharedNav isLoggedIn={true} onLogout={onLogout} />

      {/* Payment Success Message */}
      {showPaymentSuccess && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3 relative">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-green-900 font-semibold mb-1">Payment successful!</p>
              <p className="text-green-700 text-sm">Your NestRecon Pro subscription is now active.</p>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Rover */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] py-16 relative overflow-hidden">
        {/* Radar Rings */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
          <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-pulse" />
          <div className="absolute inset-8 border-2 border-white/50 rounded-full animate-ping" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
              alt="Rover" 
              className="w-16 h-16 brightness-0 invert"
            />
            <div>
              <h1 className="text-white mb-1">
                Welcome back, {userName}.
              </h1>
              <p className="text-white/80">Mission Control · Account Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Summary */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#556B2F]/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-[#556B2F]" />
              </div>
              <h2 className="text-gray-900">Profile Summary</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="text-gray-900">{userName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-gray-900">{userEmail || 'No email on file'}</p>
              </div>
              <Link 
                to="/edit-profile"
                className="text-sm text-[#556B2F] hover:underline flex items-center gap-1"
              >
                Edit Profile
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#F3A712]/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#F3A712]" />
              </div>
              <h2 className="text-gray-900">Subscription</h2>
            </div>

            {isFree && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 mb-2">NestRecon Plan</p>
                  <p className="text-sm text-gray-600">
                    You&apos;re on the <strong>Free</strong> Plan. Upgrade to unlock full recon, real-world intel, and personalized scoring.
                  </p>
                </div>
                <Link 
                  to="/billing"
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Upgrade to Pro
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {isTrialActive && (
              <div className="space-y-4">
                <div className="bg-[#F3A712]/10 rounded-lg p-4 border border-[#F3A712]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#F3A712] text-white text-xs rounded-full flex items-center justify-center">
                      {trialDaysRemaining}
                    </div>
                    <p className="text-gray-900">Trial Active</p>
                    <span className="text-xs text-[#F3A712] bg-white px-2 py-1 rounded border border-[#F3A712]/40">Plan: Trial</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {trialDaysRemaining} days remaining in your free trial
                  </p>
                </div>
                <Link 
                  to="/billing"
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Upgrade Now
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {subscriptionStatus === 'trial_expired' && (
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-gray-900">Trial Expired</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Upgrade to NestRecon Pro for just $9 a month to continue seeing personalized Fit Scores and deeper neighborhood insight.
                  </p>
                </div>
                <Link
                  to="/billing"
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Upgrade to Pro
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {subscriptionStatus === 'active' && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2">
                  <p className="text-gray-900 mb-1">NestRecon Pro</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {subscriptionRenewsAt 
                        ? `Renews on ${new Date(subscriptionRenewsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                        : 'Renewal date not available'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Monthly billing at $9/month</p>
                </div>
                <button
                  onClick={onManageBilling}
                  className="inline-flex items-center gap-2 text-[#556B2F] hover:underline"
                >
                  Manage Billing
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Preference Summary */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#1C2A40]/10 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#1C2A40]" />
              </div>
              <h2 className="text-gray-900">Preference Summary</h2>
            </div>

            {preferences ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#556B2F]/5 to-[#556B2F]/10 rounded-lg p-6 border border-[#556B2F]/20">
                  {preferences.recapText ? (
                    <p className="text-gray-700 leading-relaxed select-text">{preferences.recapText}</p>
                  ) : (
              <p className="text-gray-700 leading-relaxed">
                      Preferences saved. Recap will appear after analysis.
                    </p>
                  )}
                </div>
                {preferences.tags?.length ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Targets</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-gray-800 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-700">
                  <span className={`px-2 py-1 rounded border ${
                    preferences.toggles?.walkScore
                      ? 'bg-[#556B2F]/10 border-[#556B2F]/30 text-[#556B2F]'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    Walkability: {preferences.toggles?.walkScore ? 'On' : 'Off'}
                  </span>
                  <span className={`px-2 py-1 rounded border ${
                    preferences.toggles?.bikeScore
                      ? 'bg-[#556B2F]/10 border-[#556B2F]/30 text-[#556B2F]'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    Bikeability: {preferences.toggles?.bikeScore ? 'On' : 'Off'}
                  </span>
                  <span className={`px-2 py-1 rounded border ${
                    preferences.toggles?.transitScore
                      ? 'bg-[#556B2F]/10 border-[#556B2F]/30 text-[#556B2F]'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    Transit: {preferences.toggles?.transitScore ? 'On' : 'Off'}
                  </span>
                  <span className={`px-2 py-1 rounded border ${
                    preferences.toggles?.airQuality
                      ? 'bg-gray-500/10 border-gray-500/30 text-gray-700'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    Air Quality: {preferences.toggles?.airQuality ? 'On' : 'Off'}
                  </span>
                  <span className={`px-2 py-1 rounded border ${
                    preferences.toggles?.soundScore
                      ? 'bg-gray-500/10 border-gray-500/30 text-gray-700'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    Sound Score: {preferences.toggles?.soundScore ? 'On' : 'Off'}
                  </span>
                  <span className={`px-2 py-1 rounded border ${
                    preferences.toggles?.stargazeScore
                      ? 'bg-gray-500/10 border-gray-500/30 text-gray-700'
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    Stargaze Score: {preferences.toggles?.stargazeScore ? 'On' : 'Off'}
                  </span>
                </div>
                <Link
                  to="/edit-preferences"
                  className="inline-flex items-center gap-2 text-[#556B2F] hover:underline text-sm"
                >
                  Edit Preferences
                  <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            ) : (
              <div className="bg-[#556B2F]/5 border border-[#556B2F]/20 rounded-lg p-4">
                <p className="text-gray-800 mb-2">Set up your preferences to get the best intel for your search.</p>
                <Link
                  to="/edit-preferences"
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Calibrate preferences
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Saved Properties */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                <Heart className="w-5 h-5 text-red-600 fill-red-600" />
              </div>
              <h2 className="text-gray-900">Saved Properties</h2>
            </div>

            {savedPropertiesLoading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : savedProperties.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-sm mb-2">No saved properties yet.</p>
                <p className="text-gray-500 text-xs">
                  Save properties from the Chrome extension to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedProperties.map((property) => {
                  // Extension badge colors
                  const getBadgeStyle = (label: string | null) => {
                    if (!label) return { backgroundColor: '#f3f4f6', color: '#6b7280' };
                    if (label.includes('Great')) return { backgroundColor: '#dfe9c7', color: '#2f3c20' };
                    if (label.includes('Fair')) return { backgroundColor: '#e9f1d8', color: '#3f4f24' };
                    if (label.includes('Poor')) return { backgroundColor: '#fde7c3', color: '#8a5b00' };
                    if (label.includes('Not a Match')) return { backgroundColor: '#fbd2d2', color: '#9f1d1d' };
                    return { backgroundColor: '#f3f4f6', color: '#6b7280' };
                  };

                  return (
                    <div
                      key={property.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-[#556B2F]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-gray-900 font-medium text-sm truncate flex-1" title={property.address}>
                          {property.address}
                        </p>
                        {property.matchLabel && (
                          <span
                            className="text-xs font-bold rounded-full px-3 py-1 whitespace-nowrap"
                            style={getBadgeStyle(property.matchLabel)}
                          >
                            {property.matchLabel}
                          </span>
                        )}
                      </div>
                      <a
                        href={property.zillowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#556B2F] hover:underline"
                      >
                        View on Zillow
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
                <Link
                  to="/saved-properties"
                  className="inline-flex items-center gap-2 text-sm text-[#556B2F] hover:underline mt-2"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Devices & Security */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-gray-900">Devices & Security</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 text-sm mb-1">This device</p>
                <p className="text-sm text-gray-600">{deviceInfo.browser} · {deviceInfo.os}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Last checked: {deviceInfo.lastChecked}
                </p>
                </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 text-sm mb-1">Location & Locale</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Timezone: {deviceInfo.timezone}
                </p>
                <p className="text-sm text-gray-600">Language: {deviceInfo.language}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 text-sm mb-1">Chrome Extension</p>
                {extensionInfo.version && !extensionInfo.needsUpdate ? (
                  <p className="text-sm text-gray-600">Version {extensionInfo.version}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-2">
                      {extensionInfo.version ? `Installed: ${extensionInfo.version}` : 'Latest version:'} {LATEST_EXTENSION_VERSION}
                    </p>
                    <a
                      href={CHROME_WEB_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#556B2F] hover:underline inline-block"
                    >
                      Get the latest extension →
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4">
              <button 
                className="text-sm text-red-600 hover:underline block" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onLogout) {
                    onLogout();
                  }
                }}
              >
                Log Out Everywhere
              </button>
            </div>
          </div>
        </div>

        {/* CTA Banner (if Free) */}
        {isFree && (
          <div className="mt-8 bg-gradient-to-br from-[#556B2F] to-[#4a5e28] rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="relative">
              <h2 className="text-white mb-2">Unlock Full Tactical Intelligence</h2>
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                Upgrade to NestRecon Pro to access full recon intel, environmental data, personalized scoring, and more.
              </p>
              <Link 
                to="/billing"
                className="inline-flex items-center gap-2 bg-white text-[#556B2F] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upgrade to Pro
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}