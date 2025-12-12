import { Link } from 'react-router-dom';
import { Lock, Check, ChevronRight } from 'lucide-react';

interface TrialEndedScreenProps {
  onUpgrade: () => void;
}

export function TrialEndedScreen({ onUpgrade }: TrialEndedScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#556B2F]/5 via-white to-[#D6C9A2]/10 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full relative">
        {/* Sad Rover */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <img 
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
              alt="Rover with low signal" 
              className="w-24 h-24 opacity-40"
            />
            {/* Signal Bars - Low */}
            <div className="absolute -top-2 -right-2 flex items-end gap-1">
              <div className="w-1.5 h-2 bg-gray-300 rounded-sm" />
              <div className="w-1.5 h-3 bg-gray-300 rounded-sm" />
              <div className="w-1.5 h-4 bg-gray-200 rounded-sm" />
              <div className="w-1.5 h-5 bg-gray-200 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-8 text-center relative overflow-hidden">
          {/* Lock Icon Background */}
          <div className="absolute top-8 right-8 opacity-5">
            <Lock className="w-32 h-32 text-gray-900" />
          </div>

          <div className="relative">
            <h1 className="text-gray-900 mb-4">
              Mission Intel Restricted
            </h1>
            
            <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto">
              Your trial has ended. NestRecon Pro unlocks real-world data, AI recon, and full scoring.
            </p>

            {/* Locked Features */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-8 border-2 border-dashed border-gray-300">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Lock className="w-5 h-5 text-gray-400" />
                <h3 className="text-gray-700">Pro Features Currently Locked</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>Real commute distances</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>Environmental intel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>Proximity scoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>AI recon summaries</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>Personalized scoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>Full Fit Score (0-100)</span>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <Link 
              to="/billing"
              className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-8 py-4 rounded-lg hover:bg-[#4a5e28] transition-colors mb-4"
            >
              Upgrade to Pro
              <ChevronRight className="w-5 h-5" />
            </Link>

            <p className="text-gray-500 text-sm mb-8">
              Starting at $9/month or $79/year
            </p>

            {/* What You Get */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">With Pro, you get:</p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>Real-time environmental data</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>AI-powered recommendations</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>Custom preference matching</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                  <span>Unlimited listing analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Brackets */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#556B2F]/20" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#556B2F]/20" />
        </div>

        {/* Continue with Free */}
        <div className="text-center mt-6">
          <Link to="/account" className="text-sm text-gray-600 hover:text-gray-900">
            Continue with Free Plan →
          </Link>
        </div>
      </div>
    </div>
  );
}