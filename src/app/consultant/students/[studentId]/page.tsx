'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface MilestoneItem {
  id?: string;
  title: string;
  type: string;
  deadline: string;
  status?: string;
  description?: string;
}
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Table as TableIcon,
  PieChart,
} from 'lucide-react';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { OfflineBanner } from '@/components/common/OfflineBanner';

interface Student360Data {
  student: {
    id: string;
    name: string;
    phone: string;
    dob: string | null;
    level: string | null;
    plan: string;
  };
  profile: {
    id: string;
    board: string | null;
    stream: string | null;
    marksPercent: number | null;
    pgDegree: string | null;
    pgSpecialisation: string | null;
    pgGradYear: number | null;
    pgCgpaOrPercent: string | null;
    interests: string[];
    preferredCities: string[];
    relocate: boolean;
    budgetBand: string | null;
    budgetAmount: number | null;
    loanOpenness: boolean;
    knowledgeLevel: number | null;
  } | null;
  result: {
    id: string;
    riasecCode: string;
    radarScores: Record<string, number>;
    aptitudeScores: { logical: number; verbal: number; spatial: number; overall: number };
    personalitySpectrums: Record<string, number>;
    topValues: string[];
    completedAt: string;
  } | null;
  careerMatches: {
    id: string;
    cluster: string;
    title: string;
    fitPercent: number;
    reasons: string[];
    consultantStatus: 'pending' | 'accepted' | 'edited' | 'overridden';
    consultantNotes: string | null;
  }[];
  notes: {
    id: string;
    visibility: 'private' | 'shared';
    body: string;
    createdAt: string;
  }[];
  roadmap: {
    primary: {
      roadmapId: string | null;
      isPublished: boolean;
      publishedAt: string | null;
      milestones: {
        id: string;
        type: 'exam' | 'apply' | 'prep' | 'documents' | 'decide';
        title: string;
        description?: string;
        deadline: string;
        status: 'pending' | 'in_progress' | 'completed';
      }[];
    };
    backup: {
      roadmapId: string | null;
      isPublished: boolean;
      publishedAt: string | null;
      milestones: {
        id: string;
        type: 'exam' | 'apply' | 'prep' | 'documents' | 'decide';
        title: string;
        description?: string;
        deadline: string;
        status: 'pending' | 'in_progress' | 'completed';
      }[];
    };
  };
  session: {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    status: string;
    joinLink: string | null;
  } | null;
}

