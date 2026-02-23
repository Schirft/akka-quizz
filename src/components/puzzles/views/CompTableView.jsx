import React, { useState } from 'react';

export default function CompTableView({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const columns = ctx.columns || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the cherry-picked comparable';
  const medianLabel = ctx[`median_label_${lang}`] || ctx.median_label || '';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const colCount = columns.length || 1;

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        {/* Header */}
        <div className="grid bg-gray-700 text-gray-200 text-[10px] font-semibold uppercase tracking-wide"
             style={{ gridTemplateColumns: `repeat(${colCount}, minmax(60px, 1fr))` }}>
          {columns.map((col, i) => (
            <div key={i} className={`px-2 py-2 ${i === 0 ? 'text-left' : 'text-center'}`}>{col}</div>
          ))}
        </div>
        {/* Rows */}
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
                  ? 'bg-green-100 ring-1 ring-inset ring-green-300'
                  : isOther
                    ? 'opacity-40 cursor-default'
                    : ri % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'
              }`}
              style={{ gridTemplateColumns: `repeat(${colCount}, minmax(60px, 1fr))`, minHeight: 44 }}
            >
              {values.map((val, ci) => (
                <div
                  key={ci}
                  className={`px-2 py-2.5 text-[12px] font-mono flex items-center ${
                    ci === 0
                      ? `font-semibold ${isSelected ? 'text-green-800' : 'text-gray-800'}`
                      : `${isSelected ? 'text-green-700' : 'text-gray-600'} justify-center`
                  }`}
                >
                  {val || '—'}
                  {ci === 0 && isSelected && <span className="ml-1.5 text-green-600 font-bold text-[10px] bg-green-200 px-1 rounded">OUTLIER</span>}
                </div>
              ))}
            </div>
          );
        })}
        {/* Median row */}
        {medianLabel && (
          <div className="border-t-2 border-gray-300 bg-gray-50 px-3 py-2">
            <span className="text-[11px] font-mono text-gray-600">{medianLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
