import { Check, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RoverIcon } from '../rover-icon';
import { useState } from 'react';

interface PricingPageProps {
  isLoggedIn?: boolean;
}

export function PricingPage({ isLoggedIn = false }: PricingPageProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <RoverIcon size={32} />
              <span className="text-xl font-semibold text-gray-900">NestRecon</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link to="/#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
              <Link to="/faq" className="text-gray-600 hover:text-gray-900">FAQ</Link>
              {isLoggedIn ? (
                <Link to="/account" className="text-[#556B2F] hover:text-[#4a5e28] font-medium">
                  Account
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">Log In</Link>
                  <Link
                    to="/signup"
                    className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={closeMobileMenu}
                aria-hidden="true"
              />
              <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <span className="text-gray-900 text-xl font-semibold">Menu</span>
                    <button
                      onClick={closeMobileMenu}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col gap-6">
                      <Link 
                        to="/" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Home
                      </Link>
                      <Link 
                        to="/#how-it-works" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        How It Works
                      </Link>
                      <Link 
                        to="/faq" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        FAQ
                      </Link>
                      {isLoggedIn ? (
                        <Link 
                          to="/account" 
                          className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                          onClick={closeMobileMenu}
                        >
                          Account
                        </Link>
                      ) : (
                        <>
                          <Link 
                            to="/login" 
                            className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                            onClick={closeMobileMenu}
                          >
                            Log In
                          </Link>
                          <Link
                            to="/signup"
                            className="bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors text-center"
                            onClick={closeMobileMenu}
                          >
                            Sign Up
                          </Link>
                        </>
                      )}
                    </div>
                  </nav>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-gray-900 mb-4 text-4xl font-bold">Choose Your Mission Plan</h1>
            <p className="text-gray-600 text-lg">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
              <div className="mb-6">
                <h3 className="text-gray-900 text-2xl mb-2">NestRecon Free</h3>
                <p className="text-gray-600">Basic reconnaissance</p>
              </div>
              
              <div className="mb-8">
                <div className="text-gray-900">
                  <span className="text-5xl">$0</span>
                </div>
                <p className="text-gray-500 text-sm">Forever free</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Basic Recon Score</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Basic listing information</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Limited sidebar panel</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No tactical summaries</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No environment intel</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No personalization</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <span className="text-gray-400">✗ No intel briefs</span>
                </li>
              </ul>

              <Link 
                to={isLoggedIn ? "/account" : "/signup"}
                className="block w-full text-center border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-400 transition-colors"
              >
                {isLoggedIn ? 'Open Mission Control' : 'Get Started Free'}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] rounded-2xl p-8 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-[#F3A712] text-white text-xs px-3 py-1 rounded-full">
                MOST POPULAR
              </div>

              <div className="mb-6">
                <h3 className="text-white text-2xl mb-2">NestRecon Pro</h3>
                <p className="text-white/80">Full tactical intelligence</p>
              </div>
              
              <div className="mb-8">
                <div className="text-white">
                  <span className="text-5xl">$9</span>
                  <span className="text-xl">/month</span>
                </div>
                <p className="text-white/70 text-sm">or $79/year (Save 25%)</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Real commute distances</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Air quality, sound, stargaze intel</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Proximity scoring (preschools, parks, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Personalized preference profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Full Fit Score (0-100)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Mission Intel briefings</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">Unlimited listing reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#F3A712] mt-0.5 flex-shrink-0" />
                  <span className="text-white">7-day free trial</span>
                </li>
              </ul>

              <Link
                to={isLoggedIn ? "/billing" : "/signup"}
                className="block w-full text-center bg-[#F3A712] text-white px-6 py-3 rounded-lg hover:bg-[#e55f2f] transition-colors mb-3"
              >
                {isLoggedIn ? 'Upgrade to Pro' : 'Start Free Trial'}
              </Link>
              
              <p className="text-white/80 text-sm text-center">
                No credit card required for trial
              </p>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="text-center text-gray-500 text-sm mt-12">
            <p>Cancel anytime • Powered by Stripe</p>
          </div>
        </div>
      </section>
    </div>
  );
}

