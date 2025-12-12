import { RoverIcon } from './rover-icon';
import { AlertTriangle, Battery } from 'lucide-react';

interface SoftLockScreenProps {
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export function SoftLockScreen({ onUpgrade, onDismiss }: SoftLockScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Banner */}
        <div className="bg-[#FF6B35]/10 border-2 border-[#FF6B35] rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 text-xl mb-2">Trial Ended — Recon Restricted</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Your intel feed is now limited. Upgrade to NestRecon Pro to reactivate full scoring, AI recon, and real environmental signals.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onUpgrade}
                  className="bg-[#556B2F] text-white px-6 py-2.5 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Upgrade to Pro
                </button>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="bg-white text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Continue with Free
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rover with low signal visual */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 mb-6 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <RoverIcon size={80} className="opacity-40 grayscale" />
              <div className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center border-2 border-white shadow-lg">
                <Battery className="w-5 h-5" />
              </div>
            </div>
          </div>
          <h3 className="text-gray-900 text-lg mb-2">Signal Lost</h3>
          <p className="text-gray-600 text-sm">
            Advanced recon features are offline. Upgrade to restore full capabilities.
          </p>
        </div>

        {/* Grayed-out premium metrics example */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="text-gray-900 mb-4">Limited Intel Preview</h3>
          
          {/* Walk/Bike/Transit - Disabled */}
          <div className="mb-6">
            <h4 className="text-gray-500 text-sm mb-3">Mobility Intel (Pro Only)</h4>
            <div className="flex gap-2 opacity-40 pointer-events-none">
              <div className="flex-1 bg-gray-100 rounded-lg border border-gray-300 p-3 text-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gray-900/70 text-white text-xs px-2 py-1 rounded">LOCKED</div>
                </div>
                <div className="text-gray-400 blur-sm" style={{ fontSize: '24px' }}>78</div>
                <div className="text-gray-400 text-xs blur-sm">Walk</div>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg border border-gray-300 p-3 text-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gray-900/70 text-white text-xs px-2 py-1 rounded">LOCKED</div>
                </div>
                <div className="text-gray-400 blur-sm" style={{ fontSize: '24px' }}>65</div>
                <div className="text-gray-400 text-xs blur-sm">Bike</div>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg border border-gray-300 p-3 text-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gray-900/70 text-white text-xs px-2 py-1 rounded">LOCKED</div>
                </div>
                <div className="text-gray-400 blur-sm" style={{ fontSize: '24px' }}>52</div>
                <div className="text-gray-400 text-xs blur-sm">Transit</div>
              </div>
            </div>
          </div>

          {/* Environment - Disabled */}
          <div className="mb-6">
            <h4 className="text-gray-500 text-sm mb-3">Environment & Night Sky (Pro Only)</h4>
            <div className="space-y-2 opacity-40 pointer-events-none relative">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-gray-900/70 text-white px-4 py-2 rounded-lg">
                  UPGRADE REQUIRED
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300 blur-sm">
                <span className="text-gray-600">Sound Score</span>
                <span className="text-gray-400">Restricted</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300 blur-sm">
                <span className="text-gray-600">Air Quality</span>
                <span className="text-gray-400">Restricted</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300 blur-sm">
                <span className="text-gray-600">Stargaze Score</span>
                <span className="text-gray-400">Restricted</span>
              </div>
            </div>
          </div>

          {/* AI Recon - Disabled */}
          <div>
            <h4 className="text-gray-500 text-sm mb-3">AI Mission Brief (Pro Only)</h4>
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-gray-900/70 text-white px-4 py-2 rounded-lg">
                  LOCKED
                </div>
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 opacity-40 blur-sm pointer-events-none">
                <p className="text-gray-600 text-sm">
                  AI-powered recommendations and insights are available with Pro subscription.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onUpgrade}
              className="w-full bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
              Unlock Full Recon — Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}