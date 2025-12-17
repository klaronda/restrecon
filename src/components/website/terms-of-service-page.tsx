import { Link } from 'react-router-dom';
import { SharedNav } from './shared-nav';

interface TermsOfServicePageProps {
  isLoggedIn?: boolean;
}

export function TermsOfServicePage({ isLoggedIn = false }: TermsOfServicePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
      {/* Navigation */}
      <SharedNav isLoggedIn={isLoggedIn} />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#4a5e28] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-white/90">Last updated: December 13, 2025</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 md:p-12">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using NestRecon ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NestRecon is a Chrome extension and web service that provides home and neighborhood analysis tools for property listings on third-party websites such as Zillow and Redfin. The Service may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Property scoring and analysis features</li>
              <li>Neighborhood, location, and environmental indicators</li>
              <li>Personalized insights based on user-selected preferences and targets</li>
              <li>Free and Pro subscription tiers</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              NestRecon provides informational tools only and does not offer real estate, financial, legal, or professional advice.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts and Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain and update your information as needed</li>
              <li>Keep your account credentials secure</li>
              <li>Accept responsibility for all activity under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free and Pro Tiers</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Free Tier</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Free tier provides limited functionality and features. We reserve the right to modify, restrict, or discontinue Free tier features at any time without notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Pro Tier</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Pro tier requires a paid subscription and may include additional features such as:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Enhanced or personalized scoring</li>
              <li>Expanded neighborhood or environmental indicators</li>
              <li>Preference-based analysis and insights</li>
              <li>Priority support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Trial Period</h3>
            <p className="text-gray-700 leading-relaxed">
              We may offer a free trial of Pro features to new users. Trial availability, duration, and eligibility are determined at our discretion and may change or be discontinued at any time.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              At the end of a trial period, access to Pro features will end unless you upgrade to a paid subscription.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Subscription Fees</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pro subscriptions are billed monthly or annually, as selected at the time of purchase. All fees are charged in U.S. dollars and are non-refundable except as required by law or as explicitly stated by us.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payments are processed by Stripe. By providing payment information, you authorize us to charge your selected payment method for applicable fees.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Automatic Renewal</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Subscriptions automatically renew unless canceled before the renewal date. You may cancel your subscription at any time through your account settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Cancellation and Refunds</h3>
            <p className="text-gray-700 leading-relaxed">
              Cancellations take effect at the end of the current billing period. Refunds for unused portions of subscriptions are provided at our discretion, except where required by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chrome Extension License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We grant you a limited, non-exclusive, non-transferable, revocable license to use the NestRecon Chrome extension for personal, non-commercial use, subject to these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Reverse engineer, decompile, or disassemble the extension</li>
              <li>Modify or create derivative works</li>
              <li>Distribute, sublicense, sell, or resell the Service</li>
              <li>Use the Service for any unlawful or unauthorized purpose</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Conduct and Restrictions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the Service for unlawful purposes</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems without permission</li>
              <li>Share account credentials</li>
              <li>Violate third-party rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content, features, and functionality of the Service are owned by NestRecon and protected by intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Data Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service relies on data provided by third-party sources. We do not guarantee the accuracy, completeness, timeliness, or reliability of such data. Scores, indicators, and insights are estimates and may not reflect real-world conditions at all times.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p className="text-gray-700 leading-relaxed">
              NestRecon does not warrant that the Service will be uninterrupted, error-free, or accurate. Information provided should not be relied upon as the sole basis for purchasing or investment decisions. You are solely responsible for verifying information through independent sources and professional advisors.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NESTRECON SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Loss of profits or data</li>
              <li>Property purchase or investment decisions</li>
              <li>Business interruption</li>
              <li>Personal injury or property damage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Our total liability shall not exceed the amount paid by you to NestRecon in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless NestRecon and its affiliates from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your access to the Service at any time for violations of these Terms, non-payment, misuse, or unlawful activity. You may terminate your account at any time through your account settings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms periodically. Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about these Terms:
            </p>
            <p className="text-gray-700 leading-relaxed">
              Email: legal@nestrecon.com<br />
              Website: <Link to="/" className="text-[#556B2F] hover:underline">https://www.nestrecon.com</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


