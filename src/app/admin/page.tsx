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
  Pencil,
  Trash2,
  GraduationCap,
  Search,
  Plus,
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
  type: string | null;
  annualFees: number | null;
  cutoffPercent: number | null;
  examsJson: string | null;
  coursesJson: string | null;
  level: string | null;
  createdAt: string;
}

interface CourseItem {
  id: string;
  name: string;
  category: string;
  level: string | null;
  createdAt: string;
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
    'overview' | 'questions' | 'colleges' | 'courses' | 'consultants' | 'audit'
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
  const [coursesList, setCoursesList] = useState<CourseItem[]>([]);
  const [consultantsList, setConsultantsList] = useState<ConsultantItem[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditItem[]>([]);

  // College editing states
  const [editingCollege, setEditingCollege] = useState<CollegeItem | null>(null);
  const [isAddingCollege, setIsAddingCollege] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeStateFilter, setCollegeStateFilter] = useState('all');
  const [collegeStatusFilter, setCollegeStatusFilter] = useState<'all' | 'needs_fees' | 'needs_cutoff' | 'complete'>('all');
  const [collegeForm, setCollegeForm] = useState({
    name: '',
    city: '',
    state: '',
    type: '',
    annualFees: '',
    cutoffPercent: '',
    level: 'both' as 'UG' | 'PG' | 'both',
    exams: '',
    courses: [] as string[],
  });
  const [savingCollege, setSavingCollege] = useState(false);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState('');
  const [customCourseToAdd, setCustomCourseToAdd] = useState('');

  // Course editing states
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('all');
  const [courseForm, setCourseForm] = useState({
    name: '',
    category: 'MEDICAL',
    level: 'UG' as 'UG' | 'PG' | 'both',
  });
  const [savingCourse, setSavingCourse] = useState(false);

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

        // 5. Courses
        const crsRes = await fetch('/api/admin/courses');
        const crsJson = await crsRes.json();
        if (crsJson.success && !isCancelled) setCoursesList(crsJson.courses || []);

        // 6. Consultants
        const consRes = await fetch('/api/admin/consultants');
        const consJson = await consRes.json();
        if (consJson.success && !isCancelled) setConsultantsList(consJson.consultants || []);

        // 7. Audit Logs
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

  // Open Edit College Modal
  const openEditCollege = (col: CollegeItem) => {
    let examsList: string[] = [];
    let coursesListParsed: string[] = [];
    if (col.examsJson) {
      try {
        examsList = JSON.parse(col.examsJson);
      } catch {
        examsList = [];
      }
    }
    if (col.coursesJson) {
      try {
        coursesListParsed = JSON.parse(col.coursesJson);
      } catch {
        coursesListParsed = [];
      }
    }

    setEditingCollege(col);
    setIsAddingCollege(false);
    setSelectedCourseToAdd('');
    setCustomCourseToAdd('');
    setCollegeForm({
      name: col.name,
      city: col.city,
      state: col.state || '',
      type: col.type || '',
      annualFees: col.annualFees != null ? String(col.annualFees) : '',
      cutoffPercent: col.cutoffPercent != null ? String(col.cutoffPercent) : '',
      level: (col.level as 'UG' | 'PG' | 'both') || 'both',
      exams: examsList.join(', '),
      courses: coursesListParsed,
    });
  };

  const openAddCollege = () => {
    setEditingCollege(null);
    setIsAddingCollege(true);
    setSelectedCourseToAdd('');
    setCustomCourseToAdd('');
    setCollegeForm({
      name: '',
      city: '',
      state: '',
      type: 'Private',
      annualFees: '',
      cutoffPercent: '',
      level: 'both',
      exams: '',
      courses: [],
    });
  };

