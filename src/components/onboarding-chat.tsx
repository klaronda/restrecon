import React from 'react';
import { Send, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { PreferenceTag, PreferenceToggles, UserPreferences as StoredPreferences } from '../services/preferences';

interface OnboardingChatProps {
  userName: string;
  onComplete: (preferences: StoredPreferences) => void;
  onExit?: () => void;
  initialPreferences?: StoredPreferences | null;
}

type WizardStep = 0 | 1;

export function OnboardingChat({ userName, onComplete, onExit, initialPreferences }: OnboardingChatProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const [otherPreferences, setOtherPreferences] = useState('');
  const [tags, setTags] = useState<PreferenceTag[]>([]);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagDistance, setNewTagDistance] = useState<number>(5);
  const [toggles, setToggles] = useState<PreferenceToggles>({
    walkScore: true,
    bikeScore: false,
    transitScore: false,
  });

  React.useEffect(() => {
    if (initialPreferences) {
      setTags(initialPreferences.tags || []);
      setToggles({
        walkScore: Boolean(initialPreferences.toggles?.walkScore),
        bikeScore: Boolean(initialPreferences.toggles?.bikeScore),
        transitScore: Boolean(initialPreferences.toggles?.transitScore),
      });
      setOtherPreferences(initialPreferences.otherPreferences || '');
    }
  }, [initialPreferences]);
  const addTag = () => {
    if (!newTagLabel.trim() || tags.length >= 5) return;
    setTags((prev) => [...prev, { label: newTagLabel.trim(), distanceMiles: newTagDistance || 5 }]);
    setNewTagLabel('');
    setNewTagDistance(5);
  };

  const removeTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = () => {
    const prefs: StoredPreferences = {
      tags,
      toggles,
      freeformInput: undefined,
      otherPreferences,
    };
    onComplete(prefs);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-[#556B2F]/15">
        <div className="relative p-6 bg-gradient-to-r from-[#1C2A40] via-[#556B2F] to-[#4a5e28] text-white">
          {onExit && (
            <button
              onClick={onExit}
              className="absolute right-4 top-4 text-white/80 hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
              <img
                src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg"
                alt="Rover"
                className="w-8 h-8"
              />
              </div>
            <div className="bg-white/95 text-gray-900 rounded-lg px-3 py-2 shadow">
              <h2 className="text-gray-900 text-base font-semibold">NestRecon Pro</h2>
              <p className="text-gray-700 text-sm">Set up your mission-critical needs.</p>
            </div>
          </div>
          <div className="bg-white/92 text-gray-900 rounded-lg p-4 border border-white/20 shadow-sm">
            <h2 className="text-gray-900 text-lg">Calibrate Your Recon Parameters</h2>
            <p className="text-gray-700 text-sm mt-1">
              We handle Zillow defaults. Tell us the mission intel to surface first.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Already covered: price, beds/baths, square footage, school data. Add the signals that make a place feel right for you.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-gray-900 font-medium">
                Add up to 5 place types that matter (e.g., preschools, golf courses), plus max miles away.
              </p>
              <div className="flex flex-wrap gap-3">
                <input
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  placeholder="e.g., preschools, skateparks, dog parks, climbing gyms, grocery"
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#556B2F]"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newTagDistance}
                  onChange={(e) => setNewTagDistance(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#556B2F]"
                  placeholder="Miles (e.g., 5)"
              />
              <button
                  onClick={addTag}
                  disabled={tags.length >= 5}
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {tags.map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-800">
                      {tag.label} · within {tag.distanceMiles} miles
                    </div>
                    <button onClick={() => removeTag(idx)} className="text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && <p className="text-sm text-gray-500">No targets added yet.</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Next: Mobility + extras
              </button>
            </div>
          </div>
        )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-900 font-medium">Toggle the mobility signals that matter to you.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { key: 'walkScore', label: 'Walkability' },
                  { key: 'bikeScore', label: 'Bikeability' },
                  { key: 'transitScore', label: 'Transit access' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean((toggles as any)[item.key])}
                      onChange={(e) =>
                        setToggles((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Anything else Zillow doesn’t filter for? Drop it here so we can keep it in focus.
                </p>
                <textarea
                  value={otherPreferences}
                  onChange={(e) => setOtherPreferences(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                  placeholder="Anything else we should know?"
                />
              </div>
              <div className="flex gap-3">
            <button
              onClick={handleComplete}
                  className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
                  Save preferences
            </button>
              </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}