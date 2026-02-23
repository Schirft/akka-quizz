import React, { useState } from 'react';

export default function TermSheetView({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Find the problematic clause';
  const docTitle = ctx[`document_title_${lang}`] || ctx.document_title || 'Term Sheet';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>
      {/* Document */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
        {/* Document header */}
        <div className="px-4 py-3 border-b border-stone-300 bg-stone-100">
          <h3 className="text-sm font-bold text-stone-800 tracking-wide">{docTitle}</h3>
          <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-widest">Confidential</p>
        </div>
        {/* Clauses */}
        <div className="divide-y divide-stone-200">
          {rows.map((row, i) => {
            const isSelected = selected === row.id;
            const isOther = selected !== null && !isSelected;
            return (
              <div
                key={row.id || i}
                onClick={() => handleTap(row.id)}
                role="button"
                className={`px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 ${
                  isSelected
                    ? 'bg-yellow-100 border-l-yellow-400'
                    : isOther
                      ? 'opacity-50 cursor-default border-l-transparent'
                      : 'border-l-transparent hover:bg-stone-100 hover:border-l-stone-300'
                }`}
                style={{ minHeight: 44 }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-bold mb-1 ${isSelected ? 'text-yellow-800' : 'text-stone-700'}`}>
                      {row.label || `§${i + 1}`}
                    </p>
                    <p className={`text-[13px] leading-relaxed ${isSelected ? 'text-yellow-900' : 'text-stone-600'}`}
                       style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {row.value || ''}
                    </p>
                  </div>
                  {isSelected && <span className="text-yellow-600 font-bold mt-0.5 text-lg">⚠</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