  const handleSaveCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeForm.name.trim() || !collegeForm.city.trim()) return;

    setSavingCollege(true);
    try {
      const examsArray = collegeForm.exams
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        id: editingCollege ? editingCollege.id : undefined,
        name: collegeForm.name.trim(),
        city: collegeForm.city.trim(),
        state: collegeForm.state.trim() || 'India',
        type: collegeForm.type.trim() || null,
        annualFees: collegeForm.annualFees.trim() !== '' ? Number(collegeForm.annualFees) : null,
        cutoffPercent: collegeForm.cutoffPercent.trim() !== '' ? Number(collegeForm.cutoffPercent) : null,
        exams: examsArray,
        courses: collegeForm.courses,
        level: collegeForm.level,
      };

      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingCollege(null);
        setIsAddingCollege(false);
        const colRes = await fetch('/api/admin/colleges');
        const colJson = await colRes.json();
        if (colJson.success) setCollegesList(colJson.colleges || []);
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to save college');
      }
    } finally {
      setSavingCollege(false);
    }
  };

  const handleDeleteCollege = async (collegeId: string, collegeName: string) => {
    if (!confirm(`Are you sure you want to remove "${collegeName}" from the database?`)) return;

    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId }),
      });
      if (res.ok) {
        setCollegesList((prev) => prev.filter((c) => c.id !== collegeId));
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to delete college');
      }
    } catch {
      alert('Network error deleting college');
    }
  };

  const handleAddCourseToCollege = (courseName: string) => {
    const trimmed = courseName.trim();
    if (!trimmed) return;
    if (!collegeForm.courses.includes(trimmed)) {
      setCollegeForm((prev) => ({
        ...prev,
        courses: [...prev.courses, trimmed],
      }));
    }
    setSelectedCourseToAdd('');
    setCustomCourseToAdd('');
  };

  const handleRemoveCourseFromCollege = (courseName: string) => {
    setCollegeForm((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c !== courseName),
    }));
  };

  // Course handlers
  const openEditCourse = (crs: CourseItem) => {
    setEditingCourse(crs);
    setIsAddingCourse(false);
    setCourseForm({
      name: crs.name,
      category: crs.category,
      level: (crs.level as 'UG' | 'PG' | 'both') || 'UG',
    });
  };

  const openAddCourse = () => {
    setEditingCourse(null);
    setIsAddingCourse(true);
    setCourseForm({
      name: '',
      category: 'MEDICAL',
      level: 'UG',
    });
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name.trim() || !courseForm.category.trim()) return;

    setSavingCourse(true);
    try {
      const payload = {
        id: editingCourse ? editingCourse.id : undefined,
        name: courseForm.name.trim(),
        category: courseForm.category.trim().toUpperCase(),
        level: courseForm.level,
      };

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingCourse(null);
        setIsAddingCourse(false);
        const crsRes = await fetch('/api/admin/courses');
        const crsJson = await crsRes.json();
        if (crsJson.success) setCoursesList(crsJson.courses || []);
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to save course');
      }
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to remove course "${courseName}"?`)) return;

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        setCoursesList((prev) => prev.filter((c) => c.id !== courseId));
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Failed to delete course');
      }
    } catch {
      alert('Network error deleting course');
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

  // Filtered Colleges
  const availableCollegeStates = Array.from(new Set(collegesList.map((c) => c.state).filter(Boolean))).sort();
  const filteredColleges = collegesList.filter((col) => {
    if (collegeSearch) {
      const q = collegeSearch.toLowerCase();
      const matchName = col.name.toLowerCase().includes(q);
      const matchCity = col.city.toLowerCase().includes(q);
      const matchState = (col.state || '').toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchState) return false;
    }
    if (collegeStateFilter !== 'all' && col.state !== collegeStateFilter) {
      return false;
    }
    if (collegeStatusFilter === 'needs_fees' && col.annualFees != null) {
      return false;
    }
    if (collegeStatusFilter === 'needs_cutoff' && col.cutoffPercent != null) {
      return false;
    }
    if (collegeStatusFilter === 'complete' && (col.annualFees == null || col.cutoffPercent == null)) {
      return false;
    }
    return true;
  });

  // Filtered Courses
  const availableCourseCategories = Array.from(new Set(coursesList.map((c) => c.category).filter(Boolean))).sort();
  const filteredCourses = coursesList.filter((crs) => {
    if (courseSearch) {
      const q = courseSearch.toLowerCase();
      if (!crs.name.toLowerCase().includes(q) && !crs.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (courseCategoryFilter !== 'all' && crs.category !== courseCategoryFilter) {
      return false;
    }
    return true;
  });

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

        {/* Navigation Tabs */}
        <div className="border-t border-zinc-100 bg-white">
          <div className="mx-auto flex max-w-7xl gap-2 px-4 sm:px-6 overflow-x-auto py-2">
            {[
              { id: 'overview' as const, label: 'Funnel & Queue', icon: TrendingUp },
              { id: 'questions' as const, label: 'Question Bank', icon: HelpCircle },
              { id: 'colleges' as const, label: `Colleges (${collegesList.length})`, icon: Building },
              { id: 'courses' as const, label: `Courses (${coursesList.length})`, icon: GraduationCap },
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
            {/* Funnel Metrics */}
            {funnel && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
                  <div className="text-zinc-500 text-xs font-semibold">Total Signups</div>
                  <div className="mt-2 text-2xl font-bold text-zinc-950 font-mono">
                    {funnel.signups.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
                  <div className="text-zinc-500 text-xs font-semibold">Tests Completed</div>
                  <div className="mt-2 text-2xl font-bold text-indigo-600 font-mono">
                    {funnel.testsCompleted.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {funnel.conversionRates.signupToTestPct}% from signup
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
                  <div className="text-zinc-500 text-xs font-semibold">Paid Upgrades</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
                    {funnel.paid.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {funnel.conversionRates.testToPaidPct}% conversion
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
                  <div className="text-zinc-500 text-xs font-semibold">1:1 Sessions Held</div>
                  <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
                    {funnel.sessionsCount.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {funnel.conversionRates.paidToSessionPct}% utilization
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-zinc-950">
                    Student Mentor Assignment Queue ({queue.length})
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Paid students awaiting dedicated consultant assignment. Powered by 4-vector matching.
                  </p>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-700">No students waiting in assignment queue.</p>
                  <p className="text-[11px] text-zinc-400 mt-1">All paid students currently have mentors assigned.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {queue.map((item) => (
                    <div
                      key={item.studentId}
                      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-zinc-950">{item.name}</h3>
                            <p className="text-xs text-zinc-500 font-mono">{item.phone}</p>
                          </div>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                            {item.level}
                          </span>
                        </div>

                        {item.interests.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Interests</span>
                            <div className="flex flex-wrap gap-1">
                              {item.interests.slice(0, 3).map((int, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700 font-medium"
                                >
                                  {int}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.topSuggestion && (
                          <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-indigo-900 font-semibold">
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-indigo-600" />
                                Smart Suggestion
                              </span>
                              <span className="font-mono text-indigo-700 font-bold">
                                {item.topSuggestion.matchPercent}% Match
                              </span>
                            </div>
                            <p className="text-zinc-700 text-xs font-bold">{item.topSuggestion.consultantName}</p>
                            <p className="text-[11px] text-zinc-500">
                              Active students: {item.topSuggestion.activeStudents} · Rating: {item.topSuggestion.rating} ★
                            </p>
                          </div>
                        )}

                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] text-zinc-400 font-semibold uppercase">
                            Assign Consultant
                          </label>
                          <select
                            value={selectedConsultants[item.studentId] || ''}
                            onChange={(e) =>
                              setSelectedConsultants((prev) => ({
                                ...prev,
                                [item.studentId]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                          >
                            {item.allConsultantOptions.map((opt) => (
                              <option key={opt.consultantId} value={opt.consultantId}>
                                {opt.consultantName} ({opt.matchPercent}% match)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAssign(item.studentId)}
                        disabled={assigningStudentId === item.studentId}
                        className="w-full rounded-full bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all"
                      >
                        {assigningStudentId === item.studentId ? 'Assigning...' : 'Confirm Assignment'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: QUESTION BANK
           ======================================================== */}
        {activeTab === 'questions' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Psychometric Question Bank</h2>
                <p className="text-xs text-zinc-500">
                  Manage questions across Interests, Aptitude, Personality, and Values.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-semibold">Section:</span>
                <select
                  value={questionSectionFilter}
                  onChange={(e) => setQuestionSectionFilter(e.target.value)}
                  className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-800"
                >
                  <option value="all">All Sections ({questionBank?.questions?.length || 0})</option>
                  <option value="interests">Interests (RIASEC)</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="personality">Personality (Big 5)</option>
                  <option value="values">Work Values</option>
                  <option value="domain">PG Domain Knowledge</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-bold">Section</th>
                    <th className="py-2.5 px-3 font-bold">Question Stem</th>
                    <th className="py-2.5 px-3 font-bold">Type</th>
                    <th className="py-2.5 px-3 font-bold">Level</th>
                    <th className="py-2.5 px-3 font-bold">Status</th>
                    <th className="py-2.5 px-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-3 uppercase font-bold text-[10px] text-indigo-700">
                        {q.section}
                      </td>
                      <td className="py-3 px-3 font-medium text-zinc-900 max-w-md">{q.stemText}</td>
                      <td className="py-3 px-3 text-zinc-500">{q.type}</td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase">
                          {q.level}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            q.status === 'live'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleQuestion(q.id, q.status)}
                          disabled={togglingQId === q.id}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          {q.status === 'live' ? 'Move to Draft' : 'Publish Live'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: COLLEGES DIRECTORY & EDITING
           ======================================================== */}
        {activeTab === 'colleges' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  Colleges Directory ({collegesList.length})
                </h2>
                <p className="text-xs text-zinc-500">
                  Database of institutions. Annual fees and cutoffs can be updated anytime by admin.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddCollege}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Institution
              </button>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-700">
                Total: <strong className="text-zinc-950">{collegesList.length}</strong>
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1 font-semibold text-amber-800">
                Pending Annual Fees:{' '}
                <strong>{collegesList.filter((c) => c.annualFees == null).length}</strong>
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50/70 px-3 py-1 font-semibold text-sky-800">
                Pending Cutoff:{' '}
                <strong>{collegesList.filter((c) => c.cutoffPercent == null).length}</strong>
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 font-semibold text-emerald-800">
                Configured:{' '}
                <strong>
                  {collegesList.filter((c) => c.annualFees != null && c.cutoffPercent != null).length}
                </strong>
              </span>
            </div>

            {/* Search and Filters toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  placeholder="Search colleges by name, city, or state..."
                  className="w-full rounded-full border border-zinc-200 bg-white pl-10 pr-4 py-2 text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <select
                value={collegeStateFilter}
                onChange={(e) => setCollegeStateFilter(e.target.value)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800"
              >
                <option value="all">All States</option>
                {availableCollegeStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <select
                value={collegeStatusFilter}
                onChange={(e) =>
                  setCollegeStatusFilter(
                    e.target.value as 'all' | 'needs_fees' | 'needs_cutoff' | 'complete'
                  )
                }
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800"
              >
                <option value="all">All Records</option>
                <option value="needs_fees">Needs Annual Fee</option>
                <option value="needs_cutoff">Needs Cutoff %</option>
                <option value="complete">Fully Configured</option>
              </select>
            </div>

            {/* Colleges Table */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-bold">Institution</th>
                    <th className="py-2.5 px-3 font-bold">Location</th>
                    <th className="py-2.5 px-3 font-bold">Type</th>
                    <th className="py-2.5 px-3 font-bold">Cutoff %</th>
                    <th className="py-2.5 px-3 font-bold">Annual Fees</th>
                    <th className="py-2.5 px-3 font-bold">Level</th>
                    <th className="py-2.5 px-3 font-bold">Courses</th>
                    <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredColleges.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                        No colleges found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredColleges.map((col) => {
                      let coursesCount = 0;
                      if (col.coursesJson) {
                        try {
                          coursesCount = JSON.parse(col.coursesJson).length;
                        } catch {
                          coursesCount = 0;
                        }
                      }
                      return (
                        <tr key={col.id} className="hover:bg-zinc-50/60">
                          <td className="py-3 px-3">
                            <div className="font-bold text-zinc-950">{col.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{col.id}</div>
                          </td>
                          <td className="py-3 px-3 text-zinc-700">
                            {col.city}, {col.state || 'India'}
                          </td>
                          <td className="py-3 px-3">
                            {col.type ? (
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                                {col.type}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px]">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {col.cutoffPercent != null ? (
                              <span className="font-mono font-bold text-indigo-700">
                                {col.cutoffPercent}%
                              </span>
                            ) : (
                              <span className="text-amber-600/90 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {col.annualFees != null ? (
                              <span className="font-bold text-zinc-900">
                                ₹{col.annualFees.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-amber-600/90 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold font-sans">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase">
                              {col.level || 'both'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              {coursesCount} courses
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditCollege(col)}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCollege(col.id, col.name)}
                                className="p-1 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Remove college"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit / Add College Modal Dialog */}
            {(editingCollege || isAddingCollege) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
                <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">
                        {editingCollege ? `Edit: ${editingCollege.name}` : 'Add New Institution'}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {editingCollege
                          ? `ID: ${editingCollege.id} · Update fees, cutoff, exams & courses`
                          : 'Fill institution details for the database'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCollege(null);
                        setIsAddingCollege(false);
                      }}
                      className="text-zinc-400 hover:text-zinc-600 p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCollege} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">College Name *</label>
                      <input
                        type="text"
                        value={collegeForm.name}
                        onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                        placeholder="e.g. Acharya Group of Institutions"
                        className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* City & State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-800">City *</label>
                        <input
                          type="text"
                          value={collegeForm.city}
                          onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                          placeholder="e.g. Bangalore, Kochi, Ernakulam"
                          className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-800">State</label>
                        <input
                          type="text"
                          value={collegeForm.state}
                          onChange={(e) => setCollegeForm({ ...collegeForm, state: e.target.value })}
                          placeholder="e.g. Karnataka, Kerala, Tamil Nadu"
                          className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Type & Level */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-800">Institution Type</label>
                        <input
                          type="text"
                          value={collegeForm.type}
                          onChange={(e) => setCollegeForm({ ...collegeForm, type: e.target.value })}
                          placeholder="e.g. Private, Government, Deemed, Autonomous"
                          className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-800">Academic Level</label>
                        <select
                          value={collegeForm.level}
                          onChange={(e) =>
                            setCollegeForm({
                              ...collegeForm,
                              level: e.target.value as 'UG' | 'PG' | 'both',
                            })
                          }
                          className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        >
                          <option value="UG">UG (Undergraduate Only)</option>
                          <option value="PG">PG (Postgraduate Only)</option>
                          <option value="both">Both UG & PG</option>
                        </select>
                      </div>
                    </div>

                    {/* Annual Fees & Cutoff Percent */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-800">Annual Fees (₹ INR)</label>
                        <input
                          type="number"
                          value={collegeForm.annualFees}
                          onChange={(e) =>
                            setCollegeForm({ ...collegeForm, annualFees: e.target.value })
                          }
                          placeholder="Leave empty if not yet known"
                          className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-zinc-400">
                          Leave blank if fees should be updated later by admin.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-800">Admission Cutoff (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={collegeForm.cutoffPercent}
                          onChange={(e) =>
                            setCollegeForm({ ...collegeForm, cutoffPercent: e.target.value })
                          }
                          placeholder="Leave empty if not yet known"
                          className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-zinc-400">
                          Percentage required for eligibility (0-100).
                        </p>
                      </div>
                    </div>

                    {/* Exams */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">Accepted Entrance Exams</label>
                      <input
                        type="text"
                        value={collegeForm.exams}
                        onChange={(e) => setCollegeForm({ ...collegeForm, exams: e.target.value })}
                        placeholder="e.g. NEET, KEAM, JEE Main, CUET (comma separated)"
                        className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Courses Offered */}
                    <div className="space-y-2 border-t border-zinc-100 pt-3">
                      <label className="text-xs font-bold text-zinc-800">
                        Courses Offered ({collegeForm.courses.length})
                      </label>

                      {/* Selected Courses Chips */}
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                        {collegeForm.courses.length === 0 ? (
                          <span className="text-[11px] text-zinc-400 italic">
                            No courses mapped to this college yet. Pick from below or type custom.
                          </span>
                        ) : (
                          collegeForm.courses.map((crsName) => (
                            <span
                              key={crsName}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800"
                            >
                              <span>{crsName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCourseFromCollege(crsName)}
                                className="text-indigo-400 hover:text-indigo-700 ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Quick course selector from database */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <select
                          value={selectedCourseToAdd}
                          onChange={(e) => {
                            setSelectedCourseToAdd(e.target.value);
                            if (e.target.value) handleAddCourseToCollege(e.target.value);
                          }}
                          className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800"
                        >
                          <option value="">+ Select from {coursesList.length} database courses...</option>
                          {coursesList.map((c) => (
                            <option key={c.id} value={c.name}>
                              [{c.category}] {c.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customCourseToAdd}
                            onChange={(e) => setCustomCourseToAdd(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCourseToCollege(customCourseToAdd);
                              }
                            }}
                            placeholder="Or type custom course..."
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCourseToCollege(customCourseToAdd)}
                            className="rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCollege(null);
                          setIsAddingCollege(false);
                        }}
                        className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingCollege}
                        className="rounded-full bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingCollege ? 'Saving...' : editingCollege ? 'Save Changes' : 'Create College'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: COURSES DIRECTORY & EDITING
           ======================================================== */}
        {activeTab === 'courses' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  Courses Directory ({coursesList.length})
                </h2>
                <p className="text-xs text-zinc-500">
                  Programs available in the system extracted from academic catalog.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddCourse}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Course
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search courses by name or category..."
                  className="w-full rounded-full border border-zinc-200 bg-white pl-10 pr-4 py-2 text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <select
                value={courseCategoryFilter}
                onChange={(e) => setCourseCategoryFilter(e.target.value)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800"
              >
                <option value="all">All Categories ({coursesList.length})</option>
                {availableCourseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({coursesList.filter((c) => c.category === cat).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Courses Table */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-bold">Course Title</th>
                    <th className="py-2.5 px-3 font-bold">Category</th>
                    <th className="py-2.5 px-3 font-bold">Level</th>
                    <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-zinc-400 text-xs">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((crs) => (
                      <tr key={crs.id} className="hover:bg-zinc-50/60">
                        <td className="py-3 px-3">
                          <div className="font-bold text-zinc-950">{crs.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{crs.id}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                            {crs.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase">
                            {crs.level || 'UG'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditCourse(crs)}
                              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(crs.id, crs.name)}
                              className="p-1 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove course"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit / Add Course Modal Dialog */}
            {(editingCourse || isAddingCourse) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
                <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xl space-y-5">
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">
                        {editingCourse ? `Edit: ${editingCourse.name}` : 'Add New Course'}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {editingCourse ? `ID: ${editingCourse.id}` : 'Create a course record'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCourse(null);
                        setIsAddingCourse(false);
                      }}
                      className="text-zinc-400 hover:text-zinc-600 p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCourse} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">Course Name *</label>
                      <input
                        type="text"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        placeholder="e.g. B.Tech in Artificial Intelligence"
                        className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">Category *</label>
                      <input
                        type="text"
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        placeholder="e.g. MEDICAL, ENGINEERING, BCA, BBA, BCOM"
                        className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-800">Academic Level</label>
                      <select
                        value={courseForm.level}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            level: e.target.value as 'UG' | 'PG' | 'both',
                          })
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="UG">UG (Undergraduate)</option>
                        <option value="PG">PG (Postgraduate)</option>
                        <option value="both">Both UG & PG</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourse(null);
                          setIsAddingCourse(false);
                        }}
                        className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingCourse}
                        className="rounded-full bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingCourse ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: CONSULTANTS DIRECTORY
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
            TAB 6: AUDIT TRAIL
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
