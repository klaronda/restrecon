import { MetricRow } from './metric-row';
import { TagChip } from './tag-chip';
import { RefreshCw, Settings, X, Check, Radio } from 'lucide-react';
import { RoverIcon } from './rover-icon';

interface ListingPanelProps {
  isLoggedIn: boolean;
  userName?: string;
  onViewSettings?: () => void;
  onClose?: () => void;
}

export function ListingPanel({ isLoggedIn, userName, onViewSettings, onClose }: ListingPanelProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-end">
      {/* Fixed Right Panel */}
      <div
        className="bg-gray-50 h-screen overflow-y-auto p-6 border-l border-gray-200"
        style={{
          width: '400px',
          position: 'fixed',
          right: 0,
          top: 0,
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <RoverIcon size={24} />
            <h2 className="text-gray-900" style={{ letterSpacing: '0.02em' }}>NestRecon</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Target Fit Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-4">
          <div className="mb-2 flex items-center gap-2">
            {isLoggedIn ? (
              <span className="text-gray-600 text-sm">Your Target Fit Score</span>
            ) : (
              <span className="text-gray-600 text-sm">Target Fit Score (Default Profile)</span>
            )}
            <Radio className="w-3.5 h-3.5 text-[#556B2F]" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-gray-900" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>
              56
            </span>
            <span className="text-gray-500" style={{ fontSize: '24px' }}>
              / 100
            </span>
          </div>
          <TagChip label="Fair Match" variant="warning" size="md" />
        </div>

        {/* Mission Brief */}
        <div className="bg-[#1C2A40]/5 border border-[#1C2A40]/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs text-[#1C2A40] uppercase tracking-wider" style={{ fontWeight: 500 }}>Intel Summary</span>
          </div>
          <p className="text-gray-900 text-sm leading-relaxed">
            Strong interior, weak school signals. Sound above optimal. Worth reconnaissance only if design is priority.
          </p>
        </div>

        {/* Login Prompt (Free Mode Only) */}
        {!isLoggedIn && (
          <div className="bg-[#F3A712]/10 border border-[#F3A712]/30 rounded-lg p-4 mb-6">
            <p className="text-gray-900 text-sm mb-2">
              Deploy personalized recon. Calibrate scores to your mission parameters.
            </p>
            <button className="text-[#556B2F] hover:underline text-sm font-bold">
              Sign in or initialize account →
            </button>
          </div>
        )}

        {/* Walk/Bike/Transit Scores */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-3">Mobility Intel</h3>
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
              <div className="text-gray-900" style={{ fontSize: '24px' }}>78</div>
              <div className="text-gray-600 text-xs">Walk</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
              <div className="text-gray-900" style={{ fontSize: '24px' }}>65</div>
              <div className="text-gray-600 text-xs">Bike</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
              <div className="text-gray-900" style={{ fontSize: '24px' }}>52</div>
              <div className="text-gray-600 text-xs">Transit</div>
            </div>
          </div>
        </div>

        {/* School Overview */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-3">School Quality</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Elementary</span>
                <span className="text-gray-900">Oak Springs Elementary · 6/10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Middle</span>
                <span className="text-gray-900">Martin Middle · 5/10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">High</span>
                <span className="text-gray-900">Reagan High · 7/10</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="text-gray-900">Average</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">6.0/10</span>
                <TagChip label="Okay" variant="warning" size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Environment & Night Sky */}
        <div className="mb-6">
          <h3 className="text-gray-900 mb-3">Environment & Night Sky</h3>
          <MetricRow label="Sound Score" level="not-great" />
          <MetricRow label="Air Quality" level="good" />
          <MetricRow label="Stargaze Score" level="okay" />
        </div>

        {/* Personal Preference Signals (Logged In Only) */}
        {isLoggedIn && (
          <div className="mb-6">
            <h3 className="text-gray-900 mb-3">Priority Match Status</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-900">Skatepark: Within 8mi, rated 4.5★+ — confirmed</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-900">Schools: Below target (6.0 vs 7.5 required)</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-900">Noise: Above optimal threshold</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#556B2F] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-900">Farmers market: 5mi range, 4.5★+ — confirmed</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          {isLoggedIn && onViewSettings && (
            <button
              onClick={onViewSettings}
              className="text-[#556B2F] hover:underline text-sm mb-4 block"
            >
              Edit mission parameters →
            </button>
          )}
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            Intel gathered from external APIs and recon algorithms. Estimates only.
          </p>
          <div className="flex gap-3">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              Re-scan
            </button>
            {isLoggedIn && onViewSettings && (
              <button
                onClick={onViewSettings}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
                Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}