import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings } from 'lucide-react';
import { PreferenceTag, PreferenceToggles, UserPreferences } from '../../services/preferences';

interface EditPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  initialPreferences?: UserPreferences | null;
  onComplete: (preferences: UserPreferences) => void;
}

type WizardStep = 0 | 1;

export function EditPreferencesModal({
  isOpen,
  onClose,
  userName,
  initialPreferences,
  onComplete,
}: EditPreferencesModalProps) {
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

  // Reset form when modal opens with initial preferences
  useEffect(() => {
    if (isOpen) {
      if (initialPreferences) {
        setTags(initialPreferences.tags || []);
        setToggles({
          walkScore: Boolean(initialPreferences.toggles?.walkScore),
          bikeScore: Boolean(initialPreferences.toggles?.bikeScore),
          transitScore: Boolean(initialPreferences.toggles?.transitScore),
        });
        setOtherPreferences(initialPreferences.otherPreferences || '');
      } else {
        setTags([]);
        setToggles({ walkScore: true, bikeScore: false, transitScore: false });
        setOtherPreferences('');
      }
      setStep(0);
      setNewTagLabel('');
      setNewTagDistance(5);
    }
  }, [isOpen, initialPreferences]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
    const prefs: UserPreferences = {
      tags,
      toggles,
      freeformInput: undefined,
      otherPreferences,
    };
    onComplete(prefs);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagLabel.trim() && tags.length < 5) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      onClick={handleBackdropClick}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-[#1C2A40]/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-gray-200 max-h-[90vh] flex flex-col">
        {/* Header with gradient */}
        <div className="relative p-6 bg-gradient-to-r from-[#1C2A40] via-[#556B2F] to-[#4a5e28]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
              <img
                src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg"
                alt="Rover"
                className="w-8 h-8"
              />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Edit Preferences</h2>
              <p className="text-white/70 text-sm">Calibrate your recon parameters, {userName}</p>
            </div>
          </div>
          
          {/* Info card */}
          <div className="mt-4 bg-white/95 text-gray-900 rounded-lg p-4 border border-white/20 shadow-sm">
            <p className="text-gray-700 text-sm">
              We handle Zillow defaults. Tell us the mission intel to surface first.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Already covered: price, beds/baths, square footage, school data.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 0 ? 'bg-[#F3A712]' : 'bg-white/30'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 1 ? 'bg-[#F3A712]' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-gray-900 font-medium mb-2">Target Locations</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Add up to 5 place types that matter (e.g., preschools, golf courses), plus max miles away.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <input
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., preschools, skateparks"
                  className="flex-1 min-w-[180px] px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newTagDistance}
                  onChange={(e) => setNewTagDistance(Number(e.target.value))}
                  className="w-24 px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors text-center"
                  placeholder="Miles"
                />
                <button
                  onClick={addTag}
                  disabled={tags.length >= 5 || !newTagLabel.trim()}
                  className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              
              <div className="space-y-2">
                {tags.map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">{tag.label}</span>
                      <span className="text-gray-500"> · within {tag.distanceMiles} miles</span>
                    </div>
                    <button
                      onClick={() => removeTag(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    No target locations added yet. Add places that matter to your search.
                  </div>
                )}
                {tags.length >= 5 && (
                  <p className="text-xs text-[#F3A712]">Maximum of 5 targets reached.</p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-gray-900 font-medium mb-2">Mobility Signals</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Toggle the mobility scores that matter to you.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { key: 'walkScore', label: 'Walkability', description: 'Walk Score®' },
                  { key: 'bikeScore', label: 'Bikeability', description: 'Bike Score®' },
                  { key: 'transitScore', label: 'Transit Access', description: 'Transit Score®' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      (toggles as any)[item.key]
                        ? 'border-[#556B2F] bg-[#556B2F]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean((toggles as any)[item.key])}
                      onChange={(e) =>
                        setToggles((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      (toggles as any)[item.key]
                        ? 'bg-[#556B2F] border-[#556B2F]'
                        : 'border-gray-300'
                    }`}>
                      {(toggles as any)[item.key] && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-2">
                <h3 className="text-gray-900 font-medium mb-2">Additional Notes</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Anything else Zillow doesn't filter for? Drop it here so we can keep it in focus.
                </p>
                <textarea
                  value={otherPreferences}
                  onChange={(e) => setOtherPreferences(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors resize-none"
                  placeholder="e.g., Need a big backyard, prefer quiet streets, want natural light..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            {step === 0 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#556B2F] text-white px-4 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors font-medium"
                >
                  Next: Mobility + Extras
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 bg-[#556B2F] text-white px-4 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors font-medium"
                >
                  Save Preferences
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

