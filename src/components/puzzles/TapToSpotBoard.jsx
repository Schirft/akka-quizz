import React, { useState } from 'react';

export default function TapToSpotBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || ctx.clauses || ctx.items || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Spot the flaw';

  const handleTap = (id) => {
    if (selected !== null) return; // Block double-click
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {rows.map((row, i) => {
          const isSelected = selected === row.id;
          const isOther = selected !== null && !isSelected;
          return (
            <div
              key={row.id || i}
              onClick={() => handleTap(row.id)}
              className={`flex justify-between items-center px-3.5 py-2.5 cursor-pointer transition-all ${
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
              {row.value !== undefined && (
                <span className={`font-semibold font-mono text-sm ml-3 ${
                  isSelected ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {row.value}
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
