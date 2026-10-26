'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Calendar,
  Video,
  Users,
  FileCheck,
  Star,
  Search,
  ArrowRight,
  AlertCircle,
  LogOut,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { OfflineBanner } from '@/components/common/OfflineBanner';

interface TodaySession {
  sessionId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  joinLink: string | null;
  studentId: string;
  studentName: string | null;
  studentLevel: string | null;
  studentPhone: string;
}

interface PendingReview {
  studentId: string;
  name: string;
  level: string | null;
  riasecCode?: string;
  testDate?: string;
}

interface StudentRow {
  studentId: string;
  name: string;
  phone: string;
  level: string;
  topCluster: string;
  status: 'New' | 'Booked' | 'Live' | 'Completed';
  isTestCompleted: boolean;
  isRoadmapPublished: boolean;
  nextSessionDate: string | null;
  nextAction: 'Schedule' | 'Review results' | 'Publish roadmap';
}

interface DashboardData {
  stats: {
    todaySessionsCount: number;
    activeStudentsCount: number;
    reviewsDueCount: number;
    rating: number;
  };
  todaySessions: TodaySession[];
  pendingReviewsQueue: PendingReview[];
  studentTable: StudentRow[];
  consultant: {
    id: string;
    title: string;
    rating: number;
    studentCount: number;
  };
}

