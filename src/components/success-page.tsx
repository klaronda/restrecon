import { RoverIcon } from './rover-icon';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface SuccessPageProps {
  onOpenApp: () => void;
  onManageBilling: () => void;
}

export function SuccessPage({ onOpenApp, onManageBilling }: SuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#556B2F]/10 via-amber-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#556B2F]/20 text-center">
          {/* Success animation container */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Checkmark with animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-[#556B2F]/10 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
              </div>
              <div className="relative w-24 h-24 bg-[#556B2F] rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Rover saluting */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <RoverIcon size={72} />
              <div className="absolute -top-1 -right-1 text-2xl">
                🫡
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-gray-900 text-3xl mb-3">
            Recon Upgrade Complete
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your mission profile is now fully unlocked.
          </p>

          {/* Details */}
          <div className="bg-[#556B2F]/5 border border-[#556B2F]/20 rounded-lg p-5 mb-8 text-left">
            <h3 className="text-sm text-[#556B2F] uppercase tracking-wider mb-3">Deployment Status</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F]">✓</span>
                <span>Full NestRecon Pro activated</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F]">✓</span>
                <span>Intel engine enabled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F]">✓</span>
                <span>Personalized intel ready</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F]">✓</span>
                <span>Environmental sensors online</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#556B2F]">✓</span>
                <span>Multi-device sync active</span>
              </li>
            </ul>
          </div>

          {/* CTAs */}
          <button
            onClick={onOpenApp}
            className="w-full bg-[#556B2F] text-white px-6 py-4 rounded-lg hover:bg-[#4a5e28] transition-colors mb-3"
          >
            Open NestRecon
          </button>

          <button
            onClick={onManageBilling}
            className="w-full text-[#556B2F] hover:underline text-sm flex items-center justify-center gap-1"
          >
            Manage Billing
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          You can access your subscription settings anytime from the Settings page.
        </p>
      </div>
    </div>
  );
}
