'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Compass,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { RiasecRadarChart } from '@/components/report/RiasecRadarChart';
import { AptitudeBars } from '@/components/report/AptitudeBars';
import { PersonalitySpectrums } from '@/components/report/PersonalitySpectrums';
import { CareerCards } from '@/components/report/CareerCards';
import { CollegeCards } from '@/components/report/CollegeCards';
import { ReportPayload } from '@/server/scoring/service';
import { RiasecLetter } from '@/config/scoring';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function SharedReportPage({ params }: SharePageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [studentName, setStudentName] = useState<string>('Student');
  const [report, setReport] = useState<ReportPayload | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!token) return;

    fetch(`/api/results/share?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (!data.success) {
            if (data.isExpired) setIsExpired(true);
            setError(data.error || 'Unable to open shared report');
          } else {
            setReport(data.report);
            setStudentName(data.studentName || 'Student');
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Something went wrong';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-zinc-600">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            {isExpired ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <h2 className="text-lg font-bold text-zinc-950">
            {isExpired ? 'Link Expired' : 'Report Unavailable'}
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {error || 'This report link is no longer accessible.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>Go to CareerChecks Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const topLetters = report.riasecCode.split('') as RiasecLetter[];
  const isPaid = report.plan === 'paid';

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-20">
      {/* Top Read-Only Notice Banner */}
      <div className="bg-indigo-900 text-white px-4 py-2 text-center text-xs font-medium">
        <span>Viewing {studentName}&apos;s CareerChecks Report · Read-Only Access (Parent / Guardian)</span>
      </div>

      {/* Header */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span className="font-bold text-zinc-950 text-sm">CareerChecks</span>
            <span className="text-xs text-zinc-600 font-medium">· Student Results</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Verified student link</span>
          </div>
        </div>
      </header>

      {/* Main Report View */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Profile Headline */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <span>Interest Holland Code: {report.riasecCode}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
            {studentName}&apos;s Career Discovery Report
          </h1>

          <p className="text-sm text-zinc-700 leading-relaxed max-w-3xl">
            {report.headlineInsight}
          </p>
        </div>

        {/* Section 1: Interests */}
        <RiasecRadarChart
          scores={report.radarScores}
          topLetters={topLetters}
        />

        {/* Section 2: Aptitude */}
        <AptitudeBars scores={report.aptitudeScores} />

        {/* Section 3: Personality */}
        {isPaid && report.personalitySpectrums && (
          <PersonalitySpectrums spectrums={report.personalitySpectrums} />
        )}

        {/* Section 4: Careers */}
        {isPaid && report.careers && (
          <CareerCards careers={report.careers} />
        )}

        {/* Section 5: Colleges */}
        {isPaid && report.colleges && (
          <CollegeCards colleges={report.colleges} />
        )}
      </main>
    </div>
  );
}
