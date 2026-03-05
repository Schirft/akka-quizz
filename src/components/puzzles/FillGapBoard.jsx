import React, { useState } from 'react';

// Extract the best display value from a row, given the missing field name
function getRowDisplayValue(row, fieldName) {
  // Try the explicit field name first
  if (row[fieldName] !== undefined) return row[fieldName];
  // Common fallbacks
  if (row.value !== undefined) return row.value;
  if (row.percentage !== undefined) return row.percentage;
  if (row.amount !== undefined) return row.amount;
  // Fallback: find first non-metadata value
  const skip = new Set(['id', 'label', 'name', 'text', 'detail', 'description']);
  for (const [key, val] of Object.entries(row)) {
    if (skip.has(key)) continue;
    if (typeof val === 'string' || typeof val === 'number') return val;
  }
  return '';
}

export default function FillGapBoard({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || ctx.table || [];
  const missingField = ctx.missing_field || {};
  const options = ctx.options || [];
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Fill in the missing value');
  const fieldName = missingField.field || 'value';

  const handlePick = (val) => {
    if (selected !== null) return;
    setSelected(val);
    onAnswer(String(val));
  };

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}

      {/* Data table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        {rows.map((row, i) => {
          const isMissing = row.id === missingField.row_id;
          const displayValue = isMissing ? null : getRowDisplayValue(row, fieldName);
          return (
            <div key={row.id || i} className={`flex justify-between px-3.5 py-2.5 text-sm ${
              i < rows.length - 1 ? 'border-b border-gray-100' : ''
            } ${isMissing ? 'bg-yellow-50' : 'bg-white'}`}>
              <span className="text-gray-700">{row.label || row.name}</span>
              <span className={`font-semibold font-mono ${
                isMissing ? 'text-amber-600' : 'text-gray-900'
              }`}>
                {isMissing ? '?' : (typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Options */}
      <div className="flex gap-2.5 flex-wrap justify-center">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isOther = selected !== null && !isSelected;
          return (
            <button
              key={String(opt)}
              onClick={() => handlePick(opt)}
              className={`px-5 py-3 rounded-xl text-base font-bold font-mono transition-all min-w-[60px] text-center border-2 ${
                isSelected
                  ? 'border-green-600 bg-green-100 text-green-700 ring-2 ring-green-200'
                  : isOther
                    ? 'border-gray-200 bg-gray-50 text-gray-400 opacity-60'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
              }`}
            >
              {typeof opt === 'number' ? opt.toLocaleString() : opt}
              {isSelected && <span className="ml-1">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
