'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  MapPin,
  Edit3,
  Lock,
} from 'lucide-react';

type LevelType = 'UG' | 'PG';
type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, name: 'Level Selection', short: 'Level' },
  { id: 2, name: 'Academic Marks', short: 'Marks' },
  { id: 3, name: 'Aspirations & City', short: 'Aspiration' },
  { id: 4, name: 'Budget & Finances', short: 'Budget' },
  { id: 5, name: 'Review & Confirm', short: 'Review' },
];

const WHY_WE_ASK: Record<Step, { title: string; explanation: string }> = {
  1: {
    title: 'Why we ask about your stage',
    explanation:
      'UG and PG students take different test sections. Class 12 students get 4 sections focused on degrees and entrance exams (like CUET), while graduates get a 5th section on domain skills and career specialization.',
  },
  2: {
    title: 'Why we ask for your marks',
    explanation:
      'Helps us categorize colleges into realistic Safe, Target, and Reach tiers based on official cutoffs. Your marks are strictly private and never shared with coaching centers or telemarketers.',
  },
  3: {
    title: 'Why we ask about interest & location',
    explanation:
      'Ensures your career match report and consultant recommendations highlight courses available in cities you are actually open to living in, with relocation factors accounted for.',
  },
  4: {
    title: 'Why we ask about budget',
    explanation:
      'We never suggest colleges with tuition beyond your realistic family budget (or loan preference). This keeps recommendations practical, grounded, and stress-free.',
  },
  5: {
    title: 'Why we ask you to review',
    explanation:
      'Verifying your preferences before beginning the 35-minute test ensures your psychometric questions and consultant matching align accurately with your aspirations.',
  },
};

const INTEREST_CHIPS = [
  'Design & Creative',
  'Software & AI',
  'Media & Journalism',
  'Medicine & Health',
  'Law & Public Policy',
  'Business & Management',
  'Economics & Finance',
  'Psychology & Humanities',
  'Engineering & Hardware',
];

const POPULAR_CITIES = [
  'Delhi-NCR',
  'Mumbai',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
];

function ProfileIntakeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Form state initialized cleanly
  const [level, setLevel] = useState<LevelType>(() => {
    const urlLevel = searchParams.get('level');
    return urlLevel === 'UG' || urlLevel === 'PG' ? urlLevel : 'UG';
  });
  const [board, setBoard] = useState<string>('CBSE');
  const [stream, setStream] = useState<string>('Science PCM');
  const [marksPercent, setMarksPercent] = useState<number>(85);
  const [pgDegree, setPgDegree] = useState<string>('B.Tech Computer Science');
  const [pgSpecialisation, setPgSpecialisation] = useState<string>('Artificial Intelligence');
  const [pgGradYear, setPgGradYear] = useState<number>(2025);
  const [pgCgpaOrPercent, setPgCgpaOrPercent] = useState<string>('8.4 CGPA');

  const [interests, setInterests] = useState<string[]>(['Design & Creative', 'Software & AI']);
  const [preferredCities, setPreferredCities] = useState<string[]>(['Bengaluru', 'Pune']);
  const [relocate, setRelocate] = useState<boolean>(true);

  const [budgetBand, setBudgetBand] = useState<string>('5-10L');
  const [budgetAmount, setBudgetAmount] = useState<number>(750000);
  const [loanOpenness, setLoanOpenness] = useState<boolean>(true);
  const [knowledgeLevel, setKnowledgeLevel] = useState<number>(3);

  // Initial load profile from server and check authentication
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.replace('/auth?redirect=/onboarding/profile');
          return;
        }
        if (!data.user.dob) {
          router.replace('/auth/consent?redirect=/onboarding/profile');
          return;
        }
      })
      .catch(() => {});

    fetch('/api/profile')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/auth?redirect=/onboarding/profile');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.profile) {
          const p = data.profile;
          if (p.level) setLevel(p.level);
          if (p.board) setBoard(p.board);
          if (p.stream) setStream(p.stream);
          if (p.marksPercent) setMarksPercent(p.marksPercent);
          if (p.pgDegree) setPgDegree(p.pgDegree);
          if (p.pgSpecialisation) setPgSpecialisation(p.pgSpecialisation);
          if (p.pgGradYear) setPgGradYear(p.pgGradYear);
          if (p.pgCgpaOrPercent) setPgCgpaOrPercent(p.pgCgpaOrPercent);
          if (p.interests?.length) setInterests(p.interests);
          if (p.preferredCities?.length) setPreferredCities(p.preferredCities);
          if (p.relocate !== undefined) setRelocate(p.relocate);
          if (p.budgetBand) setBudgetBand(p.budgetBand);
          if (p.budgetAmount) setBudgetAmount(p.budgetAmount);
          if (p.loanOpenness !== undefined) setLoanOpenness(p.loanOpenness);
          if (p.knowledgeLevel) setKnowledgeLevel(p.knowledgeLevel);
        }
      })
      .catch(() => {});
  }, [router]);

  // Debounced autosave
  const triggerAutosave = async () => {
    setSaveStatus('saving');
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          board,
          stream,
          marksPercent,
          pgDegree,
          pgSpecialisation,
          pgGradYear,
          pgCgpaOrPercent,
          interests,
          preferredCities,
          relocate,
          budgetBand,
          budgetAmount,
          loanOpenness,
          knowledgeLevel,
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleNext = () => {
    triggerAutosave();
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Start test session and navigate to test intro
      fetch('/api/test/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.state?.session?.id) {
            router.push(`/test/intro?sessionId=${data.state.session.id}`);
          } else {
            router.push('/test/intro');
          }
        })
        .catch(() => {
          router.push('/test/intro');
        });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleInterest = (chip: string) => {
    if (interests.includes(chip)) {
      setInterests(interests.filter((c) => c !== chip));
    } else if (interests.length < 3) {
      setInterests([...interests, chip]);
    }
  };

  const toggleCity = (city: string) => {
    if (preferredCities.includes(city)) {
      setPreferredCities(preferredCities.filter((c) => c !== city));
    } else if (preferredCities.length < 5) {
      setPreferredCities([...preferredCities, city]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Exit to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="text-xs text-zinc-600 animate-pulse">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>
            )}
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Step {currentStep} of 5: {STEPS[currentStep - 1].short}
            </span>
          </div>
        </div>

        {/* Calm Progress Bar */}
        <div className="h-1 w-full bg-zinc-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Rail: Step Navigation on Desktop */}
          <aside className="hidden lg:block lg:col-span-3 space-y-2">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-4">
                Profile Intake
              </h3>
              <div className="space-y-2">
                {STEPS.map((s) => {
                  const isCurrent = currentStep === s.id;
                  const isDone = currentStep > s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        triggerAutosave();
                        setCurrentStep(s.id as Step);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/60'
                          : isDone
                          ? 'text-zinc-800 hover:bg-zinc-50'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {isDone ? '✓' : s.id}
                      </div>
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-100/70 p-3.5 text-xs text-zinc-600">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>We never sell your contact details or academic marks.</span>
            </div>
          </aside>

          {/* Central Main Form Area */}
          <section className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
              {/* STEP 1: LEVEL SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 1 of 5
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                      Where are you right now?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                      Your stage determines the test questions, college databases, and consultant matching.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* UG Card */}
                    <div
                      onClick={() => setLevel('UG')}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                        level === 'UG'
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <GraduationCap className="h-6 w-6 text-indigo-600" />
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            level === 'UG'
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-zinc-300'
                          }`}
                        >
                          {level === 'UG' && '✓'}
                        </div>
                      </div>
                      <h4 className="mt-4 font-bold text-zinc-900 text-base">Undergraduate (UG)</h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        I&apos;ve passed or am currently completing Class 12.
                      </p>
                      <div className="mt-4 text-[11px] text-zinc-600 font-medium">
                        4 test sections · ~35 min · College cutoffs
                      </div>
                    </div>

                    {/* PG Card */}
                    <div
                      onClick={() => setLevel('PG')}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                        level === 'PG'
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Briefcase className="h-6 w-6 text-purple-600" />
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            level === 'PG'
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-zinc-300'
                          }`}
                        >
                          {level === 'PG' && '✓'}
                        </div>
                      </div>
                      <h4 className="mt-4 font-bold text-zinc-900 text-base">Postgraduate (PG)</h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        I&apos;m graduating or have already graduated college.
                      </p>
                      <div className="mt-4 text-[11px] text-zinc-600 font-medium">
                        5 sections · ~45 min · Domain benchmarks
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: MARKS & STREAM */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 2 of 5
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                      Academic Background
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                      Used strictly to map Safe, Target, and Reach college admission chances.
                    </p>
                  </div>

                  {level === 'UG' ? (
                    <div className="space-y-4">
                      {/* Board Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Board of Education
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {['CBSE', 'ICSE', 'State', 'Other'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBoard(b)}
                              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                                board === b
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stream Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Class 11/12 Stream
                        </label>
                        <select
                          value={stream}
                          onChange={(e) => setStream(e.target.value)}
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs text-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                        >
                          <option value="Science PCM">Science PCM (Physics, Chem, Math)</option>
                          <option value="Science PCB">Science PCB (Physics, Chem, Bio)</option>
                          <option value="Commerce">Commerce with / without Math</option>
                          <option value="Arts/Humanities">Arts / Humanities</option>
                          <option value="Other">Other Vocational Stream</option>
                        </select>
                      </div>

                      {/* Percentage Slider */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1.5">
                          <span>Class 12 Marks / Expected Percentage</span>
                          <span className="font-mono text-indigo-600 font-bold text-sm">
                            {marksPercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={40}
                          max={100}
                          step={1}
                          value={marksPercent}
                          onChange={(e) => setMarksPercent(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                          <span>40%</span>
                          <span>70%</span>
                          <span>85%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* PG Fields */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1">
                          Undergraduate Degree
                        </label>
                        <input
                          type="text"
                          value={pgDegree}
                          onChange={(e) => setPgDegree(e.target.value)}
                          placeholder="e.g. B.Tech, B.Com, B.Sc, B.A."
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-indigo-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1">
                          Specialisation / Major
                        </label>
                        <input
                          type="text"
                          value={pgSpecialisation}
                          onChange={(e) => setPgSpecialisation(e.target.value)}
                          placeholder="e.g. Computer Science, Finance, Literature"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-indigo-600 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-800 mb-1">
                            Graduation Year
                          </label>
                          <input
                            type="number"
                            value={pgGradYear}
                            onChange={(e) => setPgGradYear(Number(e.target.value))}
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-indigo-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-800 mb-1">
                            CGPA or Percentage
                          </label>
                          <input
                            type="text"
                            value={pgCgpaOrPercent}
                            onChange={(e) => setPgCgpaOrPercent(e.target.value)}
                            placeholder="e.g. 8.4 CGPA or 78%"
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-indigo-600 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: ASPIRATIONS & LOCATION */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 3 of 5
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                      Aspirations & Preferred Cities
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                      Select fields you are drawn to and locations you prefer to study in.
                    </p>
                  </div>

                  {/* Interest Chips (Max 3) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-zinc-800">
                        Top Interest Domains (Choose up to 3)
                      </label>
                      <span className="text-xs text-zinc-600">{interests.length}/3 selected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_CHIPS.map((chip) => {
                        const isSelected = interests.includes(chip);
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => toggleInterest(chip)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            {chip} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Cities */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-600" /> Preferred Cities (Up to 5)
                      </label>
                      <span className="text-xs text-zinc-600">{preferredCities.length}/5 selected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_CITIES.map((city) => {
                        const isSelected = preferredCities.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => toggleCity(city)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            {city} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Relocate Toggle */}
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80">
                    <div>
                      <div className="text-xs font-bold text-zinc-900">Open to Relocating?</div>
                      <div className="text-[11px] text-zinc-600">
                        Allow colleges outside your preferred cities if quality is high.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRelocate(!relocate)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        relocate ? 'bg-indigo-600' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          relocate ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: BUDGET & KNOWLEDGE */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 4 of 5
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                      Budget & Knowledge Level
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                      We never suggest courses that exceed your family&apos;s comfortable budget.
                    </p>
                  </div>

                  {/* Budget Bands */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-2">
                      Annual Tuition Budget Band
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { key: '<2L', label: '< ₹2L' },
                        { key: '2-5L', label: '₹2-5L' },
                        { key: '5-10L', label: '₹5-10L' },
                        { key: '10-20L', label: '₹10-20L' },
                        { key: '20L+', label: '₹20L+' },
                      ].map((b) => (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => setBudgetBand(b.key)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                            budgetBand === b.key
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fine Tune Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1.5">
                      <span>Fine-tune Annual Cap</span>
                      <span className="font-mono text-indigo-600 font-bold text-sm">
                        ₹{(budgetAmount / 100000).toFixed(1)} Lakhs
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={3000000}
                      step={50000}
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                      <span>₹50,000</span>
                      <span>₹10L</span>
                      <span>₹20L</span>
                      <span>₹30L</span>
                    </div>
                  </div>

                  {/* Education Loan Toggle */}
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80">
                    <div>
                      <div className="text-xs font-bold text-zinc-900">Open to an Education Loan?</div>
                      <div className="text-[11px] text-zinc-600">
                        Allows up to +30% budget leeway for Tier-1 institutions.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLoanOpenness(!loanOpenness)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        loanOpenness ? 'bg-indigo-600' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          loanOpenness ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Self-rated Knowledge */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                      How familiar are you with admission options? (1 = Just starting, 5 = Deeply researched)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setKnowledgeLevel(lvl)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            knowledgeLevel === lvl
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW STEP */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 5 of 5
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                      Review Your Profile
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                      Everything looks solid. Review your selections or tap edit to adjust.
                    </p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Stage Summary */}
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50">
                      <div>
                        <div className="font-bold text-zinc-900">Academic Level</div>
                        <div className="text-zinc-600 mt-0.5">
                          {level === 'UG' ? 'Undergraduate (Class 12)' : 'Postgraduate (Graduating)'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>

                    {/* Marks Summary */}
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50">
                      <div>
                        <div className="font-bold text-zinc-900">Academic Score & Stream</div>
                        <div className="text-zinc-600 mt-0.5">
                          {level === 'UG'
                            ? `${board} · ${stream} · ${marksPercent}%`
                            : `${pgDegree} (${pgSpecialisation}) · ${pgCgpaOrPercent}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>

                    {/* Aspirations & Location */}
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50">
                      <div>
                        <div className="font-bold text-zinc-900">Aspirations & Preferred Cities</div>
                        <div className="text-zinc-600 mt-0.5">
                          {interests.join(', ')} · Cities: {preferredCities.join(', ')} · Relocate:{' '}
                          {relocate ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50">
                      <div>
                        <div className="font-bold text-zinc-900">Budget & Loan</div>
                        <div className="text-zinc-600 mt-0.5">
                          Band: {budgetBand} (Cap: ₹{(budgetAmount / 100000).toFixed(1)}L) · Loan:{' '}
                          {loanOpenness ? 'Open' : 'No'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                    <div className="font-bold">Next: The 35-Minute Test</div>
                    <div>
                      Interests (untimed), Aptitude (timed 12 min), Personality & Values (untimed). Pause anytime!
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  {currentStep === 5 ? 'Start My Test' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Right Rail: "Why We Ask" Panel on Desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider mb-2">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                <span>Why We Ask</span>
              </div>
              <h4 className="text-sm font-bold text-zinc-900">{WHY_WE_ASK[currentStep].title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                {WHY_WE_ASK[currentStep].explanation}
              </p>
              <div className="mt-4 pt-3 border-t border-indigo-100/80 text-[11px] text-zinc-600 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-indigo-600" /> Encrypted & private
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ProfileIntakePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-600">Loading intake...</div>}>
      <ProfileIntakeContent />
    </Suspense>
  );
}
