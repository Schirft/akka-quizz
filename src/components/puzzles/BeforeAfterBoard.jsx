import React, { useState } from 'react';

// Extract the best display value from a row object (handles Claude's variable field names)
function getDisplayValue(row) {
  if (row.value !== undefined) return row.value;
  if (row.percentage !== undefined) return row.percentage;
  if (row.amount !== undefined) return row.amount;
  if (row.shares !== undefined) return typeof row.shares === 'number' ? row.shares.toLocaleString() : row.shares;
  // Fallback: find first non-metadata string/number
  const skip = new Set(['id', 'label', 'text', 'name', 'detail', 'description']);
  for (const [key, val] of Object.entries(row)) {
    if (skip.has(key)) continue;
    if (typeof val === 'string' || typeof val === 'number') return val;
  }
  return '';
}

export default function BeforeAfterBoard({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const before = ctx.before || { title: 'Before', rows: [] };
  const after = ctx.after || { title: 'After', rows: [] };
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the inconsistency');

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  const renderTable = (section, isAfter) => (
    <div className="flex-1 min-w-[140px]">
      <div className={`font-bold text-[13px] py-1.5 px-2.5 text-center rounded-t-lg ${
        isAfter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {section.title}
      </div>
      <div className="border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
        {(section.rows || []).map((row) => {
          const isSelected = isAfter && selected === row.id;
          const isOther = isAfter && selected !== null && !isSelected;
          const displayValue = getDisplayValue(row);
          return (
            <div
              key={row.id}
              onClick={() => isAfter ? handleTap(row.id) : null}
              className={`flex justify-between px-2.5 py-2 text-[13px] border-b border-gray-100 transition-all ${
                isAfter ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'bg-green-200 ring-1 ring-inset ring-green-400'
                  : isOther
                    ? 'bg-gray-50 opacity-50'
                    : 'bg-white'
              } ${isAfter && !selected ? 'hover:bg-gray-50' : ''}`}
            >
              <span className="text-gray-700">{row.label}</span>
              <span className={`font-semibold font-mono ${
                isSelected ? 'text-green-700' : 'text-gray-900'
              }`}>
                {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
                {isSelected && <span className="ml-1">✓</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      <p className="text-xs text-gray-500 mb-3">Tap the incorrect value in the "{after.title}" table</p>
      <div className="flex gap-3">
        {renderTable(before, false)}
        {renderTable(after, true)}
      </div>
    </div>
  );
}
