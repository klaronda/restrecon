import { RoverIcon } from './rover-icon';
import { Calendar } from 'lucide-react';

interface TrialFlowProps {
  onContinue: () => void;
  onBack?: () => void;
}

export function TrialFlow({ onContinue, onBack }: TrialFlowProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#556B2F]/20">
          {/* Rover with countdown badge */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <RoverIcon size={80} />
              <div className="absolute -top-2 -right-2 bg-[#FF6B35] text-white rounded-full w-12 h-12 flex flex-col items-center justify-center border-2 border-white shadow-lg">
                <span className="text-lg leading-none">7</span>
                <span className="text-xs leading-none">DAYS</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-gray-900 text-3xl text-center mb-3">
            Your 7-Day Mission Begins
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            No credit card required. Full access to all Pro intel.
          </p>

          {/* Benefits */}
          <div className="bg-[#1C2A40]/5 border border-[#1C2A40]/20 rounded-lg p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-[#556B2F]" />
              <span className="text-sm text-[#1C2A40] uppercase tracking-wider">Trial Intel Brief</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F] mt-0.5">▸</span>
                <span>Instant access to all Pro features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F] mt-0.5">▸</span>
                <span>Personalized recon profile setup</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F] mt-0.5">▸</span>
                <span>Unlimited listing intel reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F] mt-0.5">▸</span>
                <span>No charges for 7 days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F] mt-0.5">▸</span>
                <span>Cancel anytime—no questions asked</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={onContinue}
            className="w-full bg-[#556B2F] text-white px-6 py-4 rounded-lg hover:bg-[#4a5e28] transition-colors mb-3"
          >
            Activate Trial
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to pricing
            </button>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Your trial starts immediately. We&apos;ll remind you before it ends.
        </p>
      </div>
    </div>
  );
}
