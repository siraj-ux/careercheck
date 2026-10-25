'use client';

import React, { useState } from 'react';
import { PERSONALITY_SPECTRUMS, SpectrumKey } from '@/config/scoring';
import { Table, Eye } from 'lucide-react';

interface PersonalitySpectrumsProps {
  spectrums: Record<SpectrumKey, number>;
}

export function PersonalitySpectrums({ spectrums }: PersonalitySpectrumsProps) {
  const [viewAsTable, setViewAsTable] = useState(false);

  const spectrumKeys = Object.keys(PERSONALITY_SPECTRUMS) as SpectrumKey[];

  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Workstyle & Temperament
          </div>
          <h3 className="text-lg font-bold text-zinc-950">Five Neutral Personality Spectrums</h3>
          <p className="text-xs text-zinc-600 mt-0.5">
            Every trait is a distinct strength. Neither end is judged as &apos;good&apos; or &apos;bad&apos;.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewAsTable(!viewAsTable)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all self-start sm:self-auto"
          aria-label={viewAsTable ? 'Switch to spectrum sliders view' : 'Switch to accessible table view'}
        >
          {viewAsTable ? (
            <>
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span>View as Spectrums</span>
            </>
          ) : (
            <>
              <Table className="h-3.5 w-3.5 text-indigo-600" />
              <span>View as Table</span>
            </>
          )}
        </button>
      </div>

      {viewAsTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Left Anchor</th>
                <th className="py-2.5 px-3 text-center">Score (0-100)</th>
                <th className="py-2.5 px-3">Right Anchor</th>
                <th className="py-2.5 px-3">Your Leaning Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {spectrumKeys.map((key) => {
                const meta = PERSONALITY_SPECTRUMS[key];
                const score = spectrums[key] ?? 50;
                const leaningDesc = score <= 45 ? meta.leftDesc : score >= 55 ? meta.rightDesc : 'Balanced versatility across both complementary traits.';
                return (
                  <tr key={key} className="text-zinc-700">
                    <td className="py-3 px-3 font-semibold text-zinc-900">{meta.leftLabel}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600">{score}%</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900">{meta.rightLabel}</td>
                    <td className="py-3 px-3 text-zinc-600">{leaningDesc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {spectrumKeys.map((key) => {
            const meta = PERSONALITY_SPECTRUMS[key];
            const score = spectrums[key] ?? 50;

            return (
              <div key={key} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3">
                {/* Labels and indicators */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold transition-colors ${score <= 45 ? 'text-indigo-700 font-bold' : 'text-zinc-600'}`}>
                    {meta.leftLabel}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-zinc-600">
                    {score}% Leaning
                  </span>
                  <span className={`font-semibold transition-colors ${score >= 55 ? 'text-indigo-700 font-bold' : 'text-zinc-600'}`}>
                    {meta.rightLabel}
                  </span>
                </div>

                {/* Neutral Horizontal Spectrum Slider Track */}
                <div className="relative h-2 w-full rounded-full bg-zinc-200">
                  {/* Center notch */}
                  <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-zinc-400/50" />

                  {/* Indicator Dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs transition-all duration-500"
                    style={{ left: `${Math.max(5, Math.min(95, score))}%` }}
                  />
                </div>

                {/* Plain-Language Explanations */}
                <div className="grid grid-cols-2 gap-4 text-[11px] text-zinc-600 pt-1">
                  <div className={score <= 45 ? 'text-zinc-900 font-medium' : 'text-zinc-600'}>
                    {meta.leftDesc}
                  </div>
                  <div className={`text-right ${score >= 55 ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>
                    {meta.rightDesc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