export default function Student360Page() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId as string;

  const [data, setData] = useState<Student360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accessible Chart Table View Toggle
  const [viewChartsAsTable, setViewChartsAsTable] = useState(false);

  // Career Matches state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [savingMatch, setSavingMatch] = useState(false);

  // Notes state
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'private' | 'shared'>('private');
  const [savingNote, setSavingNote] = useState(false);

  // Roadmap Builder state
  const [roadmapPlanType, setRoadmapPlanType] = useState<'primary' | 'backup'>('primary');
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'exam' | 'apply' | 'prep' | 'documents' | 'decide'>('exam');
  const [newDeadline, setNewDeadline] = useState('');
  const [publishingRoadmap, setPublishingRoadmap] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Chat Drawer state
  const [chatOpen, setChatOpen] = useState(false);

  const fetch360 = useCallback(() => {
    fetch(`/api/consultant/students/${studentId}`)
      .then((res) => {
        if (res.status === 401) {
          router.replace('/auth');
          return null;
        }
        if (res.status === 403) {
          setError('Access Denied: You are not assigned to this student.');
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((resData) => {
        if (resData && resData.success) {
          setData(resData);
          setMilestones((prev) => (prev.length > 0 ? prev : (resData.roadmap?.primary?.milestones || [])));
        } else if (resData?.error) {
          setError(resData.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error fetching Student 360 data.');
        setLoading(false);
      });
  }, [studentId, router]);

  useEffect(() => {
    if (studentId) fetch360();
  }, [fetch360, studentId]);

  const handleSwitchRoadmapTab = (type: 'primary' | 'backup') => {
    setRoadmapPlanType(type);
    if (data) {
      const activeRoadmap = type === 'primary' ? data.roadmap.primary : data.roadmap.backup;
      setMilestones(activeRoadmap.milestones || []);
    }
  };

  // Handle Career Decision (Accept / Edit / Override)
  const handleUpdateMatch = async (
    matchId: string,
    consultantStatus: 'accepted' | 'edited' | 'overridden',
    consultantNotes?: string
  ) => {
    setSavingMatch(true);
    try {
      const res = await fetch(`/api/consultant/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          consultantStatus,
          consultantNotes: consultantNotes || undefined,
        }),
      });
      if (res.ok) {
        setEditingMatchId(null);
        setEditNotes('');
        fetch360();
      }
    } finally {
      setSavingMatch(false);
    }
  };

  // Handle Adding Note
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim() || savingNote) return;
    setSavingNote(true);

    try {
      const res = await fetch(`/api/consultant/students/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility: noteVisibility,
          body: noteBody.trim(),
        }),
      });
      if (res.ok) {
        setNoteBody('');
        fetch360();
      }
    } finally {
      setSavingNote(false);
    }
  };

  // Handle Roadmap Milestone Actions
  const handleAddMilestone = () => {
    if (!newTitle.trim() || !newDeadline.trim()) return;
    const newM = {
      id: `local-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      deadline: newDeadline,
      status: 'pending',
    };
    setMilestones([...milestones, newM]);
    setNewTitle('');
    setNewDeadline('');
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handlePublishRoadmap = async () => {
    setPublishingRoadmap(true);
    setPublishSuccess(false);

    try {
      const res = await fetch(`/api/consultant/students/${studentId}/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: roadmapPlanType,
          publish: true,
          milestones: milestones.map((m) => ({
            type: m.type,
            title: m.title,
            description: m.description,
            deadline: m.deadline,
            status: m.status,
          })),
        }),
      });

      if (res.ok) {
        setPublishSuccess(true);
        fetch360();
        setTimeout(() => setPublishSuccess(false), 3000);
      }
    } finally {
      setPublishingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-zinc-600">Loading Student 360 Diagnostic...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-zinc-950">Student Access Restricted</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">{error}</p>
          <Link
            href="/consultant/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const student = data.student;
  const profile = data.profile;
  const result = data.result;
  const activeRoadmap =
    roadmapPlanType === 'primary' ? data.roadmap.primary : data.roadmap.backup;

  return (
    <div className="min-h-screen bg-zinc-50/70 pb-20">
      <OfflineBanner />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/consultant/dashboard"
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-bold text-zinc-900">{student.name}</span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              {student.level || 'UG'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
            >
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
              <span>Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Three-Pane Grid (Variant 2h) */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT PANE (4 Cols): Student Summary & Psychometric Charts
             ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Student Profile Card */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-zinc-950">{student.name}</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">{student.phone}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  Career Plan
                </span>
              </div>

              {/* Upcoming Session Badge */}
              {data.session && (
                <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200/60 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Session: {new Date(data.session.scheduledAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</span>
                  </div>
                </div>
              )}

              {/* Academic & Intake Summary */}
              {profile && (
                <div className="space-y-2 text-xs divide-y divide-zinc-100 pt-1">
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Board & Stream</span>
                    <span className="font-semibold text-zinc-900">{profile.board || 'CBSE'} · {profile.stream || 'PCM'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Marks / CGPA</span>
                    <span className="font-semibold text-zinc-900">{profile.marksPercent ? `${profile.marksPercent}%` : profile.pgCgpaOrPercent || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Annual Budget</span>
                    <span className="font-semibold text-zinc-900">{profile.budgetBand || '₹5L - ₹10L'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Open to Relocating</span>
                    <span className="font-semibold text-zinc-900">{profile.relocate ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Loan Openness</span>
                    <span className="font-semibold text-zinc-900">{profile.loanOpenness ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic Psychometrics */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Psychometric Diagnostic
                  </div>
                  <h3 className="text-sm font-bold text-zinc-950">RIASEC & Aptitude Scores</h3>
                </div>

                {/* Accessible View as Table Toggle */}
                <button
                  type="button"
                  onClick={() => setViewChartsAsTable(!viewChartsAsTable)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                  aria-label="Toggle chart accessible table representation"
                >
                  {viewChartsAsTable ? <PieChart className="h-3 w-3" /> : <TableIcon className="h-3 w-3" />}
                  <span>{viewChartsAsTable ? 'View Chart' : 'View Table'}</span>
                </button>
              </div>

              {result ? (
                viewChartsAsTable ? (
                  /* Accessible Table Representation */
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">RIASEC Interest Profile ({result.riasecCode})</h4>
                      <table className="w-full text-left border border-zinc-200 rounded-xl overflow-hidden">
                        <tbody>
                          {Object.entries(result.radarScores).map(([letter, score]) => (
                            <tr key={letter} className="border-b border-zinc-100 last:border-0">
                              <td className="p-2 font-bold text-indigo-600">{letter}</td>
                              <td className="p-2 text-right font-mono">{score}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 className="font-bold text-zinc-900 mb-1">Aptitude Sub-Scores</h4>
                      <table className="w-full text-left border border-zinc-200 rounded-xl overflow-hidden">
                        <tbody>
                          <tr className="border-b border-zinc-100"><td className="p-2">Logical</td><td className="p-2 text-right font-mono">{result.aptitudeScores.logical}%</td></tr>
                          <tr className="border-b border-zinc-100"><td className="p-2">Verbal</td><td className="p-2 text-right font-mono">{result.aptitudeScores.verbal}%</td></tr>
                          <tr><td className="p-2">Spatial</td><td className="p-2 text-right font-mono">{result.aptitudeScores.spatial}%</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Visual Charts */
                  <div className="space-y-5">
                    {/* RIASEC Highlight */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Interest Code</span>
                        <div className="text-xl font-extrabold font-mono text-indigo-950">{result.riasecCode}</div>
                      </div>
                      <div className="text-right text-[11px] text-zinc-500 font-medium">
                        Top psychometric traits
                      </div>
                    </div>

                    {/* Aptitude Bars */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-zinc-900">Aptitude Breakdown</div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                            <span>Logical Reasoning</span>
                            <span className="font-mono font-bold">{result.aptitudeScores.logical}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${result.aptitudeScores.logical}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                            <span>Verbal Ability</span>
                            <span className="font-mono font-bold">{result.aptitudeScores.verbal}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${result.aptitudeScores.verbal}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-zinc-600 mb-1">
                            <span>Spatial Awareness</span>
                            <span className="font-mono font-bold">{result.aptitudeScores.spatial}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${result.aptitudeScores.spatial}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personality Neutral Spectrums */}
                    <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                      <div className="text-xs font-bold text-zinc-900">Personality Spectrums (Neutral)</div>
                      <div className="space-y-3">
                        {Object.entries(result.personalitySpectrums).map(([spectrum, score]) => (
                          <div key={spectrum} className="space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                              <span>Low</span>
                              <span className="text-zinc-800">{spectrum} ({score})</span>
                              <span>High</span>
                            </div>
                            <div className="relative h-2 rounded-full bg-zinc-200">
                              <div
                                className="absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full bg-indigo-600 border border-white shadow-xs"
                                style={{ left: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Assessment results not yet available.
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              MIDDLE PANE (4 Cols): Engine Recommendations & Decisions
             ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Human-in-the-Loop
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Engine Recommendations</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Review matches computed by the engine. Accept, edit fit rationale, or override with customized advice.
                </p>
              </div>

              {data.careerMatches.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  No career matches generated yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.careerMatches.map((match) => {
                    const isAccepted = match.consultantStatus === 'accepted';
                    const isEdited = match.consultantStatus === 'edited';
                    const isOverridden = match.consultantStatus === 'overridden';

                    return (
                      <div
                        key={match.id}
                        className={`rounded-2xl border p-4 space-y-3 transition-all ${
                          isAccepted
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : isOverridden
                            ? 'border-amber-300 bg-amber-50/20'
                            : isEdited
                            ? 'border-indigo-300 bg-indigo-50/20'
                            : 'border-zinc-200 bg-zinc-50/40'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                              {match.cluster}
                            </span>
                            <h4 className="text-sm font-extrabold text-zinc-950">{match.title}</h4>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700">
                              {match.fitPercent}% fit
                            </span>
                          </div>
                        </div>

                        {/* Engine Reasons */}
                        <div className="space-y-1">
                          {match.reasons.map((r, i) => (
                            <div key={i} className="text-xs text-zinc-600 flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-indigo-600 shrink-0" />
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>

                        {/* Consultant Notes if present */}
                        {match.consultantNotes && (
                          <div className="rounded-xl bg-white border border-zinc-200 p-2 text-xs text-zinc-800 space-y-0.5">
                            <span className="text-[10px] font-bold text-indigo-700">Mentor Remarks:</span>
                            <p>{match.consultantNotes}</p>
                          </div>
                        )}

                        {/* Status Pill & Decision Action Buttons */}
                        <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isAccepted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverridden
                                ? 'bg-amber-100 text-amber-800'
                                : isEdited
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {match.consultantStatus.toUpperCase()}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={savingMatch}
                              onClick={() => handleUpdateMatch(match.id, 'accepted')}
                              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                                isAccepted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingMatchId(match.id);
                                setEditNotes(match.consultantNotes || '');
                              }}
                              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                                isEdited
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={savingMatch}
                              onClick={() => handleUpdateMatch(match.id, 'overridden', 'Consultant advised alternate focus area')}
                              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                                isOverridden
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              Override
                            </button>
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {editingMatchId === match.id && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-200 space-y-2 animate-in fade-in">
                            <label className="text-[11px] font-bold text-zinc-700 block">
                              Add Personalized Guidance / Edit Notes:
                            </label>
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="e.g. Focus on product design portfolio rather than standard design school exams..."
                              className="w-full rounded-xl border border-zinc-200 p-2 text-xs focus:outline-hidden focus:border-indigo-600"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMatchId(null)}
                                className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingMatch}
                                onClick={() => handleUpdateMatch(match.id, 'edited', editNotes)}
                                className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white hover:bg-indigo-700"
                              >
                                Save Decision
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              RIGHT PANE (4 Cols): Notes & Action Roadmap Builder
             ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Consultant Notes Section */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Advisory Notes
                </div>
                <h3 className="text-base font-bold text-zinc-950">Student Session Notes</h3>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleSaveNote} className="space-y-3">
                <textarea
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Record insights, student strengths, parent concerns..."
                  className="w-full rounded-2xl border border-zinc-200 p-3 text-xs text-zinc-900 focus:outline-hidden focus:border-indigo-600"
                />

                <div className="flex items-center justify-between">
                  {/* Private vs Shared Toggle */}
                  <div className="flex items-center rounded-full bg-zinc-100 p-1 border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setNoteVisibility('private')}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                        noteVisibility === 'private'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500'
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      <span>Private</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNoteVisibility('shared')}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                        noteVisibility === 'shared'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-zinc-500'
                      }`}
                    >
                      <Globe className="h-3 w-3" />
                      <span>Shared</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!noteBody.trim() || savingNote}
                    className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="divide-y divide-zinc-100 max-h-56 overflow-y-auto pt-2">
                {data.notes.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-400">No notes recorded yet.</p>
                ) : (
                  data.notes.map((n) => (
                    <div key={n.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold ${
                            n.visibility === 'shared'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {n.visibility === 'shared' ? 'Shared with Student' : 'Private to Mentor'}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 leading-relaxed">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Action Roadmap Builder Section */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Execution Strategy
                  </div>
                  <h3 className="text-base font-bold text-zinc-950">Roadmap Builder</h3>
                </div>

                {/* Primary vs Backup Toggle */}
                <div className="flex items-center rounded-full bg-zinc-100 p-1 border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => handleSwitchRoadmapTab('primary')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      roadmapPlanType === 'primary' ? 'bg-white text-indigo-700 shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRoadmapTab('backup')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      roadmapPlanType === 'backup' ? 'bg-white text-indigo-700 shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    Backup
                  </button>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 text-xs">
                <span className="text-zinc-500">Publication Status:</span>
                <span
                  className={`font-bold ${
                    activeRoadmap.isPublished ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {activeRoadmap.isPublished ? 'Published to Student ✓' : 'Draft (Unpublished)'}
                </span>
              </div>

              {/* Milestones List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {milestones.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-400">
                    No milestones added yet. Add exams, application deadlines, or prep steps below.
                  </p>
                ) : (
                  milestones.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            {m.type}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {m.deadline}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-zinc-900">{m.title}</h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-zinc-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Milestone Form */}
              <div className="p-3 rounded-2xl border border-zinc-200 bg-zinc-50/40 space-y-2">
                <div className="text-[11px] font-bold text-zinc-700">Add Milestone:</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newType}
                    onChange={(e) =>
                      setNewType(
                        e.target.value as 'exam' | 'apply' | 'prep' | 'documents' | 'decide'
                      )
                    }
                    className="rounded-xl border border-zinc-200 bg-white p-2 text-xs font-semibold text-zinc-700"
                  >
                    <option value="exam">Exam</option>
                    <option value="apply">Apply</option>
                    <option value="prep">Prep</option>
                    <option value="documents">Documents</option>
                    <option value="decide">Decide</option>
                  </select>

                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="rounded-xl border border-zinc-200 bg-white p-2 text-xs text-zinc-700"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Milestone title (e.g. CUET Registration)"
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Publish CTA Button */}
              {publishSuccess && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Roadmap published and sent to student dashboard!</span>
                </div>
              )}

              <button
                type="button"
                disabled={milestones.length === 0 || publishingRoadmap}
                onClick={handlePublishRoadmap}
                className="w-full rounded-full bg-indigo-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{publishingRoadmap ? 'Publishing...' : 'Publish Roadmap to Student'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Drawer */}
      <ChatDrawer
        currentUserId={student.id} // Consultant user is acting
        studentId={student.id}
        consultantId={data.session?.id || ''}
        recipientName={student.name}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
