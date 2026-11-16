'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  UserCheck,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ConsultantCollegeNoticeProps {
  isSharedView?: boolean;
}

export function ConsultantCollegeNotice({ isSharedView = false }: ConsultantCollegeNoticeProps) {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 via-white to-white p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/90 px-3 py-1 text-[11px] font-bold text-indigo-900">
            <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Consultant Curated Selection</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
            Institutional & College Recommendations
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
            Your tailored Safe, Target, and Reach colleges will be shared directly by your assigned career consultant. During your 1-on-1 session, your consultant will review your verified marks, fee budget, and location preferences to handpick the best institutions for your profile.
          </p>
        </div>

        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
          <GraduationCap className="h-6 w-6" />
        </div>
      </div>

      {/* 3 Reassurance Value Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Personalized Cutoff Review</span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-normal">
            Evaluates official past cutoffs, reservation categories, and admission matrices tailored to you.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
            <MapPin className="h-4 w-4 text-indigo-600" />
            <span>Verified Campuses</span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-normal">
            Shortlisted based on your preferred cities, campus infrastructure, and relocation comfort.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Unbiased Guidance</span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-normal">
            Zero commercial college tie-ups or sponsored ads. Purely focused on the right student fit.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100">
        <div className="text-xs text-zinc-500 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>Your consultant will share and discuss your full college list during your scheduled session.</span>
        </div>

        {!isSharedView ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Meet Your Consultant</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded-full px-3 py-1">
            Available in Student Session
          </div>
        )}
      </div>
    </div>
  );
}
