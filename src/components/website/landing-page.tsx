import { Link } from 'react-router-dom';
import { Check, Eye, Target, Zap, ChevronRight, Star } from 'lucide-react';
import { SharedNav } from './shared-nav';

type LandingPageProps = {
  isLoggedIn?: boolean;
  onLogout?: () => void;
};

export function LandingPage({ isLoggedIn = false, onLogout }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white" id="main-content">
      {/* Navigation */}
      <SharedNav isLoggedIn={isLoggedIn} onLogout={onLogout} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#556B2F]/5 via-white to-[#D6C9A2]/10">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#556B2F]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F3A712]/10 rounded-full blur-3xl" />
          
          {/* Tactical Grid Lines */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{
              backgroundImage: 'linear-gradient(to right, #556B2F 1px, transparent 1px), linear-gradient(to bottom, #556B2F 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />
          
          {/* Diagonal Lines */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #1C2A40, #1C2A40 2px, transparent 2px, transparent 40px)'
            }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F3A712] text-white px-3 py-1 rounded-full text-sm mb-6">
                <Zap className="w-4 h-4" />
                <span>Advanced Home Intelligence</span>
              </div>
              
              <h1 className="text-gray-900 mb-4 text-5xl md:text-6xl font-bold leading-tight">
                Tactical Recon for Homebuyers.
              </h1>
              <p className="text-gray-600 text-xl mb-8">
                Zillow shows the basics. NestRecon scouts the rest.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  to={isLoggedIn ? "/account" : "/signup"}
                  className="bg-[#556B2F] text-white px-6 py-4 rounded-lg hover:bg-[#4a5e28] flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoggedIn ? 'Open Mission Control' : 'Start 7-Day Free Trial'}
                  <ChevronRight className="w-5 h-5" />
                </Link>
                {!isLoggedIn && (
                <a 
                  href="#how-it-works"
                  className="border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  See How It Works
                </a>
                )}
              </div>
              
              <p className="text-gray-500 text-sm">
                ✓ 7-day free trial &nbsp;•&nbsp; ✓ No credit card required &nbsp;•&nbsp; ✓ Cancel anytime
              </p>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6">
                {/* Radar Effect */}
                <div className="absolute -top-8 -right-8 w-32 h-32">
                  <div className="absolute inset-0 border-2 border-[#556B2F]/30 rounded-full animate-ping" />
                  <div className="absolute inset-4 border-2 border-[#556B2F]/50 rounded-full animate-pulse" />
                </div>
                
                {/* Rover Scanning */}
                <div className="flex justify-center mb-6">
                  <img 
                    src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
                    alt="Rover scanning" 
                    className="w-24 h-24"
                    width="96"
                    height="96"
                    loading="lazy"
                  />
                </div>
                
                {/* Mock Intel Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm text-gray-700">Sound Score</span>
                    <span className="text-sm text-green-700">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-gray-700">Air Quality</span>
                    <span className="text-sm text-blue-700">Good</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-sm text-gray-700">Stargaze Score</span>
                    <span className="text-sm text-purple-700">Excellent</span>
                  </div>
                </div>
                
                {/* Tactical Brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#556B2F]/30" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#556B2F]/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4 text-4xl font-bold">Your Personal Recon Unit</h2>
            <p className="text-gray-600 text-lg">
              NestRecon analyzes what Zillow can&apos;t — and personalizes it to your mission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-[#556B2F]/5 to-[#556B2F]/10 rounded-2xl p-8 border border-[#556B2F]/20">
              <div className="w-12 h-12 bg-[#556B2F] rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-3">Real-World Environment Intel</h3>
              <p className="text-gray-600 mb-4">
                Noise levels, air quality, stargazing potential, and real commute times — not estimates.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>Sound score analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>Air quality index</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>Night sky visibility</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-[#1C2A40]/5 to-[#1C2A40]/10 rounded-2xl p-8 border border-[#1C2A40]/20">
              <div className="w-12 h-12 bg-[#1C2A40] rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-3">Personalized Fit Scores</h3>
              <p className="text-gray-600 mb-4">
                Set your priorities: schools, walkability, preschools, skateparks — we score every home for YOU.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#1C2A40] mt-0.5 flex-shrink-0" />
                  <span>Custom preference profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#1C2A40] mt-0.5 flex-shrink-0" />
                  <span>Proximity scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#1C2A40] mt-0.5 flex-shrink-0" />
                  <span>0-100 fit rating</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-[#F3A712]/5 to-[#F3A712]/10 rounded-2xl p-8 border border-[#F3A712]/20">
              <div className="w-12 h-12 bg-[#F3A712] rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-3">Intel Briefs</h3>
              <p className="text-gray-600 mb-4">
                1-2 sentence mission-style assessments for every listing you view.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span>Instant property analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span>Key insight highlighting</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span>Decision recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4 text-4xl font-bold">How It Works</h2>
            <p className="text-gray-600 text-lg">
              Three steps to smarter home shopping
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full">
                <div className="w-12 h-12 bg-[#556B2F] text-white rounded-full flex items-center justify-center mb-4 text-xl">
                  1
                </div>
                <h3 className="text-gray-900 mb-2">Install the Chrome Extension</h3>
                <p className="text-gray-600">
                  One click install. Works seamlessly with your existing Zillow workflow.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full">
                <div className="w-12 h-12 bg-[#556B2F] text-white rounded-full flex items-center justify-center mb-4 text-xl">
                  2
                </div>
                <h3 className="text-gray-900 mb-2">Browse Zillow as Usual</h3>
                <p className="text-gray-600">
                  No new tabs, no new tools. Just browse homes like you normally would.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300" />
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full">
                <div className="w-12 h-12 bg-[#556B2F] text-white rounded-full flex items-center justify-center mb-4 text-xl">
                  3
                </div>
                <h3 className="text-gray-900 mb-2">NestRecon Overlays the Intel</h3>
                <p className="text-gray-600">
                  See your full recon report in the right sidebar. Every listing, instantly analyzed.
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot */}
          <div className="mt-12 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
              <img
                src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/homepage/hp_asset_1.png"
                alt="NestRecon extension side panel overlaying a Zillow listing"
                className="w-full h-full object-contain"
                loading="lazy"
                width="1200"
                height="675"
                fetchPriority="low"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4 text-4xl font-bold">Choose Your Mission Plan</h2>
            <p className="text-gray-600 text-lg">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
              <div className="mb-6">
                <h3 className="text-gray-900 text-2xl mb-2">NestRecon Free</h3>
                <p className="text-gray-600">Basic reconnaissance</p>
              </div>
              
              <div className="mb-8">
                <div className="text-gray-900">
                  <span className="text-5xl">$0</span>
                </div>
                <p className="text-gray-500 text-sm">Forever free</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Basic Recon Score</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Basic listing information</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Limited sidebar panel</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No tactical summaries</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No environment intel</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No personalization</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No intel briefs</span>
                </li>
              </ul>

              <Link 
                  to={isLoggedIn ? "/account" : "/signup"}
                className="block w-full text-center border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-400 transition-colors"
              >
                  {isLoggedIn ? 'Open Mission Control' : 'Get Started Free'}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] rounded-2xl p-8 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-[#F3A712] text-white text-xs px-3 py-1 rounded-full">
                MOST POPULAR
              </div>

              <div className="mb-6">
                <h3 className="text-white text-2xl mb-2">NestRecon Pro</h3>
                <p className="text-white/80">Full tactical intelligence</p>
              </div>
              
              <div className="mb-8">
                <div className="text-white">
                  <span className="text-5xl">$9</span>
                  <span className="text-xl">/month</span>
                </div>
                <p className="text-white/70 text-sm">or $79/year (Save 25%)</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Real commute distances</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Air quality, sound, stargaze intel</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Proximity scoring (preschools, parks, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Personalized preference profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Full Fit Score (0-100)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Intel brief summaries</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Unlimited listing analysis</span>
                </li>
              </ul>

              {!isLoggedIn && (
              <Link 
                to="/signup"
                className="block w-full text-center bg-white text-[#556B2F] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start 7-Day Free Trial
              </Link>
              )}
              
              <p className="text-white/70 text-sm text-center mt-4">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4 text-4xl font-bold">Trusted by Home Hunters</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F3A712] text-[#F3A712]" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "NestRecon showed me the noise map Zillow hides — game changer."
              </p>
              <p className="text-gray-500 text-sm">— Sarah M., Portland</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F3A712] text-[#F3A712]" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The intel briefs saved us hours. We knew which homes to skip."
              </p>
              <p className="text-gray-500 text-sm">— Mike & Jessica T., Denver</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F3A712] text-[#F3A712]" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Finally, a tool that understands families need more than just square footage."
              </p>
              <p className="text-gray-500 text-sm">— Priya K., Austin</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4 text-4xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">What data sources do you use?</h3>
              <p className="text-gray-600">
                We aggregate data from Google Maps, environmental databases, public school APIs, and local points of interest. All data is real-time and location-specific.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">Is this safe and private?</h3>
              <p className="text-gray-600">
                Yes. NestRecon only accesses Zillow listing data you&apos;re already viewing. We don&apos;t track your browsing history or sell your data. Your preferences are stored securely and never shared.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Absolutely. Cancel your Pro subscription anytime from your account dashboard. No contracts, no penalties.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">Does this work on mobile?</h3>
              <p className="text-gray-600">
                Currently, NestRecon is a Chrome extension for desktop only. Mobile support is on our roadmap for 2025.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
                  alt="Rover" 
                  className="w-8 h-8 brightness-0 invert"
                  width="32"
                  height="32"
                  loading="lazy"
                />
                <span className="text-xl">NestRecon</span>
              </div>
              <p className="text-gray-400 text-sm">
                Advanced home intelligence for smarter buyers.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-white">Log In</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Install */}
            <div>
              <h4 className="mb-4">Get Started</h4>
              <a 
                href="https://chromewebstore.google.com/detail/nestrecon-%E2%80%93-tactical-reco/jijciobakjhkkkohjfjlcgcppcfkpgep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] text-sm"
              >
                Install Extension
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 NestRecon. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <img 
                src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
                alt="Rover saluting" 
                className="w-6 h-6 brightness-0 invert opacity-50"
                width="24"
                height="24"
                loading="lazy"
              />
              <span>Mission ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}