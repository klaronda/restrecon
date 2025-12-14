import { useState, useEffect, type FormEvent } from 'react';
import { X, Eye, EyeOff, User } from 'lucide-react';
import { updateProfile, updatePassword } from '../../services/auth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFirstName?: string | null;
  currentLastName?: string | null;
  currentEmail?: string | null;
  onProfileUpdated: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentFirstName,
  currentLastName,
  currentEmail,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(currentFirstName || '');
  const [lastName, setLastName] = useState(currentLastName || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens/closes or current values change
  useEffect(() => {
    if (isOpen) {
      setFirstName(currentFirstName || '');
      setLastName(currentLastName || '');
      setPassword('');
      setShowPassword(false);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, currentFirstName, currentLastName]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      // Update profile if name changed
      const nameChanged = 
        firstName !== (currentFirstName || '') || 
        lastName !== (currentLastName || '');

      if (nameChanged) {
        await updateProfile(
          firstName.trim() || null,
          lastName.trim() || null
        );
      }

      // Update password if provided
      if (password.trim()) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await updatePassword(password);
      }

      // If nothing changed, show message
      if (!nameChanged && !password.trim()) {
        setError('No changes to save.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      
      // Refresh profile and close after a moment
      setTimeout(() => {
        onProfileUpdated();
        onClose();
        setPassword('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-gray-200">
        {/* Header with gradient */}
        <div className="relative p-6 bg-gradient-to-r from-[#1C2A40] via-[#556B2F] to-[#4a5e28]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            disabled={isLoading}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Edit Profile</h2>
              <p className="text-white/70 text-sm">Update your account information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email (Read-only) */}
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={currentEmail || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              id="edit-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors"
              placeholder="John"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="edit-lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              id="edit-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/30 focus:border-[#556B2F] transition-colors"
              placeholder="Doe"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="edit-password"
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
              <p className="text-sm text-[#556B2F] font-medium">✓ Profile updated successfully!</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
  );
}
