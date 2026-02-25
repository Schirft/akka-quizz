import React, { useState } from 'react';

function getCellColor(val) {
  if (val == null) return 'bg-gray-100 text-gray-300';
  const n = Number(val);
  if (n >= 90) return 'bg-emerald-700 text-white';
  if (n >= 70) return 'bg-emerald-500 text-white';
  if (n >= 50) return 'bg-yellow-400 text-yellow-900';
  if (n >= 30) return 'bg-orange-400 text-orange-900';
  return 'bg-red-500 text-white';
}

export default function CohortGridView({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const columns = ctx.columns || [];
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Which cohort shows the worst retention?');

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const colCount = columns.length || 1;

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        {/* Header */}
        <div className="grid bg-gray-700 text-gray-200 text-[10px] font-semibold uppercase tracking-wide"
             style={{ gridTemplateColumns: `100px repeat(${colCount}, 1fr)` }}>
          <div className="px-2 py-2">Cohort</div>
          {columns.map((col, i) => (
            <div key={i} className="px-1 py-2 text-center">{col}</div>
          ))}
        </div>
        {/* Rows — each row (cohort) is tappable */}
        {rows.map((row, ri) => {
          const isSelected = selected === row.id;
          const isOther = selected !== null && !isSelected;
          const values = row.values || [];
          return (
            <div
              key={row.id || ri}
              onClick={() => handleTap(row.id)}
              role="button"
              className={`grid cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                isSelected
                  ? 'ring-2 ring-inset ring-green-400 bg-green-50'
                  : isOther
                    ? 'opacity-40 cursor-default'
                    : 'hover:bg-gray-50'
              }`}
              style={{ gridTemplateColumns: `100px repeat(${colCount}, 1fr)`, minHeight: 44 }}
            >
              <div className={`px-2 py-2 text-xs font-medium flex items-center gap-1 ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                {row.label || `Q${ri + 1}`}
                {isSelected && <span className="text-green-600 font-bold">✓</span>}
              </div>
              {columns.map((_, ci) => {
                const val = values[ci];
                return (
                  <div
                    key={ci}
                    className={`px-1 py-2 text-[11px] font-mono font-semibold text-center flex items-center justify-center ${
                      isOther ? 'bg-gray-100 text-gray-300' : getCellColor(val)
                    }`}
                  >
                    {val != null ? `${val}%` : '—'}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
