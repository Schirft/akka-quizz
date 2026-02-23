import React, { useState } from 'react';

export default function BarChartView({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Spot the flaw';
  const claim = ctx[`claim_${lang}`] || ctx.claim_en || ctx.claim || '';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const maxVal = Math.max(...rows.map(r => Number(r.value) || 0), 1);
  const formatK = (v) => {
    const n = Number(v);
    if (isNaN(n)) return v;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-2 text-[15px] text-gray-900">{question}</p>
      {claim && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 italic">
          "{claim}"
        </div>
      )}
      {/* SVG Bar Chart */}
      <div className="overflow-x-auto -mx-1">
        <svg
          viewBox={`0 0 ${Math.max(rows.length * 52, 300)} 200`}
          className="w-full"
          style={{ minWidth: rows.length * 44 }}
          preserveAspectRatio="xMidYMax meet"
        >
          {rows.map((row, i) => {
            const val = Number(row.value) || 0;
            const barH = Math.max((val / maxVal) * 140, 4);
            const x = i * 52 + 10;
            const y = 160 - barH;
            const isSelected = selected === row.id;
            const isOther = selected !== null && !isSelected;

            return (
              <g
                key={row.id || i}
                onClick={() => handleTap(row.id)}
                className="cursor-pointer"
                opacity={isOther ? 0.35 : 1}
              >
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={36}
                  height={barH}
                  rx={4}
                  fill={isSelected ? '#22C55E' : '#1B3D2F'}
                  className="transition-all duration-200"
                />
                {/* Value label above bar */}
                <text
                  x={x + 18}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[9px] font-mono"
                  fill={isSelected ? '#16A34A' : '#6B7280'}
                >
                  {formatK(val)}
                </text>
                {/* Month label below */}
                <text
                  x={x + 18}
                  y={178}
                  textAnchor="middle"
                  className="text-[9px]"
                  fill={isSelected ? '#16A34A' : '#374151'}
                  fontWeight={isSelected ? 700 : 400}
                >
                  {row.label || ''}
                </text>
                {/* Check mark if selected */}
                {isSelected && (
                  <text x={x + 18} y={192} textAnchor="middle" className="text-[10px]" fill="#22C55E">✓</text>
                )}
              </g>
            );
          })}
          {/* Baseline */}
          <line x1="6" y1="160" x2={rows.length * 52 + 6} y2="160" stroke="#D1D5DB" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
