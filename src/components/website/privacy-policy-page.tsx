import { Link } from 'react-router-dom';
import { RoverIcon } from '../rover-icon';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface PrivacyPolicyPageProps {
  isLoggedIn?: boolean;
}

export function PrivacyPolicyPage({ isLoggedIn = false }: PrivacyPolicyPageProps) {
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
                        to="/pricing" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Pricing
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 15, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NestRecon ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Chrome extension and website (collectively, the "Service").
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using NestRecon, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Chrome Extension Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you use our Chrome extension, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Property listing data that you view on Zillow or Redfin (only when you actively use the extension)</li>
              <li>Your home search preferences and criteria</li>
              <li>Extension usage data to improve functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Email address</li>
              <li>Name (first and last)</li>
              <li>Password (encrypted and stored securely)</li>
              <li>Subscription and payment information (processed through Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Usage Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect information about how you use our Service, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Pages visited and features used</li>
              <li>Time spent on the Service</li>
              <li>Device and browser information</li>
              <li>IP address and general location data</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Providing and maintaining our Service</li>
              <li>Processing your subscription and payments</li>
              <li>Personalizing your home search experience</li>
              <li>Sending you service-related communications</li>
              <li>Improving and optimizing our Service</li>
              <li>Detecting and preventing fraud or abuse</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party services that may collect or process your data:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Supabase</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use Supabase for user authentication, database storage, and hosting. Your account data and preferences are stored securely on Supabase's infrastructure.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Stripe</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payment processing is handled by Stripe. We do not store your full payment card details. Stripe processes and stores payment information according to their privacy policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Google Maps API</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use Google Maps API for location services, geocoding, and distance calculations. Google may collect usage data according to their privacy policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Howloud, OpenWeather, LightPollutionMap</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We integrate with these services to provide environmental data (sound scores, air quality, light pollution). These services may receive location data to provide relevant information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Data encryption in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments</li>
              <li>Limited access to personal data on a need-to-know basis</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chrome Extension Permissions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Chrome extension requires the following permissions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Active Tab Access:</strong> To read property listing data from Zillow and Redfin pages you visit</li>
              <li><strong>Storage:</strong> To save your preferences and session data locally</li>
              <li><strong>Host Permissions:</strong> To communicate with our servers and third-party APIs</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We only access data from pages you actively visit while using the extension. We do not track your browsing history or access other websites.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, contact us at the email address provided below.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences</li>
              <li>Analyze Service usage and performance</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p className="text-gray-700 leading-relaxed">
              Email: privacy@nestrecon.com<br />
              Website: <Link to="/" className="text-[#556B2F] hover:underline">nestrecon.com</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


