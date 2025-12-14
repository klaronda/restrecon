import { Link } from 'react-router-dom';
import { SharedNav } from './shared-nav';

interface PrivacyPolicyPageProps {
  isLoggedIn?: boolean;
}

export function PrivacyPolicyPage({ isLoggedIn = false }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
      {/* Navigation */}
      <SharedNav isLoggedIn={isLoggedIn} />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-white/90">Last updated: December 13, 2025</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 md:p-12">
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
              <li>Property listing data that you view on Zillow or Redfin only when you actively use the extension</li>
              <li>Your home search preferences, targets, and criteria (such as place types you care about and mobility signals you select)</li>
              <li>Extension usage data to improve functionality and reliability</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not collect data from pages unless the NestRecon extension is actively enabled and used by you.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Email address</li>
              <li>Name (first and last)</li>
              <li>Password (encrypted and stored securely)</li>
              <li>Subscription and payment status (processed through Stripe)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not store full payment card details on our servers.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Usage Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect limited information about how you use our Service, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Pages visited and features used within NestRecon</li>
              <li>Time spent using the Service</li>
              <li>Device and browser type</li>
              <li>IP address and coarse location information (such as city or region inferred from IP)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Process subscriptions and payments</li>
              <li>Personalize scoring and insights based on your preferences</li>
              <li>Send service-related communications</li>
              <li>Improve and optimize product performance</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not sell your personal information or use it for advertising profiling.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NestRecon uses trusted third-party services to operate and enhance the Service. These providers may process limited data as necessary to perform their functions.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Supabase</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use Supabase for user authentication, database storage, and backend services. Account data and user preferences are stored securely on Supabase infrastructure.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Stripe</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payment processing is handled by Stripe. Stripe collects and processes payment information according to its own privacy policy. NestRecon does not store your full payment card details.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Mapbox</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use Mapbox APIs for location-based services such as geocoding, proximity analysis, and place lookup. To provide these features, limited location-related data (such as coordinates derived from a property listing) may be sent to Mapbox.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mapbox processes this data according to its own privacy policy and does not sell personal data collected through our use of its services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mapbox Privacy Policy: <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[#556B2F] hover:underline">https://www.mapbox.com/legal/privacy</a>
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Environmental Data Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We integrate with third-party services such as Howloud, OpenWeather, and LightPollutionMap to provide environmental indicators including sound levels, air quality, and night-sky conditions.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These services may receive approximate location data related to a property to return relevant information. We do not send personal identifying information to these providers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational safeguards to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Encryption in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments</li>
              <li>Restricted access to personal data on a need-to-know basis</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chrome Extension Permissions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The NestRecon Chrome extension requires the following permissions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Active Tab Access</strong> – to read property listing data from Zillow or Redfin pages you actively visit</li>
              <li><strong>Storage</strong> – to save preferences and session data locally</li>
              <li><strong>Host Permissions</strong> – to communicate with our servers and approved third-party APIs</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not track your browsing history or access data from other websites.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access</strong> – request a copy of your personal data</li>
              <li><strong>Correction</strong> – update or correct inaccurate information</li>
              <li><strong>Deletion</strong> – request deletion of your account and associated data</li>
              <li><strong>Opt-out</strong> – unsubscribe from non-essential communications</li>
              <li><strong>Data Portability</strong> – request your data in a portable format</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, contact us using the information below.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Maintain authentication and session state</li>
              <li>Remember user preferences</li>
              <li>Analyze Service usage and performance</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings. Disabling cookies may limit certain features.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              NestRecon is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or your data, please contact us:
            </p>
            <p className="text-gray-700 leading-relaxed">
              Email: privacy@nestrecon.com<br />
              Website: <Link to="/" className="text-[#556B2F] hover:underline">https://www.nestrecon.com</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


