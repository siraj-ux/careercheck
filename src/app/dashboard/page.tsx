'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface Milestone {
  id: string;
  orderIndex: number;
  type: string;
  title: string;
  description?: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface DashboardState {
  user: {
    id: string;
    name: string;
    plan: 'free' | 'paid';
    level: string | null;
  };
  hasCompletedTest: boolean;
  testResultSummary: {
    id: string;
    riasecCode: string;
    completedAt: string;
  } | null;
  nextStepHero: {
    title: string;
    description?: string;
    type: string;
    deadline: string;
    daysLeft: number;
    status: string;
  } | null;
  session: {
    sessionId: string;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
    joinLink?: string;
    consultantName: string;
    consultantTitle: string;
    consultantRating: number;
    diffMinutes: number;
    canJoin: boolean;
  } | null;
  roadmap: {
    hasRoadmap: boolean;
    primary: Milestone[];
    backup: Milestone[];
  };
  latestMessage: {
    id: string;
    body: string;
    createdAt: string;
  } | null;
  savedColleges: {
    count: number;
    items: {
      savedId: string;
      collegeId: string;
      name: string;
      city: string;
      type: string;
      cutoffPercent: number;
    }[];
  };
}

export default function StudentDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardState | null>(null);
  const [roadmapTab, setRoadmapTab] = useState<'primary' | 'backup'>('primary');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/auth?redirect=/dashboard');
          return null;
        }
        return res.json();
      })
      .then((resData) => {
        if (resData && resData.success) {
          setData(resData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-zinc-600">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 text-amber-600 mx-auto" />
          <h2 className="text-sm font-bold text-zinc-950">Unable to load dashboard</h2>
          <p className="text-xs text-zinc-600">Please sign in again to access your dashboard.</p>
          <Link
            href="/auth"
            className="inline-block rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const user = data.user;
  const isPaid = user.plan === 'paid';
  const milestones = roadmapTab === 'primary' ? data.roadmap.primary : data.roadmap.backup;

  const formatISTDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };

  const formatISTTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 pb-24 md:pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-zinc-950 text-sm tracking-tight flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-600" />
              <span>CareerChecks</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-medium text-zinc-600">Student Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              <span>My Report</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                {user.name ? user.name[0].toUpperCase() : 'S'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Desktop Variant 2f (Main Roadmap, Side Rail) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                Hi, {user.name || 'there'} 👋
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-700'
              }`}>
                {isPaid ? 'Career Plan' : 'Free Discovery'}
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              Welcome to your personal career guidance workspace.
            </p>
          </div>

          {!isPaid && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Unlock 1-on-1 Mentor & Roadmap (₹1,499)</span>
            </Link>
          )}
        </div>

        {/* Next Step Hero */}
        {data.nextStepHero ? (
          <div className="rounded-3xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-6 sm:p-7 shadow-xs mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white">
                <span>Immediate Priority</span>
              </div>
              <div className="text-xs font-mono font-bold text-indigo-700">
                {data.nextStepHero.daysLeft} days remaining
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950">
                  {data.nextStepHero.title}
                </h2>
                {data.nextStepHero.description && (
                  <p className="text-xs text-zinc-600 mt-1 max-w-xl">
                    {data.nextStepHero.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-600 mt-2 font-medium">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Target Date: {formatISTDate(data.nextStepHero.deadline)}</span>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all shrink-0 self-start md:self-auto"
              >
                <span>Take Action</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Default Hero when roadmap not yet ready */
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Next Milestone
              </div>
              <h2 className="text-lg font-bold text-zinc-950 mt-1">
                {data.hasCompletedTest
                  ? isPaid
                    ? 'Mentor review in progress: your roadmap is being drafted.'
                    : 'Unlock Career Plan to receive a customized action roadmap.'
                  : 'Start your test to unlock your customized roadmap.'}
              </h2>
              <p className="text-xs text-zinc-600 mt-1">
                {data.hasCompletedTest
                  ? 'Your assessment results have been recorded successfully.'
                  : '35 minutes · untimed sections pause anytime.'}
              </p>
            </div>

            <Link
              href={data.hasCompletedTest ? (isPaid ? '/report' : '/pricing') : '/test/intro'}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 shrink-0 self-start md:self-auto"
            >
              <span>{data.hasCompletedTest ? (isPaid ? 'View Report' : 'Unlock Now') : 'Begin Test'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Published Roadmap */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Strategy Execution
                  </div>
                  <h3 className="text-lg font-bold text-zinc-950">Action Roadmap</h3>
                </div>

                {/* Primary / Backup Toggle */}
                <div className="flex items-center rounded-full bg-zinc-100 p-1 border border-zinc-200/60 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setRoadmapTab('primary')}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      roadmapTab === 'primary'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Primary Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoadmapTab('backup')}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      roadmapTab === 'backup'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Backup Plan
                  </button>
                </div>
              </div>

              {milestones.length === 0 ? (
                /* Empty State for Roadmap */
                <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center space-y-2">
                  <div className="text-xs font-bold text-zinc-800">
                    No published {roadmapTab} roadmap milestones yet.
                  </div>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                    {isPaid
                      ? 'Your mentor will review your assessment results and publish your tailored plan during your 1-on-1 strategy call.'
                      : 'Milestone tracking is unlocked with Career Plan.'}
                  </p>
                  {!isPaid && (
                    <Link
                      href="/pricing"
                      className="inline-block rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white mt-2"
                    >
                      Unlock Career Plan
                    </Link>
                  )}
                </div>
              ) : (
                /* Milestone Timeline */
                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                  {milestones.map((m) => {
                    const isDone = m.status === 'completed';
                    const isInProgress = m.status === 'in_progress';

                    return (
                      <div key={m.id} className="relative flex items-start gap-4 pl-1">
                        {/* Status Icon Marker */}
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white shrink-0 z-10 ${
                          isDone
                            ? 'border-emerald-600 text-emerald-600'
                            : isInProgress
                            ? 'border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                            : 'border-zinc-300 text-zinc-400'
                        }`}>
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-3 w-3 fill-current" />
                          )}
                        </div>

                        {/* Milestone Card */}
                        <div className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-1.5 hover:bg-white hover:border-zinc-200 transition-all">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[10px] uppercase tracking-wider text-indigo-600">
                              {m.type}
                            </span>
                            <span className="font-mono text-zinc-600 text-[11px]">
                              {formatISTDate(m.deadline)}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-zinc-950">{m.title}</h4>
                          {m.description && (
                            <p className="text-xs text-zinc-600 leading-relaxed">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Side Rail (Desktop): Session, Chat & Saved Colleges */}
          <aside className="lg:col-span-4 space-y-6">
            {/* 1. Upcoming Session Card */}
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                1-on-1 Consultation
              </div>

              {data.session ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950">
                      {data.session.consultantName}
                    </h4>
                    <p className="text-xs text-zinc-600">{data.session.consultantTitle}</p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3 space-y-1.5 text-xs text-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{formatISTDate(data.session.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{formatISTTime(data.session.scheduledAt)} IST (45 min)</span>
                    </div>
                  </div>

                  {data.session.canJoin && data.session.joinLink ? (
                    <a
                      href={data.session.joinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                    >
                      <Video className="h-4 w-4" />
                      <span>Join Call Now</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-600 cursor-not-allowed"
                    >
                      <Video className="h-4 w-4" />
                      <span>Join call active 10m before</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Empty state for sessions */
                <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center space-y-2">
                  <p className="text-xs text-zinc-600">No session scheduled yet.</p>
                  <button
                    type="button"
                    className="inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Find a consultant
                  </button>
                </div>
              )}
            </div>

            {/* 2. Direct Chat Preview */}
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Mentor Chat
                </div>
                <span className="text-[11px] text-zinc-600">30-day access</span>
              </div>

              {data.latestMessage ? (
                <div className="rounded-2xl bg-zinc-50 p-3.5 space-y-1">
                  <div className="text-xs text-zinc-800 line-clamp-2">
                    &ldquo;{data.latestMessage.body}&rdquo;
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono">
                    {formatISTTime(data.latestMessage.createdAt)}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  No active messages yet. Chat opens once your consultant is assigned.
                </p>
              )}

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                <span>Open Chat Thread</span>
              </button>
            </div>

            {/* 3. Saved Colleges */}
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Shortlist ({data.savedColleges.count})
                </div>
                <Link href="/report#colleges" className="text-xs font-semibold text-indigo-600 hover:underline">
                  All →
                </Link>
              </div>

              {data.savedColleges.count === 0 ? (
                <p className="text-xs text-zinc-600">
                  No colleges bookmarked yet. Bookmark colleges from your assessment report.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.savedColleges.items.map((col) => (
                    <div
                      key={col.savedId}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 text-xs space-y-0.5"
                    >
                      <div className="font-bold text-zinc-900 truncate">{col.name}</div>
                      <div className="text-[11px] text-zinc-600">{col.city} · Cutoff {col.cutoffPercent}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
