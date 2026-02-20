import React, { useState } from 'react';

export default function BeforeAfterBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const before = ctx.before || { title: 'Before', rows: [] };
  const after = ctx.after || { title: 'After', rows: [] };
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the inconsistency';

  const handleTap = (id) => {
    if (selected !== null) return; // Block double-click
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
                {row.value}
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
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      <p className="text-xs text-gray-500 mb-3">Tap the incorrect value in the "After" table</p>
      <div className="flex gap-3">
        {renderTable(before, false)}
        {renderTable(after, true)}
      </div>
    </div>
  );
}
