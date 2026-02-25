import React, { useState } from 'react';

export default function PnlTableView({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the hidden cost');
  const revenue = ctx.revenue || 0;
  const claimedRunway = ctx[`claimed_runway_${lang}`] || ctx.claimed_runway || '';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  // Parse expense values for totals
  const parseAmount = (val) => {
    const s = String(val || '0').replace(/[€$£,K\/mo]/gi, '').trim();
    let n = parseFloat(s);
    if (isNaN(n)) return 0;
    if (String(val).toUpperCase().includes('K')) n *= 1000;
    return n;
  };

  const totalExpenses = rows.reduce((sum, r) => sum + parseAmount(r.value), 0);
  const netBurn = revenue - totalExpenses;
  const formatEur = (n) => `€${Math.abs(n) >= 1000 ? (Math.abs(n) / 1000).toFixed(0) + 'K' : Math.abs(n).toLocaleString()}`;

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Revenue header */}
        {revenue > 0 && (
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-emerald-50 border-b border-emerald-200">
            <span className="text-sm font-semibold text-emerald-800">Revenue</span>
            <span className="text-sm font-mono font-bold text-emerald-700">{formatEur(revenue)}/mo</span>
          </div>
        )}
        {/* Separator */}
        <div className="px-3.5 py-1.5 bg-gray-100 border-b border-gray-200">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Expenses</span>
        </div>
        {/* Expense rows */}
        {rows.map((row, i) => {
          const isSelected = selected === row.id;
          const isOther = selected !== null && !isSelected;
          return (
            <div
              key={row.id || i}
              onClick={() => handleTap(row.id)}
              role="button"
              className={`flex justify-between items-center px-3.5 py-2.5 cursor-pointer transition-all duration-200 ${
                i < rows.length - 1 ? 'border-b border-gray-100' : ''
              } ${
                isSelected
                  ? 'bg-green-100 ring-1 ring-inset ring-green-300'
                  : isOther
                    ? 'bg-gray-50 opacity-50 cursor-default'
                    : 'bg-white hover:bg-gray-50'
              }`}
              style={{ minHeight: 44 }}
            >
              <span className={`text-sm flex-1 ${isSelected ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                {row.label || ''}
              </span>
              <span className={`font-mono text-sm font-semibold ml-3 ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                {row.value || '—'}
              </span>
              {isSelected && <span className="ml-2 text-green-600 font-bold">✓</span>}
            </div>
          );
        })}
        {/* Totals */}
        <div className="border-t-2 border-gray-300 bg-gray-50 divide-y divide-gray-200">
          <div className="flex justify-between items-center px-3.5 py-2">
            <span className="text-sm font-semibold text-gray-700">Total Expenses</span>
            <span className="text-sm font-mono font-bold text-red-600">-{formatEur(totalExpenses)}/mo</span>
          </div>
          {revenue > 0 && (
            <div className="flex justify-between items-center px-3.5 py-2">
              <span className="text-sm font-semibold text-gray-700">Net Burn</span>
              <span className={`text-sm font-mono font-bold ${netBurn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netBurn >= 0 ? '+' : '-'}{formatEur(Math.abs(netBurn))}/mo
              </span>
            </div>
          )}
          {claimedRunway && (
            <div className="flex justify-between items-center px-3.5 py-2">
              <span className="text-[11px] text-gray-500">Claimed Runway</span>
              <span className="text-[11px] font-mono text-gray-500">{claimedRunway}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
