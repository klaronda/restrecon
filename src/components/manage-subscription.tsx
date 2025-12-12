import { ArrowLeft, ExternalLink, CreditCard, Calendar, FileText } from 'lucide-react';
import { RoverIcon } from './rover-icon';

interface ManageSubscriptionProps {
  onBack: () => void;
  onManageStripe: () => void;
}

export function ManageSubscription({ onBack, onManageStripe }: ManageSubscriptionProps) {
  // Mock data - in real app this would come from your backend/Stripe
  const subscription = {
    plan: 'NestRecon Pro',
    status: 'Active',
    billingPeriod: 'Yearly',
    amount: '$79/year',
    nextBillingDate: 'December 9, 2026',
    paymentMethod: 'Visa •••• 4242',
  };

  const billingHistory = [
    { date: 'Dec 9, 2025', amount: '$79.00', status: 'Paid', invoice: '#INV-001' },
    { date: 'Dec 9, 2024', amount: '$79.00', status: 'Paid', invoice: '#INV-002' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          <div className="flex items-center gap-3">
            <RoverIcon size={40} />
            <div>
              <h1 className="text-gray-900 text-3xl">Manage Subscription</h1>
              <p className="text-gray-600">View and update your billing details</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Current Plan */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-gray-900 text-xl mb-1">Current Plan</h2>
                <p className="text-gray-600 text-sm">Your active subscription</p>
              </div>
              <div className="inline-block bg-[#556B2F]/10 text-[#556B2F] px-3 py-1 rounded-full text-sm border border-[#556B2F]/20">
                {subscription.status}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#556B2F]/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#556B2F]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Plan</p>
                    <p className="text-gray-900">{subscription.plan}</p>
                    <p className="text-sm text-gray-600">{subscription.billingPeriod} • {subscription.amount}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#556B2F]/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#556B2F]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                    <p className="text-gray-900">{subscription.nextBillingDate}</p>
                    <p className="text-sm text-gray-600">Auto-renews</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-3">Payment Method</p>
              <p className="text-gray-900 mb-4">{subscription.paymentMethod}</p>
              
              <button
                onClick={onManageStripe}
                className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-5 py-2.5 rounded-lg hover:bg-[#4a5e28] transition-colors"
              >
                Manage Subscription
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Opens Stripe Customer Portal to update payment, change plan, or cancel
              </p>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-[#556B2F]" />
              <h2 className="text-gray-900 text-xl">Billing History</h2>
            </div>

            <div className="space-y-3">
              {billingHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-gray-900">{item.date}</p>
                      <p className="text-sm text-gray-600">{item.invoice}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gray-900">{item.amount}</p>
                      <p className="text-xs text-[#556B2F]">{item.status}</p>
                    </div>
                    <button className="text-[#556B2F] hover:underline text-sm">
                      Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-sm">
            <h2 className="text-gray-900 text-xl mb-3">Danger Zone</h2>
            <p className="text-gray-600 text-sm mb-4">
              Need to cancel? You can downgrade or cancel your subscription at any time through the Stripe Customer Portal.
            </p>
            <button
              onClick={onManageStripe}
              className="inline-flex items-center gap-2 bg-white text-red-600 px-5 py-2.5 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors"
            >
              Cancel or Downgrade
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
