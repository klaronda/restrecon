import { X, Lock } from 'lucide-react';
import { RoverIcon } from './rover-icon';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateTrial: () => void;
  onViewPricing: () => void;
}

export function UpgradeModal({ isOpen, onClose, onActivateTrial, onViewPricing }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-[#556B2F]/20">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-[#556B2F]/10 rounded-full flex items-center justify-center border-2 border-[#556B2F]/20">
              <Lock className="w-8 h-8 text-[#556B2F]" />
            </div>
            {/* Rover peeking */}
            <div className="absolute -bottom-2 -right-2">
              <RoverIcon size={32} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-gray-900 text-2xl text-center mb-3">Unlock Full Recon</h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          This mission requires advanced intel—real commute times, air quality, sound analysis, and AI-driven recon. Start your 7-day free trial to deploy full NestRecon Pro.
        </p>

        {/* Features highlight */}
        <div className="bg-[#556B2F]/5 rounded-lg p-4 mb-6 border border-[#556B2F]/20">
          <p className="text-sm text-gray-700 mb-2">Pro intel includes:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Real commute distances</li>
            <li>• Environmental signals (sound, air, sky)</li>
            <li>• Personalized proximity scoring</li>
            <li>• AI mission recommendations</li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={onActivateTrial}
            className="w-full bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors"
          >
            Activate Free Trial
          </button>
          
          <button
            onClick={onViewPricing}
            className="w-full text-[#556B2F] hover:underline text-sm"
          >
            See full pricing →
          </button>
        </div>

        {/* Trust note */}
        <p className="text-center text-gray-400 text-xs mt-4">
          No credit card required • 7 days free
        </p>
      </div>
    </div>
  );
}