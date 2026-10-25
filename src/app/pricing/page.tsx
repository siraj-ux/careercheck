'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { PRICING_PLANS, REFUND_POLICY } from '@/config/pricing';

export default function PricingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const freePlan = PRICING_PLANS.free;
  const careerPlan = PRICING_PLANS.career_plan;

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
      });

      if (orderRes.status === 401) {
        router.push(`/auth?redirect=${encodeURIComponent('/pricing')}`);
        return;
      }

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // 2. Razorpay test-mode simulation or script integration
      // In development / test mode with mock key:
      const simulatedPaymentId = `pay_test_${Math.random().toString(36).substring(2, 12)}`;
      const simulatedSignature = 'mock_verified_signature';

      // 3. Verify payment signature
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Payment didn't go through. You haven't been charged.");
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        router.push('/report');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment didn't go through. You haven't been charged.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-20">
      {/* Header */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="font-bold text-zinc-950 text-sm tracking-tight flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span>CareerChecks</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/report" className="font-semibold text-zinc-600 hover:text-zinc-900">
              View My Report
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-zinc-100 px-3.5 py-1.5 font-semibold text-zinc-800 hover:bg-zinc-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Headline */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-12 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 px-3 py-1 text-xs font-bold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Simple, Honest Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
          Invest in lifelong clarity, not guesswork.
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
          Start for free to discover your interests and aptitude. Unlock expert guidance, custom roadmaps, and full career recommendations when you are ready.
        </p>
      </div>

      {/* Failure State Banner */}
      {errorMessage && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 mb-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>
                <strong>Payment issue: </strong> {errorMessage}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700 shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Success State Banner */}
      {paymentSuccess && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 mb-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-800">
            Payment confirmed! Unlocking your full Career Plan report now...
          </div>
        </div>
      )}

      {/* Comparison Cards */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-7 flex flex-col justify-between shadow-xs space-y-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                {freePlan.name}
              </div>
              <div className="text-3xl font-black text-zinc-950 font-mono mt-1">
                {freePlan.priceFormatted}
              </div>
              <p className="text-xs text-zinc-600 mt-1">{freePlan.description}</p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs text-zinc-700">
              {freePlan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  {f.included ? (
                    <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-zinc-300 shrink-0" />
                  )}
                  <span className={f.included ? 'font-medium' : 'text-zinc-600 line-through'}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/report"
            className="rounded-full border border-zinc-200 py-3 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Access Free Report
          </Link>
        </div>

        {/* Paid Plan */}
        <div className="relative rounded-3xl border-2 border-indigo-600 bg-white p-7 flex flex-col justify-between shadow-md space-y-6">
          <div className="absolute -top-3.5 right-6 rounded-full bg-indigo-600 px-3.5 py-1 text-[11px] font-bold text-white shadow-xs">
            Most Popular
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {careerPlan.name}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 font-mono">
                  {careerPlan.priceFormatted}
                </span>
                <span className="text-xs font-semibold text-zinc-600">one-time</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">{careerPlan.description}</p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs text-zinc-800">
              {careerPlan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing secure test payment...</span>
                </>
              ) : (
                <>
                  <span>Unlock Career Plan · {careerPlan.priceFormatted}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-600 text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Razorpay Test Mode · 14-day full refund guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Policy FAQ */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-16 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Transparency First
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-950">Frequently Asked Questions</h2>
        </div>

        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 divide-y divide-zinc-100">
          {REFUND_POLICY.faqs.map((faq, i) => (
            <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-1">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900">{faq.q}</h3>
              </div>
              <p className="text-xs text-zinc-600 pl-6 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
