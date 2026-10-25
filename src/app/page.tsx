import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Briefcase,
  Users,
  Star,
  Lock,
  Calendar,
  Award,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { ReportPreview } from '@/components/landing/ReportPreview';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { TakeFreeTestCta } from '@/components/landing/TakeFreeTestCta';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/50">
      <LandingHeader />

      <main className="flex-1">
        {/* HERO SECTION (Variant 1a / 3a) */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headlines & Dual CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Reassurance pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-800 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>35-min assessment · Verified human consultant · Autosaved</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.12]">
                  Find the course and college that fit{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">
                    you
                  </span>
                  .
                </h1>

                <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Take India’s most thoughtful 35-minute psychometric and aptitude test. Discover your RIASEC interest code, then meet a verified human consultant who builds your personal admission roadmap.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <TakeFreeTestCta label="Take the free test" />
                  <a
                    href="#parents"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-4 text-base font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-2xs"
                  >
                    Talk to a consultant
                  </a>
                </div>

                {/* Micro reassurance notes */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-zinc-600 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" /> ~35 min · Pause anytime
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> No right or wrong answers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-600" /> We never sell your data
                  </span>
                </div>
              </div>

              {/* Right Column: Hero Visual Mockup */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-200/50">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                        AR
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">Aarav Sharma</div>
                        <div className="text-xs text-zinc-600">Class 12 · CBSE (PCM)</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Report Ready ✓
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
                      <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Interest Code: IAR
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-800">
                        Investigative · Artistic · Realistic
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-indigo-800 shadow-2xs">
                          UI/UX Design: 92%
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-indigo-800 shadow-2xs">
                          Data Science: 88%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200/80 p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-700">Logical Reasoning</span>
                        <span className="font-mono font-bold text-indigo-600">88%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: '88%' }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-semibold text-zinc-700">Spatial Pattern Solving</span>
                        <span className="font-mono font-bold text-indigo-600">91%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: '91%' }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 border border-zinc-100">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                        PM
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-zinc-900">Assigned Consultant: Priya M.</div>
                        <div className="text-zinc-600">Session booked for Saturday, 4:00 PM IST</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="border-y border-zinc-200/80 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 font-mono">5,000+</div>
                <div className="text-xs sm:text-sm font-medium text-zinc-600 mt-1">Indian Students Guided</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 font-mono">80+</div>
                <div className="text-xs sm:text-sm font-medium text-zinc-600 mt-1">Verified Human Consultants</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 font-mono">4.8 / 5</div>
                <div className="text-xs sm:text-sm font-medium text-zinc-600 mt-1">Student & Parent Rating</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 font-mono">100%</div>
                <div className="text-xs sm:text-sm font-medium text-zinc-600 mt-1">Data Never Sold Promise</div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS STEPPER */}
        <section id="how-it-works" className="py-20 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                The CareerChecks Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                How It Works: From Test to Roadmap
              </h2>
              <p className="text-base text-zinc-600">
                A structured four-step path designed to remove admission anxiety and align your natural talents with real opportunities.
              </p>
            </div>

            {/* Stepper Grid (Horizontal on desktop, stacked on mobile) */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                    1
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-zinc-900">Take the Test</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    A calm 35-minute test covering Interests, timed Aptitude, Personality workstyles, and Core Values.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  Pause & resume anytime ✓
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                    2
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-zinc-900">Get Your Match</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    Discover your 3-letter RIASEC code, aptitude radar, and Safe, Target, and Reach college cutoffs.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  Instant free report ✓
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                    3
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-zinc-900">Meet Consultant</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    45-minute 1-on-1 session with an assigned specialist who answers student and parent questions.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  100% human guidance ✓
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                    4
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-zinc-900">Follow Roadmap</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    A personalised plan with concrete exam deadlines (CUET, etc.), primary and backup choices, and 30 days of chat.
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  Clear action steps ✓
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AUDIENCE SPLIT CARDS (UG & PG) */}
        <section id="paths" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Tailored Assessments
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                Choose Your Stage: UG or PG
              </h2>
              <p className="text-base text-zinc-600">
                Psychometrically tailored question banks, college databases, and consultant matching for your exact transition.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Undergraduate Card */}
              <div className="rounded-3xl border border-zinc-200/90 bg-zinc-50/50 p-8 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                    <GraduationCap className="h-4 w-4" /> Class 12 Pass-outs & Appearing
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-zinc-900">Undergraduate (UG) Path</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    For students completing Class 12 who want clarity on degree selection, stream transition (PCM, PCB, Commerce, Arts), and realistic college cutoffs.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> 4 sections: Interests, Aptitude, Personality, Values (~35 min)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Safe, Target & Reach college categorization with CUET cutoffs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Consultant matching with specialists in Indian UG admissions
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-200/80">
                  <Link
                    href="/onboarding/profile?level=UG"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
                  >
                    Start UG Assessment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Postgraduate Card */}
              <div className="rounded-3xl border border-zinc-200/90 bg-zinc-50/50 p-8 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                    <Briefcase className="h-4 w-4" /> Graduating or College Degree Holders
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-zinc-900">Postgraduate (PG) Path</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    For final-year college students and graduates deciding between Master&apos;s degrees (MS/M.Tech/MBA) and direct corporate employment.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" /> 5 sections including PG Domain Knowledge benchmark (~45 min)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" /> Industry trajectory, specialization fit, and MBA vs MS evaluation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" /> Consultant matching with corporate alumni and postgraduate mentors
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-200/80">
                  <Link
                    href="/onboarding/profile?level=PG"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-black transition-all"
                  >
                    Start PG Assessment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SAMPLE REPORT PREVIEW */}
        <section id="sample-report" className="py-20 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Transparent & Insightful
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                Explore a Real Student Report
              </h2>
              <p className="text-base text-zinc-600">
                See exactly what you and your parents receive: scientific interest dimensions, aptitude benchmarks, and actionable recommendations.
              </p>
            </div>

            <ReportPreview />
          </div>
        </section>

        {/* SOCIAL PROOF & TESTIMONIALS */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Real Stories
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                Trusted by Indian Families
              </h2>
              <p className="text-base text-zinc-600">
                Hear from students who found their trajectory and parents who found genuine peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed italic">
                    &ldquo;I was torn between Computer Science and Design. CareerChecks showed me how UX Design brings both together, and my consultant helped me apply for UCEED with realistic backups.&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-200/80">
                  <div className="font-bold text-zinc-900 text-sm">Rohan Patel</div>
                  <div className="text-xs text-zinc-600">Class 12 · CBSE (PCM), Ahmedabad</div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed italic">
                    &ldquo;As a parent, I was exhausted by coaching centers promising IIT seats. CareerChecks gave us an honest assessment of our daughter&apos;s strengths and transparent college fee brackets.&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-200/80">
                  <div className="font-bold text-zinc-900 text-sm">Sunita Mehra</div>
                  <div className="text-xs text-zinc-600">Parent of Class 12 student, Bengaluru</div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed italic">
                    &ldquo;The PG domain benchmark and 1-on-1 counseling clarified whether I should pursue an MBA immediately or gain 2 years of work experience in analytical consulting first.&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-200/80">
                  <div className="font-bold text-zinc-900 text-sm">Ananya Sen</div>
                  <div className="text-xs text-zinc-600">B.Tech Graduate, Kolkata</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING TEASER */}
        <section id="pricing" className="py-20 bg-zinc-50/50 border-t border-zinc-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Transparent Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                Start Free. Upgrade for Human Guidance.
              </h2>
              <p className="text-base text-zinc-600">
                No hidden college commissions. No referral bias. 100% independent counselling.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="rounded-3xl border border-zinc-200/90 bg-white p-8 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Free Assessment</h3>
                  <p className="mt-1 text-xs text-zinc-600">Test your natural aptitude and interest profile.</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-zinc-950 font-mono">₹0</span>
                    <span className="text-xs text-zinc-600">always free</span>
                  </div>

                  <ul className="mt-8 space-y-3 text-xs text-zinc-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Full 35-min psychometric & aptitude test
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 3-Letter RIASEC Interest Code
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Aptitude sub-scores (Logical, Verbal, Spatial)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 7-day shareable report link for parents
                    </li>
                    <li className="flex items-center gap-2 text-zinc-400">
                      <Lock className="h-4 w-4" /> Locked: Full career matches & Safe/Target/Reach colleges
                    </li>
                    <li className="flex items-center gap-2 text-zinc-400">
                      <Lock className="h-4 w-4" /> Locked: 45-min consultant session & roadmap
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <TakeFreeTestCta variant="pricing" label="Take Free Test" />
                </div>
              </div>

              {/* Paid Career Plan */}
              <div className="relative rounded-3xl border-2 border-indigo-600 bg-white p-8 flex flex-col justify-between shadow-xl shadow-indigo-100">
                <div className="absolute -top-3.5 right-6 rounded-full bg-orange-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-xs">
                  MOST POPULAR
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Career Plan</h3>
                  <p className="mt-1 text-xs text-zinc-600">Complete report + 1-on-1 human consultant roadmap.</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-indigo-600 font-mono">₹1,499</span>
                    <span className="text-xs text-zinc-600">one-time · incl. GST</span>
                  </div>

                  <ul className="mt-8 space-y-3 text-xs text-zinc-700">
                    <li className="flex items-center gap-2 font-medium text-zinc-900">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Everything in Free, plus:
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Full personality spectrums (5 dimensions, neutral scoring)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Top 6 career matches with detailed fit rationales
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Safe, Target & Reach colleges filtered by your budget
                    </li>
                    <li className="flex items-center gap-2 font-semibold text-indigo-900 bg-indigo-50/70 p-2 rounded-xl">
                      <Users className="h-4 w-4 text-indigo-600 shrink-0" /> 1-on-1 45-minute video session with verified consultant
                    </li>
                    <li className="flex items-center gap-2 font-semibold text-indigo-900 bg-indigo-50/70 p-2 rounded-xl">
                      <Calendar className="h-4 w-4 text-indigo-600 shrink-0" /> Personalised published roadmap + 30 days chat
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <Link
                    href="/onboarding/profile"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
                  >
                    Unlock with Career Plan
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-2 text-center text-[11px] text-zinc-600">
                    100% full refund if no session is held in 14 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOR PARENTS CREDIBILITY STRIP */}
        <section id="parents" className="py-20 bg-white border-t border-zinc-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-zinc-50 p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                    <ShieldCheck className="h-4 w-4" /> For Parents Navigating Admissions
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                    Clear guidance without commercial bias.
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                    We understand that choosing a course and college is a major family decision. CareerChecks was founded to replace aggressive coaching sales calls with thoughtful, objective human counselling.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4">
                      <Award className="h-5 w-5 text-indigo-600 mb-2" />
                      <div className="text-xs font-bold text-zinc-900">Verified Credentials</div>
                      <div className="text-[11px] text-zinc-600 mt-1">Visible master&apos;s degrees & verified counselling track record.</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4">
                      <Lock className="h-5 w-5 text-indigo-600 mb-2" />
                      <div className="text-xs font-bold text-zinc-900">Zero Kickbacks</div>
                      <div className="text-[11px] text-zinc-600 mt-1">We accept zero commissions or referral fees from colleges.</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4">
                      <ShieldCheck className="h-5 w-5 text-indigo-600 mb-2" />
                      <div className="text-xs font-bold text-zinc-900">We Never Sell Data</div>
                      <div className="text-[11px] text-zinc-600 mt-1">Student phone numbers are never shared with marketing telecallers.</div>
                    </div>
                  </div>
                </div>

                {/* Featured Consultant Card */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        PM
                      </div>
                      <div>
                        <div className="text-base font-bold text-zinc-900">Priya Mukherjee</div>
                        <div className="text-xs font-medium text-indigo-600">Senior Career Specialist</div>
                        <div className="text-xs text-zinc-600">M.Sc Applied Psychology, DU</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs text-zinc-600">
                      <div className="flex items-center justify-between">
                        <span>Students guided</span>
                        <span className="font-semibold text-zinc-900">300+ into Design, Tech & Law</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Consulting experience</span>
                        <span className="font-semibold text-zinc-900">8+ years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Average rating</span>
                        <span className="font-semibold text-zinc-900">4.9 / 5.0 ★</span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-zinc-50 p-3 text-[11px] text-zinc-600 italic">
                      &ldquo;Every student has a distinct rhythm. Our job is to match that rhythm with the right academic environment, not force fit them into hype.&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 bg-zinc-50/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950">
                Got Questions? We Have Answers.
              </h2>
              <p className="text-base text-zinc-600">
                Everything you need to know about test timing, scoring, parent sharing, and consultant sessions.
              </p>
            </div>

            <LandingFaq />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-12 text-xs text-zinc-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              CC
            </div>
            <span className="font-bold text-zinc-900 text-sm">CareerChecks</span>
            <span className="text-zinc-600">· Made with care for Indian students</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/onboarding/profile" className="hover:text-indigo-600 transition-colors">
              Student Assessment
            </Link>
            <a href="#paths" className="hover:text-indigo-600 transition-colors">
              UG / PG Tracks
            </a>
            <a href="#parents" className="hover:text-indigo-600 transition-colors">
              Parents Strip
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              FAQ
            </a>
          </div>

          <div className="text-zinc-600">
            © 2026 CareerChecks. We never sell student data.
          </div>
        </div>
      </footer>
    </div>
  );
}
