'use client';

import { useState, useEffect, useCallback, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  WifiOff,
  LogOut,
} from 'lucide-react';

interface Question {
  id: string;
  section: string;
  subType: string | null;
  type: 'likert' | 'mcq';
  stemText: string;
  stemImage: string | null;
  options: { key: string; text: string }[] | null;
}

interface TestState {
  session: {
    id: string;
    level: string;
    currentSection: string;
    currentSectionIndex: number;
    totalSections: number;
  };
  currentSectionMeta: {
    name: string;
    durationMin: number;
    isTimed: boolean;
    questionsCount: number;
  };
  questions: Question[];
  answeredMap: Record<string, string>;
  activeQuestionIndex: number;
  remainingSeconds: number | null;
  deadline: string | null;
  isTimed: boolean;
}

function TestEngineContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  // Test state
  const [testState, setTestState] = useState<TestState | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredMap, setAnsweredMap] = useState<Record<string, string>>({});

  // Timer & offline
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loading, setLoading] = useState<boolean>(true);
  const [questionStartTime, setQuestionStartTime] = useState<number>(() => Date.now());

  // Section expiry handler
  const handleSectionExpire = useCallback(async () => {
    if (!testState) return;
    try {
      await fetch('/api/test/submit-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          section: testState.session.currentSection,
        }),
      });
    } finally {
      router.push(`/test/section-break?sessionId=${sessionId}&section=${testState.session.currentSection}&expired=true`);
    }
  }, [sessionId, testState, router]);

  // Offline queue flush
  const flushOfflineQueue = useCallback(async () => {
    const queueKey = `cc_offline_queue_${sessionId}`;
    const raw = localStorage.getItem(queueKey);
    if (!raw) return;

    try {
      const queue = JSON.parse(raw);
      if (Array.isArray(queue) && queue.length > 0) {
        await fetch('/api/test/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, answers: queue }),
        });
        localStorage.removeItem(queueKey);
      }
    } catch {
      // Keep in local storage if sync failed
    }
  }, [sessionId]);

  // Save answer
  const saveAnswer = useCallback(
    async (answerVal: string) => {
      if (!testState) return;
      const currentQ = testState.questions[currentIndex];
      if (!currentQ) return;

      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

      // Update local state immediately
      setSelectedAnswer(answerVal);
      setAnsweredMap((prev) => ({ ...prev, [currentQ.id]: answerVal }));
      setSaveStatus('saving');

      // If offline, append to offline queue
      if (!navigator.onLine || isOffline) {
        const queueKey = `cc_offline_queue_${sessionId}`;
        const existing = JSON.parse(localStorage.getItem(queueKey) || '[]');
        existing.push({ questionId: currentQ.id, answer: answerVal, timeTakenSeconds: timeTaken });
        localStorage.setItem(queueKey, JSON.stringify(existing));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
        return;
      }

      try {
        const res = await fetch('/api/test/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionId: currentQ.id,
            answer: answerVal,
            timeTakenSeconds: timeTaken,
          }),
        });

        if (res.status === 410) {
          // Section expired
          handleSectionExpire();
          return;
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch {
        setIsOffline(true);
        // Fallback to offline queue
        const queueKey = `cc_offline_queue_${sessionId}`;
        const existing = JSON.parse(localStorage.getItem(queueKey) || '[]');
        existing.push({ questionId: currentQ.id, answer: answerVal, timeTakenSeconds: timeTaken });
        localStorage.setItem(queueKey, JSON.stringify(existing));
        setSaveStatus('saved');
      }
    },
    [testState, currentIndex, questionStartTime, isOffline, sessionId, handleSectionExpire]
  );

  // Advance to next question or submit section
  const handleNext = useCallback(async () => {
    if (!testState) return;

    if (currentIndex < testState.questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = testState.questions[nextIdx];
      setSelectedAnswer(answeredMap[nextQ?.id] || null);
      setQuestionStartTime(Date.now());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Completed all questions in this section!
      await flushOfflineQueue();
      await fetch('/api/test/submit-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          section: testState.session.currentSection,
        }),
      });
      router.push(`/test/section-break?sessionId=${sessionId}&section=${testState.session.currentSection}`);
    }
  }, [testState, currentIndex, answeredMap, flushOfflineQueue, sessionId, router]);

  const handlePrev = useCallback(() => {
    if (!testState || currentIndex <= 0) return;
    const prevIdx = currentIndex - 1;
    setCurrentIndex(prevIdx);
    const prevQ = testState.questions[prevIdx];
    setSelectedAnswer(answeredMap[prevQ?.id] || null);
    setQuestionStartTime(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [testState, currentIndex, answeredMap]);

  // 1. Load test state asynchronously
  useEffect(() => {
    let mounted = true;

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.replace(`/auth?redirect=${encodeURIComponent(`/test/${sessionId}`)}`);
          return;
        }
        if (!data.user.dob) {
          router.replace(`/auth/consent?redirect=${encodeURIComponent(`/test/${sessionId}`)}`);
          return;
        }
      })
      .catch(() => {});

    fetch(`/api/test/session?sessionId=${sessionId}`)
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/auth?redirect=${encodeURIComponent(`/test/${sessionId}`)}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted || !data) return;
        if (!data.success || !data.state) {
          router.push('/test/intro');
          return;
        }

        const state: TestState = data.state;
        if (data.state.isSectionComplete) {
          router.push(`/test/section-break?sessionId=${sessionId}&section=${state.session.currentSection}`);
          return;
        }

        setTestState(state);
        setAnsweredMap(state.answeredMap || {});

        const initialIndex = Math.min(state.activeQuestionIndex, state.questions.length - 1);
        setCurrentIndex(initialIndex);

        const currQ = state.questions[initialIndex];
        if (currQ && state.answeredMap?.[currQ.id]) {
          setSelectedAnswer(state.answeredMap[currQ.id]);
        } else {
          setSelectedAnswer(null);
        }

        if (state.isTimed && state.remainingSeconds !== null) {
          setRemainingTime(state.remainingSeconds);
        }

        setLoading(false);
        setQuestionStartTime(Date.now());
      })
      .catch(() => {
        if (mounted) {
          setIsOffline(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [sessionId, router]);

  // 2. Countdown timer for timed sections
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSectionExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, handleSectionExpire]);

  // 3. Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOfflineQueue]);

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const currentQ = testState?.questions[currentIndex];
      if (!currentQ) return;

      if (e.key === 'Enter') {
        if (selectedAnswer || currentQ.type === 'mcq') {
          handleNext();
        }
        return;
      }

      if (currentQ.type === 'likert') {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          saveAnswer(e.key);
        }
      }

      if (currentQ.type === 'mcq') {
        const upper = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(upper)) {
          saveAnswer(upper);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, testState, selectedAnswer, handleNext, saveAnswer]);

  if (loading || !testState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <div className="text-sm font-medium text-zinc-600">Restoring your test session...</div>
        </div>
      </div>
    );
  }

  const currentQ = testState.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / testState.questions.length) * 100);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        {isOffline && (
          <div className="bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
            <WifiOff className="h-3.5 w-3.5" />
            <span>You&apos;re offline. Answers are safely saved on this device and will sync automatically.</span>
          </div>
        )}

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 h-16">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {testState.currentSectionMeta.name}
            </div>
            <div className="text-xs text-zinc-600 font-medium">
              Question {currentIndex + 1} of {testState.questions.length}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {testState.isTimed && remainingTime !== null && (
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold ${
                  remainingTime < 120
                    ? 'bg-orange-100 text-orange-800 animate-pulse'
                    : 'bg-zinc-100 text-zinc-800'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTimer(remainingTime)}</span>
              </div>
            )}

            <div className="hidden sm:block text-xs font-medium text-zinc-600">
              {saveStatus === 'saving' && <span className="text-zinc-600">Saving...</span>}
              {saveStatus === 'saved' && <span className="text-emerald-600 font-semibold">Saved ✓</span>}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Save & Exit</span>
            </Link>
          </div>
        </div>

        <div className="h-1 w-full bg-zinc-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Question Presentation Area */}
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {currentQ ? (
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  {currentQ.subType ? `Category: ${currentQ.subType}` : 'Question'}
                </span>
                <span className="text-xs font-medium text-zinc-600">
                  {currentQ.type === 'likert' ? 'Likert Scale (1-5)' : 'Multiple Choice (A-D)'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 leading-relaxed">
                {currentQ.stemText}
              </h2>

              {currentQ.stemImage && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 max-w-md mx-auto">
                  <div dangerouslySetInnerHTML={{ __html: currentQ.stemImage }} />
                </div>
              )}
            </div>

            {currentQ.type === 'likert' ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {[
                    { val: '1', label: 'Strongly Disagree' },
                    { val: '2', label: 'Disagree' },
                    { val: '3', label: 'Neutral' },
                    { val: '4', label: 'Agree' },
                    { val: '5', label: 'Strongly Agree' },
                  ].map((opt) => {
                    const isSelected = selectedAnswer === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => saveAnswer(opt.val)}
                        className={`group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs scale-102'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-bold text-sm transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200'
                          }`}
                        >
                          {opt.val}
                        </div>
                        <span className="hidden sm:inline-block text-[11px] font-medium text-center mt-2 text-zinc-600 group-hover:text-zinc-900">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-zinc-600 px-1 sm:hidden">
                  <span>1: Disagree</span>
                  <span>5: Agree</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {currentQ.options?.map((opt) => {
                  const isSelected = selectedAnswer === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => saveAnswer(opt.key)}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-800'
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <div className="text-sm font-medium leading-relaxed">{opt.text}</div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>

              <div className="text-[11px] text-zinc-600 hidden sm:block">
                Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 border text-[10px] font-mono">Enter ↵</kbd> for next
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentQ.type === 'likert' && !selectedAnswer}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>
                  {currentIndex === testState.questions.length - 1
                    ? 'Complete Section'
                    : currentQ.type === 'mcq' && !selectedAnswer
                    ? 'Skip Question'
                    : 'Next Question'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-2xl border">
            No questions available for this section.
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-zinc-600 border-t border-zinc-200/60 bg-white">
        Autosaved to your private student session · You can close the tab anytime and resume
      </footer>
    </div>
  );
}

function TestEngineParamsWrapper({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  return <TestEngineContent sessionId={resolvedParams.sessionId} />;
}

export default function TestEnginePage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
            <div className="text-sm font-medium text-zinc-600">Loading test engine...</div>
          </div>
        </div>
      }
    >
      <TestEngineParamsWrapper params={params} />
    </Suspense>
  );
}
