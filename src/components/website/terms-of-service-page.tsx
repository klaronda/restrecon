import { Link } from 'react-router-dom';
import { RoverIcon } from '../rover-icon';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface TermsOfServicePageProps {
  isLoggedIn?: boolean;
}

export function TermsOfServicePage({ isLoggedIn = false }: TermsOfServicePageProps) {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: January 15, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using NestRecon ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NestRecon is a Chrome extension and web service that provides home and neighborhood analysis tools for property listings on Zillow and Redfin. The Service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Property scoring and analysis features</li>
              <li>Neighborhood data and environmental information</li>
              <li>Personalized recommendations based on user preferences</li>
              <li>Free and Pro subscription tiers</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts and Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information to keep it accurate</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free and Pro Tiers</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Free Tier</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The free tier provides basic functionality with limited features. We reserve the right to modify or discontinue free tier features at any time.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Pro Tier</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Pro tier requires a paid subscription. Pro features include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Advanced scoring and analysis</li>
              <li>Real-time environmental data</li>
              <li>Personalized recommendations</li>
              <li>Priority support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Trial Period</h3>
            <p className="text-gray-700 leading-relaxed">
              New users may receive a free trial period for Pro features. Trial periods are subject to our discretion and may be modified or discontinued at any time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Subscription Fees</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pro subscriptions are billed monthly or annually as selected. All fees are in USD and are non-refundable except as required by law or as stated in our refund policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payments are processed through Stripe. By providing payment information, you authorize us to charge your payment method for all fees due.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Automatic Renewal</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Subscriptions automatically renew unless cancelled before the renewal date. You can cancel your subscription at any time through your account settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Cancellation and Refunds</h3>
            <p className="text-gray-700 leading-relaxed">
              You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. Refunds for unused portions of subscriptions are provided at our discretion, except where required by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chrome Extension License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We grant you a limited, non-exclusive, non-transferable license to use the NestRecon Chrome extension for personal, non-commercial purposes, subject to these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Reverse engineer, decompile, or disassemble the extension</li>
              <li>Modify, adapt, or create derivative works</li>
              <li>Distribute, sublicense, or sell the extension</li>
              <li>Use the extension for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Conduct and Restrictions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service to violate any third-party rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service, including all content, features, and functionality, is owned by NestRecon and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may not copy, modify, distribute, sell, or lease any part of our Service without our prior written consent.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy, reliability, or completeness of data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not guarantee that the Service will be uninterrupted, secure, or error-free. Property scores and data are estimates and should not be the sole basis for purchasing decisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NESTRECON SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Loss of profits, data, or use</li>
              <li>Property purchase decisions based on our data</li>
              <li>Business interruption</li>
              <li>Personal injury or property damage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Our total liability for any claims shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless NestRecon, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>Extended periods of inactivity</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the Service will cease immediately. You may terminate your account at any time through your account settings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the appropriate courts of the United States.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p className="text-gray-700 leading-relaxed">
              Email: legal@nestrecon.com<br />
              Website: <Link to="/" className="text-[#556B2F] hover:underline">nestrecon.com</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