export default function ConsultantDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'UG' | 'PG'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'New' | 'Booked' | 'Completed'>('ALL');

  // Video Link Edit State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [updatingLink, setUpdatingLink] = useState(false);

  const fetchDashboard = useCallback(() => {
    fetch('/api/consultant/dashboard')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/auth?redirect=/consultant/dashboard');
          return null;
        }
        if (res.status === 403) {
          setError('Access restricted to verified consultants and administrators.');
          setLoading(false);
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
      .catch(() => {
        setError('Network error loading consultant dashboard.');
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleUpdateLink = async (sessionId: string) => {
    if (!linkInput.trim()) return;
    setUpdatingLink(true);
    try {
      const res = await fetch('/api/booking/join-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, joinLink: linkInput.trim() }),
      });
      if (res.ok) {
        setEditingSessionId(null);
        setLinkInput('');
        fetchDashboard();
      }
    } finally {
      setUpdatingLink(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-zinc-600">Loading Consultant Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
          <h2 className="text-base font-bold text-zinc-950">Workspace Access Notice</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {error || 'Unable to access consultant portal.'}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Sign In with Consultant Account
          </button>
        </div>
      </div>
    );
  }

  // Filtered students
  const filteredStudents = data.studentTable.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topCluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);

    const matchesLevel = levelFilter === 'ALL' || s.level === levelFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const now = new Date();

  return (
    <div className="min-h-screen bg-zinc-50/80 pb-20">
      <OfflineBanner />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-zinc-950 text-sm tracking-tight flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-600" />
              <span>CareerChecks</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Consultant Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Workspace Title & Intro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              Consultant Dashboard
            </h1>
            <p className="text-xs text-zinc-600 mt-1">
              {data.consultant.title} · Review diagnostic results, lead 1-on-1 sessions, and publish student roadmaps.
            </p>
          </div>
        </div>

        {/* 1. Stat Tiles (Today-First Variant 2g) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Today</span>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {data.stats.todaySessionsCount}
            </div>
            <p className="text-[11px] text-zinc-500">Sessions scheduled today</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Students</span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {data.stats.activeStudentsCount}
            </div>
            <p className="text-[11px] text-zinc-500">Active assigned students</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Reviews Due</span>
              <FileCheck className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {data.stats.reviewsDueCount}
            </div>
            <p className="text-[11px] text-zinc-500">Pending roadmap publication</p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Rating</span>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-950">
              {data.stats.rating.toFixed(1)} ★
            </div>
            <p className="text-[11px] text-zinc-500">Student satisfaction score</p>
          </div>
        </div>

        {/* 2. Today's Sessions List */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-950">Today&apos;s Sessions</h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {data.todaySessions.length}
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Timezone: Asia/Kolkata (IST)</span>
          </div>

          {data.todaySessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-700">No sessions scheduled for today.</p>
              <p>Upcoming bookings from your students will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {data.todaySessions.map((session) => {
                const sessionDate = new Date(session.scheduledAt);
                const timeIST = sessionDate.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Kolkata',
                });
                const diffMin = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60));
                const canJoin = diffMin <= 10 && diffMin >= -session.durationMinutes;

                return (
                  <div
                    key={session.sessionId}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-mono font-bold text-xs shrink-0">
                        {timeIST}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/consultant/students/${session.studentId}`}
                            className="text-sm font-bold text-zinc-950 hover:text-indigo-600 transition-colors"
                          >
                            {session.studentName || 'Student'}
                          </Link>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                            {session.studentLevel || 'UG'}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                          <span>Phone: {session.studentPhone}</span>
                          <span>·</span>
                          <span>45 min 1-on-1</span>
                        </div>
                      </div>
                    </div>

                    {/* Join Call or Edit Meeting Link */}
                    <div className="flex items-center gap-2 shrink-0">
                      {editingSessionId === session.sessionId ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="url"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="Paste Google Meet / Zoom link"
                            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 w-64 focus:outline-hidden focus:border-indigo-600"
                          />
                          <button
                            type="button"
                            disabled={updatingLink || !linkInput.trim()}
                            onClick={() => handleUpdateLink(session.sessionId)}
                            className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSessionId(null)}
                            className="rounded-full border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {session.joinLink ? (
                            <a
                              href={session.joinLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold shadow-xs transition-all ${
                                canJoin
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              }`}
                            >
                              <Video className="h-3.5 w-3.5" />
                              <span>{canJoin ? 'Join Call Now' : 'Join (Opens in 10m)'}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSessionId(session.sessionId);
                                setLinkInput('');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/60 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Set Meeting Link</span>
                            </button>
                          )}

                          <Link
                            href={`/consultant/students/${session.studentId}`}
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            <span>360 View</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Pending Roadmap Reviews Queue */}
        {data.pendingReviewsQueue.length > 0 && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <span>Pending Roadmap Reviews</span>
                  <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold">
                    {data.pendingReviewsQueue.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  These students have finished their test and await your roadmap strategy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.pendingReviewsQueue.map((item) => (
                <div
                  key={item.studentId}
                  className="rounded-2xl border border-amber-200/80 bg-white p-4 space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900">{item.name}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                      {item.level || 'UG'}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-600 space-y-1">
                    <div>Primary Interest: <strong>{item.riasecCode || 'Pending'}</strong></div>
                  </div>

                  <Link
                    href={`/consultant/students/${item.studentId}`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                  >
                    <span>Build & Publish Roadmap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Assigned Students Table */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Assigned Students Directory</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Overview of students assigned to your guidance roster.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or RIASEC..."
                  className="rounded-full border border-zinc-200 bg-zinc-50 pl-8 pr-4 py-1.5 text-xs text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as 'ALL' | 'UG' | 'PG')}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-hidden"
              >
                <option value="ALL">All Levels</option>
                <option value="UG">UG (Class 12)</option>
                <option value="PG">PG (Graduating)</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'New' | 'Booked' | 'Completed')}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="New">New</option>
                <option value="Booked">Booked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
              <Users className="h-8 w-8 text-zinc-300 mx-auto" />
              <p className="font-semibold text-zinc-700">No students match current search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 font-bold">Student</th>
                    <th className="py-3 px-3 font-bold">Level</th>
                    <th className="py-3 px-3 font-bold">Top Cluster</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold">Next Action</th>
                    <th className="py-3 px-3 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-950">{s.name}</div>
                        <div className="text-[11px] text-zinc-500">{s.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                          {s.level}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-indigo-700">
                        {s.topCluster}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            s.status === 'Booked'
                              ? 'bg-indigo-50 text-indigo-700'
                              : s.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-zinc-700">
                        {s.nextAction}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/consultant/students/${s.studentId}`}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <span>Open 360°</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
