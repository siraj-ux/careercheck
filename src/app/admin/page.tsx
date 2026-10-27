'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Building,
  UserCheck,
  ShieldAlert,
  X,
  AlertCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BrandLogo } from '@/components/common/BrandLogo';

interface FunnelData {
  signups: number;
  testsCompleted: number;
  paid: number;
  sessionsCount: number;
  conversionRates: {
    signupToTestPct: number;
    testToPaidPct: number;
    paidToSessionPct: number;
  };
}

interface QueueItem {
  studentId: string;
  name: string;
  phone: string;
  level: string;
  stream: string | null;
  interests: string[];
  preferredCities: string[];
  topSuggestion: {
    consultantId: string;
    consultantName: string;
    consultantTitle: string;
    rating: number;
    activeStudents: number;
    matchPercent: number;
  } | null;
  allConsultantOptions: {
    consultantId: string;
    consultantName: string;
    matchPercent: number;
  }[];
}

interface QuestionSummary {
  summary: Record<string, { total: number; live: number; draft: number }>;
  questions: {
    id: string;
    section: string;
    subType: string | null;
    type: string;
    stemText: string;
    options: unknown;
    correctKey: string | null;
    status: 'live' | 'draft';
    level: string;
  }[];
}

interface CollegeItem {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  annualFees: number;
  cutoffPercent: number;
  level: string;
}

interface ConsultantItem {
  id: string;
  userId: string;
  name: string | null;
  title: string;
  rating: number;
  studentCount: number;
  isActive: boolean;
  specialisations: string[];
  languages: string[];
}

interface AuditItem {
  id: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  targetUserId: string | null;
  detailsJson: string | null;
  createdAt: string;
}

