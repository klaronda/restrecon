import { Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SharedNav } from './shared-nav';

interface PricingPageProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function PricingPage({ isLoggedIn = false, onLogout }: PricingPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <SharedNav isLoggedIn={isLoggedIn} onLogout={onLogout} />

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-gray-900 mb-4 text-4xl font-bold">Choose Your Mission Plan</h1>
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
                  <span className="text-white">Mission Intel briefings</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Unlimited listing reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">7-day free trial</span>
                </li>
              </ul>

              <Link
                to={isLoggedIn ? "/billing" : "/signup"}
                className="block w-full text-center bg-[#F3A712] text-white px-6 py-3 rounded-lg hover:bg-[#e55f2f] transition-colors mb-3"
              >
                {isLoggedIn ? 'Upgrade to Pro' : 'Start Free Trial'}
              </Link>
              
              <p className="text-white/80 text-sm text-center">
                No credit card required for trial
              </p>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="text-center text-gray-500 text-sm mt-12">
            <p>Cancel anytime • Powered by Stripe</p>
          </div>
        </div>
      </section>
    </div>
  );
}

