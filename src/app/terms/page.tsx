import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export const metadata = {
  title: 'Terms of Service | CareerChecks',
  description: 'Terms of Service, Session Policies, and Refund Guidelines for CareerChecks.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 h-16">
          <BrandLogo href="/" size="sm" />
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-950">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <FileText className="h-3.5 w-3.5" />
            <span>Transparent Service Agreements</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-950">Terms of Service</h1>
          <p className="text-xs text-zinc-500 font-mono">Effective Date: October 2026 · Version 1.0</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 space-y-6 text-xs text-zinc-700 leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">1. Nature of the Service: Guidance, Not a Verdict</h2>
            <p>
              CareerChecks provides psychometric assessment, aptitude profiling, and consultative guidance to assist students in exploring courses and institutions. All recommendations, college admission chances (Safe, Target, Reach), and career fits are provided as <strong>educational guidance, not a guarantee or admission verdict</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">2. Career Plan & Consultant Sessions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>The <strong>Career Plan (₹1,499)</strong> includes unlocking the complete report, 1 dedicated 45-minute consultation with an assigned counselor, a personalized published roadmap, and 30-day post-session chat access.</li>
              <li>Consultations are conducted online via video links (Google Meet / Zoom). The join link activates 10 minutes prior to the scheduled slot in IST.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">3. Rescheduling & Cancellation Rules</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Self-serve Rescheduling:</strong> Students may reschedule their consultation once at least 24 hours in advance.</li>
              <li><strong>Within 24 Hours:</strong> Self-serve changes are locked within 24 hours of session start and require administrative review.</li>
              <li><strong>No-Show Policy:</strong> Failure by the student to attend a confirmed session without notice forfeits the session. In the event of a consultant delay or absence, the student receives a complimentary priority rebooking.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">4. Transparent Refund Policy</h2>
            <p>
              Students are entitled to a full (100%) refund if no consultation is scheduled or held within <strong>14 days of payment</strong> due to an internal platform or consultant availability delay. Refund requests are processed promptly back to the original payment method.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">5. Acceptable Conduct & Messaging</h2>
            <p>
              The direct chat channel is provided strictly for academic and career mentorship. Inappropriate language, harassment, or misuse will result in immediate termination of account privileges without refund.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-100">
            <p className="text-zinc-500">
              Questions regarding these Terms should be directed to <span className="font-mono text-zinc-800">support@careerchecks.in</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
