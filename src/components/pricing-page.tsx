import { Check, X } from 'lucide-react';
import { RoverIcon } from './rover-icon';
import { useState } from 'react';

interface PricingPageProps {
  onStartTrial: () => void;
  onBack?: () => void;
}

export function PricingPage({ onStartTrial, onBack }: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <RoverIcon size={56} />
            <div>
              <h1 className="text-gray-900" style={{ fontSize: '42px', letterSpacing: '0.02em' }}>NestRecon Pro</h1>
              <p className="text-gray-600" style={{ fontSize: '16px', letterSpacing: '0.05em' }}>Full intel. Real data. Mission recon. Your perfect nest—scouted.</p>
            </div>
          </div>
          
          {/* Rover scanning house visual indicator */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#556B2F]/5 rounded-full blur-2xl" style={{ animation: 'pulse 3s ease-in-out infinite' }}></div>
            <RoverIcon size={80} className="relative" />
          </div>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-[#556B2F] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly — $9/mo
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md transition-colors relative ${
                billingPeriod === 'yearly'
                  ? 'bg-[#556B2F] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Yearly — $79/yr
              <span className="absolute -top-2 -right-2 bg-[#FF6B35] text-white text-xs px-2 py-0.5 rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Comparison Table */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* FREE Plan */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
            <div className="mb-6">
              <h3 className="text-gray-900 text-2xl mb-2">FREE</h3>
              <p className="text-gray-600">Basic reconnaissance</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Basic NestRecon Score</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Walk/Bike/Transit scores from Zillow</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">School ratings overview</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Basic environmental data</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No intel briefings</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No real commute distances</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No proximity scoring</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No personalization</span>
              </li>
            </ul>

            <button
              onClick={onBack}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue with Free
            </button>
          </div>

          {/* PRO - Highlighted */}
          <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] rounded-xl border-2 border-[#556B2F] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="mb-6">
                <div className="inline-block bg-[#FF6B35] text-white text-xs px-3 py-1 rounded-full mb-3">
                  RECOMMENDED
                </div>
                <h3 className="text-white text-2xl mb-2">PRO</h3>
                <p className="text-white/90">Full tactical intel</p>
                <div className="mt-4">
                  <span className="text-4xl">${billingPeriod === 'monthly' ? '9' : '79'}</span>
                  <span className="text-white/80">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Full scoring engine</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Real commute distance (Google Directions API)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Nearest preschools / skateparks / farmers markets</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Air quality, noise, stargaze intel</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Personalized preference onboarding</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Saved profile + multi-device sync</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Mission recon recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Unlimited listing reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">&quot;Mission Intel&quot; insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Favorites + history</span>
                </li>
              </ul>

              <button
                onClick={onStartTrial}
                className="w-full bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-[#e55f2f] transition-colors mb-3"
              >
                Upgrade to Pro
              </button>
              
              <button className="w-full text-white/90 hover:text-white underline text-sm">
                See how Pro works
              </button>
            </div>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>No credit card required for trial • Cancel anytime • Powered by Stripe</p>
        </div>
      </div>
    </div>
  );
}