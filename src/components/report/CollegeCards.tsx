'use client';

import React, { useState } from 'react';
import { CollegeMatchingResult, MatchedCollege } from '@/server/scoring/collegeMatching';
import { MapPin, IndianRupee, AlertCircle, Bookmark } from 'lucide-react';

interface CollegeCardsProps {
  colleges: CollegeMatchingResult;
}

export function CollegeCards({ colleges }: CollegeCardsProps) {
  const [activeTab, setActiveTab] = useState<'safe' | 'target' | 'reach'>('target');

  const tabList: { key: 'safe' | 'target' | 'reach'; label: string; count: number; desc: string }[] = [
    {
      key: 'safe',
      label: 'Safe Colleges',
      count: colleges.safe.length,
      desc: 'High admission likelihood (Marks ≥ Cutoff + 5)',
    },
    {
      key: 'target',
      label: 'Target Colleges',
      count: colleges.target.length,
      desc: 'Balanced competitive match (Marks within Cutoff ± 5)',
    },
    {
      key: 'reach',
      label: 'Reach Colleges',
      count: colleges.reach.length,
      desc: 'Ambitious aspirations (Marks within 5-15 of Cutoff)',
    },
  ];

  const currentList: MatchedCollege[] = colleges[activeTab] || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Institutional Match
        </div>
        <h3 className="text-lg font-bold text-zinc-950">Safe, Target & Reach Colleges</h3>
        <p className="text-xs text-zinc-600 mt-0.5">
          Calculated using your academic percentage, budget boundaries, and city preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-3">
        {tabList.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <div className="text-xs text-zinc-600 italic">
        {tabList.find((t) => t.key === activeTab)?.desc}
      </div>

      {/* College List */}
      {currentList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-600">
          No colleges found matching the current criteria in this category. You can widen your budget or toggle relocation in your profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((col) => (
            <div
              key={col.id}
              className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-5 space-y-3 hover:bg-white hover:border-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    {col.type} Institution
                  </span>
                  <h4 className="text-sm font-bold text-zinc-950">{col.name}</h4>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1.5 text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Save college"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{col.city}, {col.state}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono">
                  <IndianRupee className="h-3 w-3 text-zinc-600" />
                  <span>{formatCurrency(col.annualFees)} / yr</span>
                </span>
              </div>

              {/* Exams accepted */}
              {col.exams.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-zinc-600 text-[11px]">Exams:</span>
                  {col.exams.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 font-mono"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              )}

              {/* Cutoff requirement */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px]">
                <span className="text-zinc-600">Estimated admission cutoff:</span>
                <span className="font-mono font-bold text-indigo-600">{col.cutoffPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="flex items-start gap-2 rounded-2xl bg-zinc-50 border border-zinc-200 p-3.5 text-xs text-zinc-600">
        <AlertCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
        <span>
          <strong>{colleges.disclaimer}</strong> Seat matrices, reservation quotas, and individual university cutoffs change every academic cycle.
        </span>
      </div>
    </div>
  );
}
