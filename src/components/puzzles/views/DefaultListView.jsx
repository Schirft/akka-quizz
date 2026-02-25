import React, { useState } from 'react';

// Extract the best display value from a row object (handles Claude's variable field names)
function getDisplayValue(row) {
  if (row.value !== undefined) return row.value;
  if (row.percentage !== undefined) return row.percentage;
  if (row.amount !== undefined) return row.amount;
  if (row.shares !== undefined) return typeof row.shares === 'number' ? row.shares.toLocaleString() : row.shares;
  // Fallback: find first non-metadata string/number
  const skip = new Set(['id', 'label', 'text', 'clause', 'name', 'detail', 'description', 'description_en', 'description_fr', 'description_it', 'description_es']);
  for (const [key, val] of Object.entries(row)) {
    if (skip.has(key)) continue;
    if (typeof val === 'string' || typeof val === 'number') return val;
  }
  return undefined;
}

export default function DefaultListView({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || ctx.clauses || ctx.items || [];
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Spot the flaw');

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {rows.map((row, i) => {
          const isSelected = selected === row.id;
          const isOther = selected !== null && !isSelected;
          const displayValue = getDisplayValue(row);
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
                    ? 'bg-gray-50 opacity-50'
                    : 'bg-white hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm flex-1 ${isSelected ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                {row.label || row.text || row.clause || row.name}
              </span>
              {displayValue !== undefined && (
                <span className={`font-semibold font-mono text-sm ml-3 ${
                  isSelected ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
                </span>
              )}
              {isSelected && (
                <span className="ml-2 text-green-600 font-bold">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
