import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export const metadata = {
  title: 'Privacy Policy | CareerChecks',
  description: 'CareerChecks Privacy Policy and Data Protection Commitments under DPDP Act.',
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Trust Pillar: We Never Sell Your Data</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-950">Privacy Policy</h1>
          <p className="text-xs text-zinc-500 font-mono">Effective Date: October 2026 · Version 1.0 (DPDP Compliant)</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 space-y-6 text-xs text-zinc-700 leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">1. Our Core Commitment</h2>
            <p>
              CareerChecks is committed to protecting the privacy, confidentiality, and autonomy of students and parents using our career-guidance platform. We operate under a strict principle of <strong>data minimization</strong>: we only collect information essential to providing psychometric assessments and 1-on-1 career counselling.
            </p>
            <p className="font-bold text-indigo-900 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
              We never sell, rent, monetize, or trade your personal data, assessment responses, or contact details to third-party colleges, advertisers, or lead brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">2. Minor Users (Under 18) & Parental Consent</h2>
            <p>
              Many of our students are between 14 and 18 years of age (Class 10–12). In accordance with the Digital Personal Data Protection (DPDP) Act:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Users under the age of 18 require affirmative parental or guardian consent before commencing the test.</li>
              <li>A verifiable parent/guardian phone number is stored in our encrypted consent records.</li>
              <li>Parents may view their child&apos;s report via the expiring, read-only parent share link generated from the student dashboard.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">3. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact Information:</strong> Phone number verified via one-time password (OTP).</li>
              <li><strong>Academic Profile:</strong> Education level (UG/PG), board, stream, percentage, budget band, and preferred study locations.</li>
              <li><strong>Assessment Responses:</strong> Likert ratings (1–5) and aptitude MCQ answers submitted during the test.</li>
              <li><strong>Audit Records:</strong> Immutable audit logs tracking consultant and administrator accesses to student diagnostic profiles.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">4. Your Data Rights: Export & Deletion</h2>
            <p>
              You maintain complete ownership of your career data. At any time from your student dashboard, you may:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Export Your Data:</strong> Download a complete JSON package of your profile, test results, career matches, and consultation records.</li>
              <li><strong>Right to be Forgotten:</strong> Irreversibly delete your account, which purges all personal identifiers and auth credentials immediately.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-950">5. Data Security & Storage Location</h2>
            <p>
              All application data is hosted on secured persistent volumes located within the Mumbai region (India). We enforce strict server-side role gating, end-to-end HTTPS encryption, and security response headers.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-100">
            <p className="text-zinc-500">
              For privacy inquiries or compliance notices, contact our Data Protection Officer at <span className="font-mono text-zinc-800">privacy@careerchecks.in</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
