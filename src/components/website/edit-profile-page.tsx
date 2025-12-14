import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { updateProfile, updatePassword, fetchProfile } from '../../services/auth';
import { supabase } from '../../lib/supabaseClient';
import { SharedNav } from './shared-nav';
import { UserPreferences } from '../../services/preferences';

interface EditProfilePageProps {
  onLogout?: () => void;
  currentPreferences?: UserPreferences | null;
  onPreferencesUpdated?: (prefs: UserPreferences) => Promise<void>;
}

export function EditProfilePage({ onLogout, currentPreferences, onPreferencesUpdated }: EditProfilePageProps) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const profile = await fetchProfile(user.id);
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setEmail(profile.email || user.email || '');
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[EditProfilePage] Error loading profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    void loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      // Always update profile (names can be empty/null)
      await updateProfile(
        firstName.trim() || null,
        lastName.trim() || null
      );

      // Update password if provided
      if (password.trim()) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await updatePassword(password);
      }

      // If preferences exist and we have a recap regeneration function,
      // regenerate the recap since profile changes might affect it
      if (currentPreferences && onPreferencesUpdated) {
        try {
          await onPreferencesUpdated(currentPreferences);
        } catch (recapError) {
          // Don't fail the profile update if recap regeneration fails
          console.warn('[EditProfilePage] Recap regeneration failed:', recapError);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/account');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav isLoggedIn={true} onLogout={onLogout} />

      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#1C2A40] via-[#556B2F] to-[#4a5e28] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Account
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">Edit Profile</h1>
              <p className="text-white/70">Update your account information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors"
                placeholder="Doe"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] pr-12 transition-colors"
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave blank to keep your current password</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-[#556B2F]/10 border border-[#556B2F]/20 rounded-lg p-4">
                <p className="text-sm text-[#556B2F] font-medium">✓ Profile updated successfully! Redirecting...</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#556B2F] text-white px-4 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

