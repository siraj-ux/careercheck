'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Calendar,
  UserCheck,
  AlertCircle,
  RefreshCw,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { AuthReassurancePanel } from '@/components/auth/AuthReassurancePanel';

function ConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/onboarding/profile';

  // Form state
  const [dob, setDob] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const parentCountryCode = '+91';
  const [consentGiven, setConsentGiven] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify auth on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.replace(`/auth?redirect=${encodeURIComponent(redirectParam)}`);
        } else if (data.user.dob) {
          // User already completed DOB/Consent
          router.replace(redirectParam);
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [redirectParam, router]);

  // Calculate age live from DOB
  const age = useMemo(() => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [dob]);

  const isMinor = age !== null && age < 18 && age >= 5;

  // Maximum date allowed: today
  const maxDate = new Date().toISOString().split('T')[0];
  // Minimum date: 60 years ago
  const minDate = '1960-01-01';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dob) {
      setError('Please select your date of birth.');
      return;
    }

    if (age === null || age < 10) {
      setError('Please enter a valid date of birth.');
      return;
    }

    if (isMinor) {
      const cleanParentPhone = parentPhone.replace(/\D/g, '');
      if (cleanParentPhone.length < 10) {
        setError('Please enter a valid 10-digit mobile number for your parent or guardian.');
        return;
      }
      if (!consentGiven) {
        setError('Parent or legal guardian consent confirmation is required for students under 18.');
        return;
      }
    }

    setLoading(true);

    try {
      const fullParentPhone = isMinor
        ? `${parentCountryCode}${parentPhone.replace(/\D/g, '')}`
        : undefined;

      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dob,
          parentPhone: fullParentPhone,
          consentGiven: isMinor ? consentGiven : true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save date of birth. Please try again.');
        setLoading(false);
        return;
      }

      // Success: continue to onboarding/level selection
      router.push(redirectParam);
    } catch {
      setError('A network error occurred. Please check your internet connection.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50/70 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-sm font-medium text-zinc-600">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col justify-between">
      {/* Header Bar */}
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition-transform group-hover:scale-105">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 group-hover:text-indigo-600 transition-colors">
                CareerChecks
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                Student Safety & Privacy
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Reassurance Panel */}
          <AuthReassurancePanel />

          {/* Right: Date of Birth & Consent Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-10 shadow-xl shadow-zinc-200/40 flex flex-col justify-between">
            <div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Profile Setup</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                  Date of Birth & Consent
                </h1>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  We use your date of birth to calibrate test questions for your age group and ensure privacy compliance.
                </p>
              </div>

              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-800 text-xs sm:text-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Date of Birth Picker */}
                <div>
                  <label htmlFor="dob-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      id="dob-input"
                      type="date"
                      required
                      min={minDate}
                      max={maxDate}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-3.5 text-base font-medium rounded-2xl border border-zinc-300 text-zinc-900 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-2xs"
                    />
                    <Calendar className="absolute right-4 top-4 h-5 w-5 text-zinc-400 pointer-events-none" />
                  </div>
                  {age !== null && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                      <span className="text-zinc-600">Calculated age:</span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-zinc-800 font-mono">
                        {age} years old
                      </span>
                    </div>
                  )}
                </div>

                {/* Conditional Minor Consent Block (Section 9.7) */}
                {isMinor && (
                  <div className="space-y-4 rounded-2xl bg-indigo-50/70 p-5 border border-indigo-100 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <HeartHandshake className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h2 className="text-sm font-bold text-indigo-950">Parent or Guardian Consent Required</h2>
                        <p className="text-xs text-indigo-800/90 mt-1 leading-relaxed">
                          Because you are under 18, our student protection policy and Section 9.7 require verified parent or guardian consent before you can take the assessment.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label htmlFor="parent-phone-input" className="block text-xs font-bold uppercase tracking-wider text-indigo-950 mb-1.5">
                        Parent / Guardian Mobile Number
                      </label>
                      <div className="flex rounded-xl border border-indigo-200 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 overflow-hidden shadow-2xs">
                        <div className="flex items-center gap-1 bg-indigo-50/50 px-3 border-r border-indigo-100 text-xs font-semibold text-zinc-700 select-none">
                          <span>🇮🇳</span>
                          <span>{parentCountryCode}</span>
                        </div>
                        <input
                          id="parent-phone-input"
                          type="tel"
                          inputMode="numeric"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="Parent's 10-digit number"
                          maxLength={14}
                          className="w-full px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-indigo-700">
                        Your parent will receive a link to your test results and roadmap.
                      </p>
                    </div>

                    <div className="pt-2 flex items-start gap-3">
                      <input
                        id="minor-consent-checkbox"
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <label
                        htmlFor="minor-consent-checkbox"
                        className="text-xs text-indigo-950 leading-snug cursor-pointer select-none font-medium"
                      >
                        I confirm that my parent or legal guardian has reviewed and consented to my participation in the CareerChecks assessment (Policy v1.0).
                      </label>
                    </div>
                  </div>
                )}

                {age !== null && !isMinor && age >= 18 && (
                  <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-900 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Age 18+ verified. You can take the assessment independently. You can still invite your parents to view your roadmap anytime.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !dob ||
                    (isMinor && (!consentGiven || parentPhone.replace(/\D/g, '').length < 10))
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Level Selection</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Consent records are securely encrypted and retained in accordance with Indian minor data protection standards.
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200/80 py-4 text-center text-xs text-zinc-400">
        © 2026 CareerChecks. Calm, independent student guidance.
      </footer>
    </div>
  );
}

function ConsentSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-sm font-medium text-zinc-600">Loading student consent...</span>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<ConsentSkeleton />}>
      <ConsentContent />
    </Suspense>
  );
}
