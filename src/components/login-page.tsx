import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { RoverIcon } from './rover-icon';

interface LoginPageProps {
  onLogin: (email: string, firstName: string, lastName: string, city: string, state: string) => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      onLogin(email, firstName, lastName, city, state);
    } else {
      // For demo, just use default values on login
      onLogin(email, 'Kevin', 'Smith', 'Austin', 'TX');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <RoverIcon size={36} />
            <h1 className="text-gray-900" style={{ fontSize: '28px', letterSpacing: '0.02em' }}>NestRecon</h1>
          </div>
          <p className="text-gray-600">
            {isSignUp ? 'Initialize your profile' : 'Welcome back, operator'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-gray-900 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="Kevin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-900 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-900 mb-2">City / Metro</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="Austin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-900 mb-2">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                    placeholder="TX"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-gray-900 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
              {isSignUp ? 'Deploy Account' : 'Access System'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              {isSignUp ? 'Already registered? Log in' : 'New operator? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}