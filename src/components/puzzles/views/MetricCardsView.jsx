import React, { useState } from 'react';

export default function MetricCardsView({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the vanity metric';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const isTrendPositive = (trend) => {
    if (!trend) return true;
    const s = String(trend);
    return s.startsWith('+') || (!s.startsWith('-') && !s.includes('↓'));
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {rows.map((row, i) => {
          const isSelected = selected === row.id;
          const isOther = selected !== null && !isSelected;
          const positive = isTrendPositive(row.trend);
          return (
            <div
              key={row.id || i}
              onClick={() => handleTap(row.id)}
              role="button"
              className={`relative rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-green-50 ring-2 ring-green-400 shadow-md -translate-y-0.5'
                  : isOther
                    ? 'bg-gray-50 opacity-40 cursor-default'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
              }`}
              style={{ minHeight: 44 }}
            >
              {/* Icon */}
              <div className="text-xl mb-1">{row.icon || '📊'}</div>
              {/* Big number */}
              <div className={`text-xl font-bold font-mono ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                {row.value || '—'}
              </div>
              {/* Label */}
              <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                {row.label || ''}
              </div>
              {/* Trend badge */}
              {row.trend && (
                <div className={`inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {row.trend}
                </div>
              )}
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-2 right-2 text-green-600 font-bold">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
