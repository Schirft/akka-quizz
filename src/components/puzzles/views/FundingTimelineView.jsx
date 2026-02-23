import React, { useState } from 'react';

export default function FundingTimelineView({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the hidden down round';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const formatAmount = (n) => {
    if (!n) return '';
    if (n >= 1000000) return `€${(n / 1000000).toFixed(0)}M`;
    if (n >= 1000) return `€${(n / 1000).toFixed(0)}K`;
    return `€${n}`;
  };

  const formatVal = (n) => {
    if (!n) return '';
    if (n >= 1000000000) return `€${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `€${(n / 1000000).toFixed(0)}M`;
    if (n >= 1000) return `€${(n / 1000).toFixed(0)}K`;
    return `€${n}`;
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      {/* Timeline horizontal scrollable */}
      <div className="overflow-x-auto pb-2 -mx-1">
        <div className="flex items-start gap-0 min-w-max px-1" style={{ minWidth: rows.length * 90 }}>
          {rows.map((row, i) => {
            const isSelected = selected === row.id;
            const isOther = selected !== null && !isSelected;
            // Check if valuation dropped from previous
            const prevVal = i > 0 ? rows[i - 1]?.valuation : null;
            const isDownRound = prevVal && row.valuation && row.valuation < prevVal;

            return (
              <div key={row.id || i} className="flex items-center">
                {/* Node */}
                <div
                  onClick={() => handleTap(row.id)}
                  role="button"
                  className={`flex flex-col items-center cursor-pointer transition-all duration-200 px-2 ${
                    isSelected ? 'scale-105' : isOther ? 'opacity-35 cursor-default' : 'hover:scale-105'
                  }`}
                  style={{ minWidth: 80 }}
                >
                  {/* Amount above */}
                  <div className={`text-[10px] font-mono font-bold mb-1 ${
                    isSelected ? 'text-green-600' : 'text-gray-800'
                  }`}>
                    {formatAmount(row.amount) || row.value || ''}
                  </div>
                  {/* Circle node */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isSelected
                      ? 'bg-green-500 text-white ring-4 ring-green-200 shadow-lg'
                      : isDownRound
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
                        : 'bg-[#1B3D2F] text-white border-2 border-[#1B3D2F]'
                  }`}>
                    {isSelected ? '✓' : '€'}
                  </div>
                  {/* Label below */}
                  <div className={`text-[11px] font-semibold mt-1.5 ${
                    isSelected ? 'text-green-700' : 'text-gray-800'
                  }`}>
                    {row.label || ''}
                  </div>
                  {/* Valuation */}
                  <div className={`text-[9px] font-mono mt-0.5 ${
                    isSelected ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {row.valuation ? `@ ${formatVal(row.valuation)}` : ''}
                  </div>
                  {/* Date */}
                  <div className={`text-[9px] mt-0.5 ${
                    isSelected ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {row.date || ''}
                  </div>
                </div>
                {/* Connector line */}
                {i < rows.length - 1 && (
                  <div className="w-6 h-0.5 bg-gray-300 -mx-1 mt-[-20px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
