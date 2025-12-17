import { Link } from 'react-router-dom';
import { SharedNav } from './shared-nav';

interface FAQPageProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function FAQPage({ isLoggedIn = false, onLogout }: FAQPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <SharedNav isLoggedIn={isLoggedIn} onLogout={onLogout} />

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

