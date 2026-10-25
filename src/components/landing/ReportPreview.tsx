'use client';

import { useState } from 'react';
import { Table, Eye, Sparkles, Lock } from 'lucide-react';

export function ReportPreview() {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  const riasecScores = [
    { code: 'I', name: 'Investigative', score: 92, desc: 'Drawn to scientific logic, coding, and empirical data' },
    { code: 'A', name: 'Artistic', score: 84, desc: 'Enjoys open creative problem solving, visual design & writing' },
    { code: 'R', name: 'Realistic', score: 76, desc: 'Likes hands-on building, hardware prototypes, physical craft' },
    { code: 'S', name: 'Social', score: 62, desc: 'Mentoring, facilitating teamwork, empathy in communication' },
    { code: 'E', name: 'Enterprising', score: 58, desc: 'Pitching, initiative-taking, calculated business ventures' },
    { code: 'C', name: 'Conventional', score: 45, desc: 'Organised records, methodical compliance, precision audits' },
  ];

  const aptitudeScores = [
    { type: 'Spatial Reasoning', score: 88, status: 'Strong' },
    { type: 'Logical Deduction', score: 85, status: 'Strong' },
    { type: 'Verbal Comprehension', score: 80, status: 'Proficient' },
  ];

  return (
    <div className="w-full rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Sample Report
            </span>
            <span className="text-xs text-zinc-600">Student: Aarav (Class 12, PCM)</span>
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            Primary Interest Code: <span className="text-indigo-600">IAR</span>
          </h3>
          <p className="text-sm text-zinc-600">
            Investigative · Artistic · Realistic — &ldquo;You thrive when using analytical logic to build creative, tangible prototypes.&rdquo;
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-full bg-zinc-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              viewMode === 'visual'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Visual Bars
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            View as Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RIASEC Section */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 mb-4">
            Interest Dimension (RIASEC)
          </h4>

          {viewMode === 'visual' ? (
            <div className="space-y-3.5">
              {riasecScores.map((item, idx) => (
                <div key={item.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800">
                      {idx + 1}. {item.name} ({item.code})
                    </span>
                    <span className="font-mono font-medium text-zinc-600">{item.score}/100</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx < 3 ? 'bg-indigo-600' : 'bg-zinc-300'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-600">
                    <th className="py-2 font-medium">Letter</th>
                    <th className="py-2 font-medium">Trait</th>
                    <th className="py-2 font-medium">Score</th>
                    <th className="py-2 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {riasecScores.map((item) => (
                    <tr key={item.code} className="hover:bg-zinc-50/50">
                      <td className="py-2 font-mono font-bold text-indigo-600">{item.code}</td>
                      <td className="py-2 font-medium text-zinc-800">{item.name}</td>
                      <td className="py-2 font-mono text-zinc-600">{item.score}%</td>
                      <td className="py-2 text-zinc-600">{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Aptitude & Matched Direction */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-600 mb-4">
              Aptitude Snapshot (Timed)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {aptitudeScores.map((apt) => (
                <div key={apt.type} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 text-center">
                  <div className="text-2xl font-bold font-mono text-indigo-600">{apt.score}%</div>
                  <div className="text-xs font-semibold text-zinc-800 mt-1">{apt.type}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{apt.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Matched Careers & College Teaser */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Top Fit Careers (92% Fit)
              </span>
              <span className="text-xs text-indigo-600 font-medium">Unlocked in Career Plan</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">UX / Product Designer</div>
                  <div className="text-xs text-zinc-600">Combines Spatial Logic + Visual Creativity</div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  92% Match
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Data & Interaction Architect</div>
                  <div className="text-xs text-zinc-600">Empirical Analysis + Systemic Thinking</div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  88% Match
                </span>
              </div>
            </div>

            {/* Blurred Teaser for Colleges */}
            <div className="relative mt-3 rounded-xl border border-dashed border-zinc-300 p-3 bg-white/60">
              <div className="filter blur-[2px] select-none text-xs text-zinc-600">
                Safe: Symbiosis SID, Target: NID Ahmedabad, Reach: IIT IDC (UCEED cutoff 94%)
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-orange-600 bg-white/80 rounded-xl">
                <Lock className="h-3.5 w-3.5" />
                Colleges & Consultant Session unlocked in Career Plan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