export default function AdminConsolePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'questions' | 'colleges' | 'consultants' | 'audit'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedConsultants, setSelectedConsultants] = useState<Record<string, string>>({});
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

  // Question bank state
  const [questionBank, setQuestionBank] = useState<QuestionSummary | null>(null);
  const [questionSectionFilter, setQuestionSectionFilter] = useState<string>('all');
  const [togglingQId, setTogglingQId] = useState<string | null>(null);

  // Directory states
  const [collegesList, setCollegesList] = useState<CollegeItem[]>([]);
  const [consultantsList, setConsultantsList] = useState<ConsultantItem[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditItem[]>([]);

  // Add College Modal / Form
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCity, setNewCollegeCity] = useState('');
  const [newCollegeCutoff, setNewCollegeCutoff] = useState('85');
  const [newCollegeFees, setNewCollegeFees] = useState('200000');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadAdminData() {
      try {
        // 1. Funnel
        const funnelRes = await fetch('/api/admin/funnel');
        if (funnelRes.status === 401) {
          router.replace('/auth?redirect=/admin');
          return;
        }
        if (funnelRes.status === 403) {
          if (!isCancelled) {
            setError('Forbidden: This console is restricted to administrators.');
            setLoading(false);
          }
          return;
        }
        const funnelJson = await funnelRes.json();
        if (funnelJson.success && !isCancelled) setFunnel(funnelJson);

        // 2. Assignment Queue
        const assignRes = await fetch('/api/admin/assignments');
        const assignJson = await assignRes.json();
        if (assignJson.success && !isCancelled) {
          setQueue(assignJson.queue || []);
          // Initialize default selected consultants
          const initialMap: Record<string, string> = {};
          for (const item of assignJson.queue || []) {
            if (item.topSuggestion) {
              initialMap[item.studentId] = item.topSuggestion.consultantId;
            }
          }
          setSelectedConsultants(initialMap);
        }

        // 3. Question Bank
        const qRes = await fetch('/api/admin/questions');
        const qJson = await qRes.json();
        if (qJson.success && !isCancelled) setQuestionBank(qJson);

        // 4. Colleges
        const colRes = await fetch('/api/admin/colleges');
        const colJson = await colRes.json();
        if (colJson.success && !isCancelled) setCollegesList(colJson.colleges || []);

        // 5. Consultants
        const consRes = await fetch('/api/admin/consultants');
        const consJson = await consRes.json();
        if (consJson.success && !isCancelled) setConsultantsList(consJson.consultants || []);

        // 6. Audit Logs
        const auditRes = await fetch('/api/admin/audit-logs');
        const auditJson = await auditRes.json();
        if (auditJson.success && !isCancelled) setAuditLogsList(auditJson.logs || []);

        if (!isCancelled) setLoading(false);
      } catch {
        if (!isCancelled) {
          setError('Network error loading admin console.');
          setLoading(false);
        }
      }
    }

    void loadAdminData();

    return () => {
      isCancelled = true;
    };
  }, [router, refreshTrigger]);

  // Handle Assigning Consultant
  const handleAssign = async (studentId: string) => {
    const consultantId = selectedConsultants[studentId];
    if (!consultantId) return;

    setAssigningStudentId(studentId);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, consultantId }),
      });
      if (res.ok) {
        setQueue((prev) => prev.filter((item) => item.studentId !== studentId));
        // Refresh funnel & consultants
        setRefreshTrigger((prev) => prev + 1);
      }
    } finally {
      setAssigningStudentId(null);
    }
  };

  // Handle Question Status Toggle
  const handleToggleQuestion = async (questionId: string, currentStatus: 'live' | 'draft') => {
    const nextStatus = currentStatus === 'live' ? 'draft' : 'live';
    setTogglingQId(questionId);

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, status: nextStatus }),
      });
      if (res.ok) {
        setQuestionBank((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === questionId ? { ...q, status: nextStatus } : q
            ),
          };
        });
      }
    } finally {
      setTogglingQId(null);
    }
  };

  // Handle Consultant Active Toggle
  const handleToggleConsultant = async (consultantId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/consultants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultantId, isActive: !currentActive }),
      });
      if (res.ok) {
        setConsultantsList((prev) =>
          prev.map((c) => (c.id === consultantId ? { ...c, isActive: !currentActive } : c))
        );
      }
    } catch {
      // Ignore error
    }
  };

  // Handle Add College
  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim() || !newCollegeCity.trim()) return;

    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollegeName.trim(),
          city: newCollegeCity.trim(),
          state: 'India',
          type: 'Private',
          annualFees: Number(newCollegeFees) || 200000,
          cutoffPercent: Number(newCollegeCutoff) || 85,
          exams: ['CUET'],
          courses: ['Undergraduate Degree'],
          level: 'both',
        }),
      });

      if (res.ok) {
        setShowAddCollege(false);
        setNewCollegeName('');
        setNewCollegeCity('');
        const colRes = await fetch('/api/admin/colleges');
        const colJson = await colRes.json();
        if (colJson.success) setCollegesList(colJson.colleges || []);
      }
    } catch {
      // Ignore error
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
          <p className="text-xs font-semibold text-zinc-600">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-zinc-950">Administrative Access Required</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  // Filtered Questions
  const filteredQuestions = questionBank?.questions?.filter((q) => {
    if (questionSectionFilter === 'all') return true;
    return q.section === questionSectionFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-zinc-50/80 pb-20">
      <OfflineBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size="sm" />
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Variant 2i) */}
        <div className="border-t border-zinc-100 bg-white">
          <div className="mx-auto flex max-w-7xl gap-2 px-4 sm:px-6 overflow-x-auto py-2">
            {[
              { id: 'overview' as const, label: 'Funnel & Queue', icon: TrendingUp },
              { id: 'questions' as const, label: 'Question Bank', icon: HelpCircle },
              { id: 'colleges' as const, label: 'Colleges', icon: Building },
              { id: 'consultants' as const, label: 'Consultants', icon: UserCheck },
              { id: 'audit' as const, label: 'Audit Trail', icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* ========================================================
            TAB 1: FUNNEL STRIP & CONSULTANT ASSIGNMENT QUEUE
           ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* 1. Funnel Strip (Variant 2i) */}
            {funnel && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-zinc-950">Platform Conversion Funnel</h2>
                  <span className="text-xs text-zinc-500 font-mono">Real-time metrics</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">1. Signups</span>
                    <div className="text-2xl font-extrabold text-zinc-950">{funnel.signups}</div>
                    <p className="text-[11px] text-zinc-500">Student accounts registered</p>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">2. Tests Done</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {funnel.conversionRates.signupToTestPct}% conv
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-zinc-950">{funnel.testsCompleted}</div>
                    <p className="text-[11px] text-zinc-500">Completed assessments</p>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600">3. Paid (Career Plan)</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {funnel.conversionRates.testToPaidPct}% conv
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-zinc-950">{funnel.paid}</div>
                    <p className="text-[11px] text-zinc-500">₹1,499 unlocked tier</p>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">4. Sessions Held</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {funnel.conversionRates.paidToSessionPct}% conv
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-zinc-950">{funnel.sessionsCount}</div>
                    <p className="text-[11px] text-zinc-500">1-on-1 consultations</p>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Consultant Assignment Queue */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-950">Assignment Queue</h2>
                    <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-xs font-bold">
                      {queue.length}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Paid students awaiting human consultant assignment. Smart match algorithm suggests best fit.
                  </p>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center text-xs text-zinc-500 space-y-1">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-zinc-800 text-sm">All Paid Students Assigned!</p>
                  <p>There are no unassigned students in the queue at this time.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {queue.map((item) => {
                    const topMatch = item.topSuggestion;
                    const selectedId = selectedConsultants[item.studentId] || topMatch?.consultantId;
                    const isAssigning = assigningStudentId === item.studentId;

                    return (
                      <div
                        key={item.studentId}
                        className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Student details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-950">{item.name}</span>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                              {item.level}
                            </span>
                            <span className="text-xs text-zinc-400 font-mono">{item.phone}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                            <span>Stream: <strong>{item.stream || 'General'}</strong></span>
                            {item.preferredCities.length > 0 && (
                              <span>· Cities: {item.preferredCities.slice(0, 2).join(', ')}</span>
                            )}
                            {item.interests.length > 0 && (
                              <span>· Interests: {item.interests.slice(0, 2).join(', ')}</span>
                            )}
                          </div>
                        </div>

                        {/* Match & Assignment Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                          {topMatch && (
                            <div className="flex items-center gap-2 rounded-2xl bg-indigo-50/80 border border-indigo-100 px-3.5 py-2 text-xs">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <div>
                                <span className="font-bold text-indigo-950">{topMatch.consultantName}</span>
                                <span className="ml-1.5 font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                  {topMatch.matchPercent}% Match
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Consultant Selector */}
                          <select
                            value={selectedId}
                            onChange={(e) =>
                              setSelectedConsultants({
                                ...selectedConsultants,
                                [item.studentId]: e.target.value,
                              })
                            }
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-hidden"
                          >
                            {item.allConsultantOptions.map((opt) => (
                              <option key={opt.consultantId} value={opt.consultantId}>
                                {opt.consultantName} ({opt.matchPercent}%)
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={isAssigning}
                            onClick={() => handleAssign(item.studentId)}
                            className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all"
                          >
                            {isAssigning ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================
            TAB 2: QUESTION BANK MANAGEMENT
           ======================================================== */}
        {activeTab === 'questions' && questionBank && (
          <div className="space-y-6 animate-in fade-in">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(questionBank.summary).map(([sec, stats]) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setQuestionSectionFilter(sec)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    questionSectionFilter === sec
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {sec}
                  </div>
                  <div className="text-xl font-extrabold text-zinc-950 mt-1">{stats.total}</div>
                  <div className="flex gap-2 text-[10px] text-zinc-500 mt-1">
                    <span className="text-emerald-700 font-bold">{stats.live} live</span>
                    <span>·</span>
                    <span className="text-zinc-500">{stats.draft} draft</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Questions Table */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 capitalize">
                    {questionSectionFilter === 'all' ? 'All Questions' : `${questionSectionFilter} Items`} ({filteredQuestions.length})
                  </h3>
                  <p className="text-xs text-zinc-500">Live questions appear in student tests. Draft items are withheld.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setQuestionSectionFilter('all')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Show All Sections
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 font-bold">Section</th>
                      <th className="py-2.5 px-3 font-bold">Question Stem</th>
                      <th className="py-2.5 px-3 font-bold">Type</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                      <th className="py-2.5 px-3 text-right font-bold">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredQuestions.slice(0, 50).map((q) => {
                      const isLive = q.status === 'live';
                      const isToggling = togglingQId === q.id;

                      return (
                        <tr key={q.id} className="hover:bg-zinc-50/60">
                          <td className="py-2.5 px-3 capitalize font-bold text-zinc-700">
                            {q.section}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-900 max-w-md truncate">
                            {q.stemText}
                          </td>
                          <td className="py-2.5 px-3 uppercase text-[10px] font-mono text-zinc-500">
                            {q.type}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
                              }`}
                            >
                              {q.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleQuestion(q.id, q.status)}
                              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                                isLive
                                  ? 'border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {isLive ? 'Set to Draft' : 'Publish Live'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: COLLEGES DIRECTORY
           ======================================================== */}
        {activeTab === 'colleges' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Colleges Directory ({collegesList.length})</h2>
                <p className="text-xs text-zinc-500">Database of institutions for Safe, Target, and Reach report matching.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCollege(true)}
                className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                + Add College
              </button>
            </div>

            {/* Add College Modal */}
            {showAddCollege && (
              <form onSubmit={handleAddCollege} className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-950">Add Institution</h3>
                  <button type="button" onClick={() => setShowAddCollege(false)} className="text-zinc-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                    placeholder="College Name"
                    className="rounded-xl border border-zinc-200 bg-white p-2.5 text-xs"
                    required
                  />
                  <input
                    type="text"
                    value={newCollegeCity}
                    onChange={(e) => setNewCollegeCity(e.target.value)}
                    placeholder="City (e.g. Mumbai, Bangalore)"
                    className="rounded-xl border border-zinc-200 bg-white p-2.5 text-xs"
                    required
                  />
                  <input
                    type="number"
                    value={newCollegeCutoff}
                    onChange={(e) => setNewCollegeCutoff(e.target.value)}
                    placeholder="Cutoff Percentage (e.g. 85)"
                    className="rounded-xl border border-zinc-200 bg-white p-2.5 text-xs"
                    required
                  />
                  <input
                    type="number"
                    value={newCollegeFees}
                    onChange={(e) => setNewCollegeFees(e.target.value)}
                    placeholder="Annual Fees in INR"
                    className="rounded-xl border border-zinc-200 bg-white p-2.5 text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCollege(false)}
                    className="px-4 py-2 text-xs text-zinc-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    Save College
                  </button>
                </div>
              </form>
            )}

            {/* Colleges Table */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-bold">College</th>
                    <th className="py-2.5 px-3 font-bold">City</th>
                    <th className="py-2.5 px-3 font-bold">Type</th>
                    <th className="py-2.5 px-3 font-bold">Cutoff</th>
                    <th className="py-2.5 px-3 font-bold">Annual Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {collegesList.map((col) => (
                    <tr key={col.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-3 font-bold text-zinc-950">{col.name}</td>
                      <td className="py-3 px-3 text-zinc-700">{col.city}</td>
                      <td className="py-3 px-3 text-zinc-500">{col.type}</td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">{col.cutoffPercent}%</td>
                      <td className="py-3 px-3 font-mono">₹{col.annualFees.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CONSULTANTS DIRECTORY
           ======================================================== */}
        {activeTab === 'consultants' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Consultants Directory ({consultantsList.length})</h2>
              <p className="text-xs text-zinc-500">Manage mentor credentials, specialisations, and availability status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultantsList.map((c) => (
                <div
                  key={c.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">{c.name || 'Consultant'}</h3>
                      <p className="text-xs text-zinc-500">{c.title}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleConsultant(c.id, c.isActive)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-zinc-700">
                    <div>Rating: <span className="font-mono text-amber-600 font-bold">{c.rating} ★</span></div>
                    <div>Students: <span className="font-mono font-bold">{c.studentCount}</span></div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-zinc-500">Specialisations:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.specialisations.map((spec, i) => (
                        <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-zinc-500">Languages:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.languages.map((l, i) => (
                        <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: AUDIT TRAIL
           ======================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Security Audit Trail</h2>
              <p className="text-xs text-zinc-500">
                Immutable compliance log of all consultant and admin accesses to student diagnostics and platform records.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs overflow-x-auto">
              {auditLogsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">No audit logs recorded yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 font-bold">Timestamp (IST)</th>
                      <th className="py-2.5 px-3 font-bold">Actor</th>
                      <th className="py-2.5 px-3 font-bold">Role</th>
                      <th className="py-2.5 px-3 font-bold">Action</th>
                      <th className="py-2.5 px-3 font-bold">Target</th>
                      <th className="py-2.5 px-3 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {auditLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/60 font-mono">
                        <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap text-[11px]">
                          {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-zinc-950">
                          {log.actorName || log.actorId.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 text-[10px] uppercase font-sans text-indigo-700">
                          {log.actorRole || 'consultant'}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-800 font-sans font-semibold">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500">
                          {log.targetUserId ? log.targetUserId.slice(0, 8) : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 text-[10px] max-w-xs truncate">
                          {log.detailsJson || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
