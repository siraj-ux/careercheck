'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  Keyboard,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

function TestIntroContent() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [level, setLevel] = useState<'UG' | 'PG'>('UG');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication first
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.replace('/auth?redirect=/test/intro');
          return;
        }
        if (!data.user.dob) {
          router.replace('/auth/consent?redirect=/test/intro');
          return;
        }
      })
      .catch(() => {});

    // Fetch or resume test session
    fetch('/api/test/session')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/auth?redirect=/test/intro');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.state?.session) {
          setSessionId(data.state.session.id);
          setLevel(data.state.session.level || 'UG');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleStart = () => {
    if (sessionId) {
      router.push(`/test/${sessionId}`);
    } else {
      // Create session on the fly
      fetch('/api/test/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.state?.session?.id) {
            router.push(`/test/${data.state.session.id}`);
          }
        });
    }
  };

  const sectionsUG = [
    {
      num: 1,
      title: 'Interests (RIASEC)',
      desc: 'Discover your authentic vocational passions across 6 global dimensions.',
      timing: '~10 min',
      isTimed: false,
      items: '60 questions',
    },
    {
      num: 2,
      title: 'Aptitude & Reasoning',
      desc: 'Objective evaluation of logical deduction, verbal comprehension, and spatial problem solving.',
      timing: '12 min',
      isTimed: true,
      items: '20 questions · Timed',
    },
    {
      num: 3,
      title: 'Workstyle & Personality',
      desc: 'Understand your innate interpersonal and problem-solving rhythm across 5 neutral spectrums.',
      timing: '~8 min',
      isTimed: false,
      items: '40 questions',
    },
    {
      num: 4,
      title: 'Core Career Values',
      desc: 'Prioritize what truly matters to you: stability, financial growth, independence, or social impact.',
      timing: '~5 min',
      isTimed: false,
      items: '20 questions',
    },
  ];

  const pgSection = {
    num: 5,
    title: 'Domain & Analytical Knowledge',
    desc: 'Benchmark your diagnostic reasoning and applied concepts for postgraduate specialization.',
    timing: '10 min',
    isTimed: true,
    items: '30 questions · Timed',
  };

  const sections = level === 'PG' ? [...sectionsUG, pgSection] : sectionsUG;

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Top Bar */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 h-16">
          <Link
            href="/onboarding/profile"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Profile Intake</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Answers Private & Autosaved</span>
          </div>
        </div>
      </header>

      {/* Main Content (Variant 1j Reassurance-first, desktop 3e) */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 sm:pt-14 space-y-8">
        {/* Intro Hero */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              {level === 'UG' ? 'Undergraduate Assessment' : 'Postgraduate Assessment'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              Your test, in {sections.length} parts, about {level === 'PG' ? '45' : '35'} minutes.
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 max-w-2xl leading-relaxed">
              Take your time and answer naturally. There are no right or wrong answers in the psychometric sections — only honest reflections of how you think and work.
            </p>
          </div>

          {/* Three Reassurance Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-100">
            <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/60">
              <Clock className="h-5 w-5 text-indigo-600 mb-1.5" />
              <div className="text-xs font-bold text-zinc-900">Pause Anytime</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">
                Answers save after every click. Resume right where you left off.
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/60">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 mb-1.5" />
              <div className="text-xs font-bold text-zinc-900">No Trap Questions</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">
                Neutral scoring. We celebrate both analytical and creative strengths.
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/60">
              <Lock className="h-5 w-5 text-indigo-600 mb-1.5" />
              <div className="text-xs font-bold text-zinc-900">100% Private</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">
                Never shared with coaching institutes or telemarketing call centers.
              </div>
            </div>
          </div>

          {/* Section Breakdown List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Test Sections Overview
            </h3>
            <div className="space-y-2.5">
              {sections.map((sec) => (
                <div
                  key={sec.num}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-zinc-200/80 p-4 bg-zinc-50/40 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs shrink-0 mt-0.5">
                      {sec.num}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        <span>{sec.title}</span>
                        {sec.isTimed && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                            Timed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">{sec.desc}</div>
                    </div>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs text-zinc-600 font-medium pl-10 sm:pl-0">
                    <div>{sec.timing}</div>
                    <div className="text-[11px] text-zinc-600">{sec.items}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Keyboard Hints */}
          <div className="rounded-2xl border border-dashed border-zinc-300 p-4 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Keyboard className="h-5 w-5 text-indigo-600 shrink-0" />
              <div className="text-xs text-zinc-700">
                <span className="font-bold">Desktop Shortcuts:</span> Use keys{' '}
                <kbd className="rounded bg-white px-1.5 py-0.5 border border-zinc-300 font-mono text-[11px]">1-5</kbd>{' '}
                for rating,{' '}
                <kbd className="rounded bg-white px-1.5 py-0.5 border border-zinc-300 font-mono text-[11px]">A-D</kbd>{' '}
                for aptitude options, and{' '}
                <kbd className="rounded bg-white px-1.5 py-0.5 border border-zinc-300 font-mono text-[11px]">Enter ↵</kbd>{' '}
                for next.
              </div>
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-600">
              By starting, you agree to our calm testing guidelines.
            </div>
            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50"
            >
              <span>Start Section 1: Interests</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TestIntroPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-zinc-600">Loading test intro...</div>}>
      <TestIntroContent />
    </Suspense>
  );
}
