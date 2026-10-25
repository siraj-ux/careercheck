import Link from 'next/link';
import { Compass, ShieldCheck, Clock, Lock, CheckCircle2 } from 'lucide-react';

export function AuthReassurancePanel() {
  return (
    <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 p-12 text-white rounded-3xl shadow-xl min-h-[640px]">
      <div>
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">CareerChecks</span>
            <span className="block text-[11px] text-indigo-200 font-medium">India&apos;s Student Guidance</span>
          </div>
        </Link>

        <div className="mt-14 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-200 border border-white/15">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Calm · Private · Yours</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Autosave, pause anytime, never sold.
          </h2>
          <p className="text-sm text-indigo-200 leading-relaxed max-w-sm">
            Sign in with your phone number to access your psychometric test, college cutoff matches, and consultant roadmap.
          </p>
        </div>

        <div className="mt-10 space-y-4 border-t border-white/15 pt-8">
          <div className="flex items-start gap-3 text-xs text-indigo-100">
            <Clock className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Pause and resume mid-test:</span> Your progress is saved automatically after every question.
            </div>
          </div>
          <div className="flex items-start gap-3 text-xs text-indigo-100">
            <Lock className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Strict data privacy:</span> We never sell student phone numbers or marks to coaching institutes.
            </div>
          </div>
          <div className="flex items-start gap-3 text-xs text-indigo-100">
            <CheckCircle2 className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">No passwords to remember:</span> Instant secure access with a 6-digit SMS OTP.
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/10 text-xs text-indigo-300 flex items-center justify-between">
        <span>100% Independent Guidance</span>
        <span>Trusted by 5,000+ Families</span>
      </div>
    </div>
  );
}
