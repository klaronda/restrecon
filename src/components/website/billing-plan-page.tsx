import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowLeft, Zap } from 'lucide-react';
import { startCheckout } from '../../services/payments';

interface BillingPlanPageProps {
  currentPlan: 'none' | 'trial' | 'trial_expired' | 'active' | 'cancelled';
  onUpgrade: (plan: 'monthly' | 'yearly') => void;
}

export function BillingPlanPage({ currentPlan, onUpgrade }: BillingPlanPageProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = () => {
    setError(null);
    setIsProcessing(true);
    try {
      startCheckout(billingInterval);
      onUpgrade(billingInterval);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open checkout.';
      setError(message);
      if (import.meta.env.DEV) {
        console.error(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
              alt="Rover" 
              className="w-8 h-8"
            />
            <span className="text-gray-900 text-xl">NestRecon</span>
          </Link>
          <Link to="/account" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Account
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <img 
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
              alt="Rover delivering folder" 
              className="w-20 h-20"
            />
          </div>
          <h1 className="text-gray-900 mb-4">
            Upgrade to NestRecon Pro
          </h1>
          <p className="text-gray-600 text-lg">
            Unlock real-world intel, mission-grade scoring, and tactical insights
          </p>

          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 bg-[#F3A712]/10 text-[#F3A712] px-4 py-2 rounded-full text-sm mt-4 border border-[#F3A712]/30">
            <Zap className="w-4 h-4" />
              <span>Trial starts automatically when you create your account</span>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-md transition-colors relative ${
                billingInterval === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-[#F3A712] text-white text-xs px-2 py-0.5 rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
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
                <span className="text-gray-600">Listing details captured from the page</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Limited sidebar panel</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No mission-grade recon briefs</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No environmental intel</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No commute or proximity scoring</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 line-through">No personalization</span>
              </li>
            </ul>

            {currentPlan === 'none' && (
              <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">Current Plan</p>
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] rounded-2xl p-8 relative overflow-hidden">
            {/* Top Secret Badge */}
            <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
              <div className="absolute top-4 right-4 transform rotate-12">
                <div className="bg-[#F3A712] text-white text-xs px-3 py-1 rounded">
                  TOP SECRET
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-white text-2xl mb-2">NestRecon Pro</h3>
              <p className="text-white/80">Full tactical intelligence</p>
            </div>
            
            <div className="mb-8">
              <div className="text-white">
                {billingInterval === 'monthly' ? (
                  <>
                    <span className="text-5xl">$9</span>
                    <span className="text-xl">/month</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl">$79</span>
                    <span className="text-xl">/year</span>
                  </>
                )}
              </div>
              {billingInterval === 'yearly' && (
                <p className="text-white/70 text-sm">$6.58/month · Save 25%</p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                <span className="text-white">Real commute distances</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                <span className="text-white">Real air/sound/light intel</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                <span className="text-white">Google Places proximity scoring</span>
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
                <span className="text-white">Mission-grade recon briefs</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                <span className="text-white">Favorites + history</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                <span className="text-white">Unlimited listing analysis</span>
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full bg-white text-[#556B2F] px-6 py-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Upgrade to Pro'}
            </button>
            {error && (
              <p className="text-sm text-orange-100 mt-3 text-center">
                {error}
              </p>
            )}
            
            <p className="text-white/70 text-sm text-center mt-4">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h3 className="text-gray-900 mb-6 text-center">Detailed Feature Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-600">Feature</th>
                  <th className="text-center py-3 text-gray-600 w-32">Free</th>
                  <th className="text-center py-3 text-gray-600 w-32">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 text-gray-700">Basic Recon Score</td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">AI Recon Summaries</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Environmental Intel (air, sound, sky)</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Real Commute Distances</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Proximity Scoring (parks, preschools, etc.)</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Personalized Preferences</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Full Fit Score (0-100)</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Favorites & History</td>
                  <td className="text-center"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-2">Questions about billing?</p>
          <Link to="/" className="text-[#556B2F] hover:underline">
            View FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}