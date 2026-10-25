'use client';

import React, { useState } from 'react';
import { RiasecLetter, RIASEC_TYPES } from '@/config/scoring';
import { Table, Eye } from 'lucide-react';

interface RiasecRadarChartProps {
  scores: Record<RiasecLetter, number>;
  topLetters: RiasecLetter[];
}

export function RiasecRadarChart({ scores, topLetters }: RiasecRadarChartProps) {
  const [viewAsTable, setViewAsTable] = useState(false);

  const letters: RiasecLetter[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  const size = 320;
  const center = size / 2;
  const radius = size * 0.38;

  // Compute 6 vertex positions
  const getCoordinates = (index: number, scorePercent: number) => {
    // Top is 0 degrees (R), clockwise
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = (scorePercent / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon path points for student's scores
  const points = letters
    .map((letter, i) => {
      const score = scores[letter] || 0;
      const { x, y } = getCoordinates(i, Math.max(15, score));
      return `${x},${y}`;
    })
    .join(' ');

  // Grid concentric rings (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Holland Code Assessment
          </div>
          <h3 className="text-lg font-bold text-zinc-950">RIASEC Interest Profile</h3>
        </div>

        <button
          type="button"
          onClick={() => setViewAsTable(!viewAsTable)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all self-start sm:self-auto"
          aria-label={viewAsTable ? 'Switch to radar chart view' : 'Switch to accessible table view'}
        >
          {viewAsTable ? (
            <>
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span>View as Radar Chart</span>
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
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Letter</th>
                <th className="py-2.5 px-3">Dimension</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3">Focus Strengths</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {letters.map((letter) => {
                const meta = RIASEC_TYPES[letter];
                const score = scores[letter] || 0;
                const isTop = topLetters.includes(letter);
                return (
                  <tr key={letter} className={isTop ? 'bg-indigo-50/40 font-semibold text-zinc-950' : 'text-zinc-600'}>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                        isTop ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {letter}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{meta.name}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">{score}%</td>
                    <td className="py-3 px-3 text-zinc-600 max-w-xs">{meta.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* SVG Radar Chart */
        <div className="flex flex-col items-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[320px] h-auto overflow-visible"
            role="img"
            aria-label="RIASEC hexagonal radar chart"
          >
            {/* Concentric grid polygons */}
            {gridLevels.map((lvl) => {
              const gridPoints = letters
                .map((_, i) => {
                  const { x, y } = getCoordinates(i, lvl);
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={lvl}
                  points={gridPoints}
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="1"
                  strokeDasharray={lvl === 100 ? undefined : '2,2'}
                />
              );
            })}

            {/* Radial axis lines */}
            {letters.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled student area */}
            <polygon
              points={points}
              fill="rgba(79, 70, 229, 0.18)"
              stroke="#4f46e5"
              strokeWidth="2.5"
            />

            {/* Vertices & Labels */}
            {letters.map((letter, i) => {
              const score = scores[letter] || 0;
              const { x, y } = getCoordinates(i, Math.max(15, score));
              const isTop = topLetters.includes(letter);

              // Outer label coordinates
              const labelCoord = getCoordinates(i, 122);

              return (
                <g key={letter}>
                  {/* Point circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isTop ? 5 : 3.5}
                    fill={isTop ? '#4f46e5' : '#71717a'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Label on perimeter */}
                  <text
                    x={labelCoord.x}
                    y={labelCoord.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-[11px] font-sans transition-all ${
                      isTop ? 'font-bold fill-indigo-700' : 'font-medium fill-zinc-600'
                    }`}
                  >
                    {RIASEC_TYPES[letter].name} ({score}%)
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Top 3 Legend Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-zinc-100 w-full text-xs">
            <span className="text-zinc-600 font-medium">Top Dimensions:</span>
            {topLetters.map((l, idx) => (
              <span
                key={l}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 font-semibold text-indigo-700 text-xs"
              >
                <span className="font-mono">#{idx + 1}</span> {RIASEC_TYPES[l].name} ({scores[l]}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
