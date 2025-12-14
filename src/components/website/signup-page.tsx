import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

interface SignUpPageProps {
  onSignUp: (params: { firstName: string; lastName: string; email: string; password: string }) => Promise<void> | void;
}

export function SignUpPage({ onSignUp }: SignUpPageProps) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;
    try {
      setError(null);
      setIsLoading(true);
      await onSignUp({ firstName, lastName, email, password });
      navigate('/account');
    } catch (err: any) {
      // Error messages are now user-friendly from auth.ts
      const errorMessage = err?.message || 'Sign up failed. Please try again.';
      setError(errorMessage);
      console.error('[signup-page] Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#556B2F]/5 via-white to-[#D6C9A2]/10 flex items-center justify-center p-6">
      <div className="max-w-md w-full relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-2">
            <img 
              src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
              alt="Rover" 
              className="w-12 h-12"
            />
            <span className="text-gray-900 text-2xl">NestRecon</span>
          </Link>
          <p className="text-gray-600">Create your NestRecon HQ</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 relative">
          {/* Rover Peeking */}
          <div className="absolute -top-6 -right-6">
          </div>

          <h1 className="text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 text-sm mb-8">
            Your preferences will guide every mission.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm text-gray-700 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/20 focus:border-[#556B2F]"
                placeholder="Alex"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm text-gray-700 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/20 focus:border-[#556B2F]"
                placeholder="Smith"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/20 focus:border-[#556B2F]"
                placeholder="alex@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]/20 focus:border-[#556B2F] pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Trial Notice */}
            <div className="bg-[#F3A712]/10 border border-[#F3A712]/30 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                ✓ Start with a <strong>7-day free trial</strong> of NestRecon Pro<br />
                ✓ No credit card required<br />
                ✓ Downgrade to Free anytime
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#556B2F] text-white px-6 py-4 rounded-lg hover:bg-[#4a5e28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#556B2F] hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {/* Tactical Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#556B2F]/20" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#556B2F]/20" />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}