import { Target, TrendingUp, MapPin } from 'lucide-react';
import { RoverIcon } from './rover-icon';

interface LandingPageProps {
  onTryFree: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onTryFree, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <RoverIcon size={48} />
            <div>
              <h1 className="text-gray-900" style={{ fontSize: '36px', letterSpacing: '0.02em' }}>NestRecon</h1>
              <p className="text-gray-500" style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Intel for Homebuyers</p>
            </div>
          </div>
          <p className="text-gray-600 text-xl">Mission: Find your perfect nest.</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-200">
          {/* Explainer Bullets */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#556B2F]/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#556B2F]/20">
                <TrendingUp className="w-3.5 h-3.5 text-[#556B2F]" />
              </div>
              <div>
                <p className="text-gray-900">Surfaces walk/bike/transit + school scores beyond Zillow&apos;s perimeter</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#556B2F]/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#556B2F]/20">
                <MapPin className="w-3.5 h-3.5 text-[#556B2F]" />
              </div>
              <div>
                <p className="text-gray-900">Retrieves environmental intel (sound, air quality, night sky)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#556B2F]/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#556B2F]/20">
                <Target className="w-3.5 h-3.5 text-[#556B2F]" />
              </div>
              <div>
                <p className="text-gray-900">Calibrates to your mission parameters (farmers markets, preschools, skateparks, etc.)</p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={onSignUp}
              className="w-full bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
              Deploy Personalized Recon
            </button>
            <button
              onClick={onTryFree}
              className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Run Free Recon Mode
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <button onClick={onSignUp} className="text-[#556B2F] hover:underline">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}