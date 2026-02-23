import React, { useState } from 'react';

export default function CapTableView({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Spot the flaw in this cap table';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  // Calculate total percentage
  const totalPct = rows.reduce((sum, r) => {
    const pct = parseFloat(String(r.value || '0').replace('%', ''));
    return sum + (isNaN(pct) ? 0 : pct);
  }, 0);
  const isOverflow = totalPct > 100;

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 bg-gray-700 text-gray-200 text-xs font-semibold uppercase tracking-wide">
          <div className="px-3 py-2">Shareholder</div>
          <div className="px-3 py-2 text-right">Shares</div>
          <div className="px-3 py-2 text-right">%</div>
        </div>
        {/* Rows */}
        {rows.map((row, i) => {
          const isSelected = selected === row.id;
          const isOther = selected !== null && !isSelected;
          return (
            <div
              key={row.id || i}
              onClick={() => handleTap(row.id)}
              role="button"
              className={`grid grid-cols-3 cursor-pointer transition-all duration-200 ${
                i < rows.length - 1 ? 'border-b border-gray-100' : ''
              } ${
                isSelected
                  ? 'bg-green-100 ring-1 ring-inset ring-green-300'
                  : isOther
                    ? 'bg-gray-50 opacity-50 cursor-default'
                    : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'
              }`}
              style={{ minHeight: 44 }}
            >
              <div className={`px-3 py-2.5 text-sm flex items-center gap-1.5 ${isSelected ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                {row.label || row.name || 'Unknown'}
                {isSelected && <span className="text-green-600 font-bold">✓</span>}
              </div>
              <div className={`px-3 py-2.5 text-sm font-mono text-right ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                {row.shares != null ? (typeof row.shares === 'number' ? row.shares.toLocaleString() : row.shares) : '—'}
              </div>
              <div className={`px-3 py-2.5 text-sm font-mono font-semibold text-right ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                {row.value || '—'}
              </div>
            </div>
          );
        })}
        {/* Total row */}
        <div className={`grid grid-cols-3 border-t-2 border-gray-300 ${isOverflow ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="px-3 py-2.5 text-sm font-bold text-gray-900">TOTAL</div>
          <div className="px-3 py-2.5 text-sm font-mono text-right text-gray-500">—</div>
          <div className={`px-3 py-2.5 text-sm font-mono font-bold text-right ${isOverflow ? 'text-red-600' : 'text-gray-900'}`}>
            {totalPct.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
