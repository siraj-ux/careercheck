'use client';

import React, { useState } from 'react';
import { APTITUDE_SUBTYPES, AptitudeSubType } from '@/config/scoring';
import { Table, Eye, Brain } from 'lucide-react';

interface AptitudeBarsProps {
  scores: {
    logical: number;
    verbal: number;
    spatial: number;
    overall: number;
  };
}

export function AptitudeBars({ scores }: AptitudeBarsProps) {
  const [viewAsTable, setViewAsTable] = useState(false);

  const subTypes: AptitudeSubType[] = ['logical', 'verbal', 'spatial'];

  const getDescriptor = (score: number) => {
    if (score >= 80) return 'Exceptional strength';
    if (score >= 60) return 'Proficient';
    if (score >= 40) return 'Developing';
    return 'Exploratory';
  };

  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Cognitive Aptitude Profile
          </div>
          <h3 className="text-lg font-bold text-zinc-950">Reasoning Sub-Scores</h3>
        </div>

        <button
          type="button"
          onClick={() => setViewAsTable(!viewAsTable)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all self-start sm:self-auto"
          aria-label={viewAsTable ? 'Switch to bar charts view' : 'Switch to accessible table view'}
        >
          {viewAsTable ? (
            <>
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span>View as Bars</span>
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
                <th className="py-2.5 px-3">Sub-Type</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3">Performance Band</th>
                <th className="py-2.5 px-3">Skills Tested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {subTypes.map((type) => {
                const val = scores[type];
                const meta = APTITUDE_SUBTYPES[type];
                return (
                  <tr key={type} className="text-zinc-700">
                    <td className="py-3 px-3 font-semibold text-zinc-900">{meta.name}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600">{val}%</td>
                    <td className="py-3 px-3 font-medium">{getDescriptor(val)}</td>
                    <td className="py-3 px-3 text-zinc-600">{meta.description}</td>
                  </tr>
                );
              })}
              <tr className="bg-indigo-50/50 font-bold text-indigo-950">
                <td className="py-3 px-3">Overall Composite Aptitude</td>
                <td className="py-3 px-3 text-right font-mono">{scores.overall}%</td>
                <td className="py-3 px-3">{getDescriptor(scores.overall)}</td>
                <td className="py-3 px-3 text-zinc-600">Arithmetic average of reasoning domains</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {subTypes.map((type) => {
            const val = scores[type];
            const meta = APTITUDE_SUBTYPES[type];
            return (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-900">{meta.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 font-medium">{getDescriptor(val)}</span>
                    <span className="font-mono font-bold text-indigo-600">{val}%</span>
                  </div>
                </div>

                {/* Calm Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(5, val)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-600">{meta.description}</p>
              </div>
            );
          })}

          {/* Overall Summary Banner */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-950">Composite Aptitude Average</div>
                <div className="text-[11px] text-zinc-600">Equally weighted across all reasoning types</div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-extrabold text-indigo-700">{scores.overall}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
