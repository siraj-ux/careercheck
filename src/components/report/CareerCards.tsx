'use client';

import React from 'react';
import { MatchedCareerResult } from '@/server/scoring/careerMatching';
import { Sparkles, CheckCircle, Compass } from 'lucide-react';

interface CareerCardsProps {
  careers: MatchedCareerResult[];
}

export function CareerCards({ careers }: CareerCardsProps) {
  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Top Recommendations
          </div>
          <h3 className="text-lg font-bold text-zinc-950">Matched Career Pathways</h3>
        </div>
        <div className="text-xs text-zinc-600">
          Ranked by multi-factor psychological fit
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {careers.map((career, idx) => {
          return (
            <div
              key={career.careerId}
              className="group relative rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-5 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-3.5"
            >
              {/* Header: Cluster & Fit Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                  {career.cluster}
                </span>

                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  <span>{career.fitPercent}% Fit</span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-base font-bold text-zinc-950 group-hover:text-indigo-600 transition-colors">
                  {career.title}
                </h4>
                {career.description && (
                  <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                    {career.description}
                  </p>
                )}
              </div>

              {/* Plain-Language Reasons */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Why this fits you
                </div>
                <div className="space-y-1">
                  {career.reasons.map((reason, rIdx) => (
                    <div
                      key={rIdx}
                      className="flex items-start gap-1.5 text-xs text-zinc-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer rank indicator */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-600">
                <span className="font-mono">Match #{idx + 1}</span>
                <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold group-hover:underline">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Explore trajectory</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
