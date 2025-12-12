import { Link } from 'react-router-dom';
import { RoverIcon } from '../rover-icon';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface FAQPageProps {
  isLoggedIn?: boolean;
}

export function FAQPage({ isLoggedIn = false }: FAQPageProps) {
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
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
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
                        to="/pricing" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Pricing
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

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-gray-900 mb-4 text-4xl font-bold">Frequently Asked Questions</h1>
            <p className="text-gray-600 text-lg">
              Everything you need to know about NestRecon
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">What data sources do you use?</h3>
              <p className="text-gray-600">
                We aggregate data from Google Maps, environmental databases, public school APIs, and local points of interest. All data is real-time and location-specific.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">Is this safe and private?</h3>
              <p className="text-gray-600">
                Yes. NestRecon only accesses Zillow listing data you&apos;re already viewing. We don&apos;t track your browsing history or sell your data. Your preferences are stored securely and never shared.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Absolutely. Cancel your Pro subscription anytime from your account dashboard. No contracts, no penalties.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">Does this work on mobile?</h3>
              <p className="text-gray-600">
                Currently, NestRecon is a Chrome extension for desktop only. Mobile support is on our roadmap for 2025.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">How does the free trial work?</h3>
              <p className="text-gray-600">
                New users get a 7-day free trial of NestRecon Pro. No credit card required. After the trial, you can continue with the free plan or upgrade to Pro for full access.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">What browsers are supported?</h3>
              <p className="text-gray-600">
                NestRecon currently works with Chrome and Chromium-based browsers (Edge, Brave, etc.). Firefox and Safari support are coming soon.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-gray-900 mb-2 text-xl font-semibold">How accurate are the scores?</h3>
              <p className="text-gray-600">
                Our scores are based on real-time data from trusted sources. The Basic Recon Score uses on-page data from Zillow/Redfin, while Pro scores incorporate live API data for maximum accuracy. All scores are estimates and should be used as one factor in your home-buying decision.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link
              to="/signup"
              className="inline-block bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

