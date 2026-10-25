'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Share2,
  Lock,
  Sparkles,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { RiasecRadarChart } from '@/components/report/RiasecRadarChart';
import { AptitudeBars } from '@/components/report/AptitudeBars';
import { PersonalitySpectrums } from '@/components/report/PersonalitySpectrums';
import { CareerCards } from '@/components/report/CareerCards';
import { CollegeCards } from '@/components/report/CollegeCards';
import { UnlockCard } from '@/components/report/UnlockCard';
import { ShareParentModal } from '@/components/report/ShareParentModal';
import { ReportPayload } from '@/server/scoring/service';
import { RiasecLetter } from '@/config/scoring';

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportPayload | null>(null);
  const [studentName, setStudentName] = useState<string>('Student');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('interests');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = sessionId ? `/api/results?sessionId=${sessionId}` : '/api/results';
      const res = await fetch(url);

      if (res.status === 401) {
        router.push(`/auth?redirect=${encodeURIComponent(sessionId ? `/report?sessionId=${sessionId}` : '/report')}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReportData(data.report);
      if (data.user?.name) {
        setStudentName(data.user.name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load assessment report.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const url = sessionId ? `/api/results?sessionId=${sessionId}` : '/api/results';

    fetch(url)
      .then((res) => {
        if (res.status === 401) {
          router.push(`/auth?redirect=${encodeURIComponent(sessionId ? `/report?sessionId=${sessionId}` : '/report')}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!ignore && data) {
          if (!data.success) {
            setError(data.error || 'Failed to fetch report');
          } else {
            setReportData(data.report);
            if (data.user?.name) {
              setStudentName(data.user.name);
            }
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Unable to load assessment report.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50/70 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-zinc-600">Generating your assessment report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-950">Report Not Available</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {error || 'No assessment results were found for this account. You may need to complete the test first.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={fetchReport}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = reportData.plan === 'paid';
  const topLetters = reportData.riasecCode.split('') as RiasecLetter[];

  const navAnchors = [
    { id: 'interests', label: 'Interests (RIASEC)', locked: false },
    { id: 'aptitude', label: 'Aptitude Sub-Scores', locked: false },
    { id: 'personality', label: 'Personality Spectrums', locked: !isPaid },
    { id: 'careers', label: 'Matched Careers', locked: !isPaid },
    { id: 'colleges', label: 'Colleges (Safe/Target/Reach)', locked: !isPaid },
  ];

  const scrollToAnchor = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-zinc-950 text-sm tracking-tight flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-600" />
              <span>CareerChecks</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-medium text-zinc-600">Assessment Report</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {isPaid ? 'Career Plan ✓' : 'Free Discovery'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all"
            >
              <Share2 className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Share with parent</span>
              <span className="sm:hidden">Share</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <span>Dashboard</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container: Variant 2d Two-Column Desktop / Variant 2c Mobile */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sticky Summary & Navigation (Desktop 3a/3d) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            {/* Summary Card */}
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Assessment Summary
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 mt-1">
                  {studentName}&apos;s Profile
                </h1>
              </div>

              {/* Interest Code Badge */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-900">Dominant Holland Code</span>
                  <span className="font-mono text-2xl font-black text-indigo-700 tracking-wider">
                    {reportData.riasecCode}
                  </span>
                </div>
                <div className="text-xs text-zinc-700 leading-relaxed font-medium">
                  {reportData.headlineInsight}
                </div>
              </div>

              {/* Action CTAs */}
              <div className="space-y-2.5 pt-1">
                {!isPaid ? (
                  <Link
                    href="/pricing"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Unlock Full Career Plan (₹1,499)</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Meet your consultant</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all"
                >
                  <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Share with parent (7-day link)</span>
                </button>
              </div>

              {/* Section Anchors Navigation (Desktop) */}
              <div className="hidden lg:block pt-3 border-t border-zinc-100 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Jump to Section
                </div>
                {navAnchors.map((anchor) => (
                  <button
                    key={anchor.id}
                    type="button"
                    onClick={() => scrollToAnchor(anchor.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      activeSection === anchor.id
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{anchor.label}</span>
                    {anchor.locked && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/60 rounded-full px-2 py-0.2">
                        <Lock className="h-2.5 w-2.5" />
                        <span>Unlock</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Scrolling Report Sections */}
          <main className="lg:col-span-8 space-y-8">
            {/* Section 1: Interests RIASEC */}
            <section id="interests" className="scroll-mt-24 space-y-4">
              <RiasecRadarChart
                scores={reportData.radarScores}
                topLetters={topLetters}
              />
            </section>

            {/* Section 2: Aptitude Sub-Scores */}
            <section id="aptitude" className="scroll-mt-24 space-y-4">
              <AptitudeBars scores={reportData.aptitudeScores} />
            </section>

            {/* Locked Content Gate for Free Users */}
            {!isPaid ? (
              <section className="space-y-6 pt-2">
                <UnlockCard onUnlockClick={() => router.push('/pricing')} />

                {/* Blurred Preview Teaser */}
                <div className="relative rounded-3xl border border-zinc-200 overflow-hidden select-none pointer-events-none">
                  <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <div className="rounded-full bg-white/90 border border-zinc-200/80 px-4 py-2 shadow-xs text-xs font-bold text-zinc-900 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                      <span>Personality, Careers & Colleges are locked on the Free plan</span>
                    </div>
                  </div>

                  {/* Dummy blurred placeholder items */}
                  <div className="p-6 filter blur-sm space-y-6 opacity-40">
                    <div className="h-32 bg-zinc-100 rounded-2xl" />
                    <div className="h-44 bg-zinc-100 rounded-2xl" />
                    <div className="h-32 bg-zinc-100 rounded-2xl" />
                  </div>
                </div>
              </section>
            ) : (
              /* Unlocked Sections for Paid Users */
              <>
                {/* Section 3: Personality Spectrums */}
                {reportData.personalitySpectrums && (
                  <section id="personality" className="scroll-mt-24 space-y-4">
                    <PersonalitySpectrums spectrums={reportData.personalitySpectrums} />
                  </section>
                )}

                {/* Section 4: Matched Careers */}
                {reportData.careers && (
                  <section id="careers" className="scroll-mt-24 space-y-4">
                    <CareerCards careers={reportData.careers} />
                  </section>
                )}

                {/* Section 5: Matched Colleges */}
                {reportData.colleges && (
                  <section id="colleges" className="scroll-mt-24 space-y-4">
                    <CollegeCards colleges={reportData.colleges} />
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Share with Parent Modal */}
      <ShareParentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-600">Loading report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
