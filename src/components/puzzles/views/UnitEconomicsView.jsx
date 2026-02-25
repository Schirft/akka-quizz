import React, { useState } from 'react';

export default function UnitEconomicsView({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the misclassified cost');
  const revenuePerUnit = ctx.revenue_per_unit || 0;
  const claimedGrossMargin = ctx[`claimed_gross_margin_${lang}`] || ctx.claimed_gross_margin || '';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const parseVal = (v) => {
    const n = parseFloat(String(v || '0').replace(/[€$£,]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const cogsRows = rows.filter(r => r.section === 'cogs');
  const opexRows = rows.filter(r => r.section === 'opex');
  const totalCogs = cogsRows.reduce((s, r) => s + parseVal(r.value), 0);
  const totalOpex = opexRows.reduce((s, r) => s + parseVal(r.value), 0);
  const grossMargin = revenuePerUnit ? ((revenuePerUnit - totalCogs) / revenuePerUnit * 100).toFixed(0) : '—';

  const renderRow = (row, i, arr) => {
    const isSelected = selected === row.id;
    const isOther = selected !== null && !isSelected;
    return (
      <div
        key={row.id || i}
        onClick={() => handleTap(row.id)}
        role="button"
        className={`flex justify-between items-center px-3.5 py-2.5 cursor-pointer transition-all duration-200 ${
          i < arr.length - 1 ? 'border-b border-gray-100' : ''
        } ${
          isSelected
            ? 'bg-green-100 ring-1 ring-inset ring-green-300'
            : isOther
              ? 'opacity-40 cursor-default'
              : 'hover:bg-white/80'
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
  };

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Revenue */}
        {revenuePerUnit > 0 && (
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-emerald-50 border-b border-emerald-200">
            <span className="text-sm font-semibold text-emerald-800">Revenue / Unit</span>
            <span className="text-sm font-mono font-bold text-emerald-700">€{revenuePerUnit.toFixed(2)}</span>
          </div>
        )}
        {/* COGS Section */}
        <div className="bg-red-50/40">
          <div className="px-3.5 py-1.5 bg-red-100/50 border-b border-red-200/50">
            <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">COGS — Cost of Goods Sold</span>
          </div>
          {cogsRows.map((r, i) => renderRow(r, i, cogsRows))}
          <div className="flex justify-between items-center px-3.5 py-1.5 bg-red-100/30 border-t border-red-200/40">
            <span className="text-[11px] font-semibold text-red-700">Subtotal COGS</span>
            <span className="text-[11px] font-mono font-bold text-red-600">€{totalCogs.toFixed(2)}</span>
          </div>
        </div>
        {/* Opex Section */}
        <div className="bg-blue-50/30">
          <div className="px-3.5 py-1.5 bg-blue-100/50 border-b border-blue-200/50 border-t border-gray-200">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Operating Expenses</span>
          </div>
          {opexRows.map((r, i) => renderRow(r, i, opexRows))}
          <div className="flex justify-between items-center px-3.5 py-1.5 bg-blue-100/30 border-t border-blue-200/40">
            <span className="text-[11px] font-semibold text-blue-700">Subtotal Opex</span>
            <span className="text-[11px] font-mono font-bold text-blue-600">€{totalOpex.toFixed(2)}</span>
          </div>
        </div>
        {/* Margins */}
        <div className="border-t-2 border-gray-300 bg-gray-50 divide-y divide-gray-200">
          <div className="flex justify-between items-center px-3.5 py-2">
            <span className="text-sm font-semibold text-gray-700">Gross Margin</span>
            <span className="text-sm font-mono font-bold text-gray-900">{grossMargin}%</span>
          </div>
          {claimedGrossMargin && (
            <div className="flex justify-between items-center px-3.5 py-2">
              <span className="text-[11px] text-gray-500">Claimed Gross Margin</span>
              <span className="text-[11px] font-mono text-amber-600 font-semibold">{claimedGrossMargin}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
