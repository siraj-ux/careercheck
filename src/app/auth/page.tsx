'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AuthReassurancePanel } from '@/components/auth/AuthReassurancePanel';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/onboarding/profile';

  // Step state: 'phone' or 'otp'
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Phone state
  const countryCode = '+91';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false);

  // OTP state: 6 boxes
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer & UI state
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockNotice, setMockNotice] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (!data.user.dob) {
            router.replace(`/auth/consent?redirect=${encodeURIComponent(redirectParam)}`);
          } else {
            router.replace(redirectParam);
          }
        }
      })
      .catch(() => {});
  }, [redirectParam, router]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first OTP input when switching to OTP screen
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Clean and format phone number
  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setMockNotice(null);

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: fullPhone,
          channel: sendViaWhatsapp ? 'whatsapp' : 'sms',
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setLoading(false);
        return;
      }

      if (data.mockCode) {
        setMockNotice(`Development mode: your verification code is ${data.mockCode}`);
      }

      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch {
      setError('A network error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: fullPhone,
          channel: sendViaWhatsapp ? 'whatsapp' : 'sms',
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Too many attempts. Please wait a while before requesting again.');
        setLoading(false);
        return;
      }

      if (data.mockCode) {
        setMockNotice(`Development mode: new verification code is ${data.mockCode}`);
      }

      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend verification code. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit entry
  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, '');

    // Handling pasted multi-digit string
    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);

      const nextFocus = Math.min(pastedDigits.length, 5);
      otpRefs.current[nextFocus]?.focus();

      // If full 6 digits pasted, trigger verify automatically
      if (pastedDigits.length === 6) {
        triggerVerify(pastedDigits.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto advance to next box
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // If 6th box filled, auto verify
    const currentCode = newOtp.join('');
    if (currentCode.length === 6) {
      triggerVerify(currentCode);
    }
  };

  // Handle backspace and arrow navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Trigger verify action
  const triggerVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6 || verifying) return;

    setError(null);
    setVerifying(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: fullPhone,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Incorrect code. Please try again.');
        setVerifying(false);
        return;
      }

      // Check if user requires DOB / Minor consent
      if (data.requiresConsent) {
        router.push(`/auth/consent?redirect=${encodeURIComponent(redirectParam)}`);
      } else {
        router.push(redirectParam);
      }
    } catch {
      setError('A connection issue prevented verification. Please try again.');
      setVerifying(false);
    }
  };

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
                Student Guidance
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Split Section (Desktop 3c Layout) */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Reassurance Panel */}
          <AuthReassurancePanel />

          {/* Right: Form Card (Variant 1d separate screens) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-10 shadow-xl shadow-zinc-200/40 flex flex-col justify-between">
            {step === 'phone' ? (
              /* SCREEN 1: Phone Entry */
              <div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Phone Verification</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                    Sign in or Create Account
                  </h1>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Enter your mobile number to get a 6-digit SMS verification code. No passwords required.
                  </p>
                </div>

                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-800 text-xs sm:text-sm">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                {mockNotice && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-indigo-50 p-3.5 border border-indigo-200 text-indigo-900 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>{mockNotice}</div>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="mt-8 space-y-6">
                  <div>
                    <label htmlFor="phone-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="flex rounded-2xl border border-zinc-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 overflow-hidden shadow-2xs transition-all">
                      <div className="flex items-center gap-1 bg-zinc-50 px-3.5 border-r border-zinc-200 text-sm font-semibold text-zinc-700 select-none">
                        <span>🇮🇳</span>
                        <span>{countryCode}</span>
                      </div>
                      <input
                        id="phone-input"
                        type="tel"
                        inputMode="numeric"
                        autoFocus
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="98765 43210"
                        maxLength={14}
                        className="w-full px-4 py-3.5 text-base sm:text-lg font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Standard Indian 10-digit mobile number.
                    </p>
                  </div>

                  {/* WhatsApp Option (Section Module 2) */}
                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 hover:bg-zinc-50 transition-colors">
                    <input
                      id="whatsapp-toggle"
                      type="checkbox"
                      checked={sendViaWhatsapp}
                      onChange={(e) => setSendViaWhatsapp(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="whatsapp-toggle" className="text-xs text-zinc-700 cursor-pointer select-none">
                      <span className="font-semibold text-zinc-900">Send code via WhatsApp</span> (if SMS has delivery delay)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Code</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-100 space-y-3 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-500">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Your phone number is strictly private and never sold to coaching institutes.</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            ) : (
              /* SCREEN 2: 6-Box OTP Entry */
              <div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Wrong number? Edit
                  </button>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                    Enter Verification Code
                  </h1>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-zinc-900 font-mono">{fullPhone}</span>.
                  </p>
                </div>

                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-800 text-xs sm:text-sm">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                {mockNotice && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-indigo-50 p-3.5 border border-indigo-200 text-indigo-900 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>{mockNotice}</div>
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  {/* 6 OTP Boxes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3 text-center sm:text-left">
                      6-Digit Security Code
                    </label>
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border-2 border-zinc-200 bg-white text-zinc-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend Timer Strip */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2">
                    <span className="text-zinc-500">Didn&apos;t get the code?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <span className="font-medium text-zinc-500 font-mono">
                        Resend in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerVerify()}
                    disabled={verifying || otp.join('').length !== 6}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Auto-saves your test progress</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                    }}
                    className="text-zinc-600 hover:text-zinc-900 underline"
                  >
                    Change phone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-zinc-200/80 py-4 text-center text-xs text-zinc-400">
        © 2026 CareerChecks. Calm, independent student guidance.
      </footer>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-sm font-medium text-zinc-600">Loading secure sign in...</span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthContent />
    </Suspense>
  );
}
