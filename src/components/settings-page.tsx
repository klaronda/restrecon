import { ArrowLeft } from 'lucide-react';
import { MetricRow } from './metric-row';
import { RoverIcon } from './rover-icon';

interface SettingsPageProps {
  userName: string;
  userCity: string;
  userState?: string;
  onViewListing: () => void;
  onBack?: () => void;
}

export function SettingsPage({ userName, userCity, userState = 'TX', onViewListing, onBack }: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <RoverIcon size={28} />
              <h1 className="text-gray-900" style={{ letterSpacing: '0.02em' }}>NestRecon</h1>
            </div>
          </div>
          <button
            onClick={onViewListing}
            className="px-4 py-2 bg-[#556B2F] text-white rounded-lg hover:bg-[#4a5e28] transition-colors text-sm"
          >
            View Sample Recon
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-gray-900 mb-4">Mission Profile</h2>
          <div className="mb-4">
            <div className="text-gray-600 text-sm mb-1">Operator</div>
            <div className="text-gray-900">{userName}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-sm mb-1">Target Location</div>
            <div className="text-gray-900">{userCity}</div>
          </div>
          <div className="mb-6">
            <div className="text-gray-600 text-sm mb-1">State</div>
            <div className="text-gray-900">{userState}</div>
          </div>
          <div className="bg-[#556B2F]/5 border border-[#556B2F]/20 rounded-lg p-4">
            <p className="text-gray-900 leading-relaxed">
              <strong>{userName}</strong> is scouting single-family homes in {userCity}, {userState}. Priority intel: excellent air quality, 
              low noise environment, fair night sky visibility, average school score ≥ 7/10. 
              Optimal ranges: preschool within 10 miles, quality skatepark within 8 miles.
            </p>
          </div>
        </div>

        {/* Environment & Night Sky */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-gray-900 mb-4">Environment & Night Sky</h3>
          <div className="space-y-3">
            <MetricRow label="Air Quality Preference" level="excellent" />
            <MetricRow label="Sound Tolerance" level="good" subtitle="Lower is better" />
            <MetricRow label="Stargaze Importance" level="okay" />
          </div>
        </div>

        {/* Walkability & Amenities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-gray-900 mb-4">Walkability & Amenities</h3>
          <div className="space-y-3">
            <MetricRow label="Walk Score Importance" level="good" />
            <MetricRow label="Farmers Market Proximity" level="good" subtitle="Within 5 miles" />
          </div>
        </div>

        {/* Schools & Kids */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-gray-900 mb-4">Schools & Kids</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-3">
              <div className="text-gray-900 text-sm">Minimum Average School Score</div>
              <div className="text-gray-900">7/10</div>
            </div>
            <div className="flex justify-between items-center mb-3">
              <div className="text-gray-900 text-sm">Preschool Proximity</div>
              <div className="text-gray-900">Within 10 miles</div>
            </div>
          </div>
        </div>

        {/* Custom Interests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Priority Signals</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-[#556B2F]/10 text-[#556B2F] rounded-full text-sm border border-[#556B2F]/30">
              Skateparks
            </span>
            <span className="px-3 py-1.5 bg-[#556B2F]/10 text-[#556B2F] rounded-full text-sm border border-[#556B2F]/30">
              Preschools
            </span>
            <span className="px-3 py-1.5 bg-[#556B2F]/10 text-[#556B2F] rounded-full text-sm border border-[#556B2F]/30">
              Farmers Markets
            </span>
            <span className="px-3 py-1.5 bg-[#556B2F]/10 text-[#556B2F] rounded-full text-sm border border-[#556B2F]/30">
              Low Noise
            </span>
            <span className="px-3 py-1.5 bg-[#556B2F]/10 text-[#556B2F] rounded-full text-sm border border-[#556B2F]/30">
              Good Air Quality
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-3 bg-[#556B2F] text-white rounded-lg hover:bg-[#4a5e28] transition-colors">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
}