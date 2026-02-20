import React, { useState } from 'react';

export default function FillGapBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || ctx.table || [];
  const missingField = ctx.missing_field || {};
  const options = ctx.options || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Fill in the missing value';

  const handlePick = (val) => {
    if (selected !== null) return; // Block double-click
    setSelected(val);
    onAnswer(String(val));
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>

      {/* Data table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        {rows.map((row, i) => {
          const isMissing = row.id === missingField.row_id;
          return (
            <div key={row.id || i} className={`flex justify-between px-3.5 py-2.5 text-sm ${
              i < rows.length - 1 ? 'border-b border-gray-100' : ''
            } ${isMissing ? 'bg-yellow-50' : 'bg-white'}`}>
              <span className="text-gray-700">{row.label || row.name}</span>
              <span className={`font-semibold font-mono ${
                isMissing ? 'text-amber-600' : 'text-gray-900'
              }`}>
                {isMissing ? '❓' : (row[missingField.field] !== undefined ? row[missingField.field] : row.value)}
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
              key={opt}
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
