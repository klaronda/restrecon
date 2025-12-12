import { RoverIcon } from './rover-icon';
import { Shield, Check } from 'lucide-react';

interface CheckoutRedirectProps {
  billingPeriod: 'monthly' | 'yearly';
  onProceed: () => void;
  onBack?: () => void;
}

export function CheckoutRedirect({ billingPeriod, onProceed, onBack }: CheckoutRedirectProps) {
  const price = billingPeriod === 'monthly' ? '$9/mo' : '$79/yr';
  const savings = billingPeriod === 'yearly' ? ' (Save 25%)' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#556B2F]/20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <RoverIcon size={64} />
          </div>

          {/* Title */}
          <h1 className="text-gray-900 text-3xl text-center mb-2">
            Confirm Your Mission
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Review your NestRecon Pro subscription
          </p>

          {/* Plan Summary */}
          <div className="bg-[#556B2F]/5 border-2 border-[#556B2F]/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900 text-lg">NestRecon Pro</h3>
                <p className="text-gray-600 text-sm capitalize">{billingPeriod} Billing{savings}</p>
              </div>
              <div className="text-right">
                <div className="text-gray-900 text-2xl">{price}</div>
              </div>
            </div>

            <div className="border-t border-[#556B2F]/20 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">7</span>
                </div>
                <span className="text-sm text-gray-700">7-Day Free Trial</span>
              </div>
              <p className="text-xs text-gray-500">
                No charges until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-3">What&apos;s included:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span>Full scoring engine with real-time data</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span>Environmental intel (air, sound, sky)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span>Personalized proximity scoring</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span>AI-powered recon recommendations</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span>Unlimited reports + multi-device sync</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={onProceed}
            className="w-full bg-[#556B2F] text-white px-6 py-4 rounded-lg hover:bg-[#4a5e28] transition-colors mb-3"
          >
            Proceed to Secure Checkout
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to pricing
            </button>
          )}

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Powered by Stripe. NestRecon does not store payment info.</span>
          </div>
        </div>
      </div>
    </div>
  );
}