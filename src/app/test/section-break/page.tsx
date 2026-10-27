'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { SECTION_META, SectionType, SECTION_ORDER_UG, SECTION_ORDER_PG } from '@/lib/constants/sections';
import { BrandLogo } from '@/components/common/BrandLogo';

function SectionBreakContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get('sessionId');
  const finishedSection = (searchParams.get('section') || 'interests') as SectionType;
  const isExpired = searchParams.get('expired') === 'true';

  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<'UG' | 'PG'>('UG');
  const [currentSection, setCurrentSection] = useState<SectionType>('aptitude');
  const [isTestComplete, setIsTestComplete] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.replace(`/auth?redirect=${encodeURIComponent(`/test/section-break?sessionId=${sessionId}&section=${finishedSection}`)}`);
          return;
        }
        if (!data.user.dob) {
          router.replace(`/auth/consent?redirect=${encodeURIComponent(`/test/section-break?sessionId=${sessionId}&section=${finishedSection}`)}`);
          return;
        }
      })
      .catch(() => {});

    fetch(`/api/test/session?sessionId=${sessionId}`)
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/auth?redirect=${encodeURIComponent(`/test/section-break?sessionId=${sessionId}&section=${finishedSection}`)}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.state) {
          const session = data.state.session;
          setLevel(session.level || 'UG');
          setCurrentSection(session.currentSection);

          if (session.status === 'completed') {
            setIsTestComplete(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId, finishedSection, router]);

  const sections: readonly SectionType[] = level === 'PG' ? SECTION_ORDER_PG : SECTION_ORDER_UG;
  const finishedIdx = sections.indexOf(finishedSection);
  const sectionsRemaining = sections.length - (finishedIdx + 1);

  const nextMeta = SECTION_META[currentSection];
  const finishedMeta = SECTION_META[finishedSection];

  const handleContinue = () => {
    if (isTestComplete) {
      router.push(`/report?sessionId=${sessionId}`);
    } else {
      router.push(`/test/${sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-sm text-zinc-600 animate-pulse">Loading section progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Header */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2">
            <BrandLogo href="/" size="sm" />
            <span className="text-xs text-zinc-600 font-medium">· Section Break</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Saved ✓</span>
          </div>
        </div>
      </header>

      {/* Main Content (Variant 2a Celebration-first, desktop 3g) */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-14 space-y-8">
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8 text-center sm:text-left">
          {/* Celebration Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              {isTestComplete
                ? 'All Sections Completed!'
                : `Section ${finishedIdx + 1} done. ${sectionsRemaining} to go.`}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              {isTestComplete ? 'Spectacular work! Your test is complete.' : 'Nice work. All answers saved.'}
            </h1>

            {isExpired && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800">
                The timed {finishedMeta.name} section reached its duration limit and was automatically submitted. Unanswered items were recorded as skipped.
              </div>
            )}

            {/* Teaser insight from completed section */}
            {finishedMeta.teaser && !isTestComplete && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs text-indigo-950">
                <span className="font-bold">A first glimpse: </span>
                <span className="italic">{finishedMeta.teaser}</span>
              </div>
            )}
          </div>

          {/* Dotted Path Progress */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Overall Test Progress
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sections.map((sec, idx) => {
                const isDone = idx <= finishedIdx;
                const isCurrent = sec === currentSection && !isTestComplete;
                return (
                  <div
                    key={sec}
                    className={`rounded-2xl border p-3 text-xs transition-all ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                        : isCurrent
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-600/20'
                        : 'border-zinc-200 bg-zinc-50/40 text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-600">Part {idx + 1}</span>
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-zinc-300" />
                      )}
                    </div>
                    <div className="mt-1 font-semibold truncate">{SECTION_META[sec].name.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Up Next Card */}
          {!isTestComplete && nextMeta && (
            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-5 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Up Next: Section {sections.indexOf(currentSection) + 1}
              </div>
              <div className="text-lg font-bold text-zinc-900">{nextMeta.name}</div>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-600 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" /> {nextMeta.durationMin} minutes
                </span>
                <span>·</span>
                <span>{nextMeta.questionsCount} questions</span>
                <span>·</span>
                <span>{nextMeta.isTimed ? 'Timed section' : 'Untimed · answer naturally'}</span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 w-full sm:w-auto justify-center"
            >
              <LogOut className="h-4 w-4" />
              <span>Pause and come back later</span>
            </Link>

            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all w-full sm:w-auto justify-center"
            >
              <span>{isTestComplete ? 'View My Report' : `Continue to ${nextMeta?.name.split(' ')[0]}`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SectionBreakPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-zinc-600">Loading section break...</div>}>
      <SectionBreakContent />
    </Suspense>
  );
}
