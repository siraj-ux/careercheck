'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';

interface UnlockCardProps {
  onUnlockClick?: () => void;
}

export function UnlockCard({ onUnlockClick }: UnlockCardProps) {
  const plan = PRICING_PLANS.career_plan;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/70 via-white to-white p-6 sm:p-8 shadow-sm space-y-6 text-center sm:text-left">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>Unlock Careers, Colleges & Mentorship</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950 mt-1">
              Ready for the complete picture?
            </h3>
          </div>
        </div>

        {/* Pricing badge */}
        <div className="text-center sm:text-right shrink-0">
          <div className="text-2xl sm:text-3xl font-black text-zinc-950 font-mono">
            {plan.priceFormatted}
          </div>
          <div className="text-[11px] font-semibold text-zinc-600">one-time · inclusive of GST</div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
        Your interest and aptitude scores are ready. Unlock your personalized career recommendations, Safe/Target/Reach college shortlists, plus a dedicated 45-minute 1-on-1 strategy call with an expert mentor.
      </p>

      {/* Feature list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-zinc-700">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Top 6 Ranked Career Pathways with fit %</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Safe / Target / Reach Colleges with cutoffs</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>1-on-1 Video Consultation (45 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Custom Published Roadmap (Primary & Backup)</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>5 Neutral Personality Temperament Spectrums</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>30 Days Direct Chat Support with your mentor</span>
        </div>
      </div>

      {/* CTA actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-100">
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>14-day full refund guarantee if no session is held</span>
        </div>

        {onUnlockClick ? (
          <button
            type="button"
            onClick={onUnlockClick}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3 text-sm font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <span>Unlock Career Plan · {plan.priceFormatted}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3 text-sm font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <span>Unlock Career Plan · {plan.priceFormatted}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
