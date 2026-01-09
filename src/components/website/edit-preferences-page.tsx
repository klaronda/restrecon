import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Settings, Wind, Volume2, Star, Footprints, Bike, Train } from 'lucide-react';
import { PreferenceTag, PreferenceToggles, UserPreferences } from '../../services/preferences';
import { SharedNav } from './shared-nav';

interface EditPreferencesPageProps {
  userName: string;
  initialPreferences?: UserPreferences | null;
  onComplete: (preferences: UserPreferences) => Promise<void>;
  onLogout?: () => void;
}

type WizardStep = 0 | 1;

export function EditPreferencesPage({ userName, initialPreferences, onComplete, onLogout }: EditPreferencesPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(0);
  const [tags, setTags] = useState<PreferenceTag[]>([]);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [toggles, setToggles] = useState<PreferenceToggles>({
    walkScore: true,
    bikeScore: false,
    transitScore: false,
    airQuality: false,
    soundScore: false,
    stargazeScore: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialPreferences) {
      // Convert old tags that might have distanceMiles to new format without it
      const convertedTags = (initialPreferences.tags || []).map(tag => ({
        label: tag.label
      }));
      setTags(convertedTags);
      setToggles({
        walkScore: Boolean(initialPreferences.toggles?.walkScore),
        bikeScore: Boolean(initialPreferences.toggles?.bikeScore),
        transitScore: Boolean(initialPreferences.toggles?.transitScore),
        airQuality: Boolean(initialPreferences.toggles?.airQuality),
        soundScore: Boolean(initialPreferences.toggles?.soundScore),
        stargazeScore: Boolean(initialPreferences.toggles?.stargazeScore),
      });
    }
  }, [initialPreferences]);

  const addTag = () => {
    if (!newTagLabel.trim() || tags.length >= 5) return;
    setTags((prev) => [...prev, { label: newTagLabel.trim() }]);
    setNewTagLabel('');
  };

  const removeTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
    const prefs: UserPreferences = {
      tags,
      toggles,
      freeformInput: undefined,
    };
      await onComplete(prefs);
      navigate('/account');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[EditPreferencesPage] Error saving preferences:', err);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagLabel.trim() && tags.length < 5) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav isLoggedIn={true} onLogout={onLogout} />

      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#1C2A40] via-[#556B2F] to-[#4a5e28] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4">
            <img
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg"
              alt="Rover"
              className="w-16 h-16 brightness-0 invert"
            />
            <div>
              <h1 className="text-white text-3xl font-bold">Edit Preferences</h1>
              <p className="text-white/70">Calibrate your recon parameters, {userName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => navigate('/account')}
                  className="inline-flex items-center gap-2 text-[#556B2F] hover:text-[#4a5e28] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Account
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#556B2F]/5 to-[#556B2F]/10 rounded-lg p-4 border border-[#556B2F]/20">
                  <h3 className="font-semibold text-gray-900 mb-2">Mission Brief</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    We handle Zillow defaults. Tell us the mission intel to surface first.
                  </p>
                  <p className="text-xs text-gray-600">
                    Already covered: price, beds/baths, square footage, school data.
                  </p>
                </div>

                {/* Step indicator */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full transition-colors ${
                        step >= 0 ? 'bg-[#F3A712]' : 'bg-gray-300'
                      }`} />
                      <span className={`text-sm ${step >= 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                        Target Locations
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full transition-colors ${
                        step >= 1 ? 'bg-[#F3A712]' : 'bg-gray-300'
                      }`} />
                      <span className={`text-sm ${step >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                        Environment
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
          {step === 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#556B2F]/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#556B2F]" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-semibold text-xl">Target Locations</h2>
                  <p className="text-gray-600 text-sm">Add places that matter to your search</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Add up to 5 place types that matter to your search.
                </p>

                <div className="flex flex-wrap gap-3">
                  <input
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., preschools, skateparks, coffee shops"
                    className="flex-1 min-w-[280px] px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors"
                  />
                  <button
                    onClick={addTag}
                    disabled={tags.length >= 5 || !newTagLabel.trim()}
                    className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                {tags.map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">{tag.label}</span>
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
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#556B2F]/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#556B2F]" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-semibold text-xl">Environment</h2>
                  <p className="text-gray-600 text-sm">Configure environmental preferences</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">
                Select the environmental factors that matter most to your lifestyle.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'walkScore', label: 'Walkability', description: 'Walk Score®', icon: Footprints },
                  { key: 'bikeScore', label: 'Bikeability', description: 'Bike Score®', icon: Bike },
                  { key: 'transitScore', label: 'Transit Access', description: 'Transit Score®', icon: Train },
                  { key: 'airQuality', label: 'Air Quality', description: 'Clean air quality', icon: Wind },
                  { key: 'soundScore', label: 'Sound Score', description: 'Low noise levels', icon: Volume2 },
                  { key: 'stargazeScore', label: 'Stargaze Score', description: 'Dark sky conditions', icon: Star },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = Boolean((toggles as any)[item.key]);

                  return (
                    <label
                      key={item.key}
                      className={`group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${
                        isSelected
                          ? 'border-[#556B2F] bg-[#556B2F]/5'
                          : 'border-gray-200 hover:border-[#556B2F]/30 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          setToggles((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                        className="sr-only"
                      />

                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#556B2F] text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-[#556B2F]/10 group-hover:text-[#556B2F]'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex flex-col">
                        <span className={`text-sm font-medium transition-colors ${
                          isSelected ? 'text-[#556B2F]' : 'text-gray-800'
                        }`}>
                          {item.label}
                        </span>
                        <span className={`text-xs transition-colors ${
                          isSelected ? 'text-[#556B2F]/70' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            {step === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/account')}
                  className="px-6 py-3 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-[#556B2F] text-white rounded-lg hover:bg-[#4a5e28] transition-colors font-medium"
                >
                  Next: Environment
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-6 py-3 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="px-6 py-3 bg-[#556B2F] text-white rounded-lg hover:bg-[#4a5e28] transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

